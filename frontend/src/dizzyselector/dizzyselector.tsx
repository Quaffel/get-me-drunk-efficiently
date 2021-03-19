import React from "react";

function convertDegreesToRadians(degrees: number, normalize: boolean = true) {
    /*
     * Normalization: Substract 90 degrees as circle would start in B rather than A otherwise.
     *     A
     *   /   \
     *  D     B
     *   \   /
     *     C
     */
    return (degrees - (normalize ? 90 : 0)) / 180 * Math.PI;
}

function convertRadiantsToDegrees(radiants: number) {
    return radiants / (2 * Math.PI) * 360;
}

export function DizzySelector(): React.ReactElement {
    interface TDVector {
        x: number,
        y: number
    }

    type TDPoint = TDVector;

    function convertPolarToCartesian(center: TDVector, radius: number, angleInDegrees: number): TDVector {
        const angleInRadians = convertDegreesToRadians(angleInDegrees);

        return {
            x: center.x + Math.cos(angleInRadians) * radius,
            y: center.y + Math.sin(angleInRadians) * radius
        };
    }

    const startAngle = 200;
    const endAngle = 160;

    const radius = 200;
    const center: TDVector = {
        x: 250,
        y: 250
    };
    const startPoint: TDPoint = convertPolarToCartesian(center, radius, startAngle);
    const endPoint: TDPoint = convertPolarToCartesian(center, radius, endAngle);

    const startEndAngularSpan = Math.abs((endAngle % 360) - (startAngle % 360));

    const largeArcFlag = (() => {
        const largerThanSemicircle = startEndAngularSpan > 180;

        // If the start angle is larger than the end angle, the part of the circle that is enclosed by 
        // the start and the end angle is invers.
        return startAngle > endAngle ? !largerThanSemicircle : largerThanSemicircle;
    })() ? "1" : "0";

    const [knobPosition, setKnobPosition] = React.useState<TDVector>({ x: endPoint.x, y: endPoint.y });

    function onMove(event: React.MouseEvent<HTMLDivElement>) {
        if (!event.ctrlKey) {
            return;
        }

        const targetDimensionsInViewport: DOMRect = event.currentTarget.getBoundingClientRect();
        const cursorPosition: TDVector = {
            x: event.clientX - targetDimensionsInViewport.left,
            y: event.clientY - targetDimensionsInViewport.top
        };

        function calculateEuclideanDistance(vector: TDVector): number {
            return Math.sqrt(vector.x ** 2 + vector.y ** 2)
        }

        function calculateClosestPointOnCircle(point: TDVector): TDVector | null {
            const centerToPoint: TDVector = {
                x: point.x - center.x,
                y: point.y - center.y
            };

            const centerToPointLength = calculateEuclideanDistance(centerToPoint);
            if (Math.abs(radius - centerToPointLength) > 75) {
                return null;
            }

            return {
                x: centerToPoint.x / centerToPointLength * radius + center.x,
                y: centerToPoint.y / centerToPointLength * radius + center.y
            };
        }

        function calculateOpeningAngle(point: TDPoint, spanPoint: TDPoint) {
            const spanPointToPointLength: number = calculateEuclideanDistance({
                x: point.x - spanPoint.x,
                y: point.y - spanPoint.y
            });

            return convertRadiantsToDegrees(Math.acos(1 - (spanPointToPointLength ** 2) / (2 * radius ** 2)));
        }

        const pointOnCircle = calculateClosestPointOnCircle(cursorPosition) ?? knobPosition;

        const totalValueAngularSpan = 360 - startEndAngularSpan;
        const openingAngleStart = calculateOpeningAngle(pointOnCircle, startPoint);
        const openingAngleEnd = calculateOpeningAngle(pointOnCircle, endPoint);
        const percentage = (() => {
            if (totalValueAngularSpan <= 180) {
                return openingAngleStart / totalValueAngularSpan;
            } else {
                if (openingAngleStart < openingAngleEnd) {
                    return openingAngleStart / totalValueAngularSpan;
                } else {
                    return (totalValueAngularSpan / 2 + (totalValueAngularSpan / 2 - openingAngleEnd)) / totalValueAngularSpan;
                }
            }
        })();

        if (openingAngleStart < startEndAngularSpan && openingAngleEnd < startEndAngularSpan) {
            return;
        }

        setKnobPosition(pointOnCircle);
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