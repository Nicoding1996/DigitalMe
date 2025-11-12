/**
 * Navigation Component
 * Black Mirror aesthetic - System Controls
 */
import React from 'react';

const Navigation = ({ onSourcesClick, onSettingsClick }) => {
  return (
    <nav className="flex items-center gap-2">
      <button 
        className="px-3 py-2 font-mono text-xs text-static-muted border border-static-whisper hover:border-unsettling-cyan hover:text-unsettling-cyan transition-all"
        onClick={onSourcesClick}
        aria-label="Manage sources"
      >
        [SOURCES]
      </button>
      
      <button 
        className="px-3 py-2 font-mono text-xs text-static-muted border border-static-whisper hover:border-unsettling-cyan hover:text-unsettling-cyan transition-all"
        onClick={onSettingsClick}
        aria-label="Open config"
      >
        [CONFIG]
      </button>
    </nav>
  );
};

export default Navigation;
