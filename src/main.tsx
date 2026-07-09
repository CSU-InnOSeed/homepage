import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { initObservability } from './lib/observability';
import './styles/globals.css';

// Boot observability BEFORE React mounts so global error handlers catch
// anything from the first render. No-op if no endpoint is configured.
initObservability();

const container = document.getElementById('root');
if (!container) {
  throw new Error('Root element #root not found in index.html');
}
createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>
);
