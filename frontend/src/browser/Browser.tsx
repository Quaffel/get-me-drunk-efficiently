import React from 'react';
import { DrinkGrid } from '../drinks/DrinkGrid';
import { Query, SearchProvider, useSearch } from './search';

import './Browser.css';
import SearchForm from '../searchform/searchform';
import { IIngredient } from '../../../types';
import { FilterElement, ValueSlider } from './BrowserFilter';
import { IngredientList, loadAllIngredients } from '../searchform/IngredientList';
import * as API from '../api';

export function Browser(): JSX.Element {
    const { submitQuery } = useSearch();

    const [searchValue, setSearchValue] = React.useState<string>("");

    const [permille, setPermille] = React.useState<number>(0.8);
    const [ingredients, setIngredients] = React.useState<Array<IIngredient>>([]);

    React.useEffect(() => {
        submitQuery({
            searchValue,
            filterIngredients: ingredients
        });
    }, [searchValue, permille, ingredients]);

    return <div className="browser">
        <BrowserSearch searchValue={searchValue} setSearchValue={setSearchValue} />
        <BrowserResult />
        <BrowserFilterPane permille={permille} setPermille={setPermille}
            ingredients={ingredients} setIngredients={setIngredients} />
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

    return <div className="browser-result"><DrinkGrid drinks={contentQuery.results} /></div>;
}

function BrowserStatusMessage({ children }: { children: string }): JSX.Element {
    return <div className="browser-result browser-message">{children}</div>;
}

export function BrowserSearch({
    searchValue,
    setSearchValue
}: {
    searchValue: string,
    setSearchValue: (value: string) => void
}): JSX.Element {
    function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
        setSearchValue(event.currentTarget.value);
    }

    return <div className="browser-search">
        <input className="browser-search-bar" type="text" value={searchValue} onChange={handleChange} />
    </div>;
}

export function BrowserFilterPane({
    permille, setPermille,
    ingredients, setIngredients
}: {
    permille: number,
    setPermille: (value: number) => void,
    ingredients: Array<IIngredient>,
    setIngredients: (value: Array<IIngredient>) => void
}): JSX.Element {

    return <div className="browser-filter">
        <FilterElement label="Permille">
            <ValueSlider min={0} max={2} precision={.05} value={permille} onValueUpdate={setPermille} />
        </FilterElement>
        <FilterElement label="Ingredients">
            <IngredientList ingredients={ingredients} setIngredients={setIngredients} />
        </FilterElement>
    </div>;
}