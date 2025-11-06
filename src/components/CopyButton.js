import { useState } from 'react';
import './CopyButton.css';

const CopyButton = ({ content, onCopySuccess }) => {
  const [showToast, setShowToast] = useState(false);
  const [copyStatus, setCopyStatus] = useState('idle'); // idle, success, error

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopyStatus('success');
      setShowToast(true);
      
      if (onCopySuccess) {
        onCopySuccess();
      }

      // Hide toast after 2 seconds
      setTimeout(() => {
        setShowToast(false);
        setCopyStatus('idle');
      }, 2000);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      setCopyStatus('error');
      setShowToast(true);

      // Hide toast after 2 seconds
      setTimeout(() => {
        setShowToast(false);
        setCopyStatus('idle');
      }, 2000);
    }
  };

  return (
    <>
      <button 
        className="copy-button action-button"
        onClick={handleCopy}
        disabled={!content || copyStatus !== 'idle'}
      >
        <svg 
          className="button-icon" 
          width="16" 
          height="16" 
          viewBox="0 0 16 16" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
        >
          <path 
            d="M5.5 2.5H2.5C2.22386 2.5 2 2.72386 2 3V13C2 13.2761 2.22386 13.5 2.5 13.5H10.5C10.7761 13.5 11 13.2761 11 13V10M8 2.5H13.5C13.7761 2.5 14 2.72386 14 3V8.5M8 2.5V6.5C8 6.77614 8.22386 7 8.5 7H12.5M8 2.5H8.5L12.5 6.5V7" 
            stroke="currentColor" 
            strokeWidth="1.5" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          />
        </svg>
        Copy to Clipboard
      </button>

      {showToast && (
        <div className={`toast ${copyStatus}`}>
          {copyStatus === 'success' ? (
            <>
              <svg 
                className="toast-icon" 
                width="16" 
                height="16" 
                viewBox="0 0 16 16" 
                fill="none" 
                xmlns="http://www.w3.org/2000/svg"
              >
                <path 
                  d="M13.5 4L6 11.5L2.5 8" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                />
              </svg>
              Copied to clipboard!
            </>
          ) : (
            <>
              <svg 
                className="toast-icon" 
                width="16" 
                height="16" 
                viewBox="0 0 16 16" 
                fill="none" 
                xmlns="http://www.w3.org/2000/svg"
              >
                <path 
                  d="M8 4V8M8 10.5V11M14 8C14 11.3137 11.3137 14 8 14C4.68629 14 2 11.3137 2 8C2 4.68629 4.68629 2 8 2C11.3137 2 14 4.68629 14 8Z" 
                  stroke="currentColor" 
                  strokeWidth="1.5" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                />
              </svg>
              Failed to copy
            </>
          )}
        </div>
      )}
    </>
  );
};

export default CopyButton;
