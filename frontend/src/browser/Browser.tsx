import React from 'react';
import { types } from '@get-me-drunk/common';
import { DrinkGrid } from '../drinks/DrinkGrid';
import { Query, useSearch } from './search';
import { BrowserFilterPane } from './BrowserFilter';

import './Browser.css';

export function Browser(): JSX.Element {
    const { submitQuery } = useSearch();

    const [maxAlcoholConcentration, setMaxAlcoholConcentration] = React.useState<number>(0.2);
    const [ingredients, setIngredients] = React.useState<Array<types.IIngredient>>([]);

    React.useEffect(() => {
        submitQuery(prev => ({
            ...prev.data,
            maxAlcoholConcentration,
            ingredients
        }));
    }, [maxAlcoholConcentration, ingredients]);

    return <div className="browser">
        <BrowserFilterPane 
            maxAlcoholConcentration={maxAlcoholConcentration} 
            onMaxAlcoholConcentrationUpdate={setMaxAlcoholConcentration}
            ingredients={ingredients} 
            onIngredientsUpdate={setIngredients} />
        <BrowserResult />
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
    if (contentQuery.results.length === 0) {
        return <BrowserStatusMessage>No results</BrowserStatusMessage>
    }

    return <div className="browser-result"><DrinkGrid drinks={contentQuery.results} /></div>;
}

function BrowserStatusMessage({ children }: { children: string }): JSX.Element {
    return <div className="browser-result-status">
            <label>No results</label>
        </div>;
}
