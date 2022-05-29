import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import { Browser } from './browser/Browser';

import './App.css';
import { SearchProvider } from './browser/search';
import { NavProvider } from './nav/nav';
import { Navbar } from './nav/Navbar';
import { BrowserSearch } from './browser/BrowserSearch';

ReactDOM.render(
  <React.StrictMode>
    <div className="app">
      <NavProvider fallbackElementId="tipsiness">
        <SearchProvider>
          <header>
            <div className="app-title">Get me drunk <span className="app-title-suffix">efficiently</span></div>
            <Navbar />
            <BrowserSearch />
          </header>
          <navElement id="tipsiness" name="Browse by tipsiness">
            <App />
          </navElement>
          <navElement id="browser" name="Conventional browsing">
            <Browser />
          </navElement>
        </SearchProvider>
      </NavProvider>
    </div>
  </React.StrictMode>,
  document.getElementById('root')
);
