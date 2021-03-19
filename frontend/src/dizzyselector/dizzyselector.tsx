import React from "react";

function convertDegreesToRadians(degrees: number) {
    return degrees / 180 * Math.PI;
}

function convertRadiantsToDegrees(radiants: number) {
    return radiants / (2 * Math.PI) * 360;
}

export function DizzySelector(): React.ReactElement {
    interface Vector {
        x: number,
        y: number
    }

    type CartesianPoint = Vector;

    interface PolarPoint {
        center: CartesianPoint,
        angle: number
    }

    function convertPolarToCartesian(center: CartesianPoint, radius: number, angleInDegrees: number): Vector {
        const angleInRadians = convertDegreesToRadians(angleInDegrees);

        return {
            x: center.x + Math.cos(angleInRadians) * radius,
            y: center.y + Math.sin(angleInRadians) * radius
        };
    }

    const startAngle = 200;
    const endAngle = 90;

    const radius = 100;
    const center: Vector = {
        x: 250,
        y: 250
    };

    const startEndAngularSpan = Math.abs((endAngle % 360) - (startAngle % 360));

    const largeArcFlag = (() => {
        const largerThanSemicircle = startEndAngularSpan > 180;

        // If the start angle is larger than the end angle, the part of the circle that is enclosed by 
        // the start and the end angle is invers.
        return startAngle > endAngle ? !largerThanSemicircle : largerThanSemicircle;
    })() ? "1" : "0";

    const startPoint = convertPolarToCartesian(center, radius, startAngle);
    const endPoint = convertPolarToCartesian(center, radius, endAngle);

    const [knobPosition, setKnobPosition] = React.useState<CartesianPoint>(startPoint);

    function onMove(event: React.MouseEvent<HTMLDivElement>) {
        // Mouse movement only, so the input must not change the value
        if (!event.ctrlKey) {
            return;
        }

        /* Calculate point on circle that is closest to the cursor */
        function calculateEuclideanDistance(vector: Vector): number {
            return Math.sqrt(vector.x ** 2 + vector.y ** 2)
        }

        function calculateClosestPointOnCircle(point: Vector): Vector & { offset: number } {
            const centerToPoint: Vector = {
                x: point.x - center.x,
                y: point.y - center.y
            };

            const centerToPointLength = calculateEuclideanDistance(centerToPoint);

            return {
                offset: Math.abs(radius - centerToPointLength),
                x: centerToPoint.x / centerToPointLength * radius + center.x,
                y: centerToPoint.y / centerToPointLength * radius + center.y
            };
        }

        const targetDimensionsInViewport: DOMRect = event.currentTarget.getBoundingClientRect();
        const cursorPosition: Vector = {
            x: event.clientX - targetDimensionsInViewport.left,
            y: event.clientY - targetDimensionsInViewport.top
        };

        const pointOnCircleCartesian = calculateClosestPointOnCircle(cursorPosition);

        // Cursor is too far away, so the input must not change the value
        if (pointOnCircleCartesian.offset > 75) {
            return;
        }

        /* Transform cartesian point into polar point */
        /**
         * Converts the cartesian coordinates of a point located on the given circle into polar coordinates. 
         */
        function convertCartesianOnCircleIntoPolar(point: CartesianPoint): PolarPoint {
            const centerToPoint: Vector = {
                x: point.x - center.x,
                y: point.y - center.y
            };

            // Determine in which quarter the point is located in and add the respective offset
            let quarterPhiBase, quarterOffset;
            if (centerToPoint.x >= 0) {
                if (centerToPoint.y >= 0) {
                    quarterPhiBase = Math.asin(centerToPoint.y / radius);
                    quarterOffset = 0;
                } else {
                    quarterPhiBase = Math.asin(centerToPoint.x / radius);
                    quarterOffset = 270;
                }
            } else {
                if (centerToPoint.y >= 0) {
                    quarterPhiBase = Math.asin(centerToPoint.x / radius);
                    quarterOffset = 90;
                } else {
                    quarterPhiBase = Math.asin(centerToPoint.y / radius);
                    quarterOffset = 180;
                }
            }

            const quarterPhi = convertRadiantsToDegrees(Math.abs(quarterPhiBase));

            return {
                center,
                angle: quarterPhi + quarterOffset
            };
        }

        const pointOnCirclePolar = convertCartesianOnCircleIntoPolar(pointOnCircleCartesian);

        if (pointOnCirclePolar.angle < startAngle && pointOnCirclePolar.angle > endAngle) {
            return;
        }

        const openingAngle = ((360 - startAngle) + pointOnCirclePolar.angle) % 360;
        const totalValueAngle = (360 - startAngle + endAngle);
        const percentage = openingAngle / totalValueAngle;

        console.log(percentage);

        setKnobPosition(pointOnCircleCartesian);
    }

    return <>
        <h1>How dizzy do you want to be?</h1>
        <div onMouseMove={onMove}
            style={{ backgroundColor: "lightgrey", width: "500px", height: "500px" }}>
            <svg width="500" height="500">
                <path fill="none" stroke="black" strokeWidth="10"
                    d={`M ${startPoint.x} ${startPoint.y} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${endPoint.x} ${endPoint.y}`} />
                <circle cx={knobPosition.x} cy={knobPosition.y} r="10" fill="white" />
            </svg>
        </div>
        <div style={{ height: "900px" }}></div>
    </>
}