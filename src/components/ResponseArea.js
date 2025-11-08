/**
 * ResponseArea Component
 * Black Mirror aesthetic - AI response display
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
      <div className="glass-panel p-6 mb-6 min-h-[160px] flex items-center justify-center">
        <LoadingIndicator />
      </div>
    );
  }

  if (!content) {
    return (
      <div className="glass-panel p-6 mb-6 min-h-[160px] flex items-center justify-center">
        <p className="text-static-ghost text-sm italic">Your reflection awaits...</p>
      </div>
    );
  }

  return (
    <div className="glass-panel p-6 mb-6 min-h-[160px]">
      <GlitchEffect intensity={glitchIntensity} trigger={triggerGlitch}>
        {contentType === 'code' ? (
          <CodeBlock code={content} language={language} />
        ) : (
          <p className="text-static-white text-sm leading-relaxed whitespace-pre-wrap">
            {content}
          </p>
        )}
      </GlitchEffect>
    </div>
  );
};

const CodeBlock = ({ code, language }) => {
  return (
    <div className="bg-void-surface border border-static-whisper overflow-hidden">
      {language && (
        <div className="px-4 py-2 bg-void-elevated border-b border-static-whisper">
          <span className="system-text text-unsettling-blue">{language}</span>
        </div>
      )}
      <pre className="p-4 overflow-x-auto">
        <code className="text-static-white text-xs font-mono leading-relaxed">
          {code}
        </code>
      </pre>
    </div>
  );
};

export default ResponseArea;
