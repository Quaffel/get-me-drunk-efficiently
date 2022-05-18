import React from 'react';
import { IDrink, IIngredient } from '../../../types';

import './Browser.css';

interface QueryData {
    searchValue: string,
    filterIngredients?: Array<IIngredient>
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
    submitQuery: (query: QueryData) => void
}
const SearchContext = React.createContext<SearchContextProps>({} as any);

export const useSearch = () => React.useContext(SearchContext);

export function SearchProvider({ children }: React.PropsWithChildren<{}>): JSX.Element {
    const [query, setQuery] = React.useState<Query>({
        state: 'pending',
        data: { searchValue: "" },
        lastCompletedQuery: null
    });

    function submitQuery(newQuery: QueryData) {
        setQuery(prev => ({
            state: 'pending',
            data: newQuery,
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
            console.log("Submitted query: ", query);
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