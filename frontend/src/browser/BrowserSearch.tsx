import React from "react";
import { useSearch } from "./search";

import './BrowserSearch.css';

export function BrowserSearch({
    showPlaceholder
}: {
    showPlaceholder?: boolean
}): JSX.Element {
    const { searchValue, setSearchValue } = useSearch();

    function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
        setSearchValue(event.currentTarget.value);
    }

    return <div className="browser-search">
        <input className="browser-search-bar" type="text" 
            placeholder={showPlaceholder ? "Search for cocktails..." : undefined}
            value={searchValue} onChange={handleChange} />
    </div>;
}