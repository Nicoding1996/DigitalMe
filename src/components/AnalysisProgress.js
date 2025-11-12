/**
 * AnalysisProgress Component
 * Black Mirror aesthetic - System processing interface
 */
import { useEffect, useState } from 'react';

const AnalysisProgress = ({ 
  isComplete, 
  currentStep, 
  totalSteps, 
  message, 
  summary, 
  error, 
  failedSources = [], 
  onComplete, 
  onRetry,
  advancedAnalysis = null // { enabled: boolean, status: { phrases, thoughtFlow, quirks, contextual } }
}) => {
  const [dots, setDots] = useState('');

  useEffect(() => {
    if (!isComplete && !error) {
      const interval = setInterval(() => {
        setDots(prev => (prev.length >= 3 ? '' : prev + '.'));
      }, 500);
      return () => clearInterval(interval);
    }
  }, [isComplete, error]);

  const progressPercentage = (currentStep / totalSteps) * 100;

  return (
    <div className="relative flex items-center justify-center min-h-screen bg-mirror-black px-6 py-12">
      {/* Scanline effect */}
      <div className="scanline" />
      
      <div className="relative z-10 w-full max-w-3xl fade-in">
        {error ? (
          /* ERROR STATE */
          <>
            <div className="mb-12">
              <div className="font-mono text-xs text-static-ghost mb-6">
                [SYSTEM_ERROR]
              </div>
              <div className="text-6xl text-glitch-red mb-6 flicker">⚠</div>
              <h2 className="text-3xl font-display font-bold text-static-white mb-4 tracking-tight">
                Analysis Failed
              </h2>
              <div className="font-mono text-sm text-glitch-red mb-8">
                [ERROR: {error}]
              </div>
            </div>

            {failedSources.length > 0 && (
              <div className="border border-static-whisper bg-void-surface p-6 mb-8">
                <div className="font-mono text-xs text-static-ghost mb-4">[FAILED_SOURCES]</div>
                <div className="space-y-3">
                  {failedSources.map((source, index) => {
                    // Format the source value for display
                    let displayValue = 'Text Sample';
                    if (source.type === 'gmail') {
                      displayValue = 'Gmail Account';
                    } else if (typeof source.value === 'string') {
                      displayValue = source.value;
                    } else if (typeof source.value === 'object' && source.value !== null) {
                      displayValue = JSON.stringify(source.value);
                    }
                    
                    return (
                      <div key={index} className="p-4 bg-void-elevated border border-static-whisper">
                        <div className="font-mono text-xs text-unsettling-cyan mb-2">
                          [{source.type.toUpperCase()}]
                        </div>
                        <div className="font-mono text-sm text-static-white mb-2">
                          {displayValue}
                        </div>
                        <div className="font-mono text-xs text-glitch-red">
                          ERROR: {source.error}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <button 
              className="w-full px-8 py-4 bg-void-surface border border-glitch-red text-glitch-red font-mono text-sm tracking-wider hover:bg-glitch-red hover:text-void-deep transition-all"
              onClick={onRetry}
            >
              &gt; RETRY_ANALYSIS
            </button>
          </>
        ) : !isComplete ? (
          /* PROCESSING STATE */
          <>
            <div className="mb-12">
              <div className="font-mono text-xs text-static-ghost mb-6">
                [ANALYSIS_IN_PROGRESS]
              </div>
              <h2 className="text-3xl font-display font-bold text-static-white mb-4 tracking-tight">
                Analyzing Your Style
              </h2>
              <div className="font-mono text-xs text-static-muted">
                &gt; Building your digital twin profile{dots}
              </div>
            </div>

            {/* Progress Bar */}
            <div className="border border-static-whisper bg-void-surface p-6 mb-8">
              <div className="font-mono text-xs text-static-ghost mb-4">
                [PROGRESS: {currentStep} / {totalSteps}]
              </div>
              <div className="h-2 bg-void-elevated mb-4">
                <div 
                  className="h-full bg-unsettling-cyan transition-all duration-500"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
              <div className="font-mono text-xs text-static-white">
                &gt; {message}
              </div>
            </div>

            {/* Advanced Analysis Progress */}
            {advancedAnalysis?.enabled && (
              <div className="border border-unsettling-cyan bg-void-surface p-6 mb-8">
                <div className="font-mono text-xs text-unsettling-cyan mb-4">
                  [ADVANCED_ANALYSIS]
                </div>
                <div className="space-y-3">
                  {/* Phrase Patterns */}
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 flex items-center justify-center">
                      {advancedAnalysis.status?.phrases === 'complete' && (
                        <span className="text-system-active">✓</span>
                      )}
                      {advancedAnalysis.status?.phrases === 'running' && (
                        <span className="text-unsettling-cyan animate-pulse">●</span>
                      )}
                      {advancedAnalysis.status?.phrases === 'failed' && (
                        <span className="text-glitch-red">✗</span>
                      )}
                      {!advancedAnalysis.status?.phrases && (
                        <span className="text-static-ghost">○</span>
                      )}
                    </div>
                    <span className="font-mono text-xs text-static-white">
                      Phrase Patterns
                    </span>
                  </div>

                  {/* Thought Flow */}
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 flex items-center justify-center">
                      {advancedAnalysis.status?.thoughtFlow === 'complete' && (
                        <span className="text-system-active">✓</span>
                      )}
                      {advancedAnalysis.status?.thoughtFlow === 'running' && (
                        <span className="text-unsettling-cyan animate-pulse">●</span>
                      )}
                      {advancedAnalysis.status?.thoughtFlow === 'failed' && (
                        <span className="text-glitch-red">✗</span>
                      )}
                      {!advancedAnalysis.status?.thoughtFlow && (
                        <span className="text-static-ghost">○</span>
                      )}
                    </div>
                    <span className="font-mono text-xs text-static-white">
                      Thought Flow
                    </span>
                  </div>

                  {/* Personality Quirks */}
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 flex items-center justify-center">
                      {advancedAnalysis.status?.quirks === 'complete' && (
                        <span className="text-system-active">✓</span>
                      )}
                      {advancedAnalysis.status?.quirks === 'running' && (
                        <span className="text-unsettling-cyan animate-pulse">●</span>
                      )}
                      {advancedAnalysis.status?.quirks === 'failed' && (
                        <span className="text-glitch-red">✗</span>
                      )}
                      {!advancedAnalysis.status?.quirks && (
                        <span className="text-static-ghost">○</span>
                      )}
                    </div>
                    <span className="font-mono text-xs text-static-white">
                      Personality Quirks
                    </span>
                  </div>

                  {/* Contextual Patterns */}
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 flex items-center justify-center">
                      {advancedAnalysis.status?.contextual === 'complete' && (
                        <span className="text-system-active">✓</span>
                      )}
                      {advancedAnalysis.status?.contextual === 'running' && (
                        <span className="text-unsettling-cyan animate-pulse">●</span>
                      )}
                      {advancedAnalysis.status?.contextual === 'failed' && (
                        <span className="text-glitch-red">✗</span>
                      )}
                      {!advancedAnalysis.status?.contextual && (
                        <span className="text-static-ghost">○</span>
                      )}
                    </div>
                    <span className="font-mono text-xs text-static-white">
                      Contextual Patterns
                    </span>
                  </div>
                </div>

                {/* Partial failure message */}
                {advancedAnalysis.status && 
                 Object.values(advancedAnalysis.status).some(s => s === 'failed') && (
                  <div className="mt-4 pt-4 border-t border-static-whisper">
                    <div className="font-mono text-xs text-system-warning mb-2">
                      [!] Advanced analysis unavailable
                    </div>
                    <div className="font-mono text-xs text-static-muted">
                      Some advanced pattern analyses failed. Your basic profile is still being created and will work normally.
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Visual Indicator */}
            <div className="flex justify-center gap-2">
              {[...Array(5)].map((_, i) => (
                <div 
                  key={i}
                  className="w-2 h-2 bg-unsettling-cyan rounded-full animate-pulse"
                  style={{ animationDelay: `${i * 0.2}s` }}
                />
              ))}
            </div>
          </>
        ) : (
          /* COMPLETE STATE */
          <>
            <div className="mb-12">
              <div className="font-mono text-xs text-static-ghost mb-6">
                [ANALYSIS_COMPLETE]
              </div>
              <div className="text-6xl text-system-active mb-6">✓</div>
              <h2 className="text-3xl font-display font-bold text-static-white mb-4 tracking-tight">
                Analysis Complete
              </h2>
              <div className="font-mono text-xs text-static-muted">
                &gt; Your digital twin is ready
              </div>
            </div>

            {summary && (
              <div className="border border-static-whisper bg-void-surface mb-8">
                <div className="px-6 py-3 bg-void-elevated border-b border-static-whisper font-mono text-xs text-static-ghost">
                  [PROFILE_SUMMARY]
                </div>
                
                <div className="p-6">
                  {summary.failedSources > 0 && (
                    <div className="p-4 bg-void-elevated border border-system-warning mb-6">
                      <div className="text-system-warning font-mono text-xs">
                        [WARNING: {summary.failedSources} SOURCE(S) FAILED BUT PROFILE WAS CREATED]
                      </div>
                    </div>
                  )}
                  
                  <div className="space-y-3 font-mono text-xs">
                    {summary.repositories !== undefined && summary.repositories > 0 && (
                      <div className="flex justify-between items-center py-2 border-b border-static-whisper">
                        <span className="text-static-muted">Repositories:</span>
                        <span className="text-static-white">{summary.repositories}</span>
                      </div>
                    )}

                    {summary.codeLines !== undefined && summary.codeLines > 0 && (
                      <div className="flex justify-between items-center py-2 border-b border-static-whisper">
                        <span className="text-static-muted">Lines of Code:</span>
                        <span className="text-static-white">{summary.codeLines.toLocaleString()}</span>
                      </div>
                    )}

                    {summary.articles !== undefined && summary.articles > 0 && (
                      <div className="flex justify-between items-center py-2 border-b border-static-whisper">
                        <span className="text-static-muted">Articles:</span>
                        <span className="text-static-white">{summary.articles}</span>
                      </div>
                    )}

                    {summary.wordCount !== undefined && summary.wordCount > 0 && (
                      <div className="flex justify-between items-center py-2 border-b border-static-whisper">
                        <span className="text-static-muted">Words:</span>
                        <span className="text-static-white">{summary.wordCount.toLocaleString()}</span>
                      </div>
                    )}

                    {summary.confidence !== undefined && (
                      <div className="flex justify-between items-center py-2">
                        <span className="text-static-muted">Confidence:</span>
                        <span className="text-system-active text-lg">
                          {(summary.confidence * 100).toFixed(0)}%
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Advanced Analysis Failure Notice */}
            {advancedAnalysis?.enabled && advancedAnalysis.status && 
             Object.values(advancedAnalysis.status).every(s => s === 'failed') && (
              <div className="border border-system-warning bg-void-surface p-6 mb-8">
                <div className="font-mono text-xs text-system-warning mb-3">
                  [!] [ADVANCED_ANALYSIS_UNAVAILABLE]
                </div>
                <div className="font-mono text-xs text-static-white mb-4 leading-relaxed">
                  Advanced pattern analysis could not be completed. Your basic style profile has been created successfully and is fully functional.
                </div>
                <div className="font-mono text-xs text-static-muted">
                  You can retry advanced analysis later from Settings → Re-analyze with Advanced Patterns
                </div>
              </div>
            )}

            {/* Improvement Suggestion */}
            {summary && summary.confidence < 0.8 && (
              <div className="border border-system-warning bg-void-surface p-6 mb-8">
                <div className="font-mono text-xs text-system-warning mb-3">
                  {summary.confidence < 0.55 && '[!] [SYSTEM_WARNING: LOW_CONFIDENCE]'}
                  {summary.confidence >= 0.55 && summary.confidence < 0.70 && '[!] [SYSTEM_RECOMMENDATION: MODERATE_CONFIDENCE]'}
                  {summary.confidence >= 0.70 && '[!] [SYSTEM_RECOMMENDATION: ACCURACY_OPTIMIZATION]'}
                </div>
                <div className="font-mono text-xs text-static-white mb-4 leading-relaxed">
                  {summary.confidence < 0.55 && 'Insufficient data for reliable style analysis. Add more content (minimum 500 words recommended).'}
                  {summary.confidence >= 0.55 && summary.confidence < 0.70 && 'Profile usable but limited. Add more content for improved accuracy (1,500+ words recommended).'}
                  {summary.confidence >= 0.70 && 'Profile initialization complete. Additional content recommended for optimal results (3,000+ words for 80%+ confidence).'}
                </div>
                <div className="font-mono text-xs text-static-ghost">
                  <span className="text-static-muted">CURRENT_CONFIDENCE:</span> {(summary.confidence * 100).toFixed(0)}% 
                  <span className="text-static-muted mx-2">→</span> 
                  <span className="text-static-muted">OPTIMAL_THRESHOLD:</span> <span className="text-system-active">80%+</span>
                  <span className="text-static-muted ml-4">({summary.wordCount || 0} words analyzed)</span>
                </div>
              </div>
            )}

            <button 
              className="w-full px-8 py-4 bg-void-surface border border-static-whisper text-static-white font-mono text-sm tracking-wider hover:border-unsettling-cyan hover:text-unsettling-cyan transition-all"
              onClick={onComplete}
            >
              &gt; ENTER_MIRROR_INTERFACE
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default AnalysisProgress;
