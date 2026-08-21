import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router } from 'react-router-dom';
import App from './App';

/**
 * The site previously ran on HashRouter, so links like /#/works exist in
 * bookmarks, in shared messages and possibly in search results. The fragment
 * never reaches the server, so only the client can repair these — rewrite the
 * URL before React Router reads it, so the app mounts on the right route.
 */
const redirectLegacyHashUrl = () => {
  const { hash, pathname, search } = window.location;
  if (pathname === '/' && hash.startsWith('#/')) {
    window.history.replaceState(null, '', hash.slice(1) + search);
  }
};

redirectLegacyHashUrl();

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Could not find root element to mount to');
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <Router>
      <App />
    </Router>
  </React.StrictMode>,
);
