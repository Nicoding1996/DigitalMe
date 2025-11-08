/**
 * StyleControls Component
 * Black Mirror aesthetic - System Preferences
 */
import { useState, useEffect } from 'react';

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
    <div className="space-y-6">
      {/* Theme */}
      <div className="border border-static-whisper bg-void-surface p-4">
        <div className="font-mono text-xs text-static-ghost mb-3">THEME</div>
        <p className="font-mono text-xs text-static-muted mb-4">Choose your preferred color scheme</p>
        <div className="grid grid-cols-2 gap-2">
          <button
            className={`p-4 border font-mono text-xs transition-all ${
              localPreferences.theme === 'dark'
                ? 'border-unsettling-cyan text-unsettling-cyan bg-void-elevated'
                : 'border-static-whisper text-static-muted hover:border-static-ghost'
            }`}
            onClick={() => handleThemeChange('dark')}
          >
            <div className="mb-2 h-8 bg-mirror-black border border-static-whisper"></div>
            Dark
          </button>
          <button
            className={`p-4 border font-mono text-xs transition-all ${
              localPreferences.theme === 'light'
                ? 'border-unsettling-cyan text-unsettling-cyan bg-void-elevated'
                : 'border-static-whisper text-static-muted hover:border-static-ghost'
            }`}
            onClick={() => handleThemeChange('light')}
          >
            <div className="mb-2 h-8 bg-static-white border border-static-whisper"></div>
            Light
          </button>
        </div>
      </div>

      {/* Glitch Intensity */}
      <div className="border border-static-whisper bg-void-surface p-4">
        <div className="font-mono text-xs text-static-ghost mb-3">GLITCH_EFFECT_INTENSITY</div>
        <p className="font-mono text-xs text-static-muted mb-4">Adjust the intensity of the glitch animation</p>
        <div className="flex items-center gap-4 mb-3">
          <span className={`font-mono text-xs ${localPreferences.glitchIntensity === 'low' ? 'text-unsettling-cyan' : 'text-static-ghost'}`}>
            Low
          </span>
          <span className={`font-mono text-xs ${localPreferences.glitchIntensity === 'medium' ? 'text-unsettling-cyan' : 'text-static-ghost'}`}>
            Medium
          </span>
          <span className={`font-mono text-xs ${localPreferences.glitchIntensity === 'high' ? 'text-unsettling-cyan' : 'text-static-ghost'}`}>
            High
          </span>
        </div>
        <div className="font-mono text-xs text-static-white">
          Current: <span className="text-unsettling-cyan">{getGlitchIntensityLabel(localPreferences.glitchIntensity)}</span>
        </div>
      </div>

      {/* Auto-Save */}
      <div className="border border-static-whisper bg-void-surface p-4">
        <div className="font-mono text-xs text-static-ghost mb-3">AUTO_SAVE</div>
        <p className="font-mono text-xs text-static-muted mb-4">Automatically save conversation history</p>
        <button
          className={`px-6 py-2 border font-mono text-xs transition-all ${
            localPreferences.autoSave
              ? 'border-system-active text-system-active bg-void-elevated'
              : 'border-static-whisper text-static-muted hover:border-static-ghost'
          }`}
          onClick={handleAutoSaveToggle}
          role="switch"
          aria-checked={localPreferences.autoSave}
        >
          {localPreferences.autoSave ? '[ENABLED]' : '[DISABLED]'}
        </button>
      </div>

      {/* Info */}
      <div className="font-mono text-xs text-static-ghost">
        Preferences are saved locally in your browser and will persist across sessions.
      </div>
    </div>
  );
};

export default StyleControls;
