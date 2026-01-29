// index.js - Entry point for React application
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

// Get the root element from index.html
const root = ReactDOM.createRoot(document.getElementById('root'));

// Render the App component
// StrictMode helps identify potential problems in the app during development
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);