import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import { Searchbar } from './searchbar/AutocompleteBar';
import { TiledBar } from './searchbar/TiledBar';

// ReactDOM.render(
//   <React.StrictMode>
//     <App />
//   </React.StrictMode>,
//   document.getElementById('root')
// );



ReactDOM.render(
  <React.StrictMode>
    <Searchbar querySuggestions={query => [query, "bla"]} />
    <TiledBar>Test text<inlineTag color="red">set by main</inlineTag>end</TiledBar>
    <TiledBar />
    <TiledBar>t</TiledBar>
  </React.StrictMode>,
  document.getElementById('root')
);
