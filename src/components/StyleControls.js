/**
 * StyleControls Component
 * Black Mirror aesthetic - System Preferences
 */
import { useState, useEffect } from 'react';

const PREFERENCES_KEY = 'digitalme_preferences';

const StyleControls = ({ preferences, onUpdatePreferences }) => {
  const [localPreferences, setLocalPreferences] = useState(preferences || {
    glitchIntensity: 'medium',
    autoSave: true
  });

  useEffect(() => {
    if (preferences) {
      setLocalPreferences(preferences);
    }
  }, [preferences]);

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
      {/* Glitch Intensity */}
      <div className="border border-static-whisper bg-void-surface p-4">
        <div className="font-mono text-xs text-static-ghost mb-3">GLITCH_EFFECT_INTENSITY</div>
        <p className="font-mono text-xs text-static-muted mb-4">Adjust the intensity of the glitch animation</p>
        <div className="grid grid-cols-3 gap-2 mb-3">
          <button
            className={`p-3 min-h-[44px] border font-mono text-xs transition-all touch-manipulation ${
              localPreferences.glitchIntensity === 'low'
                ? 'border-unsettling-cyan text-unsettling-cyan bg-void-elevated'
                : 'border-static-whisper text-static-muted hover:border-static-ghost active:bg-void-elevated'
            }`}
            onClick={() => handleGlitchIntensityChange({ target: { value: 'low' } })}
          >
            [LOW]
          </button>
          <button
            className={`p-3 min-h-[44px] border font-mono text-xs transition-all touch-manipulation ${
              localPreferences.glitchIntensity === 'medium'
                ? 'border-unsettling-cyan text-unsettling-cyan bg-void-elevated'
                : 'border-static-whisper text-static-muted hover:border-static-ghost active:bg-void-elevated'
            }`}
            onClick={() => handleGlitchIntensityChange({ target: { value: 'medium' } })}
          >
            [MEDIUM]
          </button>
          <button
            className={`p-3 min-h-[44px] border font-mono text-xs transition-all touch-manipulation ${
              localPreferences.glitchIntensity === 'high'
                ? 'border-unsettling-cyan text-unsettling-cyan bg-void-elevated'
                : 'border-static-whisper text-static-muted hover:border-static-ghost active:bg-void-elevated'
            }`}
            onClick={() => handleGlitchIntensityChange({ target: { value: 'high' } })}
          >
            [HIGH]
          </button>
        </div>
        <div className="font-mono text-xs text-static-ghost text-center">
          <span className="text-static-muted">CURRENT:</span> <span className="text-unsettling-cyan">{getGlitchIntensityLabel(localPreferences.glitchIntensity).toUpperCase()}</span>
        </div>
      </div>

      {/* Auto-Save */}
      <div className="border border-static-whisper bg-void-surface p-4">
        <div className="font-mono text-xs text-static-ghost mb-3">AUTO_SAVE</div>
        <p className="font-mono text-xs text-static-muted mb-4">Automatically save conversation history</p>
        <button
          className={`px-6 py-2 min-h-[44px] border font-mono text-xs transition-all touch-manipulation ${
            localPreferences.autoSave
              ? 'border-system-active text-system-active bg-void-elevated'
              : 'border-static-whisper text-static-muted hover:border-static-ghost active:bg-void-elevated'
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
