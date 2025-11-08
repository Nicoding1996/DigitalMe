/**
 * ExportModal Component
 * Black Mirror aesthetic - Data Export Terminal
 */
import { useState } from 'react';
import CopyButton from './CopyButton';
import DownloadButton from './DownloadButton';

const ExportModal = ({ isOpen, onClose, content, contentType = 'text' }) => {
  const [selectedFormat, setSelectedFormat] = useState('markdown');

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
      <div className="w-full max-w-3xl max-h-[90vh] bg-void-deep border border-static-whisper flex flex-col">
        {/* Terminal header */}
        <div className="flex items-center justify-between px-6 py-4 bg-void-elevated border-b border-static-whisper">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-glitch-red" />
              <span className="w-2 h-2 rounded-full bg-system-warning" />
              <span className="w-2 h-2 rounded-full bg-system-active" />
            </div>
            <span className="font-mono text-sm text-static-white">
              [DATA_EXPORT.exe]
            </span>
          </div>
          <button 
            className="font-mono text-xl text-static-muted hover:text-glitch-red transition-colors"
            onClick={onClose}
            aria-label="Close export modal"
          >
            [X]
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto scrollbar-minimal p-6 space-y-6">
          {/* Format selection */}
          <div>
            <div className="font-mono text-xs text-static-ghost mb-3">
              [EXPORT_FORMAT]
            </div>
            <div className="flex gap-2">
              <button
                className={`flex-1 px-4 py-2 font-mono text-xs border transition-all ${
                  selectedFormat === 'markdown'
                    ? 'bg-void-elevated border-unsettling-cyan text-unsettling-cyan'
                    : 'bg-void-surface border-static-whisper text-static-muted hover:border-static-ghost hover:text-static-white'
                }`}
                onClick={() => setSelectedFormat('markdown')}
              >
                [MARKDOWN]
              </button>
              <button
                className={`flex-1 px-4 py-2 font-mono text-xs border transition-all ${
                  selectedFormat === 'plain'
                    ? 'bg-void-elevated border-unsettling-cyan text-unsettling-cyan'
                    : 'bg-void-surface border-static-whisper text-static-muted hover:border-static-ghost hover:text-static-white'
                }`}
                onClick={() => setSelectedFormat('plain')}
              >
                [PLAIN_TEXT]
              </button>
            </div>
          </div>

          {/* Content preview */}
          <div>
            <div className="font-mono text-xs text-static-ghost mb-3">
              [CONTENT_PREVIEW]
            </div>
            <div className="border border-static-whisper bg-void-surface">
              <div className="px-4 py-2 bg-void-elevated border-b border-static-whisper font-mono text-xs text-static-ghost">
                [BUFFER_SIZE: {content?.length || 0} BYTES]
              </div>
              <pre className="p-4 max-h-96 overflow-auto scrollbar-minimal">
                <code className="font-mono text-xs text-static-white leading-relaxed">
                  {content || '[NO_DATA_AVAILABLE]'}
                </code>
              </pre>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 px-6 py-4 bg-void-elevated border-t border-static-whisper">
          <button 
            className="px-6 py-2 bg-void-surface border border-static-whisper text-static-white font-mono text-xs hover:border-static-ghost transition-all"
            onClick={onClose}
          >
            [CANCEL]
          </button>
          <CopyButton content={content} />
          <DownloadButton 
            content={content} 
            contentType={contentType}
            format={selectedFormat}
          />
        </div>
      </div>
    </div>
  );
};

export default ExportModal;
