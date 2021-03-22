import React from "react";
import { Angle, CartesianPoint, CartesianVector as Vector, DegreeAngle, PolarPoint } from "./math2d";

export function DizzySelector({
    circleOptions
}: {
    circleOptions: {
        startAngle: Angle,
        endAngle: Angle,
        radius: number,
        center: CartesianPoint,
    }
}): React.ReactElement {
    const startAngleDegrees = circleOptions.startAngle.convertToDegrees();
    const endAngleDegrees = circleOptions.endAngle.convertToDegrees();

    // Always use degree angles to make amount of necessary conversions more predictable
    const startPointPolar = new PolarPoint(circleOptions.center, circleOptions.radius, startAngleDegrees);
    const endPointPolar = new PolarPoint(circleOptions.center, circleOptions.radius, endAngleDegrees)

    const startPointCartesian = startPointPolar.convertToCartesian();
    const endPointCartesian = endPointPolar.convertToCartesian();

    const startEndAngularSpan = Math.abs(endAngleDegrees.degrees - startAngleDegrees.degrees);

    // TODO: Test extreme case: 350 -> 10

    const largeArcFlag = (() => {
        const largerThanSemicircle = startEndAngularSpan > 180;

        // If the start angle is larger than the end angle, the part of the circle that is enclosed by 
        // the start and the end angle is invers.
        return startAngleDegrees.degrees > endAngleDegrees.degrees ? !largerThanSemicircle : largerThanSemicircle;
    })() ? "1" : "0";

    console.log(`Arc flag: ${largeArcFlag}`);

    const [knobPosition, setKnobPosition] = React.useState<CartesianPoint>(startPointCartesian);

    function onMove(event: React.MouseEvent<HTMLDivElement>) {
        // Mouse movement only, so the input must not change the value
        if (!event.ctrlKey) {
            return;
        }

        /* Calculate point on circle that is closest to the cursor */
        function calculateClosestPointOnCircle(point: CartesianPoint): { point: CartesianPoint, offset: number } {
            const centerToPoint: Vector = new CartesianPoint(
                point.x - circleOptions.center.x,
                point.y - circleOptions.center.y
            );

            const centerToPointLength = centerToPoint.calculateEuclideanDistance();

            return {
                offset: Math.abs(circleOptions.radius - centerToPointLength),
                point: new CartesianPoint(
                    centerToPoint.x / centerToPointLength * circleOptions.radius + circleOptions.center.x,
                    centerToPoint.y / centerToPointLength * circleOptions.radius + circleOptions.center.y
                )
            };
        }

        const targetDimensionsInViewport: DOMRect = event.currentTarget.getBoundingClientRect();
        const cursorPosition: Vector = new CartesianPoint(
            event.clientX - targetDimensionsInViewport.left,
            event.clientY - targetDimensionsInViewport.top
        );

        const pointOnCircleCartesian = calculateClosestPointOnCircle(cursorPosition);

        // Cursor is too far away, so the input must not change the value
        if (pointOnCircleCartesian.offset > 75) {
            return;
        }

        /* Transform cartesian point into polar point */
        const pointOnCirclePolar = pointOnCircleCartesian.point.convertPointOnCircleToPolar(
            circleOptions.center, circleOptions.radius
        );

        // Knob is between start and end point; thus on the invalid part of the circle
        if (pointOnCirclePolar.angle.convertToDegrees().degrees < startAngleDegrees.degrees
            && pointOnCirclePolar.angle.convertToDegrees().degrees > endAngleDegrees.degrees) {
            return;
        }

        const openingAngle = pointOnCirclePolar.normalize(startAngleDegrees).angle.convertToDegrees().degrees;
        const totalValueAngle = (360 - startAngleDegrees.degrees + endAngleDegrees.degrees);
        const percentage = openingAngle / totalValueAngle;

        console.log(percentage);

        setKnobPosition(pointOnCircleCartesian.point);
    }

    return <>
        <h1>How dizzy do you want to be?</h1>
        <div onMouseMove={onMove}
            style={{ backgroundColor: "lightgrey", width: "500px", height: "500px" }}>
            <svg width="500" height="500">
                <path fill="none" stroke="black" strokeWidth="10"
                    d={`M ${startPointCartesian.x} ${startPointCartesian.y} A ${circleOptions.radius} ${circleOptions.radius} 0 ${largeArcFlag} 1 ${endPointCartesian.x} ${endPointCartesian.y}`} />
                <circle cx={knobPosition.x} cy={knobPosition.y} r="10" fill="white" />
            </svg>
        </div>
        <div style={{ height: "900px" }}></div>
    </>
}