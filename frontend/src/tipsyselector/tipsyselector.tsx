import React from 'react';
import './tipsyselector.css';

import { CircleSelector } from './circleselector';
import { DegreeAngle } from './math2d';

export function useTipsySelector({
    rangeOptions,
    styleOptions
}: {
    rangeOptions: {
        min: number,
        max: number
    }
    styleOptions?: {
        radius?: number,
        displayValueFormatter?: (value: number) => string
    },
}): [element: React.ReactElement, value: number] {
    const [normalizedValue, setNormalizedValue] = React.useState<number>(.5);
    const value = (rangeOptions.max - rangeOptions.min) * normalizedValue + rangeOptions.min;

    const formattedValue = (styleOptions?.displayValueFormatter ?? ((it: number) => it.toFixed(2) + ""))(value);

    const el = <CircleSelector displayValue={formattedValue}
        value={normalizedValue} setValue={setNormalizedValue}
        circleOptions={{
            radius: styleOptions?.radius ?? 100,
            startAngle: new DegreeAngle(130),
            endAngle: new DegreeAngle(50)
        }}
        styleOptions={{
            primaryCircleClass: "tipsyselector-primary",
            secondaryCircleClass: "tipsyselector-secondary",
            knobClass: "tipsyselector-knob",
            valueDisplayClass: "tipsyselector-display"
        }}
    />;

    console.log(value);

    return [el, value];
}
