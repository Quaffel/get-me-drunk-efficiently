import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import { Browser } from './browser/Browser';

import './App.css';
import { SearchProvider } from './browser/search';

ReactDOM.render(
  <React.StrictMode>
    {/* <App /> */}
    <SearchProvider>
      <Browser />
    </SearchProvider>
  </React.StrictMode>,
  document.getElementById('root')
);
