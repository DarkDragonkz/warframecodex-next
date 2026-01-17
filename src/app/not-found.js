// src/app/not-found.js
import Link from 'next/link';
import './not-found.css';

export default function NotFound() {
  return (
    <div className="notfound-container">
      <div className="notfound-panel">
        <h1 className="notfound-title">404 - ORDIS NOT FOUND</h1>
        <p className="notfound-text">Operator, this coordinates do not exist.</p>
        <Link href="/" className="notfound-link">
          Return to Orbiter (Home)
        </Link>
      </div>
    </div>
  );
}
