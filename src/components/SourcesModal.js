/**
 * SourcesModal Component
 * Black Mirror aesthetic - Source Data Management Modal
 */
import { useState } from 'react';
import SourceManager from './SourceManager';

const SourcesModal = ({ isOpen, onClose, sources, onUpdateSources }) => {
  if (!isOpen) return null;

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-overlay-darker backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={handleOverlayClick}
    >
      <div className="w-full max-w-4xl max-h-[90vh] bg-void-deep border border-static-whisper flex flex-col">
        {/* Terminal header */}
        <div className="flex items-center justify-between px-6 py-4 bg-void-elevated border-b border-static-whisper">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-glitch-red" />
              <span className="w-2 h-2 rounded-full bg-system-warning" />
              <span className="w-2 h-2 rounded-full bg-system-active" />
            </div>
            <span className="font-mono text-sm text-static-white">
              [SOURCE_MANAGER.exe]
            </span>
          </div>
          <button 
            className="font-mono text-xl text-static-muted hover:text-glitch-red transition-colors"
            onClick={onClose}
            aria-label="Close sources"
          >
            [X]
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto scrollbar-minimal p-6">
          <div className="space-y-6">
            <div className="font-mono text-xs text-static-ghost mb-4">
              [CONNECTED_SOURCES]
            </div>
            <SourceManager 
              sources={sources}
              onAddSource={onUpdateSources}
              onRemoveSource={onUpdateSources}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default SourcesModal;
