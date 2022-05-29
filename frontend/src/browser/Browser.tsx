import React from 'react';
import { DrinkGrid } from '../drinks/DrinkGrid';
import { Query, useSearch } from './search';

import { IIngredient } from '../../../types';
import { FilterElement, ValueSlider } from './BrowserFilter';
import { IngredientList } from '../searchform/IngredientList';

import './Browser.css';

export function Browser(): JSX.Element {
    const { submitQuery } = useSearch();

    const [maxAlcoholConcentration, setMaxAlcoholConcentration] = React.useState<number>(0.2);
    const [ingredients, setIngredients] = React.useState<Array<IIngredient>>([]);

    React.useEffect(() => {
        submitQuery(prev => ({
            ...prev.data,
            maxAlcoholConcentration,
            ingredients
        }));
    }, [maxAlcoholConcentration, ingredients]);

    return <div className="browser">
        <BrowserResult />
        <BrowserFilterPane 
            maxAlcoholConcentration={maxAlcoholConcentration} 
            onMaxAlcoholConcentrationUpdate={setMaxAlcoholConcentration}
            ingredients={ingredients} 
            onIngredientsUpdate={setIngredients} />
    </div>;
}

export function BrowserResult(): JSX.Element {
    const { query } = useSearch();
    if (query === null) {
        return <BrowserStatusMessage>No active query :(</BrowserStatusMessage>;
    }

    const contentQuery: Query | null = query.state === 'completed' ? query : query.lastCompletedQuery;
    if (contentQuery?.state !== 'completed') {
        return <BrowserStatusMessage>Loading</BrowserStatusMessage>;
    }

    console.log("rerendering results");
    console.log(contentQuery.results);
    return <div className="browser-result"><DrinkGrid drinks={contentQuery.results} /></div>;
}

function BrowserStatusMessage({ children }: { children: string }): JSX.Element {
    return <div className="browser-result browser-message">{children}</div>;
}

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
    return <div className="browser-filter">
        <FilterElement label="Concentration of alcohol">
            <ValueSlider min={0} max={1} precision={.05} 
                value={maxAlcoholConcentration} onValueUpdate={onMaxAlcoholConcentrationUpdate} />
        </FilterElement>
        <FilterElement label="Ingredients">
            <IngredientList ingredients={ingredients} setIngredients={onIngredientsUpdate} />
        </FilterElement>
    </div>;
}