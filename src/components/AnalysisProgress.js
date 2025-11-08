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
    <div className="relative flex items-center justify-center min-h-screen bg-void-deep px-6 py-12">
      {/* Scanline effect */}
      <div className="scanline" />
      
      <div className="relative z-10 w-full max-w-2xl text-center fade-in">
        {error ? (
          /* ERROR STATE */
          <>
            <div className="mb-12">
              <div className="text-6xl text-glitch-red mb-6 flicker">⚠</div>
              <h2 className="text-3xl font-display font-bold text-static-white mb-4 tracking-tight">
                Analysis Failed
              </h2>
              <div className="text-sm text-glitch-red font-mono mb-8">
                {error}
              </div>
            </div>

            {failedSources.length > 0 && (
              <div className="glass-panel p-6 mb-8 text-left">
                <div className="system-text mb-4">FAILED SOURCES</div>
                <div className="space-y-3">
                  {failedSources.map((source, index) => (
                    <div key={index} className="p-3 bg-void-surface border border-static-whisper">
                      <div className="font-mono text-xs text-unsettling-blue mb-1">
                        {source.type.toUpperCase()}
                      </div>
                      <div className="text-sm text-static-white mb-1">
                        {source.value || 'Text Sample'}
                      </div>
                      <div className="text-xs text-glitch-red font-mono">
                        {source.error}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button className="btn-danger" onClick={onRetry}>
              RETRY ANALYSIS
            </button>
          </>
        ) : !isComplete ? (
          /* PROCESSING STATE */
          <>
            <div className="mb-12">
              <h2 className="text-3xl font-display font-bold text-static-white mb-4 tracking-tight">
                Analyzing Your Style
              </h2>
              <div className="text-sm text-static-dim font-mono">
                Building your digital twin profile{dots}
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mb-8">
              <div className="h-1 bg-void-surface mb-3 overflow-hidden">
                <div 
                  className="h-full bg-unsettling-blue transition-all duration-500"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
              <div className="system-text text-static-muted">
                {currentStep} / {totalSteps} STEPS
              </div>
            </div>

            {/* Status Message */}
            <div className="glass-panel p-6 mb-8">
              <div className="flex items-center justify-center gap-3">
                <span className="text-unsettling-blue text-xl">→</span>
                <span className="text-sm text-static-white font-mono">{message}</span>
              </div>
            </div>

            {/* Visual Indicator */}
            <div className="flex justify-center gap-2">
              {[...Array(5)].map((_, i) => (
                <div 
                  key={i}
                  className="w-2 h-2 bg-unsettling-blue rounded-full animate-pulse"
                  style={{ animationDelay: `${i * 0.2}s` }}
                />
              ))}
            </div>
          </>
        ) : (
          /* COMPLETE STATE */
          <>
            <div className="mb-12">
              <div className="text-6xl text-system-active mb-6">✓</div>
              <h2 className="text-3xl font-display font-bold text-static-white mb-4 tracking-tight">
                Analysis Complete
              </h2>
              <div className="text-sm text-static-dim">
                Your digital twin is ready
              </div>
            </div>

            {summary && (
              <div className="glass-panel p-8 mb-8 text-left">
                <div className="system-text mb-6">PROFILE SUMMARY</div>
                
                {summary.failedSources > 0 && (
                  <div className="p-4 bg-warning-amber bg-opacity-10 border border-warning-amber mb-6">
                    <div className="text-warning-amber text-sm font-mono">
                      ⚠ {summary.failedSources} source(s) failed but profile was created
                    </div>
                  </div>
                )}
                
                <div className="space-y-4">
                  {summary.repositories !== undefined && summary.repositories > 0 && (
                    <div className="flex justify-between items-center py-3 border-b border-static-whisper">
                      <span className="text-static-dim text-sm">Words Analyzed:</span>
                      <span className="text-static-white font-mono">{summary.repositories}</span>
                    </div>
                  )}

                  {summary.codeLines !== undefined && summary.codeLines > 0 && (
                    <div className="flex justify-between items-center py-3 border-b border-static-whisper">
                      <span className="text-static-dim text-sm">Lines of Code:</span>
                      <span className="text-static-white font-mono">{summary.codeLines.toLocaleString()}</span>
                    </div>
                  )}

                  {summary.articles !== undefined && summary.articles > 0 && (
                    <div className="flex justify-between items-center py-3 border-b border-static-whisper">
                      <span className="text-static-dim text-sm">Articles Analyzed:</span>
                      <span className="text-static-white font-mono">{summary.articles}</span>
                    </div>
                  )}

                  {summary.wordCount !== undefined && summary.wordCount > 0 && (
                    <div className="flex justify-between items-center py-3 border-b border-static-whisper">
                      <span className="text-static-dim text-sm">Words Analyzed:</span>
                      <span className="text-static-white font-mono">{summary.wordCount.toLocaleString()}</span>
                    </div>
                  )}

                  {summary.confidence !== undefined && (
                    <div className="flex justify-between items-center py-3">
                      <span className="text-static-dim text-sm">Confidence Score:</span>
                      <span className="text-system-active font-mono text-lg">
                        {(summary.confidence * 100).toFixed(0)}%
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            <button className="btn-primary w-full text-base tracking-wide group relative overflow-hidden" onClick={onComplete}>
              <span className="relative z-10">ENTER MIRROR INTERFACE</span>
              <div className="absolute inset-0 bg-unsettling-blue opacity-0 group-hover:opacity-10 transition-opacity duration-300" />
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default AnalysisProgress;
