import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { Web3AuthProvider } from './auth/Web3AuthContext';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <Web3AuthProvider>
      <App />
    </Web3AuthProvider>
  </React.StrictMode>
);