import { useState } from 'react';
import CopyButton from './CopyButton';
import DownloadButton from './DownloadButton';
import './ExportModal.css';

const ExportModal = ({ isOpen, onClose, content, contentType = 'text' }) => {
  const [selectedFormat, setSelectedFormat] = useState('markdown');

  if (!isOpen) return null;

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="export-overlay" onClick={handleOverlayClick}>
      <div className="export-modal">
        <div className="export-header">
          <h2>Export Content</h2>
          <button className="close-button" onClick={onClose} aria-label="Close export modal">
            ×
          </button>
        </div>

        <div className="export-content">
          <div className="format-selection">
            <label className="format-label">Format:</label>
            <div className="format-options">
              <button
                className={`format-button ${selectedFormat === 'markdown' ? 'active' : ''}`}
                onClick={() => setSelectedFormat('markdown')}
              >
                Markdown
              </button>
              <button
                className={`format-button ${selectedFormat === 'plain' ? 'active' : ''}`}
                onClick={() => setSelectedFormat('plain')}
              >
                Plain Text
              </button>
            </div>
          </div>

          <div className="content-preview">
            <div className="preview-label">Preview:</div>
            <pre className="preview-content">
              <code>{content || 'No content to export'}</code>
            </pre>
          </div>
        </div>

        <div className="export-actions">
          <div className="action-buttons">
            <button className="action-button secondary" onClick={onClose}>
              Cancel
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
    </div>
  );
};

export default ExportModal;
