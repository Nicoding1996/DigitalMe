/**
 * ProfileSummary Component
 * Black Mirror aesthetic - System Profile Data Display
 */
const ProfileSummary = ({ styleProfile }) => {
  if (!styleProfile) {
    return (
      <div className="p-6 border border-static-whisper bg-void-surface text-center">
        <p className="font-mono text-xs text-static-ghost">[NO_PROFILE_DATA_AVAILABLE]</p>
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
    <div className="space-y-6">
      {/* Metrics */}
      <div className="grid grid-cols-2 gap-4">
        <div className="border border-static-whisper bg-void-surface p-4">
          <div className="font-mono text-xs text-static-ghost mb-2">CONFIDENCE_SCORE</div>
          <div className="font-mono text-3xl text-unsettling-cyan mb-2">
            {(confidence * 100).toFixed(0)}%
          </div>
          <div className="h-1 bg-void-elevated">
            <div 
              className="h-full bg-unsettling-cyan"
              style={{ width: `${confidence * 100}%` }}
            />
          </div>
        </div>

        <div className="border border-static-whisper bg-void-surface p-4">
          <div className="font-mono text-xs text-static-ghost mb-2">PROFILE_COMPLETENESS</div>
          <div className="font-mono text-3xl text-system-active mb-2">
            {completeness}%
          </div>
          <div className="h-1 bg-void-elevated">
            <div 
              className="h-full bg-system-active"
              style={{ width: `${completeness}%` }}
            />
          </div>
        </div>
      </div>

      {/* Analyzed Content */}
      <div className="border border-static-whisper bg-void-surface">
        <div className="px-4 py-2 bg-void-elevated border-b border-static-whisper font-mono text-xs text-static-ghost">
          [ANALYZED_CONTENT]
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-y divide-static-whisper">
          <div className="p-4">
            <div className="font-mono text-xs text-static-ghost mb-1">📦 Repositories</div>
            <div className="font-mono text-xl text-static-white">{sampleCount.repositories}</div>
          </div>
          <div className="p-4">
            <div className="font-mono text-xs text-static-ghost mb-1">💻 Lines of Code</div>
            <div className="font-mono text-xl text-static-white">{sampleCount.codeLines.toLocaleString()}</div>
          </div>
          <div className="p-4">
            <div className="font-mono text-xs text-static-ghost mb-1">📝 Articles</div>
            <div className="font-mono text-xl text-static-white">{sampleCount.articles}</div>
          </div>
          <div className="p-4">
            <div className="font-mono text-xs text-static-ghost mb-1">✍️ Words</div>
            <div className="font-mono text-xl text-static-white">{sampleCount.textWords.toLocaleString()}</div>
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
    </div>
  );
};

export default ProfileSummary;
