import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { LookupProvider } from './hooks/useLookups';
import { SettingsProvider } from './hooks/useSettings';
import { ToastProvider } from './hooks/useToast';
import './styles/index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <ToastProvider>
        <LookupProvider>
          <SettingsProvider>
            <App />
          </SettingsProvider>
        </LookupProvider>
      </ToastProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
