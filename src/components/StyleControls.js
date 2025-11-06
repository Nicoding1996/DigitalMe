import { useState, useEffect } from 'react';
import './StyleControls.css';

const PREFERENCES_KEY = 'digitalme_preferences';

const StyleControls = ({ preferences, onUpdatePreferences }) => {
  const [localPreferences, setLocalPreferences] = useState(preferences || {
    theme: 'dark',
    glitchIntensity: 'medium',
    autoSave: true
  });

  useEffect(() => {
    if (preferences) {
      setLocalPreferences(preferences);
    }
  }, [preferences]);

  const handleThemeChange = (theme) => {
    const updated = { ...localPreferences, theme };
    setLocalPreferences(updated);
    savePreferences(updated);
  };

  const handleGlitchIntensityChange = (e) => {
    const intensity = e.target.value;
    const updated = { ...localPreferences, glitchIntensity: intensity };
    setLocalPreferences(updated);
    savePreferences(updated);
  };

  const handleAutoSaveToggle = () => {
    const updated = { ...localPreferences, autoSave: !localPreferences.autoSave };
    setLocalPreferences(updated);
    savePreferences(updated);
  };

  const savePreferences = (prefs) => {
    localStorage.setItem(PREFERENCES_KEY, JSON.stringify(prefs));
    if (onUpdatePreferences) {
      onUpdatePreferences(prefs);
    }
  };

  const getGlitchIntensityLabel = (value) => {
    const labels = {
      low: 'Low',
      medium: 'Medium',
      high: 'High'
    };
    return labels[value] || 'Medium';
  };

  return (
    <div className="style-controls">
      <div className="control-group">
        <div className="control-header">
          <label className="control-label">Theme</label>
          <span className="control-description">Choose your preferred color scheme</span>
        </div>
        <div className="theme-selector">
          <button
            className={`theme-option ${localPreferences.theme === 'dark' ? 'active' : ''}`}
            onClick={() => handleThemeChange('dark')}
          >
            <div className="theme-preview dark-preview">
              <div className="preview-bar"></div>
              <div className="preview-bar"></div>
            </div>
            <span className="theme-label">Dark</span>
          </button>
          <button
            className={`theme-option ${localPreferences.theme === 'light' ? 'active' : ''}`}
            onClick={() => handleThemeChange('light')}
          >
            <div className="theme-preview light-preview">
              <div className="preview-bar"></div>
              <div className="preview-bar"></div>
            </div>
            <span className="theme-label">Light</span>
          </button>
        </div>
      </div>

      <div className="control-group">
        <div className="control-header">
          <label className="control-label" htmlFor="glitch-slider">
            Glitch Effect Intensity
          </label>
          <span className="control-description">
            Adjust the intensity of the glitch animation
          </span>
        </div>
        <div className="slider-container">
          <input
            id="glitch-slider"
            type="range"
            min="0"
            max="2"
            step="1"
            value={localPreferences.glitchIntensity === 'low' ? 0 : localPreferences.glitchIntensity === 'medium' ? 1 : 2}
            onChange={(e) => {
              const values = ['low', 'medium', 'high'];
              handleGlitchIntensityChange({ target: { value: values[e.target.value] } });
            }}
            className="glitch-slider"
          />
          <div className="slider-labels">
            <span className={localPreferences.glitchIntensity === 'low' ? 'active' : ''}>Low</span>
            <span className={localPreferences.glitchIntensity === 'medium' ? 'active' : ''}>Medium</span>
            <span className={localPreferences.glitchIntensity === 'high' ? 'active' : ''}>High</span>
          </div>
        </div>
        <div className="intensity-display">
          Current: <span className="intensity-value">{getGlitchIntensityLabel(localPreferences.glitchIntensity)}</span>
        </div>
      </div>

      <div className="control-group">
        <div className="control-header">
          <label className="control-label">Auto-Save</label>
          <span className="control-description">
            Automatically save conversation history
          </span>
        </div>
        <div className="toggle-container">
          <button
            className={`toggle-button ${localPreferences.autoSave ? 'active' : ''}`}
            onClick={handleAutoSaveToggle}
            role="switch"
            aria-checked={localPreferences.autoSave}
          >
            <div className="toggle-track">
              <div className="toggle-thumb"></div>
            </div>
            <span className="toggle-label">
              {localPreferences.autoSave ? 'Enabled' : 'Disabled'}
            </span>
          </button>
        </div>
      </div>

      <div className="preferences-info">
        <p className="info-text">
          Preferences are saved locally in your browser and will persist across sessions.
        </p>
      </div>
    </div>
  );
};

export default StyleControls;
