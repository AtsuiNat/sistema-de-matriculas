import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import 'bootstrap/dist/css/bootstrap.min.css';
import './app.css';
import App from './App';
import LimiteDeErro from './components/LimiteDeErro';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <LimiteDeErro>
      <App />
    </LimiteDeErro>
  </StrictMode>
);
