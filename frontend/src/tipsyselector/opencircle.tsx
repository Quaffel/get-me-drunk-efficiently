import React from "react";
import { Angle, CartesianPoint, PolarPoint } from "./math2d";

export function OpenCircleSvg({
    pathProps,
    layoutOptions,
    styleOptions
}: {
    pathProps?: Omit<React.SVGProps<SVGPathElement>, "d" | "fill">
    layoutOptions: {
        startAngle: Angle,
        endAngle: Angle,
        radius: number,
        center: CartesianPoint,
    },
    styleOptions?: {
        className?: string,
        strokeWidth?: number
    }
}): React.ReactElement {
    const { startPointCartesian, endPointCartesian, largeArcFlag } = React.useMemo<{
        startPointCartesian: CartesianPoint,
        endPointCartesian: CartesianPoint,
        largeArcFlag: string
    }>(() => {
        const startAngleDegrees = layoutOptions.startAngle.convertToDegrees();
        const endAngleDegrees = layoutOptions.endAngle.convertToDegrees();

        // Always use degree angles to make amount of necessary conversions more predictable
        const startPointPolar = new PolarPoint(layoutOptions.center, layoutOptions.radius, startAngleDegrees);
        const endPointPolar = new PolarPoint(layoutOptions.center, layoutOptions.radius, endAngleDegrees);

        const startPointCartesian = startPointPolar.convertToCartesian();
        const endPointCartesian = endPointPolar.convertToCartesian();

        const largeArcFlag = endPointPolar.normalize(startAngleDegrees).angle.convertToDegrees().degrees > 180
            ? "1"
            : "0";

        return {
            startPointCartesian,
            endPointCartesian,
            largeArcFlag
        };
    }, [layoutOptions]);


    return <path fill="none" stroke="black"
        strokeWidth={styleOptions?.strokeWidth ?? "10"}
        className={styleOptions?.className}
        d={`M ${startPointCartesian.x} ${startPointCartesian.y} ` +
            `A ${layoutOptions.radius} ${layoutOptions.radius} ` +
            `0 ${largeArcFlag} 1 ` + // <rotation> <large-arc (necessary when lgt 180deg)> <clock-wise>
            `${endPointCartesian.x} ${endPointCartesian.y}`}
        {...pathProps} // Last so that parent elements can override the default settings (except d)
    />
}
