import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { MotionConfig } from 'framer-motion';
import App from './App.tsx';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';
import './index.css';

// @monaco-editor/react rejects with { type: 'cancelation' } when an editor unmounts before Monaco
// finishes loading (e.g. leaving a tool page quickly). It's expected, so keep it out of the console.
window.addEventListener('unhandledrejection', (e) => {
  if ((e.reason as { type?: string } | null)?.type === 'cancelation') e.preventDefault();
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <ToastProvider>
          <MotionConfig reducedMotion="user">
            <App />
          </MotionConfig>
        </ToastProvider>
      </ThemeProvider>
    </BrowserRouter>
  </StrictMode>
);
