// src/app/error.js
"use client";
import './error.css';

export default function Error({ error, reset }) {
  const message =
    process.env.NODE_ENV === 'production'
      ? 'An unexpected error occurred.'
      : error.message;

  return (
    <div className="error-container">
      <div className="error-panel">
        <h2 className="error-title">SYSTEM FAILURE</h2>
        <p>Ordis has encountered an error:</p>
        <pre className="error-message">
          {message}
        </pre>
        <button 
          onClick={() => reset()} 
          className="error-reset-button"
        >
          REBOOT SYSTEM
        </button>
      </div>
    </div>
  );
}
