/**
 * SettingsPanel Component
 * Black Mirror aesthetic - System Configuration Terminal
 */
import { useState } from 'react';
import ProfileSummary from './ProfileSummary';
import SourceManager from './SourceManager';
import StyleControls from './StyleControls';

const SettingsPanel = ({ isOpen, onClose, styleProfile, sources, preferences, conversationHistory = [], onUpdateSources, onUpdatePreferences, onClearHistory, onReanalyzeAdvanced }) => {
  const [activeTab, setActiveTab] = useState('profile');
  const [showAdvancedConfirm, setShowAdvancedConfirm] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [isReanalyzing, setIsReanalyzing] = useState(false);
  const [reanalyzeError, setReanalyzeError] = useState(null);
  const [reanalyzeSuccess, setReanalyzeSuccess] = useState(false);

  if (!isOpen) return null;

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
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
              activeTab === 'sources'
                ? 'bg-void-elevated text-unsettling-cyan border-b-2 border-unsettling-cyan'
                : 'text-static-muted hover:text-static-white hover:bg-void-elevated'
            }`}
            onClick={() => setActiveTab('sources')}
          >
            [SOURCES]
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
                    className="px-6 py-3 bg-void-surface border border-unsettling-cyan text-unsettling-cyan font-mono text-xs hover:bg-unsettling-cyan hover:text-void-deep transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                    onClick={() => setShowAdvancedConfirm(true)}
                    disabled={isReanalyzing || !sources || sources.length === 0}
                  >
                    {isReanalyzing ? '[ANALYZING...]' : hasAdvancedAnalysis ? '[REFRESH_PATTERNS]' : '[ANALYZE_PATTERNS]'}
                  </button>
                  {(!sources || sources.length === 0) && (
                    <div className="font-mono text-xs text-static-ghost mt-2">
                      No sources available for analysis
                    </div>
                  )}
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

          {activeTab === 'sources' && (
            <div className="space-y-6">
              <div className="font-mono text-xs text-static-ghost mb-4">
                [SOURCE_MANAGER]
              </div>
              <SourceManager 
                sources={sources}
                onAddSource={onUpdateSources}
                onRemoveSource={onUpdateSources}
              />
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
