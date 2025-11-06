import { useState } from 'react';
import ProfileSummary from './ProfileSummary';
import SourceManager from './SourceManager';
import StyleControls from './StyleControls';
import './SettingsPanel.css';

const SettingsPanel = ({ isOpen, onClose, styleProfile, sources, preferences, onUpdateSources, onUpdatePreferences }) => {
  const [activeTab, setActiveTab] = useState('profile');

  if (!isOpen) return null;

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="settings-overlay" onClick={handleOverlayClick}>
      <div className="settings-modal">
        <div className="settings-header">
          <h2>Settings</h2>
          <button className="close-button" onClick={onClose} aria-label="Close settings">
            ×
          </button>
        </div>

        <div className="settings-tabs">
          <button
            className={`tab-button ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            Profile
          </button>
          <button
            className={`tab-button ${activeTab === 'sources' ? 'active' : ''}`}
            onClick={() => setActiveTab('sources')}
          >
            Sources
          </button>
          <button
            className={`tab-button ${activeTab === 'preferences' ? 'active' : ''}`}
            onClick={() => setActiveTab('preferences')}
          >
            Preferences
          </button>
        </div>

        <div className="settings-content">
          {activeTab === 'profile' && (
            <div className="settings-section">
              <h3>Profile Summary</h3>
              <ProfileSummary styleProfile={styleProfile} />
            </div>
          )}

          {activeTab === 'sources' && (
            <div className="settings-section">
              <h3>Source Manager</h3>
              <SourceManager 
                sources={sources}
                onAddSource={onUpdateSources}
                onRemoveSource={onUpdateSources}
              />
            </div>
          )}

          {activeTab === 'preferences' && (
            <div className="settings-section">
              <h3>Style Controls</h3>
              <StyleControls 
                preferences={preferences}
                onUpdatePreferences={onUpdatePreferences}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SettingsPanel;
