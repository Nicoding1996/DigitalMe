/**
 * AdvancedPatternsView Component
 * Black Mirror aesthetic - Advanced Style Analysis Display
 */
import { useState } from 'react';

const AdvancedPatternsView = ({ phrases, thoughtPatterns, personalityMarkers, contextualPatterns }) => {
  const [expandedSection, setExpandedSection] = useState(null);

  const toggleSection = (section) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  // Helper to get max frequency for scaling bars
  const getMaxFrequency = () => {
    if (!phrases || phrases.length === 0) return 1;
    return Math.max(...phrases.map(p => p.frequency));
  };

  const maxFrequency = getMaxFrequency();

  return (
    <div className="space-y-4">
      {/* Signature Phrases Section */}
      {phrases && phrases.length > 0 && (
        <div className="border border-static-whisper bg-void-surface">
          <button
            className="w-full px-4 py-3 bg-void-elevated border-b border-static-whisper font-mono text-xs text-static-ghost hover:text-unsettling-cyan transition-colors flex items-center justify-between"
            onClick={() => toggleSection('phrases')}
          >
            <span>[SIGNATURE_PHRASES]</span>
            <span className="text-unsettling-cyan">{expandedSection === 'phrases' ? '[-]' : '[+]'}</span>
          </button>
          
          {expandedSection === 'phrases' && (
            <div className="p-4 space-y-3">
              <div className="font-mono text-xs text-static-muted mb-4">
                Recurring expressions and transitions detected in your writing
              </div>
              {phrases.map((phrase, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex items-center justify-between font-mono text-xs">
                    <span className="text-static-white">"{phrase.phrase}"</span>
                    <div className="flex items-center gap-2">
                      <span className="text-static-muted text-[10px] uppercase">{phrase.category}</span>
                      <span className="text-unsettling-cyan">{phrase.frequency}×</span>
                    </div>
                  </div>
                  <div className="h-1.5 bg-void-elevated">
                    <div 
                      className="h-full bg-unsettling-cyan transition-all"
                      style={{ width: `${(phrase.frequency / maxFrequency) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Thought Flow Section */}
      {thoughtPatterns && (
        <div className="border border-static-whisper bg-void-surface">
          <button
            className="w-full px-4 py-3 bg-void-elevated border-b border-static-whisper font-mono text-xs text-static-ghost hover:text-system-active transition-colors flex items-center justify-between"
            onClick={() => toggleSection('thoughtFlow')}
          >
            <span>[THOUGHT_FLOW]</span>
            <span className="text-system-active">{expandedSection === 'thoughtFlow' ? '[-]' : '[+]'}</span>
          </button>
          
          {expandedSection === 'thoughtFlow' && (
            <div className="p-4 space-y-4">
              <div className="font-mono text-xs text-static-muted mb-4">
                How you organize and connect ideas in your writing
              </div>
              
              {/* Flow Score Indicator */}
              <div className="space-y-2">
                <div className="flex items-center justify-between font-mono text-xs">
                  <span className="text-static-muted">STRUCTURE</span>
                  <span className="text-static-white">{thoughtPatterns.flowScore}/100</span>
                  <span className="text-static-muted">STREAM</span>
                </div>
                <div className="relative h-2 bg-void-elevated">
                  <div 
                    className="absolute h-full bg-gradient-to-r from-system-active to-system-warning transition-all"
                    style={{ width: `${thoughtPatterns.flowScore}%` }}
                  />
                  <div 
                    className="absolute top-0 w-0.5 h-full bg-static-white"
                    style={{ left: `${thoughtPatterns.flowScore}%` }}
                  />
                </div>
                <div className="font-mono text-[10px] text-static-ghost text-center">
                  {thoughtPatterns.flowScore < 33 ? 'Highly structured with clear topic progression' :
                   thoughtPatterns.flowScore < 67 ? 'Balanced mix of structure and spontaneity' :
                   'Stream-of-consciousness with organic idea flow'}
                </div>
              </div>

              {/* Additional Metrics */}
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-static-whisper">
                <div className="space-y-1">
                  <div className="font-mono text-xs text-static-muted">Parenthetical Usage</div>
                  <div className="font-mono text-lg text-system-active">
                    {thoughtPatterns.parentheticalFrequency}
                    <span className="text-xs text-static-ghost ml-1">/1000 words</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="font-mono text-xs text-static-muted">Transition Style</div>
                  <div className="font-mono text-lg text-system-active capitalize">
                    {thoughtPatterns.transitionStyle}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Personality Quirks Section */}
      {personalityMarkers && personalityMarkers.length > 0 && (
        <div className="border border-static-whisper bg-void-surface">
          <button
            className="w-full px-4 py-3 bg-void-elevated border-b border-static-whisper font-mono text-xs text-static-ghost hover:text-system-warning transition-colors flex items-center justify-between"
            onClick={() => toggleSection('quirks')}
          >
            <span>[PERSONALITY_QUIRKS]</span>
            <span className="text-system-warning">{expandedSection === 'quirks' ? '[-]' : '[+]'}</span>
          </button>
          
          {expandedSection === 'quirks' && (
            <div className="p-4 space-y-3">
              <div className="font-mono text-xs text-static-muted mb-4">
                Distinctive writing quirks and self-aware patterns
              </div>
              {personalityMarkers.map((marker, idx) => (
                <div key={idx} className="bg-void-elevated p-3 border-l-2 border-system-warning">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-mono text-[10px] text-system-warning uppercase px-2 py-0.5 bg-void-surface">
                      {marker.type.replace('-', ' ')}
                    </span>
                  </div>
                  <div className="font-mono text-xs text-static-white mb-2 italic">
                    "{marker.text}"
                  </div>
                  {marker.context && (
                    <div className="font-mono text-[10px] text-static-muted">
                      {marker.context}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Contextual Variations Section */}
      {contextualPatterns && Object.keys(contextualPatterns).length > 0 && (
        <div className="border border-static-whisper bg-void-surface">
          <button
            className="w-full px-4 py-3 bg-void-elevated border-b border-static-whisper font-mono text-xs text-static-ghost hover:text-unsettling-cyan transition-colors flex items-center justify-between"
            onClick={() => toggleSection('contextual')}
          >
            <span>[CONTEXTUAL_VARIATIONS]</span>
            <span className="text-unsettling-cyan">{expandedSection === 'contextual' ? '[-]' : '[+]'}</span>
          </button>
          
          {expandedSection === 'contextual' && (
            <div className="p-4 space-y-4">
              <div className="font-mono text-xs text-static-muted mb-4">
                How your writing style adapts to different topics and contexts
              </div>
              {Object.entries(contextualPatterns).map(([topic, patterns], idx) => (
                <div key={idx} className="bg-void-elevated p-3 space-y-2">
                  <div className="font-mono text-xs text-unsettling-cyan uppercase mb-3">
                    {topic}
                  </div>
                  <div className="grid grid-cols-2 gap-3 font-mono text-xs">
                    <div>
                      <span className="text-static-muted">Formality:</span>
                      <span className="text-static-white ml-2 capitalize">{patterns.formality}</span>
                    </div>
                    <div>
                      <span className="text-static-muted">Tone:</span>
                      <span className="text-static-white ml-2 capitalize">{patterns.tone}</span>
                    </div>
                  </div>
                  {patterns.vocabulary && patterns.vocabulary.length > 0 && (
                    <div className="pt-2 border-t border-static-whisper">
                      <div className="text-static-muted text-[10px] mb-1">Key vocabulary:</div>
                      <div className="text-static-white text-xs">
                        {patterns.vocabulary.slice(0, 5).join(', ')}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdvancedPatternsView;
