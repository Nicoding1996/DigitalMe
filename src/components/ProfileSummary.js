/**
 * ProfileSummary Component
 * Black Mirror aesthetic - System Profile Data Display
 */
import { useState, useEffect } from 'react';
import AdvancedPatternsView from './AdvancedPatternsView';

const ProfileSummary = ({ styleProfile }) => {
  const [animatedCompleteness, setAnimatedCompleteness] = useState(0);
  const [animatedWordsAnalyzed, setAnimatedWordsAnalyzed] = useState(0);

  if (!styleProfile) {
    return (
      <div className="p-6 border border-static-whisper bg-void-surface text-center">
        <p className="font-mono text-xs text-static-ghost">[NO_PROFILE_DATA_AVAILABLE]</p>
      </div>
    );
  }

  const { coding, writing, confidence, sampleCount, sourceAttribution } = styleProfile;

  const getConfidenceLevel = (score) => {
    if (score >= 0.8) return 'high';
    if (score >= 0.6) return 'medium';
    return 'low';
  };

  const getCompletenessPercentage = () => {
    const hasCode = sampleCount.codeLines > 0;
    const hasText = sampleCount.textWords > 0;
    const hasRepos = sampleCount.repositories > 0;
    const hasArticles = sampleCount.articles > 0;
    const hasConversations = (sampleCount.conversationWords || 0) > 0;
    
    // Count active data sources
    const activeSources = [hasCode, hasText, hasRepos, hasArticles, hasConversations].filter(Boolean).length;
    
    // Base percentage from active sources (20% each for 5 sources)
    let percentage = activeSources * 20;
    
    // Total words including conversations
    const totalWords = sampleCount.textWords + (sampleCount.emailWords || 0) + (sampleCount.conversationWords || 0);
    
    // Bonus for data quantity
    if (totalWords >= 500) percentage += 5;
    if (totalWords >= 1000) percentage += 5;
    if (sampleCount.codeLines >= 1000) percentage += 5;
    if (sampleCount.repositories >= 3) percentage += 5;
    
    return Math.min(100, percentage);
  };

  const getTotalWordsAnalyzed = () => {
    return sampleCount.textWords + (sampleCount.emailWords || 0) + (sampleCount.conversationWords || 0);
  };

  const confidenceLevel = getConfidenceLevel(confidence);
  const completeness = getCompletenessPercentage();
  const totalWordsAnalyzed = getTotalWordsAnalyzed();

  // Animate completeness score changes
  useEffect(() => {
    const duration = 1000; // 1 second
    const startTime = Date.now();
    const startValue = animatedCompleteness;
    const endValue = completeness;

    const animate = () => {
      const now = Date.now();
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Easing function for smooth animation
      const easeOutQuad = (t) => t * (2 - t);
      const easedProgress = easeOutQuad(progress);

      const currentValue = startValue + (endValue - startValue) * easedProgress;
      setAnimatedCompleteness(Math.round(currentValue));

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    animate();
  }, [completeness]);

  // Animate words analyzed changes
  useEffect(() => {
    const duration = 1000; // 1 second
    const startTime = Date.now();
    const startValue = animatedWordsAnalyzed;
    const endValue = totalWordsAnalyzed;

    const animate = () => {
      const now = Date.now();
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Easing function for smooth animation
      const easeOutQuad = (t) => t * (2 - t);
      const easedProgress = easeOutQuad(progress);

      const currentValue = startValue + (endValue - startValue) * easedProgress;
      setAnimatedWordsAnalyzed(Math.round(currentValue));

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    animate();
  }, [totalWordsAnalyzed]);

  // Helper to format source type for display
  const formatSourceType = (type) => {
    const typeMap = {
      gmail: 'Gmail',
      text: 'Text Sample',
      blog: 'Blog',
      github: 'GitHub',
      existing: 'Previous Profile'
    };
    return typeMap[type] || type;
  };

  // Helper to get source icon
  const getSourceIcon = (type) => {
    const iconMap = {
      gmail: '📧',
      text: '📝',
      blog: '✍️',
      github: '💻',
      existing: '🔄'
    };
    return iconMap[type] || '📄';
  };

  return (
    <div className="space-y-6">
      {/* Improvement Suggestion */}
      {confidence < 0.8 && (
        <div className="border border-system-warning bg-void-elevated p-4">
          <div className="font-mono text-xs text-system-warning mb-2">
            [!] [OPTIMIZATION_PROTOCOL_AVAILABLE]
          </div>
          <div className="font-mono text-xs text-static-white mb-3 leading-relaxed">
            {confidence < 0.55 && 'Profile accuracy insufficient. Add more content for reliable analysis:'}
            {confidence >= 0.55 && confidence < 0.70 && 'Profile accuracy moderate. Add more content for improved results:'}
            {confidence >= 0.70 && 'Profile accuracy good. Add more content for optimal results:'}
          </div>
          <div className="font-mono text-xs text-static-muted space-y-1 border-l-2 border-static-whisper pl-4">
            {confidence < 0.55 && <div><span className="text-unsettling-cyan">&gt;</span> TARGET: 500+ words minimum</div>}
            {confidence >= 0.55 && confidence < 0.70 && <div><span className="text-unsettling-cyan">&gt;</span> TARGET: 1,500+ words for reliable profile</div>}
            {confidence >= 0.70 && confidence < 0.80 && <div><span className="text-unsettling-cyan">&gt;</span> TARGET: 3,000+ words for 80%+ confidence</div>}
            <div><span className="text-unsettling-cyan">&gt;</span> CURRENT: {totalWordsAnalyzed} words analyzed</div>
            {sampleCount.conversationWords > 0 && (
              <div className="text-system-active"><span className="text-unsettling-cyan">&gt;</span> Including {sampleCount.conversationWords} words from conversations</div>
            )}
          </div>
          <div className="font-mono text-xs text-static-ghost mt-3 pt-3 border-t border-static-whisper">
            <span className="text-static-muted">OPTIMAL_THRESHOLD:</span> <span className="text-system-active">80%+ (3,000+ words)</span>
          </div>
        </div>
      )}

      {/* Metrics */}
      <div className="grid grid-cols-3 gap-4">
        <div className="border border-static-whisper bg-void-surface p-4">
          <div className="font-mono text-xs text-static-ghost mb-2">CONFIDENCE_SCORE</div>
          <div className="font-mono text-3xl text-unsettling-cyan mb-2">
            {(confidence * 100).toFixed(0)}%
          </div>
          <div className="h-1 bg-void-elevated">
            <div 
              className="h-full bg-unsettling-cyan transition-all duration-1000"
              style={{ width: `${confidence * 100}%` }}
            />
          </div>
        </div>

        <div className="border border-static-whisper bg-void-surface p-4">
          <div className="font-mono text-xs text-static-ghost mb-2">PROFILE_COMPLETENESS</div>
          <div className="font-mono text-3xl text-system-active mb-2">
            {animatedCompleteness}%
          </div>
          <div className="h-1 bg-void-elevated">
            <div 
              className="h-full bg-system-active transition-all duration-1000"
              style={{ width: `${animatedCompleteness}%` }}
            />
          </div>
        </div>

        <div className="border border-static-whisper bg-void-surface p-4">
          <div className="font-mono text-xs text-static-ghost mb-2">WORDS_ANALYZED</div>
          <div className="font-mono text-3xl text-static-white mb-2">
            {animatedWordsAnalyzed.toLocaleString()}
          </div>
          <div className="font-mono text-xs text-static-muted mt-1">
            {sampleCount.conversationWords > 0 && (
              <span className="text-unsettling-cyan">
                +{sampleCount.conversationWords.toLocaleString()} from conversations
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Analyzed Content */}
      <div className="border border-static-whisper bg-void-surface">
        <div className="px-4 py-2 bg-void-elevated border-b border-static-whisper font-mono text-xs text-static-ghost">
          [ANALYZED_CONTENT]
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 divide-x divide-y divide-static-whisper">
          <div className={`p-4 ${sampleCount.repositories === 0 ? 'opacity-40' : ''}`}>
            <div className="font-mono text-xs text-static-ghost mb-1">📦 Repositories</div>
            <div className="font-mono text-xl text-static-white">{sampleCount.repositories}</div>
          </div>
          <div className={`p-4 ${sampleCount.codeLines === 0 ? 'opacity-40' : ''}`}>
            <div className="font-mono text-xs text-static-ghost mb-1">💻 Lines of Code</div>
            <div className="font-mono text-xl text-static-white">{sampleCount.codeLines.toLocaleString()}</div>
          </div>
          <div className={`p-4 ${sampleCount.articles === 0 ? 'opacity-40' : ''}`}>
            <div className="font-mono text-xs text-static-ghost mb-1">📝 Articles</div>
            <div className="font-mono text-xl text-static-white">{sampleCount.articles}</div>
          </div>
          <div className={`p-4 ${sampleCount.textWords === 0 ? 'opacity-40' : ''}`}>
            <div className="font-mono text-xs text-static-ghost mb-1">✍️ Text Words</div>
            <div className="font-mono text-xl text-static-white">{sampleCount.textWords.toLocaleString()}</div>
          </div>
          <div className={`p-4 ${(sampleCount.conversationWords || 0) === 0 ? 'opacity-40' : ''}`}>
            <div className="font-mono text-xs text-static-ghost mb-1">💬 Conversation Words</div>
            <div className="font-mono text-xl text-static-white">{(sampleCount.conversationWords || 0).toLocaleString()}</div>
          </div>
        </div>
      </div>

      {/* Style Details */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Coding Style */}
        <div className="border border-static-whisper bg-void-surface">
          <div className="px-4 py-2 bg-void-elevated border-b border-static-whisper font-mono text-xs text-static-ghost">
            [CODING_STYLE]
          </div>
          <div className="p-4 space-y-2 font-mono text-xs">
            <div className="flex justify-between">
              <span className="text-static-muted">Language:</span>
              <span className="text-static-white">{coding.language}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-static-muted">Framework:</span>
              <span className="text-static-white">{coding.framework}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-static-muted">Component Style:</span>
              <span className="text-static-white">{coding.componentStyle}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-static-muted">Naming:</span>
              <span className="text-static-white">{coding.namingConvention}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-static-muted">Comments:</span>
              <span className="text-static-white">{coding.commentFrequency}</span>
            </div>
            <div className="pt-2 border-t border-static-whisper">
              <div className="text-static-muted mb-2">Patterns:</div>
              <div className="text-static-white break-words">{coding.patterns.join(', ')}</div>
            </div>
          </div>
        </div>

        {/* Writing Style */}
        <div className="border border-static-whisper bg-void-surface">
          <div className="px-4 py-2 bg-void-elevated border-b border-static-whisper font-mono text-xs text-static-ghost">
            [WRITING_STYLE]
          </div>
          <div className="p-4 space-y-2 font-mono text-xs">
            <div className="flex justify-between">
              <span className="text-static-muted">Tone:</span>
              <span className="text-static-white">{writing.tone}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-static-muted">Formality:</span>
              <span className="text-static-white">{writing.formality}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-static-muted">Sentence Length:</span>
              <span className="text-static-white">{writing.sentenceLength}</span>
            </div>
            <div className="pt-2 border-t border-static-whisper">
              <div className="text-static-muted mb-2">Vocabulary:</div>
              <div className="text-static-white break-words">{writing.vocabulary.join(', ')}</div>
            </div>
            <div className="pt-2 border-t border-static-whisper">
              <div className="text-static-muted mb-2">Avoids:</div>
              <div className="text-glitch-red break-words">{writing.avoidance.join(', ')}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Source Attribution */}
      {sourceAttribution && Object.keys(sourceAttribution).length > 0 && (
        <div className="border border-static-whisper bg-void-surface">
          <div className="px-4 py-2 bg-void-elevated border-b border-static-whisper font-mono text-xs text-static-ghost">
            [SOURCE_ATTRIBUTION]
          </div>
          <div className="p-4 space-y-4 font-mono text-xs">
            <div className="text-static-muted mb-3 leading-relaxed">
              Your style profile is built from multiple data sources. Here's how each source contributed to your writing attributes:
            </div>

            {/* Tone Attribution */}
            {sourceAttribution.tone && (
              <div className="border-l-2 border-unsettling-cyan pl-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-static-white">Tone: <span className="text-unsettling-cyan">{sourceAttribution.tone.value}</span></span>
                </div>
                <div className="space-y-1">
                  {sourceAttribution.tone.sources.map((source, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <span className="text-static-ghost">{getSourceIcon(source.type)}</span>
                      <span className="text-static-muted flex-1">{formatSourceType(source.type)}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-void-elevated">
                          <div 
                            className="h-full bg-unsettling-cyan"
                            style={{ width: `${source.contribution}%` }}
                          />
                        </div>
                        <span className="text-static-white w-8 text-right">{source.contribution}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Formality Attribution */}
            {sourceAttribution.formality && (
              <div className="border-l-2 border-system-active pl-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-static-white">Formality: <span className="text-system-active">{sourceAttribution.formality.value}</span></span>
                </div>
                <div className="space-y-1">
                  {sourceAttribution.formality.sources.map((source, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <span className="text-static-ghost">{getSourceIcon(source.type)}</span>
                      <span className="text-static-muted flex-1">{formatSourceType(source.type)}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-void-elevated">
                          <div 
                            className="h-full bg-system-active"
                            style={{ width: `${source.contribution}%` }}
                          />
                        </div>
                        <span className="text-static-white w-8 text-right">{source.contribution}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Sentence Length Attribution */}
            {sourceAttribution.sentenceLength && (
              <div className="border-l-2 border-static-whisper pl-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-static-white">Sentence Length: <span className="text-static-white">{sourceAttribution.sentenceLength.value}</span></span>
                </div>
                <div className="space-y-1">
                  {sourceAttribution.sentenceLength.sources.map((source, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <span className="text-static-ghost">{getSourceIcon(source.type)}</span>
                      <span className="text-static-muted flex-1">{formatSourceType(source.type)}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-void-elevated">
                          <div 
                            className="h-full bg-static-white"
                            style={{ width: `${source.contribution}%` }}
                          />
                        </div>
                        <span className="text-static-white w-8 text-right">{source.contribution}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Vocabulary Attribution */}
            {sourceAttribution.vocabulary && sourceAttribution.vocabulary.sources && Object.keys(sourceAttribution.vocabulary.sources).length > 0 && (
              <div className="border-l-2 border-system-warning pl-4">
                <div className="text-static-white mb-2">Vocabulary Terms:</div>
                <div className="space-y-3">
                  {Object.entries(sourceAttribution.vocabulary.sources).map(([term, sources], idx) => (
                    <div key={idx} className="bg-void-elevated p-2 rounded">
                      <div className="text-system-warning mb-1.5">"{term}"</div>
                      <div className="space-y-1">
                        {sources.map((source, sIdx) => (
                          <div key={sIdx} className="flex items-center gap-2 text-xs">
                            <span className="text-static-ghost">{getSourceIcon(source.type)}</span>
                            <span className="text-static-muted flex-1">{formatSourceType(source.type)}</span>
                            <div className="flex items-center gap-2">
                              <div className="w-12 h-1 bg-void-deep">
                                <div 
                                  className="h-full bg-system-warning"
                                  style={{ width: `${source.contribution}%` }}
                                />
                              </div>
                              <span className="text-static-white w-8 text-right">{source.contribution}%</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Avoidance Attribution */}
            {sourceAttribution.avoidance && sourceAttribution.avoidance.value[0] !== 'none' && sourceAttribution.avoidance.sources && Object.keys(sourceAttribution.avoidance.sources).length > 0 && (
              <div className="border-l-2 border-glitch-red pl-4">
                <div className="text-static-white mb-2">Avoidance Terms:</div>
                <div className="space-y-3">
                  {Object.entries(sourceAttribution.avoidance.sources).map(([term, sources], idx) => (
                    <div key={idx} className="bg-void-elevated p-2 rounded">
                      <div className="text-glitch-red mb-1.5">"{term}"</div>
                      <div className="space-y-1">
                        {sources.map((source, sIdx) => (
                          <div key={sIdx} className="flex items-center gap-2 text-xs">
                            <span className="text-static-ghost">{getSourceIcon(source.type)}</span>
                            <span className="text-static-muted flex-1">{formatSourceType(source.type)}</span>
                            <div className="flex items-center gap-2">
                              <div className="w-12 h-1 bg-void-deep">
                                <div 
                                  className="h-full bg-glitch-red"
                                  style={{ width: `${source.contribution}%` }}
                                />
                              </div>
                              <span className="text-static-white w-8 text-right">{source.contribution}%</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Advanced Patterns Section */}
      {styleProfile.advanced && (
        styleProfile.advanced.phrases?.length > 0 ||
        styleProfile.advanced.thoughtPatterns ||
        styleProfile.advanced.personalityMarkers?.length > 0 ||
        (styleProfile.advanced.contextualPatterns && Object.keys(styleProfile.advanced.contextualPatterns).length > 0)
      ) && (
        <div className="border border-unsettling-cyan bg-void-surface">
          <div className="px-4 py-2 bg-void-elevated border-b border-unsettling-cyan font-mono text-xs text-unsettling-cyan">
            [ADVANCED_PATTERNS]
          </div>
          <div className="p-4">
            <div className="font-mono text-xs text-static-muted mb-4 leading-relaxed">
              Deep analysis of your unique expressions, thought patterns, and personality quirks
            </div>
            <AdvancedPatternsView
              phrases={styleProfile.advanced.phrases}
              thoughtPatterns={styleProfile.advanced.thoughtPatterns}
              personalityMarkers={styleProfile.advanced.personalityMarkers}
              contextualPatterns={styleProfile.advanced.contextualPatterns}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileSummary;
