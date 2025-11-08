/**
 * SourceManager Component
 * Black Mirror aesthetic - Source Data Management
 */
import { useState } from 'react';

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
      complete: { label: 'COMPLETE', color: 'text-system-active' },
      analyzing: { label: 'ANALYZING', color: 'text-unsettling-cyan' },
      pending: { label: 'PENDING', color: 'text-system-warning' },
      error: { label: 'ERROR', color: 'text-glitch-red' }
    };

    const config = statusConfig[status] || statusConfig.pending;
    return <span className={`font-mono text-xs ${config.color}`}>{config.label}</span>;
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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="font-mono text-xs text-static-muted">
          Manage your connected sources. Adding or removing sources will trigger a profile recalculation.
        </p>
        <button 
          className="px-4 py-2 bg-void-surface border border-static-whisper text-static-white font-mono text-xs hover:border-unsettling-cyan hover:text-unsettling-cyan transition-all whitespace-nowrap"
          onClick={handleAddSourceClick}
        >
          + Add Source
        </button>
      </div>

      {!sources || sources.length === 0 ? (
        <div className="border border-static-whisper bg-void-surface p-8 text-center">
          <p className="font-mono text-xs text-static-ghost mb-2">[NO_SOURCES_CONNECTED]</p>
          <p className="font-mono text-xs text-static-muted">Add a source to build your style profile</p>
        </div>
      ) : (
        <div className="space-y-2">
          {sources.map((source) => (
            <div key={source.id} className="border border-static-whisper bg-void-surface hover:bg-void-elevated transition-colors">
              <div className="flex items-center gap-4 p-4">
                <div className="text-2xl">{getSourceIcon(source.type)}</div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="font-mono text-xs text-unsettling-cyan uppercase">{source.type}</span>
                    {getStatusBadge(source.status)}
                  </div>
                  
                  <div className="font-mono text-xs text-static-white truncate mb-2">{source.url}</div>
                  
                  <div className="flex flex-wrap gap-3 font-mono text-xs text-static-ghost">
                    <span>Added: {formatDate(source.addedAt)}</span>
                    {source.lastAnalyzed && (
                      <span>Last analyzed: {formatDate(source.lastAnalyzed)}</span>
                    )}
                    {source.metadata?.itemsAnalyzed && (
                      <span>Items: {source.metadata.itemsAnalyzed}</span>
                    )}
                  </div>
                </div>

                <div>
                  {showConfirmDelete === source.id ? (
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-static-muted">Remove?</span>
                      <button 
                        className="px-3 py-1 bg-glitch-red text-void-deep font-mono text-xs hover:bg-glitch-red-dim transition-colors"
                        onClick={() => handleConfirmRemove(source.id)}
                      >
                        YES
                      </button>
                      <button 
                        className="px-3 py-1 bg-void-surface border border-static-whisper text-static-white font-mono text-xs hover:border-static-ghost transition-colors"
                        onClick={handleCancelRemove}
                      >
                        NO
                      </button>
                    </div>
                  ) : (
                    <button 
                      className="px-3 py-1 font-mono text-xl text-static-muted hover:text-glitch-red transition-colors"
                      onClick={() => handleRemoveClick(source.id)}
                      aria-label="Remove source"
                    >
                      ×
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SourceManager;
