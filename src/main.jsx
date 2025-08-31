import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router } from 'react-router-dom';
import App from './App';
import './style.css';
import ErrorBoundary from './components/ErrorBoundary';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* <Router>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </Router> */}
    <h1>Welcome to the frontend for Hospital Management System</h1>
  </React.StrictMode>

);
