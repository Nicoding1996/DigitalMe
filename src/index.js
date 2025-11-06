import React from 'react';
import ReactDOM from 'react-dom/client';
import './variables.css';
import './global.css';
import './utilities.css';
import './App.css';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
