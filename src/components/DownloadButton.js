import './DownloadButton.css';

const DownloadButton = ({ content, contentType = 'text', format = 'markdown' }) => {
  const detectLanguage = (content) => {
    // Simple language detection based on content patterns
    if (!content) return 'txt';
    
    // Check for common code patterns
    if (content.includes('import React') || content.includes('export default')) return 'jsx';
    if (content.includes('function') && content.includes('{') && content.includes('}')) return 'js';
    if (content.includes('def ') && content.includes(':')) return 'py';
    if (content.includes('public class') || content.includes('private ')) return 'java';
    if (content.includes('const ') || content.includes('let ') || content.includes('var ')) return 'js';
    if (content.includes('<html') || content.includes('<!DOCTYPE')) return 'html';
    if (content.includes('<?php')) return 'php';
    
    return 'txt';
  };

  const getFileExtension = () => {
    if (contentType === 'code') {
      return detectLanguage(content);
    }
    
    // For text content, use the selected format
    return format === 'markdown' ? 'md' : 'txt';
  };

  const generateFileName = () => {
    const timestamp = new Date().toISOString().slice(0, 10);
    const extension = getFileExtension();
    
    if (contentType === 'code') {
      return `digitalme-code-${timestamp}.${extension}`;
    }
    
    return `digitalme-export-${timestamp}.${extension}`;
  };

  const handleDownload = () => {
    if (!content) return;

    const fileName = generateFileName();
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    
    // Cleanup
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <button 
      className="download-button action-button"
      onClick={handleDownload}
      disabled={!content}
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
          d="M8 2V10M8 10L11 7M8 10L5 7M2 11V13C2 13.5523 2.44772 14 3 14H13C13.5523 14 14 13.5523 14 13V11" 
          stroke="currentColor" 
          strokeWidth="1.5" 
          strokeLinecap="round" 
          strokeLinejoin="round"
        />
      </svg>
      Download
    </button>
  );
};

export default DownloadButton;
