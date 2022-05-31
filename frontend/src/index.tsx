import React from 'react';
import ReactDOM from 'react-dom';
import App from './tipsiness/App';
import { Browser } from './browser/Browser';
import { SearchProvider } from './browser/search';
import { NavProvider } from './nav/nav';
import { Navbar } from './nav/Navbar';
import { BrowserSearch } from './browser/BrowserSearch';

import './index.css';

ReactDOM.render(
  <React.StrictMode>
    <div className="app">
      <NavProvider fallbackElementId="tipsiness">
        <SearchProvider>
          <header>
            <div className="app-title">Get me drunk <span className="app-title-suffix">efficiently</span></div>
            <Navbar />
            <div className="header-search">
              <BrowserSearch showPlaceholder={true} />
            </div>
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
