/**
 * MessageHistory Component
 * Black Mirror aesthetic - Conversation history display
 */
import { useEffect, useRef } from 'react';

const MessageHistory = ({ messages = [], role = 'user', onExport }) => {
  const historyEndRef = useRef(null);

  useEffect(() => {
    if (historyEndRef.current) {
      historyEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  if (messages.length === 0) {
    return null;
  }

  const roleMessages = messages.filter(msg => msg.role === role);

  return (
    <div className="w-full mt-12 pt-8 border-t border-static-whisper">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <span className="system-text">HISTORY</span>
        <span className="px-3 py-1 bg-unsettling-blue bg-opacity-10 border border-unsettling-blue text-unsettling-blue text-xs font-mono rounded-full">
          {roleMessages.length}
        </span>
      </div>
      
      {/* Messages */}
      <div className="flex flex-col gap-4 max-h-[500px] overflow-y-auto pr-2">
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
  
  const borderColor = message.role === 'user' ? 'border-l-unsettling-blue' : 'border-l-glitch-red';
  
  return (
    <div className={`glass-panel p-4 border-l-2 ${borderColor} transition-all duration-300 hover:bg-overlay-medium`}>
      {/* Meta */}
      <div className="flex items-center gap-3 mb-3">
        <span className={`system-text text-xs ${message.role === 'user' ? 'text-unsettling-blue' : 'text-glitch-red'}`}>
          {message.role === 'user' ? 'YOU' : 'AI'}
        </span>
        <span className="text-xs font-mono text-static-ghost ml-auto">
          {formatTime(message.timestamp)}
        </span>
        {showExport && (
          <button 
            className="px-2 py-1 text-xs border border-static-whisper text-static-muted hover:border-unsettling-blue hover:text-unsettling-blue transition-all duration-200"
            onClick={handleExport}
            aria-label="Export this message"
            title="Export this message"
          >
            ↗
          </button>
        )}
      </div>
      
      {/* Content */}
      <div className="text-sm leading-relaxed">
        {isCode ? (
          <pre className="p-3 bg-void-surface border border-static-whisper overflow-x-auto">
            <code className="text-static-white text-xs font-mono">{message.content}</code>
          </pre>
        ) : (
          <p className="text-static-white whitespace-pre-wrap break-words m-0">
            {message.content}
          </p>
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
