import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// Forzar zona horaria de Buenos Aires en todos los formateos de fecha del frontend
const originalToLocaleString = Date.prototype.toLocaleString;
Date.prototype.toLocaleString = function (locales, options) {
  const opts = { ...options, timeZone: 'America/Argentina/Buenos_Aires' };
  return originalToLocaleString.call(this, locales || 'es-AR', opts);
};

const originalToLocaleDateString = Date.prototype.toLocaleDateString;
Date.prototype.toLocaleDateString = function (locales, options) {
  const opts = { ...options, timeZone: 'America/Argentina/Buenos_Aires' };
  return originalToLocaleDateString.call(this, locales || 'es-AR', opts);
};

const originalToLocaleTimeString = Date.prototype.toLocaleTimeString;
Date.prototype.toLocaleTimeString = function (locales, options) {
  const opts = { ...options, timeZone: 'America/Argentina/Buenos_Aires' };
  return originalToLocaleTimeString.call(this, locales || 'es-AR', opts);
};

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
