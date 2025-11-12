/**
 * SettingsPanel Component (Config Modal)
 * Black Mirror aesthetic - System Configuration Terminal
 */
import { useState } from 'react';
import ProfileSummary from './ProfileSummary';
import StyleControls from './StyleControls';
import CopyButton from './CopyButton';
import DownloadButton from './DownloadButton';

const SettingsPanel = ({ isOpen, onClose, styleProfile, preferences, conversationHistory = [], onUpdatePreferences, onClearHistory, onReanalyzeAdvanced, onLearningToggle }) => {
  const [activeTab, setActiveTab] = useState('profile');
  const [exportFormat, setExportFormat] = useState('markdown');
  const [showAdvancedConfirm, setShowAdvancedConfirm] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [isReanalyzing, setIsReanalyzing] = useState(false);
  const [reanalyzeError, setReanalyzeError] = useState(null);
  const [reanalyzeSuccess, setReanalyzeSuccess] = useState(false);
  const [learningEnabled, setLearningEnabled] = useState(() => {
    // Load toggle state from localStorage on mount (Requirement 2.1, 10.1)
    const stored = localStorage.getItem('learningEnabled');
    return stored !== 'false'; // Default to true if not set
  });

  if (!isOpen) return null;

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  /**
   * Handle learning toggle change
   * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5
   */
  const handleLearningToggle = (enabled) => {
    setLearningEnabled(enabled);
    
    // Persist toggle state in localStorage (Requirement 2.5)
    localStorage.setItem('learningEnabled', enabled.toString());
    
    // Notify parent component to update MessageCollector (Requirements 2.2, 2.3, 2.4)
    if (onLearningToggle) {
      onLearningToggle(enabled);
    }
  };

  const handleReanalyzeAdvanced = async () => {
    setIsReanalyzing(true);
    setShowAdvancedConfirm(false);
    setReanalyzeError(null);
    setReanalyzeSuccess(false);
    
    try {
      if (onReanalyzeAdvanced) {
        await onReanalyzeAdvanced();
        setReanalyzeSuccess(true);
        // Clear success message after 5 seconds
        setTimeout(() => setReanalyzeSuccess(false), 5000);
      }
    } catch (error) {
      console.error('Failed to re-analyze with advanced:', error);
      setReanalyzeError(error.message || 'Advanced analysis failed. Please try again later.');
      // Clear error message after 10 seconds
      setTimeout(() => setReanalyzeError(null), 10000);
    } finally {
      setIsReanalyzing(false);
    }
  };

  const hasAdvancedAnalysis = styleProfile?.advanced && (
    styleProfile.advanced.phrases?.length > 0 ||
    styleProfile.advanced.thoughtPatterns ||
    styleProfile.advanced.personalityMarkers?.length > 0 ||
    (styleProfile.advanced.contextualPatterns && Object.keys(styleProfile.advanced.contextualPatterns).length > 0)
  );

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
              [SYSTEM_CONFIGURATION.exe]
            </span>
          </div>
          <button 
            className="font-mono text-xl text-static-muted hover:text-glitch-red transition-colors"
            onClick={onClose}
            aria-label="Close settings"
          >
            [X]
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-static-whisper bg-void-surface">
          <button
            className={`flex-1 px-6 py-3 font-mono text-xs tracking-wider transition-all ${
              activeTab === 'profile'
                ? 'bg-void-elevated text-unsettling-cyan border-b-2 border-unsettling-cyan'
                : 'text-static-muted hover:text-static-white hover:bg-void-elevated'
            }`}
            onClick={() => setActiveTab('profile')}
          >
            [PROFILE]
          </button>
          <button
            className={`flex-1 px-6 py-3 font-mono text-xs tracking-wider transition-all ${
              activeTab === 'preferences'
                ? 'bg-void-elevated text-unsettling-cyan border-b-2 border-unsettling-cyan'
                : 'text-static-muted hover:text-static-white hover:bg-void-elevated'
            }`}
            onClick={() => setActiveTab('preferences')}
          >
            [PREFERENCES]
          </button>
          <button
            className={`flex-1 px-6 py-3 font-mono text-xs tracking-wider transition-all ${
              activeTab === 'export'
                ? 'bg-void-elevated text-unsettling-cyan border-b-2 border-unsettling-cyan'
                : 'text-static-muted hover:text-static-white hover:bg-void-elevated'
            }`}
            onClick={() => setActiveTab('export')}
          >
            [EXPORT]
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto scrollbar-minimal p-6">
          {activeTab === 'profile' && (
            <div className="space-y-6">
              <div className="font-mono text-xs text-static-ghost mb-4">
                [PROFILE_SUMMARY]
              </div>
              <ProfileSummary styleProfile={styleProfile} />
              
              <div className="mt-8 pt-6 border-t border-static-whisper">
                <div className="font-mono text-xs text-static-ghost mb-4">
                  [PROFILE_MANAGEMENT]
                </div>
                
                {/* Advanced Analysis Section */}
                <div className="mb-6 p-4 bg-void-elevated border border-unsettling-cyan">
                  <div className="font-mono text-xs text-unsettling-cyan mb-2">
                    [ADVANCED_ANALYSIS]
                  </div>
                  <p className="font-mono text-xs text-static-muted mb-4 leading-relaxed">
                    {hasAdvancedAnalysis 
                      ? 'Re-run deep pattern analysis to update your signature phrases, thought patterns, and personality quirks with the latest data.'
                      : 'Deep pattern analysis captures your unique expressions and quirks for a more authentic doppelgänger. Run it now on your existing sources.'}
                  </p>
                  
                  {/* Success Message */}
                  {reanalyzeSuccess && (
                    <div className="mb-4 p-3 bg-void-surface border border-system-active">
                      <div className="font-mono text-xs text-system-active">
                        [SUCCESS] Advanced analysis complete! Your profile has been updated.
                      </div>
                    </div>
                  )}
                  
                  {/* Error Message */}
                  {reanalyzeError && (
                    <div className="mb-4 p-3 bg-void-surface border border-glitch-red">
                      <div className="font-mono text-xs text-glitch-red mb-2">
                        [ERROR] Advanced analysis unavailable
                      </div>
                      <div className="font-mono text-xs text-static-muted mb-2">
                        {reanalyzeError}
                      </div>
                      <div className="font-mono text-xs text-static-ghost">
                        Your basic profile is still available. You can try again later.
                      </div>
                    </div>
                  )}
                  
                  <button 
                    className="px-6 py-3 bg-void-surface border border-unsettling-cyan text-unsettling-cyan font-mono text-xs hover:bg-unsettling-cyan hover:text-void-deep transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={() => setShowAdvancedConfirm(true)}
                    disabled={isReanalyzing}
                  >
                    {isReanalyzing ? '[ANALYZING...]' : hasAdvancedAnalysis ? '[REFRESH_PATTERNS]' : '[ANALYZE_PATTERNS]'}
                  </button>
                </div>

                <p className="font-mono text-xs text-static-muted mb-4 leading-relaxed">
                  Reset your profile to re-analyze your writing style with updated algorithms.
                </p>
                <button 
                  className="px-6 py-3 bg-void-surface border border-glitch-red text-glitch-red font-mono text-xs hover:bg-glitch-red hover:text-void-deep transition-all"
                  onClick={() => setShowResetConfirm(true)}
                >
                  [RESET_PROFILE]
                </button>
              </div>
            </div>
          )}

          {activeTab === 'preferences' && (
            <div className="space-y-6">
              <div className="font-mono text-xs text-static-ghost mb-4">
                [STYLE_CONTROLS]
              </div>
              <StyleControls 
                preferences={preferences}
                onUpdatePreferences={onUpdatePreferences}
              />
              
              {/* Learning Toggle Section */}
              <div className="mt-8 pt-6 border-t border-static-whisper">
                <div className="font-mono text-xs text-static-ghost mb-4">
                  [REAL_TIME_LEARNING]
                </div>
                <div className="p-5 bg-void-elevated border border-unsettling-cyan">
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex-1">
                      <div className="font-mono text-xs text-unsettling-cyan mb-2">
                        [ADAPTIVE_PROFILE]
                      </div>
                      <p className="font-mono text-xs text-static-muted leading-relaxed">
                        Allow DigitalMe to learn from your conversations and continuously refine your style profile. 
                        Messages are analyzed in batches to improve personalization over time.
                      </p>
                    </div>
                  </div>
                  
                  <label className="flex items-center gap-3 cursor-pointer group py-2">
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={learningEnabled}
                        onChange={(e) => handleLearningToggle(e.target.checked)}
                        className="sr-only"
                      />
                      <div className={`w-14 h-7 border transition-all duration-200 ${
                        learningEnabled 
                          ? 'bg-unsettling-cyan border-unsettling-cyan' 
                          : 'bg-void-surface border-static-whisper'
                      }`}>
                        <div className={`w-5 h-5 bg-void-deep transition-all duration-200 ease-out ${
                          learningEnabled ? 'translate-x-8' : 'translate-x-1'
                        } mt-1`} />
                      </div>
                    </div>
                    <span className="font-mono text-xs text-static-white group-hover:text-unsettling-cyan transition-colors">
                      Enable Real-Time Learning
                    </span>
                  </label>
                  
                  <div className="mt-4 pt-4 border-t border-static-whisper">
                    <div className="flex items-center gap-3 font-mono text-xs">
                      <div className="flex items-center gap-2">
                        <span className={`w-1.5 h-1.5 rounded-full transition-colors ${
                          learningEnabled ? 'bg-system-active' : 'bg-static-whisper'
                        }`} />
                        <span className="text-static-ghost">Status:</span>
                        <span className={learningEnabled ? 'text-system-active' : 'text-static-muted'}>
                          {learningEnabled ? 'ACTIVE' : 'DISABLED'}
                        </span>
                      </div>
                    </div>
                    <div className="mt-2 font-mono text-xs text-static-muted pl-5">
                      {learningEnabled 
                        ? '→ Collecting messages for batch analysis' 
                        : '→ Learning paused, no data collected'}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mt-8 pt-6 border-t border-static-whisper">
                <div className="font-mono text-xs text-static-ghost mb-4">
                  [CONVERSATION_HISTORY]
                </div>
                <p className="font-mono text-xs text-static-muted mb-4">
                  STORED_MESSAGES: {conversationHistory.length} / 50
                </p>
                <button 
                  className="px-6 py-3 bg-void-surface border border-static-whisper text-static-white font-mono text-xs hover:border-glitch-red hover:text-glitch-red transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                  onClick={onClearHistory}
                  disabled={conversationHistory.length === 0}
                >
                  [CLEAR_HISTORY]
                </button>
              </div>
            </div>
          )}

          {activeTab === 'export' && (
            <div className="space-y-6">
              <div className="font-mono text-xs text-static-ghost mb-4">
                [DATA_EXPORT]
              </div>
              
              {/* Format selection */}
              <div>
                <div className="font-mono text-xs text-static-ghost mb-3">
                  [EXPORT_FORMAT]
                </div>
                <div className="flex gap-2">
                  <button
                    className={`flex-1 px-4 py-2 font-mono text-xs border transition-all ${
                      exportFormat === 'markdown'
                        ? 'bg-void-elevated border-unsettling-cyan text-unsettling-cyan'
                        : 'bg-void-surface border-static-whisper text-static-muted hover:border-static-ghost hover:text-static-white'
                    }`}
                    onClick={() => setExportFormat('markdown')}
                  >
                    [MARKDOWN]
                  </button>
                  <button
                    className={`flex-1 px-4 py-2 font-mono text-xs border transition-all ${
                      exportFormat === 'plain'
                        ? 'bg-void-elevated border-unsettling-cyan text-unsettling-cyan'
                        : 'bg-void-surface border-static-whisper text-static-muted hover:border-static-ghost hover:text-static-white'
                    }`}
                    onClick={() => setExportFormat('plain')}
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
                    [BUFFER_SIZE: {(() => {
                      if (conversationHistory.length === 0) return 0;
                      const content = conversationHistory
                        .map(msg => {
                          const role = msg.role === 'user' ? 'YOU' : 'DIGITAL_ME';
                          const timestamp = new Date(msg.timestamp).toLocaleString();
                          return `[${role}] ${timestamp}\n${msg.content}\n`;
                        })
                        .join('\n---\n\n');
                      return exportFormat === 'markdown' 
                        ? `# Digital Me - Conversation Export\n\n${content}`.length 
                        : content.length;
                    })()} BYTES]
                  </div>
                  <pre className="p-4 max-h-96 overflow-auto scrollbar-minimal">
                    <code className="font-mono text-xs text-static-white leading-relaxed">
                      {conversationHistory.length === 0 ? (
                        '[NO_CONVERSATION_HISTORY]'
                      ) : (
                        (() => {
                          const content = conversationHistory
                            .map(msg => {
                              const role = msg.role === 'user' ? 'YOU' : 'DIGITAL_ME';
                              const timestamp = new Date(msg.timestamp).toLocaleString();
                              return `[${role}] ${timestamp}\n${msg.content}\n`;
                            })
                            .join('\n---\n\n');
                          return exportFormat === 'markdown' 
                            ? `# Digital Me - Conversation Export\n\n${content}` 
                            : content;
                        })()
                      )}
                    </code>
                  </pre>
                </div>
              </div>

              {/* Export actions */}
              <div className="flex items-center gap-2 pt-4">
                <CopyButton 
                  content={conversationHistory.length === 0 ? '[NO_CONVERSATION_HISTORY]' : (() => {
                    const content = conversationHistory
                      .map(msg => {
                        const role = msg.role === 'user' ? 'YOU' : 'DIGITAL_ME';
                        const timestamp = new Date(msg.timestamp).toLocaleString();
                        return `[${role}] ${timestamp}\n${msg.content}\n`;
                      })
                      .join('\n---\n\n');
                    return exportFormat === 'markdown' 
                      ? `# Digital Me - Conversation Export\n\n${content}` 
                      : content;
                  })()}
                />
                <DownloadButton 
                  content={conversationHistory.length === 0 ? '[NO_CONVERSATION_HISTORY]' : (() => {
                    const content = conversationHistory
                      .map(msg => {
                        const role = msg.role === 'user' ? 'YOU' : 'DIGITAL_ME';
                        const timestamp = new Date(msg.timestamp).toLocaleString();
                        return `[${role}] ${timestamp}\n${msg.content}\n`;
                      })
                      .join('\n---\n\n');
                    return exportFormat === 'markdown' 
                      ? `# Digital Me - Conversation Export\n\n${content}` 
                      : content;
                  })()}
                  contentType="text"
                  format={exportFormat}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Advanced Analysis Confirmation Dialog */}
      {showAdvancedConfirm && (
        <div 
          className="absolute inset-0 bg-overlay-darker backdrop-blur-sm flex items-center justify-center p-4 z-10"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowAdvancedConfirm(false);
            }
          }}
        >
          <div className="w-full max-w-md bg-void-deep border border-unsettling-cyan">
            <div className="px-6 py-4 bg-void-elevated border-b border-unsettling-cyan">
              <div className="font-mono text-sm text-unsettling-cyan">
                [DEEP_PATTERN_ANALYSIS]
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div className="font-mono text-xs text-static-white leading-relaxed">
                Deep pattern analysis will examine your existing sources to identify:
              </div>
              <div className="font-mono text-xs text-static-muted space-y-2 border-l-2 border-unsettling-cyan pl-4">
                <div><span className="text-unsettling-cyan">&gt;</span> Signature phrases and recurring expressions</div>
                <div><span className="text-unsettling-cyan">&gt;</span> Thought flow and idea organization patterns</div>
                <div><span className="text-unsettling-cyan">&gt;</span> Personality quirks and self-aware comments</div>
                <div><span className="text-unsettling-cyan">&gt;</span> Contextual style variations by topic</div>
              </div>
              <div className="font-mono text-xs text-static-ghost pt-4 border-t border-static-whisper">
                <span className="text-system-warning">[PRIVACY]</span> Personal information is anonymized before analysis.
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  className="flex-1 px-4 py-3 bg-void-surface border border-static-whisper text-static-white font-mono text-xs hover:border-static-white transition-all"
                  onClick={() => setShowAdvancedConfirm(false)}
                >
                  [CANCEL]
                </button>
                <button
                  className="flex-1 px-4 py-3 bg-unsettling-cyan border border-unsettling-cyan text-void-deep font-mono text-xs hover:bg-transparent hover:text-unsettling-cyan transition-all"
                  onClick={handleReanalyzeAdvanced}
                >
                  [PROCEED]
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reset Profile Confirmation Dialog */}
      {showResetConfirm && (
        <div 
          className="absolute inset-0 bg-overlay-darker backdrop-blur-sm flex items-center justify-center p-4 z-10"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowResetConfirm(false);
            }
          }}
        >
          <div className="w-full max-w-md bg-void-deep border border-glitch-red">
            <div className="px-6 py-4 bg-void-elevated border-b border-glitch-red">
              <div className="font-mono text-sm text-glitch-red">
                [SYSTEM_RESET_WARNING]
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div className="font-mono text-xs text-static-white leading-relaxed">
                This action will permanently delete:
              </div>
              <div className="font-mono text-xs text-static-muted space-y-2 border-l-2 border-glitch-red pl-4">
                <div><span className="text-glitch-red">&gt;</span> Your complete style profile</div>
                <div><span className="text-glitch-red">&gt;</span> All connected data sources</div>
                <div><span className="text-glitch-red">&gt;</span> Advanced pattern analysis results</div>
                <div><span className="text-glitch-red">&gt;</span> Conversation history and preferences</div>
              </div>
              <div className="font-mono text-xs text-static-white pt-4 border-t border-static-whisper">
                You will need to reconnect sources and re-analyze your writing style from scratch.
              </div>
              <div className="font-mono text-xs text-system-warning bg-void-elevated border border-system-warning p-3">
                <span className="text-system-warning">[WARNING]</span> This action cannot be undone.
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  className="flex-1 px-4 py-3 bg-void-surface border border-static-whisper text-static-white font-mono text-xs hover:border-static-white transition-all"
                  onClick={() => setShowResetConfirm(false)}
                >
                  [CANCEL]
                </button>
                <button
                  className="flex-1 px-4 py-3 bg-glitch-red border border-glitch-red text-void-deep font-mono text-xs hover:bg-transparent hover:text-glitch-red transition-all"
                  onClick={() => {
                    localStorage.removeItem('digitalme_profile');
                    localStorage.removeItem('digitalme_sources');
                    window.location.reload();
                  }}
                >
                  [CONFIRM_RESET]
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsPanel;
