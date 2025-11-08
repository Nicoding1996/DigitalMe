/**
 * DownloadButton Component
 * Black Mirror aesthetic - Download file
 */
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
      className="px-6 py-2 bg-void-surface border border-static-whisper text-static-white font-mono text-xs hover:border-unsettling-cyan hover:text-unsettling-cyan transition-all disabled:opacity-30 disabled:cursor-not-allowed"
      onClick={handleDownload}
      disabled={!content}
    >
      [DOWNLOAD]
    </button>
  );
};

export default DownloadButton;
