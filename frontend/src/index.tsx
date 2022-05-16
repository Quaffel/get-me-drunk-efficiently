import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import { SearchBar } from './searchbar/SearchBar';

// ReactDOM.render(
//   <React.StrictMode>
//     <App />
//   </React.StrictMode>,
//   document.getElementById('root')
// );

ReactDOM.render(
  <React.StrictMode>
    <SearchBar querySuggestions={query => [query, "bla"]} />
  </React.StrictMode>,
  document.getElementById('root')
);
