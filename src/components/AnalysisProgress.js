import { useEffect, useState } from 'react';
import './AnalysisProgress.css';

const AnalysisProgress = ({ isComplete, currentStep, totalSteps, message, summary, onComplete }) => {
  const [dots, setDots] = useState('');

  useEffect(() => {
    if (!isComplete) {
      const interval = setInterval(() => {
        setDots(prev => (prev.length >= 3 ? '' : prev + '.'));
      }, 500);
      return () => clearInterval(interval);
    }
  }, [isComplete]);

  const progressPercentage = (currentStep / totalSteps) * 100;

  return (
    <div className="analysis-progress">
      <div className="analysis-content">
        {!isComplete ? (
          <>
            <div className="analysis-header">
              <h2 className="analysis-title">Analyzing Your Style</h2>
              <div className="analysis-subtitle">
                Building your digital twin profile{dots}
              </div>
            </div>

            <div className="progress-container">
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
              <div className="progress-text">
                {currentStep} / {totalSteps} steps
              </div>
            </div>

            <div className="status-message">
              <span className="status-icon">→</span>
              {message}
            </div>

            <div className="analysis-visual">
              <div className="scanning-line" />
              <div className="data-points">
                {[...Array(20)].map((_, i) => (
                  <div 
                    key={i} 
                    className="data-point"
                    style={{
                      animationDelay: `${i * 0.1}s`,
                      left: `${(i * 5)}%`
                    }}
                  />
                ))}
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="analysis-header">
              <div className="success-icon">✓</div>
              <h2 className="analysis-title">Analysis Complete</h2>
              <div className="analysis-subtitle">
                Your digital twin is ready
              </div>
            </div>

            {summary && (
              <div className="analysis-summary">
                <div className="summary-title">Profile Summary</div>
                
                {summary.repositories !== undefined && summary.repositories > 0 && (
                  <div className="summary-item">
                    <span className="summary-label">Repositories Analyzed:</span>
                    <span className="summary-value">{summary.repositories}</span>
                  </div>
                )}

                {summary.codeLines !== undefined && summary.codeLines > 0 && (
                  <div className="summary-item">
                    <span className="summary-label">Lines of Code:</span>
                    <span className="summary-value">{summary.codeLines.toLocaleString()}</span>
                  </div>
                )}

                {summary.articles !== undefined && summary.articles > 0 && (
                  <div className="summary-item">
                    <span className="summary-label">Articles Analyzed:</span>
                    <span className="summary-value">{summary.articles}</span>
                  </div>
                )}

                {summary.wordCount !== undefined && summary.wordCount > 0 && (
                  <div className="summary-item">
                    <span className="summary-label">Words Analyzed:</span>
                    <span className="summary-value">{summary.wordCount.toLocaleString()}</span>
                  </div>
                )}

                {summary.confidence !== undefined && (
                  <div className="summary-item">
                    <span className="summary-label">Confidence Score:</span>
                    <span className="summary-value confidence">
                      {(summary.confidence * 100).toFixed(0)}%
                    </span>
                  </div>
                )}
              </div>
            )}

            <button className="continue-button" onClick={onComplete}>
              Enter Mirror Interface
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default AnalysisProgress;
