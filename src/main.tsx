import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.tsx';
import AuthProvider from './context/auth/AuthProvider.tsx';
import './index.css';
import { ToastProvider } from './lib/toast/ToastProvider.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
        <ToastProvider />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
);
