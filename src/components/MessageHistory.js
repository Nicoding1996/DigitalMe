import { useEffect, useRef } from 'react';
import './MessageHistory.css';

const MessageHistory = ({ messages = [], role = 'user', onExport }) => {
  const historyEndRef = useRef(null);

  useEffect(() => {
    // Auto-scroll to latest message
    if (historyEndRef.current) {
      historyEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  if (messages.length === 0) {
    return null;
  }

  // Filter messages by role
  const roleMessages = messages.filter(msg => msg.role === role);

  return (
    <div className="message-history">
      <div className="history-header">
        <span className="history-title">History</span>
        <span className="history-count">{roleMessages.length}</span>
      </div>
      <div className="history-messages">
        {roleMessages.map((message) => (
          <MessageItem key={message.id} message={message} onExport={onExport} />
        ))}
        <div ref={historyEndRef} />
      </div>
    </div>
  );
};

const MessageItem = ({ message, onExport }) => {
  const isCode = message.contentType === 'code';
  const showExport = message.role === 'ai' && onExport;
  
  const handleExport = () => {
    if (onExport) {
      onExport(message.content, message.contentType);
    }
  };
  
  return (
    <div className={`message-item ${message.role}-message`}>
      <div className="message-meta">
        <span className="message-role">{message.role === 'user' ? 'YOU' : 'AI'}</span>
        <span className="message-time">{formatTime(message.timestamp)}</span>
        {showExport && (
          <button 
            className="export-button" 
            onClick={handleExport}
            aria-label="Export this message"
            title="Export this message"
          >
            ↗
          </button>
        )}
      </div>
      <div className={`message-content ${isCode ? 'code-content' : 'text-content'}`}>
        {isCode ? (
          <pre className="message-code">
            <code>{message.content}</code>
          </pre>
        ) : (
          <p className="message-text">{message.content}</p>
        )}
      </div>
    </div>
  );
};

const formatTime = (timestamp) => {
  const date = new Date(timestamp);
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
};

export default MessageHistory;
