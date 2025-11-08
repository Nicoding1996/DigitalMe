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
  onRetry 
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
                  {failedSources.map((source, index) => (
                    <div key={index} className="p-4 bg-void-elevated border border-static-whisper">
                      <div className="font-mono text-xs text-unsettling-cyan mb-2">
                        [{source.type.toUpperCase()}]
                      </div>
                      <div className="font-mono text-sm text-static-white mb-2">
                        {source.value || 'Text Sample'}
                      </div>
                      <div className="font-mono text-xs text-glitch-red">
                        ERROR: {source.error}
                      </div>
                    </div>
                  ))}
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
