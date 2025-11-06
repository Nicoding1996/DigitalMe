import { useState, useEffect } from 'react';
import LoadingIndicator from './LoadingIndicator';
import GlitchEffect from './GlitchEffect';
import './ResponseArea.css';

const ResponseArea = ({ content, contentType = 'text', language = null, isLoading = false, glitchIntensity = 'medium' }) => {
  const [triggerGlitch, setTriggerGlitch] = useState(false);
  const [prevContent, setPrevContent] = useState(null);

  useEffect(() => {
    if (content && content !== prevContent) {
      setTriggerGlitch(true);
      setPrevContent(content);
      
      // Reset trigger after animation
      const timer = setTimeout(() => {
        setTriggerGlitch(false);
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [content, prevContent]);

  if (isLoading) {
    return (
      <div className="response-area">
        <LoadingIndicator />
      </div>
    );
  }

  if (!content) {
    return (
      <div className="response-area">
        <p className="response-placeholder">Your reflection awaits...</p>
      </div>
    );
  }

  return (
    <div className="response-area">
      <GlitchEffect intensity={glitchIntensity} trigger={triggerGlitch}>
        {contentType === 'code' ? (
          <CodeBlock code={content} language={language} />
        ) : (
          <p className="response-text">{content}</p>
        )}
      </GlitchEffect>
    </div>
  );
};

const CodeBlock = ({ code, language }) => {
  return (
    <div className="code-block">
      {language && (
        <div className="code-header">
          <span className="code-language">{language}</span>
        </div>
      )}
      <pre className="code-pre">
        <code className="code-content">{code}</code>
      </pre>
    </div>
  );
};

export default ResponseArea;
