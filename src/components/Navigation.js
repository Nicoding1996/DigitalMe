import React from 'react';
import './Navigation.css';

const Navigation = ({ onSettingsClick, onExportClick }) => {
  return (
    <nav className="navigation">
      <button 
        className="nav-button"
        onClick={onExportClick}
        aria-label="Export content"
      >
        <svg 
          className="nav-icon" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2"
          strokeLinecap="round" 
          strokeLinejoin="round"
        >
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
        <span className="nav-label">Export</span>
      </button>
      
      <button 
        className="nav-button"
        onClick={onSettingsClick}
        aria-label="Open settings"
      >
        <svg 
          className="nav-icon" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2"
          strokeLinecap="round" 
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="3" />
          <path d="M12 1v6m0 6v6m-9-9h6m6 0h6" />
          <path d="M4.22 4.22l4.24 4.24m7.08 0l4.24-4.24M4.22 19.78l4.24-4.24m7.08 0l4.24 4.24" />
        </svg>
        <span className="nav-label">Settings</span>
      </button>
    </nav>
  );
};

export default Navigation;
