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
        radius?: number
    },
}): [element: React.ReactElement, value: number] {
    const [normalizedValue, setNormalizedValue] = React.useState<number>(.5);
    const value = (rangeOptions.max - rangeOptions.min) * normalizedValue + rangeOptions.min;

    const formattedValue = value.toFixed(2) + "\u2030";

    const el = <div className="tipsyselector-container">
        <h2 className="searchform-label">How drunk do you want to get?</h2>
        <div className="circleselector-container">
            <CircleSelector displayValue={formattedValue}
                value={normalizedValue} setValue={setNormalizedValue}
                layoutOptions={{
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
            />
        </div>
    </div>;

    return [el, value];
}
