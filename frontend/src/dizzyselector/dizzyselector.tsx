import React from "react";

export function DizzySelector(): React.ReactElement {
    interface Point {
        x: number,
        y: number
    }

    function convertPolarToCartesian(center: Point, radius: number, angleInDegrees: number): Point {
        const angleInRadians = convertDegreesToRadians(angleInDegrees);

        return {
            x: center.x + Math.cos(angleInRadians) * radius,
            y: center.y + Math.sin(angleInRadians) * radius
        };
    }

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

    const startAngle = 180;
    const endAngle = 190;

    const radius = 200;
    const center: Point = {
        x: 250,
        y: 250
    };
    const start: Point = convertPolarToCartesian(center, radius, startAngle);
    const end: Point = convertPolarToCartesian(center, radius, endAngle);

    const largeArcFlag = (() => {
        const largerThanSemicircle = Math.abs((endAngle % 360) - (startAngle % 360)) > 180;

        // If the start angle is larger than the end angle, the part of the circle that is enclosed by 
        // the start and the end angle is invers.
        return startAngle > endAngle ? !largerThanSemicircle : largerThanSemicircle;
    })() ? "1" : "0";

    const [knobPosition, setKnobPosition] = React.useState<Point>({x: end.x, y: end.y});

    function onMove(event: React.MouseEvent<HTMLDivElement>) {
        const targetDimensionsInViewport: DOMRect = event.currentTarget.getBoundingClientRect();
        const cursorPosition: Point = {
            x: event.clientX - targetDimensionsInViewport.left,
            y: event.clientY - targetDimensionsInViewport.top
        };

        setKnobPosition(cursorPosition);
    }

    return <>
        <h1>How dizzy do you want to be?</h1>
        <div onMouseMove={onMove}
            style={{ backgroundColor: "lightgrey", width: "500px", height: "500px" }}>
            <svg width="500" height="500">
                <path fill="none" stroke="black" strokeWidth="10"
                    d={`M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${end.x} ${end.y}`} />
                <circle cx={knobPosition.x} cy={knobPosition.y} r="10" fill="white" />
            </svg>
        </div>
        <div style={{height: "900px"}}></div>
    </>
}