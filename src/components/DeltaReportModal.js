/**
 * DeltaReportModal Component
 * Black Mirror aesthetic - Profile Change Report
 * 
 * Requirements: 8.1, 8.2, 8.3, 8.4, 8.5
 * - Display list of changed attributes with old → new values (8.2)
 * - Show change percentage for each attribute (8.2)
 * - Display words analyzed and confidence change summary (8.4)
 * - Include dismiss button to close modal (8.5)
 * - Human-readable format (8.4)
 * 
 * Usage:
 * <DeltaReportModal 
 *   deltaReport={{
 *     changes: [
 *       { attribute: 'tone', oldValue: 'professional', newValue: 'conversational', changePercent: -15 },
 *       { attribute: 'formality', oldValue: 'formal', newValue: 'casual', changePercent: -20 }
 *     ],
 *     wordsAnalyzed: 247,
 *     confidenceChange: 0.02
 *   }}
 *   onClose={() => setShowModal(false)}
 * />
 */

const DeltaReportModal = ({ deltaReport, onClose }) => {
  if (!deltaReport) return null;

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const formatValue = (value) => {
    if (typeof value === 'number') {
      return value.toFixed(2);
    }
    if (Array.isArray(value)) {
      return value.join(', ');
    }
    return String(value);
  };

  const formatChangePercent = (percent) => {
    const sign = percent > 0 ? '+' : '';
    return `${sign}${percent.toFixed(1)}%`;
  };

  const getChangeColor = (percent) => {
    if (Math.abs(percent) < 5) return 'text-static-muted';
    if (Math.abs(percent) < 15) return 'text-unsettling-cyan';
    return 'text-system-warning';
  };

  return (
    <div 
      className="fixed inset-0 bg-overlay-darker backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={handleOverlayClick}
    >
      <div className="w-full max-w-2xl max-h-[85vh] bg-void-deep border border-unsettling-cyan flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-void-elevated border-b border-unsettling-cyan">
          <div className="flex items-center gap-3">
            <span className="text-unsettling-cyan text-lg">✨</span>
            <span className="font-mono text-sm text-unsettling-cyan">
              [PROFILE_DELTA_REPORT]
            </span>
          </div>
          <button
            onClick={onClose}
            className="font-mono text-xl text-static-muted hover:text-glitch-red transition-colors"
            aria-label="Close modal"
          >
            [X]
          </button>
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-y-auto scrollbar-minimal p-6">
          {/* Summary Section */}
          <div className="mb-6 p-4 bg-void-elevated border border-static-whisper">
            <div className="font-mono text-xs text-static-ghost mb-3">
              [ANALYSIS_SUMMARY]
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="font-mono text-xs text-static-muted mb-1">
                  Words Analyzed
                </div>
                <div className="font-mono text-lg text-unsettling-cyan">
                  {deltaReport.wordsAnalyzed?.toLocaleString() || 0}
                </div>
              </div>
              <div>
                <div className="font-mono text-xs text-static-muted mb-1">
                  Confidence Change
                </div>
                <div className={`font-mono text-lg ${
                  deltaReport.confidenceChange > 0 
                    ? 'text-system-active' 
                    : deltaReport.confidenceChange < 0 
                    ? 'text-glitch-red' 
                    : 'text-static-muted'
                }`}>
                  {deltaReport.confidenceChange > 0 ? '+' : ''}
                  {(deltaReport.confidenceChange * 100).toFixed(1)}%
                </div>
              </div>
            </div>
          </div>

          {/* Changes List */}
          <div className="mb-4">
            <div className="font-mono text-xs text-static-ghost mb-3">
              [ATTRIBUTE_CHANGES] ({deltaReport.changes?.length || 0})
            </div>
            
            {deltaReport.changes && deltaReport.changes.length > 0 ? (
              <div className="space-y-3">
                {deltaReport.changes.map((change, index) => (
                  <div 
                    key={index}
                    className="p-4 bg-void-surface border border-static-whisper hover:border-unsettling-cyan transition-colors"
                  >
                    {/* Attribute Name */}
                    <div className="font-mono text-xs text-unsettling-cyan mb-2 uppercase tracking-wider">
                      {change.attribute}
                    </div>
                    
                    {/* Value Change */}
                    <div className="flex items-center gap-3 mb-2">
                      <span className="font-mono text-sm text-static-white flex-shrink-0">
                        {formatValue(change.oldValue)}
                      </span>
                      <span className="text-static-muted">→</span>
                      <span className="font-mono text-sm text-static-white flex-shrink-0">
                        {formatValue(change.newValue)}
                      </span>
                    </div>
                    
                    {/* Change Percentage */}
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-static-ghost">
                        Change:
                      </span>
                      <span className={`font-mono text-xs font-semibold ${getChangeColor(change.changePercent)}`}>
                        {formatChangePercent(change.changePercent)}
                      </span>
                      
                      {/* Visual indicator */}
                      <div className="flex-1 h-1 bg-void-deep ml-2">
                        <div 
                          className={`h-full transition-all ${
                            Math.abs(change.changePercent) < 5 
                              ? 'bg-static-muted' 
                              : Math.abs(change.changePercent) < 15 
                              ? 'bg-unsettling-cyan' 
                              : 'bg-system-warning'
                          }`}
                          style={{ 
                            width: `${Math.min(Math.abs(change.changePercent), 100)}%` 
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 bg-void-surface border border-static-whisper text-center">
                <div className="font-mono text-xs text-static-muted">
                  No significant changes detected
                </div>
              </div>
            )}
          </div>

          {/* Info Footer */}
          <div className="mt-6 p-4 bg-void-elevated border border-static-whisper">
            <div className="font-mono text-xs text-static-ghost leading-relaxed">
              <span className="text-unsettling-cyan">[INFO]</span> Changes are applied using confidence-weighted merging. 
              High-confidence attributes change slowly, while low-confidence attributes adapt more quickly to new patterns.
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-void-elevated border-t border-static-whisper">
          <button
            onClick={onClose}
            className="w-full px-6 py-3 bg-void-surface border border-unsettling-cyan text-unsettling-cyan font-mono text-xs hover:bg-unsettling-cyan hover:text-void-deep transition-all"
          >
            [DISMISS]
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeltaReportModal;
