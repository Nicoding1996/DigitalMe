/**
 * RefinementNotification Component
 * Black Mirror aesthetic - Profile Update Notification
 * 
 * Requirements: 3.2, 3.5
 * - Display notification when profile is updated (3.2)
 * - Auto-dismiss after 5 seconds (3.5)
 * - Include "View Changes" button to open delta report modal
 * - Style with subtle animation (slide in from top)
 */
import { useEffect, useState } from 'react';

const RefinementNotification = ({ visible, deltaReport, onDismiss, onViewDetails }) => {
  const [isAnimating, setIsAnimating] = useState(false);
  
  // Determine if this is an error notification (no deltaReport means error)
  const isError = !deltaReport;

  useEffect(() => {
    if (visible) {
      // Trigger animation
      setIsAnimating(true);
      
      // Auto-dismiss after 5 seconds (Requirement 3.5)
      const timer = setTimeout(() => {
        handleDismiss();
      }, 5000);

      return () => clearTimeout(timer);
    } else {
      setIsAnimating(false);
    }
  }, [visible]);

  const handleDismiss = () => {
    setIsAnimating(false);
    // Wait for animation to complete before calling onDismiss
    setTimeout(() => {
      if (onDismiss) {
        onDismiss();
      }
    }, 300);
  };

  const handleViewDetails = () => {
    if (onViewDetails) {
      onViewDetails();
    }
  };

  if (!visible && !isAnimating) return null;

  return (
    <div 
      className={`fixed top-6 left-1/2 -translate-x-1/2 z-50 transition-all duration-300 ${
        isAnimating ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'
      }`}
      style={{ maxWidth: '600px', width: 'calc(100% - 2rem)' }}
    >
      <div className={`bg-void-elevated border ${isError ? 'border-glitch-red' : 'border-unsettling-cyan'} shadow-lg`}>
        {/* Notification Header */}
        <div className={`flex items-center gap-3 px-4 py-3 border-b ${isError ? 'border-glitch-red' : 'border-unsettling-cyan'} bg-void-surface`}>
          <span className={`${isError ? 'text-glitch-red' : 'text-unsettling-cyan'} text-lg ${!isError && 'animate-pulse'}`}>
            {isError ? '⚠' : '✨'}
          </span>
          <span className={`font-mono text-xs ${isError ? 'text-glitch-red' : 'text-unsettling-cyan'} flex-1`}>
            {isError ? '[PROFILE_UPDATE_FAILED]' : '[PROFILE_UPDATE_COMPLETE]'}
          </span>
          <button
            onClick={handleDismiss}
            className="font-mono text-xs text-static-muted hover:text-glitch-red transition-colors"
            aria-label="Dismiss notification"
          >
            [X]
          </button>
        </div>

        {/* Notification Content */}
        <div className="px-4 py-3">
          <p className="font-mono text-xs text-static-white mb-3 leading-relaxed">
            {isError 
              ? 'Unable to update profile. Your current profile is unchanged.' 
              : 'Style profile updated based on recent conversation'}
          </p>

          {/* Quick Stats (only for success) */}
          {!isError && deltaReport && (
            <div className="flex items-center gap-4 mb-3 font-mono text-xs text-static-muted">
              <div className="flex items-center gap-2">
                <span className="text-system-active">●</span>
                <span>{deltaReport.changes?.length || 0} attributes changed</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-unsettling-cyan">●</span>
                <span>{deltaReport.wordsAnalyzed || 0} words analyzed</span>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2">
            {!isError && onViewDetails && (
              <button
                onClick={handleViewDetails}
                className="flex-1 px-4 py-2 bg-void-surface border border-unsettling-cyan text-unsettling-cyan font-mono text-xs hover:bg-unsettling-cyan hover:text-void-deep transition-all"
              >
                [VIEW_CHANGES]
              </button>
            )}
            <button
              onClick={handleDismiss}
              className={`${isError ? 'flex-1' : ''} px-4 py-2 bg-void-surface border border-static-whisper text-static-white font-mono text-xs hover:border-static-white transition-all`}
            >
              [DISMISS]
            </button>
          </div>
        </div>

        {/* Progress Bar for Auto-Dismiss */}
        <div className="h-0.5 bg-void-deep overflow-hidden">
          <div 
            className={`h-full ${isError ? 'bg-glitch-red' : 'bg-unsettling-cyan'} transition-all`}
            style={{
              width: isAnimating ? '0%' : '100%',
              transition: isAnimating ? 'width 5s linear' : 'none'
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default RefinementNotification;
