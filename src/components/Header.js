import React from 'react';
import Navigation from './Navigation';
import './Header.css';

const Header = ({ onSettingsClick, onExportClick }) => {
  return (
    <header className="header">
      <div className="header-content">
        <div className="logo-section">
          <div className="logo">
            <span className="logo-bracket">[</span>
            <span className="logo-text">DM</span>
            <span className="logo-bracket">]</span>
          </div>
          <h1 className="app-title">
            Digital<span className="title-accent">Me</span>
          </h1>
        </div>
        
        <Navigation 
          onSettingsClick={onSettingsClick}
          onExportClick={onExportClick}
        />
      </div>
    </header>
  );
};

export default Header;
