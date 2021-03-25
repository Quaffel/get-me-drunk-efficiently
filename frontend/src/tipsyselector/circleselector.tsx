import React from "react";
import { Angle, CartesianPoint, Vector, PolarPoint, DegreeAngle } from "./math2d";
import { OpenCircleSvg } from "./opencircle";

export function CircleSelector({
    value,
    displayValue,
    setValue,
    layoutOptions,
    styleOptions
}: {
    value: number,
    displayValue: string,
    setValue: (value: number) => void,
    layoutOptions: {
        knobRadius?: number,

        startAngle: Angle,
        endAngle: Angle,
        radius: number
    },
    styleOptions?: {
        knobClass?: string,
        primaryCircleClass?: string,
        secondaryCircleClass?: string,
        valueDisplayClass?: string,

        primaryCircleProps?: React.SVGProps<SVGPathElement>,
        secondaryCircleProps?: React.SVGProps<SVGPathElement>,
        knobProps?: React.SVGProps<SVGCircleElement>,
        valueDisplayProps?: React.SVGProps<SVGTextElement>
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
        const knobRadius = (layoutOptions?.knobRadius) ?? 10;
        const width = layoutOptions.radius * 2 + knobRadius * 2;

        const center = new CartesianPoint(width / 2, width / 2);

        const startAngleDegrees = layoutOptions.startAngle.convertToDegrees();
        const endAngleDegrees = layoutOptions.endAngle.convertToDegrees();

        const endAngleNormalizedDegrees = new PolarPoint(center, layoutOptions.radius, endAngleDegrees)
            .normalize(startAngleDegrees)
            .angle.convertToDegrees();

        const knobPositionPolar = new PolarPoint(
            center,
            layoutOptions.radius,
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
    }, [value, layoutOptions]);

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

    function onMove(this: HTMLDivElement, event: MouseEvent | TouchEvent) {
        function isTouchEvent(event: Event): event is TouchEvent {
            return (event as any).touches;
        }

        event.preventDefault();

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
                offset: Math.abs(layoutOptions.radius - centerToPointLength),
                point: new CartesianPoint(
                    centerToPoint.x / centerToPointLength * layoutOptions.radius + center.x,
                    centerToPoint.y / centerToPointLength * layoutOptions.radius + center.y
                )
            };
        }

        // Rectangle containing all elements. Offsets are relative to the viewport.
        const targetDimensionsInViewport: DOMRect = this.getBoundingClientRect();
        const cursorPosition: Vector = new CartesianPoint(
            (isTouchEvent(event) ? event.touches[0].clientX : event.clientX) - targetDimensionsInViewport.left,
            (isTouchEvent(event) ? event.touches[0].clientY : event.clientY) - targetDimensionsInViewport.top
        );

        const pointOnCircleCartesian = calculateClosestPointOnCircle(cursorPosition);

        /* Check whether user has moved too far away */
        if (pointOnCircleCartesian.offset > 75) {
            return;
        }

        /* Check whether knob is in the "invalid part" of the circle */
        const knobOpeningAngleDegrees = pointOnCircleCartesian.point.convertPointOnCircleToPolar(
            center, layoutOptions.radius)
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

    const containerRef = React.useRef<HTMLDivElement>(null);
    React.useEffect(() => {
        const element = containerRef.current;
        if (!element) {
            return;
        }

        // Necessary as event listeners must not be passive (Event#preventDefault fails otherwise)
        element.addEventListener("mousemove", onMove, { passive: false });
        element.addEventListener("touchmove", onMove, { passive: false });

        return () => {
            element.removeEventListener("mousemove", onMove);
            element.removeEventListener("touchmove", onMove);
        }
    // eslint demands 'onMove' to be in the dependencies array as well
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [containerRef]);

    return <div ref={containerRef}
        onTouchStart={onPress} onTouchEnd={onRelease} onMouseDown={onPress} onMouseUp={onRelease}>
        <svg width={width} height={width}>
            <OpenCircleSvg
                pathProps={styleOptions?.secondaryCircleProps}
                layoutOptions={{ center, ...layoutOptions }}
                styleOptions={{
                    className: styleOptions?.secondaryCircleClass
                }} />
            <OpenCircleSvg
                pathProps={styleOptions?.primaryCircleProps}
                layoutOptions={{
                    center,
                    radius: layoutOptions.radius,
                    startAngle: layoutOptions.startAngle,
                    endAngle: knobPositionPolar.angle
                }}
                styleOptions={{
                    className: styleOptions?.primaryCircleClass
                }} />
            <circle cx={knobPositionCartesian.x} cy={knobPositionCartesian.y}
                r={knobRadius} fill="white"
                className={styleOptions?.knobClass}
                {...styleOptions?.knobProps} />
            <text x={center.x} y={center.y}
                textAnchor="middle"
                className={styleOptions?.valueDisplayClass}
                {...styleOptions?.valueDisplayProps}>{displayValue}</text>
        </svg>
    </div>
}
