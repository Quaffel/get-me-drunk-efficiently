import React from 'react';
import { IDrink, IIngredient } from '../../../types';
import { queryDrinks } from '../api';

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
    readonly query: Query,
    submitQuery: (block: (prevQuery: Query) => QueryData) => void
}
const SearchContext = React.createContext<SearchContextProps>({} as any);

export const useSearch = () => React.useContext(SearchContext);

export function SearchProvider({ children }: React.PropsWithChildren<{}>): JSX.Element {
    const [query, setQuery] = React.useState<Query>({
        state: 'pending',
        data: {},
        lastCompletedQuery: null
    });

    function submitQuery(block: (prevQuery: Query) => QueryData) {
        setQuery(prev => ({
            state: 'pending',
            data: block(prev),
            lastCompletedQuery: prev.state === 'completed' ? prev : prev.lastCompletedQuery
        }));
    }

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

            console.log("finished query");
        }, 1000);
        return () => clearTimeout(timeout);
    }, [query])

    const context = React.useMemo<SearchContextProps>(() => ({
        query,
        submitQuery
    }), [query]);

    return <SearchContext.Provider value={context}>
        {children}
    </SearchContext.Provider>;
}