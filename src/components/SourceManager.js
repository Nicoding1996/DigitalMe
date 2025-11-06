import { useState } from 'react';
import './SourceManager.css';

const SourceManager = ({ sources, onAddSource, onRemoveSource }) => {
  const [showAddSource, setShowAddSource] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(null);

  const handleAddSourceClick = () => {
    setShowAddSource(true);
    if (onAddSource) {
      onAddSource();
    }
  };

  const handleRemoveClick = (sourceId) => {
    setShowConfirmDelete(sourceId);
  };

  const handleConfirmRemove = (sourceId) => {
    if (onRemoveSource) {
      onRemoveSource(sourceId);
    }
    setShowConfirmDelete(null);
  };

  const handleCancelRemove = () => {
    setShowConfirmDelete(null);
  };

  const getSourceIcon = (type) => {
    switch (type) {
      case 'github':
        return '🐙';
      case 'blog':
        return '📝';
      case 'text':
        return '✍️';
      default:
        return '📄';
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      complete: { label: 'Complete', className: 'status-complete' },
      analyzing: { label: 'Analyzing', className: 'status-analyzing' },
      pending: { label: 'Pending', className: 'status-pending' },
      error: { label: 'Error', className: 'status-error' }
    };

    const config = statusConfig[status] || statusConfig.pending;
    return <span className={`status-badge ${config.className}`}>{config.label}</span>;
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="source-manager">
      <div className="source-manager-header">
        <p className="source-description">
          Manage your connected sources. Adding or removing sources will trigger a profile recalculation.
        </p>
        <button className="add-source-button" onClick={handleAddSourceClick}>
          + Add Source
        </button>
      </div>

      {!sources || sources.length === 0 ? (
        <div className="sources-empty">
          <p>No sources connected yet</p>
          <p className="empty-hint">Add a source to build your style profile</p>
        </div>
      ) : (
        <div className="sources-list">
          {sources.map((source) => (
            <div key={source.id} className="source-item">
              <div className="source-icon">{getSourceIcon(source.type)}</div>
              
              <div className="source-details">
                <div className="source-header-row">
                  <div className="source-type">{source.type}</div>
                  {getStatusBadge(source.status)}
                </div>
                
                <div className="source-url">{source.url}</div>
                
                <div className="source-meta">
                  <span className="meta-item">
                    Added: {formatDate(source.addedAt)}
                  </span>
                  {source.lastAnalyzed && (
                    <span className="meta-item">
                      Last analyzed: {formatDate(source.lastAnalyzed)}
                    </span>
                  )}
                  {source.metadata?.itemsAnalyzed && (
                    <span className="meta-item">
                      Items: {source.metadata.itemsAnalyzed}
                    </span>
                  )}
                </div>
              </div>

              <div className="source-actions">
                {showConfirmDelete === source.id ? (
                  <div className="confirm-delete">
                    <span className="confirm-text">Remove?</span>
                    <button 
                      className="confirm-button confirm-yes"
                      onClick={() => handleConfirmRemove(source.id)}
                    >
                      Yes
                    </button>
                    <button 
                      className="confirm-button confirm-no"
                      onClick={handleCancelRemove}
                    >
                      No
                    </button>
                  </div>
                ) : (
                  <button 
                    className="remove-button"
                    onClick={() => handleRemoveClick(source.id)}
                    aria-label="Remove source"
                  >
                    ×
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SourceManager;
