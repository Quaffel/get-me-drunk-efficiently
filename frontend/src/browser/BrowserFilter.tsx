import React from 'react';
import { IIngredient } from '../../../types';
import { IngredientList } from '../searchform/IngredientList';
import { BrowserSearch } from './BrowserSearch';

import './BrowserFilter.css';

export function BrowserFilterPane({
    maxAlcoholConcentration,
    onMaxAlcoholConcentrationUpdate,
    ingredients,
    onIngredientsUpdate
}: {
    maxAlcoholConcentration: number,
    onMaxAlcoholConcentrationUpdate: (value: number) => void,
    ingredients: Array<IIngredient>,
    onIngredientsUpdate: (value: Array<IIngredient>) => void
}): JSX.Element {
    return <details className="browser-filter" open={true}>
        <summary>Filter options</summary>
        <FilterElement label="Drink name" styles={["browser-filter-search"]}>
            <BrowserSearch />
        </FilterElement>
        <FilterElement label="Concentration of alcohol">
            <ValueSlider min={0} max={1} precision={.05} 
                value={maxAlcoholConcentration} onValueUpdate={onMaxAlcoholConcentrationUpdate} />
        </FilterElement>
        <FilterElement label="Ingredients">
            <IngredientList ingredients={ingredients} setIngredients={onIngredientsUpdate} />
        </FilterElement>
    </details>;
}

export function FilterElement({
    label,
    children,
    styles
}: React.PropsWithChildren<{
    label: string,
    styles?: Array<string>
}>): JSX.Element {
    // TODO: Once the :has pseudoclass is supported by all major browsers, the filter element
    // of the browser search can be selected directly.  This hack would thus become superfluous.
    return <div className={`browser-filter-element ${styles?.join(" ")}`}>
        <label>{label}</label>
        {children}
    </div>
}

export function ValueSlider({
    min,
    max,
    precision,
    value,
    onValueUpdate
}: {
    min: number,
    max: number,
    precision: number,
    value: number,
    onValueUpdate?: (value: number) => void | boolean
}): JSX.Element {
    const valueSpan = max - min;

    if (valueSpan <= 0) {
        throw new Error("Max value must not be larger or equal to the min value");
    }
    if (value < min || value > max) {
        throw new Error("Value must be in bounds");
    }
    if (precision <= 0) {
        throw new Error("Illegal precision");
    }
    
    const virtualMax = valueSpan / precision;
    const virtualValue = (value - min) / precision;

    function roundToPrecisionString(value: number): string {
        const precisionString = precision.toString();
        const precisionDigits = precisionString.length - precisionString.indexOf(".") - 1;
        return value.toFixed(precisionDigits);
    }

    const [textInputValue, setTextInputValue] = React.useState<string>(roundToPrecisionString(value));

    function handleValueUpdate(event: React.ChangeEvent<HTMLInputElement>) {
        const currentVirtualValue = Number.parseInt(event.currentTarget.value, 10) * precision;
        const updateInputText = onValueUpdate?.(+currentVirtualValue.toFixed(2)) ?? true;
        if (updateInputText) {
            setTextInputValue(roundToPrecisionString(currentVirtualValue));
        }
    }

    function handleTextUpdate(event: React.ChangeEvent<HTMLInputElement>) {
        setTextInputValue(event.target.value);
    }

    function handleCustomInput(input: string) {
        const numberInput = Number.parseFloat(input);
        if (Number.isNaN(numberInput) || numberInput < min || numberInput > max) {
            setTextInputValue(roundToPrecisionString(value));
            return;
        }

        const newValueString = numberInput.toFixed(2);
        setTextInputValue(newValueString);
        onValueUpdate?.(Number.parseFloat(newValueString));
    }
    function handleTextSubmit(event: React.KeyboardEvent<HTMLInputElement>) {
        if (event.key !== "Enter") {
            return;
        }
        handleCustomInput(event.currentTarget.value);
    }
    function handleUnfocus(event: React.FocusEvent<HTMLInputElement>) {
        handleCustomInput(event.currentTarget.value);
    }

    return <div>
        <input className="browser-filter-slider" type="range"
            min={min} max={virtualMax} value={virtualValue} step={1}
            onChange={handleValueUpdate} />
        <div className="browser-filter-slider-value">
            <span>{min}</span>
            <input type="text" value={textInputValue} 
                onBlur={handleUnfocus} onKeyDown={handleTextSubmit} onChange={handleTextUpdate} />
            <span>{max}</span>
        </div>
    </div>
}