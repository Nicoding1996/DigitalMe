/**
 * ResponseArea Component
 * Black Mirror aesthetic - Data Transmission Display
 */
import { useState, useEffect } from 'react';
import LoadingIndicator from './LoadingIndicator';
import GlitchEffect from './GlitchEffect';

const ResponseArea = ({ content, contentType = 'text', language = null, isLoading = false, glitchIntensity = 'medium' }) => {
  const [triggerGlitch, setTriggerGlitch] = useState(false);
  const [prevContent, setPrevContent] = useState(null);

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
        
        {/* Loading content */}
        <div className="p-6 min-h-[160px] flex items-center justify-center">
          <LoadingIndicator />
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
      </div>
      
      {/* Content */}
      <div className="p-4 font-mono text-sm text-static-white leading-relaxed min-h-[160px]">
        <GlitchEffect intensity={glitchIntensity} trigger={triggerGlitch}>
          {contentType === 'code' ? (
            <CodeBlock code={content} language={language} />
          ) : (
            <div className="whitespace-pre-wrap break-words">
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
        <code className="text-static-white text-xs font-mono leading-relaxed">
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
