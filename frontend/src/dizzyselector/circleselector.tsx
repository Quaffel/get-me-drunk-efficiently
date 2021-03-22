import React, { SVGProps } from "react";
import { Angle, CartesianPoint, Vector, PolarPoint, DegreeAngle } from "./math2d";
import { OpenCircleSvg } from "./opencircle";

export function DizzySelector({
    value,
    setValue,
    circleOptions,
    styleOptions
}: {
    value: number,
    setValue: (value: number) => void,
    circleOptions: {
        startAngle: Angle,
        endAngle: Angle,
        radius: number
    },
    styleOptions?: {
        knobRadius?: number,

        knobClass?: string,
        primaryCircleClass?: string,
        secondaryCircleClass?: string,

        primaryCircleProps?: SVGProps<SVGPathElement>,
        secondaryCircleProps?: SVGProps<SVGPathElement>,
        knobProps?: SVGProps<SVGCircleElement>
    }
}): React.ReactElement {
    if (value > 1 || value < 0) {
        throw new Error("Illegal value");
    }

    let { width, center, knobRadius,
        startAngleDegrees, endAngleNormalizedDegrees, knobPositionPolar, knobPositionCartesian
    } = React.useMemo<{
        width: number,
        center: CartesianPoint,
        knobRadius: number

        startAngleDegrees: DegreeAngle,
        endAngleNormalizedDegrees: DegreeAngle,
        knobPositionPolar: PolarPoint,
        knobPositionCartesian: CartesianPoint
    }>(() => {
        const knobRadius = (styleOptions?.knobRadius) ?? 10;
        const width = circleOptions.radius * 2 + knobRadius * 2;

        const center = new CartesianPoint(width / 2, width / 2);

        const startAngleDegrees = circleOptions.startAngle.convertToDegrees();
        const endAngleDegrees = circleOptions.endAngle.convertToDegrees();

        const endAngleNormalizedDegrees = new PolarPoint(center, circleOptions.radius, endAngleDegrees)
            .normalize(startAngleDegrees)
            .angle.convertToDegrees();

        const knobPositionPolar = new PolarPoint(
            center,
            circleOptions.radius,
            new DegreeAngle(endAngleNormalizedDegrees.degrees * value + startAngleDegrees.degrees)
        );
        const knobPositionCartesian = knobPositionPolar.convertToCartesian();

        return {
            width,
            center,
            knobRadius,
            startAngleDegrees,
            endAngleNormalizedDegrees,
            knobPositionPolar,
            knobPositionCartesian
        }
    }, [value, circleOptions]);

    const pressed = React.useRef<{ pressed: boolean, lastRegisteredInput: number }>({
        pressed: false,
        lastRegisteredInput: 0
    });
    function onPress() {
        pressed.current.pressed = true;
    }
    function onRelease() {
        pressed.current.pressed = false;
        pressed.current.lastRegisteredInput = 0;
    }

    function onMove(event: React.MouseEvent<HTMLDivElement>) {
        /* Debounce and check for mouse press */
        const currentTime = new Date().getTime();
        // Mouse movement only, so the input must not change the value
        if (!pressed.current.pressed || currentTime - 25 < pressed.current.lastRegisteredInput) {
            return;
        }

        /* Determine point on circle closest to the cursor */
        function calculateClosestPointOnCircle(point: CartesianPoint): { point: CartesianPoint, offset: number } {
            const centerToPoint: Vector = new CartesianPoint(
                point.x - center.x,
                point.y - center.y
            );

            const centerToPointLength = centerToPoint.calculateEuclideanDistance();

            return {
                offset: Math.abs(circleOptions.radius - centerToPointLength),
                point: new CartesianPoint(
                    centerToPoint.x / centerToPointLength * circleOptions.radius + center.x,
                    centerToPoint.y / centerToPointLength * circleOptions.radius + center.y
                )
            };
        }

        // Rectangle containing all elements. Offsets are relative to the viewport.
        const targetDimensionsInViewport: DOMRect = event.currentTarget.getBoundingClientRect();
        const cursorPosition: Vector = new CartesianPoint(
            event.clientX - targetDimensionsInViewport.left,
            event.clientY - targetDimensionsInViewport.top
        );

        const pointOnCircleCartesian = calculateClosestPointOnCircle(cursorPosition);

        /* Check whether user has moved too far away */
        if (pointOnCircleCartesian.offset > 75) {
            return;
        }

        /* Check whether knob is in the "invalid part" of the circle */
        const knobOpeningAngleDegrees = pointOnCircleCartesian.point.convertPointOnCircleToPolar(
            center, circleOptions.radius)
            .normalize(startAngleDegrees)
            .angle.convertToDegrees();

        if (knobOpeningAngleDegrees.degrees > endAngleNormalizedDegrees.degrees) {
            return;
        }

        const openingAngle = knobOpeningAngleDegrees.degrees;
        const totalValueAngle = endAngleNormalizedDegrees.degrees;
        const percentage = openingAngle / totalValueAngle;

        pressed.current.lastRegisteredInput = currentTime;
        setValue(percentage);
    }

    return <div onMouseMove={onMove}
        onTouchStart={onPress} onTouchEnd={onRelease} onMouseDown={onPress} onMouseUp={onRelease}>
        <svg width={width} height={width}>
            <OpenCircleSvg
                pathProps={styleOptions?.secondaryCircleProps}
                circleOptions={{ center, ...circleOptions }}
                styleOptions={{
                    className: styleOptions?.secondaryCircleClass
                }} />
            <OpenCircleSvg
                pathProps={styleOptions?.primaryCircleProps}
                circleOptions={{
                    center,
                    radius: circleOptions.radius,
                    startAngle: circleOptions.startAngle,
                    endAngle: knobPositionPolar.angle
                }}
                styleOptions={{
                    className: styleOptions?.primaryCircleClass
                }} />
            <circle cx={knobPositionCartesian.x} cy={knobPositionCartesian.y}
                r={knobRadius} fill="white"
                className={styleOptions?.knobClass}
                {...styleOptions?.knobProps} />
        </svg>
    </div>
}
