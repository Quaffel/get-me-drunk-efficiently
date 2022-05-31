import React from 'react';
import { IDrink, IIngredient } from '../../../types';
import { queryDrinks } from '../api';
import { arrayEquals } from '../util/array';

import './Browser.css';

interface QueryData {
    drinkName?: string,
    maxAlcoholConcentration?: number,
    ingredients?: Array<IIngredient>,
}

interface QueryBase<T extends string> {
    state: T,
    data: QueryData
}
interface PendingQuery extends QueryBase<'pending'> {
    lastCompletedQuery: CompletedQuery | null;
}
interface LoadingQuery extends QueryBase<'loading'> {
    lastCompletedQuery: CompletedQuery;
}
interface FailedQuery extends QueryBase<'loading'> {
    lastCompletedQuery: CompletedQuery;
}
interface CompletedQuery extends QueryBase<'completed'> {
    results: Array<IDrink>
}

export type Query = PendingQuery | LoadingQuery | FailedQuery | CompletedQuery;

interface SearchContextProps {
    // Allows search bars that enable the user to search by drink name to coordinate their content.
    // This is essential for the site's responsiveness as the search bar that the user needs to interact with
    // isn't necessarily the same in all page layouts.
    // Due to query debouncing and potentially other effects, this is not necessarily equivalent to the
    // 'drinkName' property of the currently active query.
    searchValue: string,
    setSearchValue: (searchValue: string) => void,

    // Currently active query
    query: Query,
    submitQuery: (block: (prevQuery: Query) => QueryData) => boolean
}
const SearchContext = React.createContext<SearchContextProps>({} as any);

export const useSearch = () => React.useContext(SearchContext);

export function SearchProvider({ children }: React.PropsWithChildren<{}>): JSX.Element {
    const [searchValue, setSearchValue] = React.useState<string>("");
    const [query, setQuery] = React.useState<Query>({
        state: 'pending',
        data: {},
        lastCompletedQuery: null
    });

    function submitQuery(block: (prevQuery: Query) => QueryData): boolean {
        const prevQuery = query;
        const newQueryData = block(prevQuery);

        if (prevQuery.data.drinkName === newQueryData.drinkName
            && arrayEquals(prevQuery.data.ingredients, newQueryData.ingredients)
            && prevQuery.data.maxAlcoholConcentration === newQueryData.maxAlcoholConcentration) {
            // Query data is equal to the query data of the previous query.  Skip query.
            return false;
        }

        setQuery(() => ({
            state: 'pending',
            data: newQueryData,
            lastCompletedQuery: prevQuery.state === 'completed' ? prevQuery : prevQuery.lastCompletedQuery
        }));
        return true;
    }

    React.useEffect(() => {
        submitQuery(prev => ({
            ...prev.data,
            drinkName: searchValue
        }));
    }, [searchValue]);

    React.useEffect(() => {
        if (query.state !== 'pending') {
            return;
        }

        // Do not send any request until one second has passed without user interaction. 
        // If a new query is registered (due to user interaction), the previous effect's timeout is cleared.
        // Edge cases in which the timeout is not cleared in time are permissible.
        const timeout = setTimeout(async () => {
            const drinks = (await queryDrinks({
                drinkName: query.data.drinkName,
                maxAlcoholConcentration: query.data.maxAlcoholConcentration,
                ingredients: query.data.ingredients?.map(it => it.name)
            })).drinks;

            setQuery({
                state: 'completed',
                data: query.data,
                results: drinks
            });
        }, 1000);
        return () => clearTimeout(timeout);
    }, [query])

    const context = React.useMemo<SearchContextProps>(() => ({
        searchValue,
        setSearchValue,
        query,
        submitQuery
    }), [query]);

    return <SearchContext.Provider value={context}>
        {children}
    </SearchContext.Provider>;
}