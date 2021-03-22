import React from "react";
import { Angle, CartesianPoint, DegreeAngle, PolarPoint } from "./math2d";

export function OpenCircleSvg({
    pathProps,
    circleOptions,
    styleOptions
}: {
    pathProps?: Omit<React.SVGProps<SVGPathElement>, "d" | "fill">
    circleOptions: {
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
        const startAngleDegrees = circleOptions.startAngle.convertToDegrees();
        const endAngleDegrees = circleOptions.endAngle.convertToDegrees();

        // Always use degree angles to make amount of necessary conversions more predictable
        const startPointPolar = new PolarPoint(circleOptions.center, circleOptions.radius, startAngleDegrees);
        const endPointPolar = new PolarPoint(circleOptions.center, circleOptions.radius, endAngleDegrees);

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
    }, [circleOptions]);


    return <path fill="none" stroke="black"
        strokeWidth={styleOptions?.strokeWidth ?? "10"}
        className={styleOptions?.className}
        d={`M ${startPointCartesian.x} ${startPointCartesian.y} ` +
            `A ${circleOptions.radius} ${circleOptions.radius} ` +
            `0 ${largeArcFlag} 1 ` + // <rotation> <large-arc (necessary when lgt 180deg)> <clock-wise>
            `${endPointCartesian.x} ${endPointCartesian.y}`}
        {...pathProps} // Last so that parent elements can override the default settings (except d)
    />
}
