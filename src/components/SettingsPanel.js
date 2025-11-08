/**
 * SettingsPanel Component
 * Black Mirror aesthetic - System Configuration Terminal
 */
import { useState } from 'react';
import ProfileSummary from './ProfileSummary';
import SourceManager from './SourceManager';
import StyleControls from './StyleControls';

const SettingsPanel = ({ isOpen, onClose, styleProfile, sources, preferences, conversationHistory = [], onUpdateSources, onUpdatePreferences, onClearHistory }) => {
  const [activeTab, setActiveTab] = useState('profile');

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
                <p className="font-mono text-xs text-static-muted mb-4 leading-relaxed">
                  Reset your profile to re-analyze your writing style with updated algorithms.
                </p>
                <button 
                  className="px-6 py-3 bg-void-surface border border-glitch-red text-glitch-red font-mono text-xs hover:bg-glitch-red hover:text-void-deep transition-all"
                  onClick={() => {
                    if (window.confirm('[CONFIRM] This will clear your profile and require re-analysis. Continue?')) {
                      localStorage.removeItem('digitalme_profile');
                      localStorage.removeItem('digitalme_sources');
                      window.location.reload();
                    }
                  }}
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
    </div>
  );
};

export default SettingsPanel;
