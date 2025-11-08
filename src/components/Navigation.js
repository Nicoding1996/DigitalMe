/**
 * Navigation Component
 * Black Mirror aesthetic - System Controls
 */
import React from 'react';

const Navigation = ({ onSettingsClick, onExportClick }) => {
  return (
    <nav className="flex items-center gap-2">
      <button 
        className="px-3 py-2 font-mono text-xs text-static-muted border border-static-whisper hover:border-unsettling-cyan hover:text-unsettling-cyan transition-all"
        onClick={onExportClick}
        aria-label="Export content"
      >
        [EXPORT]
      </button>
      
      <button 
        className="px-3 py-2 font-mono text-xs text-static-muted border border-static-whisper hover:border-unsettling-cyan hover:text-unsettling-cyan transition-all"
        onClick={onSettingsClick}
        aria-label="Open settings"
      >
        [CONFIG]
      </button>
    </nav>
  );
};

export default Navigation;
