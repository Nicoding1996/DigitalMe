/**
 * ResponseArea Component
 * Black Mirror aesthetic - Data Transmission Display
 */
import { useState, useEffect } from 'react';
import LoadingIndicator from './LoadingIndicator';
import GlitchEffect from './GlitchEffect';
import CopyButton from './CopyButton';

const ResponseArea = ({ content, contentType = 'text', language = null, isLoading = false, glitchIntensity = 'medium', streamingText = null }) => {
  const [triggerGlitch, setTriggerGlitch] = useState(false);
  const [prevContent, setPrevContent] = useState(null);
  const [loadingStartTime, setLoadingStartTime] = useState(null);
  const [showStillWorking, setShowStillWorking] = useState(false);

  // Track loading start time for "Still working..." message (Requirement 4.5)
  useEffect(() => {
    if (isLoading) {
      setLoadingStartTime(Date.now());
      setShowStillWorking(false);
    } else {
      setLoadingStartTime(null);
      setShowStillWorking(false);
    }
  }, [isLoading]);

  // Show "Still working..." after 3 seconds (Requirement 4.5)
  useEffect(() => {
    if (!isLoading || !loadingStartTime) return;

    const timer = setTimeout(() => {
      setShowStillWorking(true);
    }, 3000);

    return () => clearTimeout(timer);
  }, [isLoading, loadingStartTime]);

  useEffect(() => {
    if (content && content !== prevContent) {
      setTriggerGlitch(true);
      setPrevContent(content);
      
      const timer = setTimeout(() => {
        setTriggerGlitch(false);
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [content, prevContent]);

  if (isLoading) {
    return (
      <div className="w-full mb-6 border border-static-whisper bg-void-surface">
        {/* Transmission header */}
        <div className="flex items-center gap-3 px-4 py-2 bg-void-elevated border-b border-static-whisper font-mono text-xs">
          <span className="text-static-ghost">[TRANSMISSION_PROCESSING]</span>
          <span className="text-unsettling-cyan animate-pulse">●</span>
        </div>
        
        {/* Loading content with streaming text or "Still working..." message */}
        <div className="p-6 min-h-[160px]">
          {streamingText ? (
            // Display streaming text as it arrives (Requirement 4.2)
            <div className="font-mono text-sm text-static-white leading-relaxed whitespace-pre-wrap break-words" style={{ overflowWrap: 'anywhere' }}>
              {streamingText}
              <span className="inline-block w-2 h-4 bg-unsettling-cyan animate-pulse ml-1" />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center gap-4">
              <LoadingIndicator />
              {/* Show "Still working..." after 3 seconds (Requirement 4.5) */}
              {showStillWorking && (
                <div className="font-mono text-xs text-system-warning animate-pulse">
                  [STILL_WORKING...]
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (!content) {
    return (
      <div className="w-full mb-6 border border-static-whisper bg-void-surface">
        {/* Transmission header */}
        <div className="flex items-center gap-3 px-4 py-2 bg-void-elevated border-b border-static-whisper font-mono text-xs">
          <span className="text-static-ghost">[TRANSMISSION_IDLE]</span>
          <span className="text-static-ghost">○</span>
        </div>
        
        {/* Placeholder content */}
        <div className="p-6 min-h-[160px] flex items-center justify-center">
          <p className="text-static-ghost text-xs font-mono">[DECRYPTING_STREAM...]</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full mb-6 border border-static-whisper bg-void-surface">
      {/* Transmission header */}
      <div className="flex items-center gap-3 px-4 py-2 bg-void-elevated border-b border-static-whisper font-mono text-xs">
        <span className="text-static-ghost">[TRANSMISSION_RECEIVED]</span>
        <span className="text-unsettling-cyan animate-pulse">●</span>
        <span className="text-static-ghost ml-auto">{formatTime(Date.now())}</span>
        <CopyButton content={content} compact={true} />
      </div>
      
      {/* Content */}
      <div className="p-4 font-mono text-sm text-static-white leading-relaxed min-h-[160px]">
        <GlitchEffect intensity={glitchIntensity} trigger={triggerGlitch} autoGlitch={true}>
          {contentType === 'code' ? (
            <CodeBlock code={content} language={language} />
          ) : (
            <div className="whitespace-pre-wrap break-words" style={{ overflowWrap: 'anywhere' }}>
              {content}
            </div>
          )}
        </GlitchEffect>
      </div>
    </div>
  );
};

const CodeBlock = ({ code, language }) => {
  return (
    <div className="bg-mirror-black border border-static-whisper overflow-hidden">
      {language && (
        <div className="px-4 py-2 bg-void-elevated border-b border-static-whisper">
          <span className="font-mono text-xs text-unsettling-cyan">[LANG: {language.toUpperCase()}]</span>
        </div>
      )}
      <pre className="p-4 overflow-x-auto scrollbar-minimal">
        <code className="text-static-white text-xs font-mono leading-relaxed whitespace-pre">
          {code}
        </code>
      </pre>
    </div>
  );
};

const formatTime = (timestamp) => {
  const date = new Date(timestamp);
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const seconds = date.getSeconds().toString().padStart(2, '0');
  return `${hours}:${minutes}:${seconds}`;
};

export default ResponseArea;
