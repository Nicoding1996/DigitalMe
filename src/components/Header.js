/**
 * Header Component
 * Black Mirror aesthetic - Minimal top navigation
 */
import React from 'react';
import Navigation from './Navigation';

const Header = ({ onSettingsClick, onExportClick }) => {
  return (
    <header className="fixed top-0 left-0 right-0 h-[60px] bg-void-deep bg-opacity-95 backdrop-blur-md border-b border-static-whisper z-30">
      <div className="flex items-center justify-between h-full px-8 max-w-full">
        {/* Logo Section */}
        <div className="flex items-center gap-4">
          <div className="flex items-center font-mono text-xl font-bold text-unsettling-blue">
            <span className="text-unsettling-blue-dim animate-pulse-slow">[</span>
            <span className="mx-1 tracking-tighter">DM</span>
            <span className="text-unsettling-blue-dim animate-pulse-slow">]</span>
          </div>
          <h1 className="text-lg font-semibold text-static-white tracking-tight hidden sm:block">
            Digital<span className="text-unsettling-blue font-bold">Me</span>
          </h1>
        </div>
        
        {/* Navigation */}
        <Navigation 
          onSettingsClick={onSettingsClick}
          onExportClick={onExportClick}
        />
      </div>
    </header>
  );
};

export default Header;
