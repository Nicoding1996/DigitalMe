/**
 * CopyButton Component
 * Black Mirror aesthetic - Copy to clipboard
 */
import { useState } from 'react';

const CopyButton = ({ content, onCopySuccess }) => {
  const [copyStatus, setCopyStatus] = useState('idle');

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopyStatus('success');
      
      if (onCopySuccess) {
        onCopySuccess();
      }

      setTimeout(() => {
        setCopyStatus('idle');
      }, 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
      setCopyStatus('error');

      setTimeout(() => {
        setCopyStatus('idle');
      }, 2000);
    }
  };

  return (
    <button 
      className="px-6 py-2 bg-void-surface border border-static-whisper text-static-white font-mono text-xs hover:border-unsettling-cyan hover:text-unsettling-cyan transition-all disabled:opacity-30 disabled:cursor-not-allowed"
      onClick={handleCopy}
      disabled={!content || copyStatus !== 'idle'}
    >
      {copyStatus === 'success' ? '[COPIED]' : copyStatus === 'error' ? '[ERROR]' : '[COPY]'}
    </button>
  );
};

export default CopyButton;
