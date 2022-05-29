import React from "react";
import { useSearch } from "./search";

import './BrowserSearch.css';

export function BrowserSearch(): JSX.Element {
    const { submitQuery } = useSearch();

    const [searchValue, setSearchValue] = React.useState<string>("");
    React.useEffect(() => {
        submitQuery(prev => ({
            ...prev.data,
            drinkName: searchValue
        }));
    }, [searchValue]);

    function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
        setSearchValue(event.currentTarget.value);
    }

    return <div className="browser-search">
        <input className="browser-search-bar" type="text" value={searchValue} onChange={handleChange} />
    </div>;
}