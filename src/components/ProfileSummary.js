import './ProfileSummary.css';

const ProfileSummary = ({ styleProfile }) => {
  if (!styleProfile) {
    return (
      <div className="profile-summary-empty">
        <p>No style profile available</p>
      </div>
    );
  }

  const { coding, writing, confidence, sampleCount } = styleProfile;

  const getConfidenceLevel = (score) => {
    if (score >= 0.8) return 'high';
    if (score >= 0.6) return 'medium';
    return 'low';
  };

  const getCompletenessPercentage = () => {
    const hasCode = sampleCount.codeLines > 0;
    const hasText = sampleCount.textWords > 0;
    const hasMultipleSources = (sampleCount.repositories + sampleCount.articles) > 1;
    
    let percentage = 0;
    if (hasCode) percentage += 40;
    if (hasText) percentage += 40;
    if (hasMultipleSources) percentage += 20;
    
    return percentage;
  };

  const confidenceLevel = getConfidenceLevel(confidence);
  const completeness = getCompletenessPercentage();

  return (
    <div className="profile-summary">
      <div className="profile-metrics">
        <div className="metric-card">
          <div className="metric-label">Confidence Score</div>
          <div className="metric-value">
            <span className={`confidence-score ${confidenceLevel}`}>
              {(confidence * 100).toFixed(0)}%
            </span>
          </div>
          <div className="metric-indicator">
            <div className="indicator-bar">
              <div 
                className={`indicator-fill ${confidenceLevel}`}
                style={{ width: `${confidence * 100}%` }}
              />
            </div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-label">Profile Completeness</div>
          <div className="metric-value">
            <span className="completeness-score">
              {completeness}%
            </span>
          </div>
          <div className="metric-indicator">
            <div className="indicator-bar">
              <div 
                className="indicator-fill completeness"
                style={{ width: `${completeness}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="sample-counts">
        <h4>Analyzed Content</h4>
        <div className="count-grid">
          <div className="count-item">
            <div className="count-icon">📦</div>
            <div className="count-details">
              <div className="count-value">{sampleCount.repositories}</div>
              <div className="count-label">Repositories</div>
            </div>
          </div>

          <div className="count-item">
            <div className="count-icon">💻</div>
            <div className="count-details">
              <div className="count-value">{sampleCount.codeLines.toLocaleString()}</div>
              <div className="count-label">Lines of Code</div>
            </div>
          </div>

          <div className="count-item">
            <div className="count-icon">📝</div>
            <div className="count-details">
              <div className="count-value">{sampleCount.articles}</div>
              <div className="count-label">Articles</div>
            </div>
          </div>

          <div className="count-item">
            <div className="count-icon">✍️</div>
            <div className="count-details">
              <div className="count-value">{sampleCount.textWords.toLocaleString()}</div>
              <div className="count-label">Words</div>
            </div>
          </div>
        </div>
      </div>

      <div className="style-details">
        <div className="style-column">
          <h4>Coding Style</h4>
          <div className="style-attributes">
            <div className="attribute">
              <span className="attribute-label">Language:</span>
              <span className="attribute-value">{coding.language}</span>
            </div>
            <div className="attribute">
              <span className="attribute-label">Framework:</span>
              <span className="attribute-value">{coding.framework}</span>
            </div>
            <div className="attribute">
              <span className="attribute-label">Component Style:</span>
              <span className="attribute-value">{coding.componentStyle}</span>
            </div>
            <div className="attribute">
              <span className="attribute-label">Naming:</span>
              <span className="attribute-value">{coding.namingConvention}</span>
            </div>
            <div className="attribute">
              <span className="attribute-label">Comments:</span>
              <span className="attribute-value">{coding.commentFrequency}</span>
            </div>
          </div>
          <div className="patterns">
            <span className="patterns-label">Patterns:</span>
            <div className="pattern-tags">
              {coding.patterns.map((pattern, index) => (
                <span key={index} className="pattern-tag">{pattern}</span>
              ))}
            </div>
          </div>
        </div>

        <div className="style-column">
          <h4>Writing Style</h4>
          <div className="style-attributes">
            <div className="attribute">
              <span className="attribute-label">Tone:</span>
              <span className="attribute-value">{writing.tone}</span>
            </div>
            <div className="attribute">
              <span className="attribute-label">Formality:</span>
              <span className="attribute-value">{writing.formality}</span>
            </div>
            <div className="attribute">
              <span className="attribute-label">Sentence Length:</span>
              <span className="attribute-value">{writing.sentenceLength}</span>
            </div>
          </div>
          <div className="patterns">
            <span className="patterns-label">Vocabulary:</span>
            <div className="pattern-tags">
              {writing.vocabulary.map((vocab, index) => (
                <span key={index} className="pattern-tag">{vocab}</span>
              ))}
            </div>
          </div>
          <div className="patterns">
            <span className="patterns-label">Avoids:</span>
            <div className="pattern-tags">
              {writing.avoidance.map((avoid, index) => (
                <span key={index} className="pattern-tag avoid">{avoid}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileSummary;
