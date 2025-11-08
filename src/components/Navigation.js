/**
 * Navigation Component
 * Black Mirror aesthetic - System Controls
 */
import React from 'react';

const Navigation = ({ onSettingsClick, onExportClick, hasContent = true }) => {
  return (
    <nav className="flex items-center gap-2">
      <button 
        className="px-3 py-2 font-mono text-xs text-static-muted border border-static-whisper hover:border-unsettling-cyan hover:text-unsettling-cyan transition-all disabled:opacity-30 disabled:cursor-not-allowed"
        onClick={onExportClick}
        disabled={!hasContent}
        aria-label="Export content"
        title={hasContent ? "Export conversation" : "No conversation to export"}
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
