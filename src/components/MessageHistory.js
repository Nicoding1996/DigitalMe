/**
 * MessageHistory Component
 * Black Mirror aesthetic - Evidence Log / Surveillance Transcript
 */
import { useEffect, useRef, useState } from 'react';

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
      {/* Log file header */}
      <div className="flex items-center justify-between mb-6 font-mono text-xs">
        <span className="text-static-ghost">
          [LOG_FILE: {role === 'user' ? 'USER_TRANSCRIPT' : 'AI_TRANSCRIPT'}.txt]
        </span>
        <span className="text-static-ghost">
          [ENTRIES: {roleMessages.length}]
        </span>
      </div>
      
      {/* Log entries */}
      <div className="flex flex-col gap-0 max-h-[500px] overflow-y-auto scrollbar-minimal font-mono text-xs">
        {roleMessages.map((message, index) => (
          <LogEntry 
            key={message.id} 
            message={message} 
            index={index}
            onExport={onExport}
          />
        ))}
        <div ref={historyEndRef} />
      </div>
    </div>
  );
};

const LogEntry = ({ message, index, onExport }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const isCode = message.contentType === 'code';
  const showExport = message.role === 'ai' && onExport;
  
  const handleExport = () => {
    if (onExport) {
      onExport(message.content, message.contentType);
    }
  };
  
  // Truncate content for preview
  const preview = message.content.length > 80 
    ? message.content.substring(0, 80) + '...'
    : message.content;
  
  return (
    <div className="group hover:bg-void-elevated transition-colors duration-200">
      {/* Entry header - log line */}
      <div 
        className="flex items-center gap-4 py-2 px-3 border-l-2 border-static-whisper group-hover:border-unsettling-cyan cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <span className="text-static-ghost w-16">
          [{index.toString().padStart(3, '0')}]
        </span>
        <span className="text-unsettling-cyan w-20">
          {formatTime(message.timestamp)}
        </span>
        <span className="text-static-muted w-12">
          {message.role === 'user' ? 'USER' : 'AI'}
        </span>
        <span className="text-static-white flex-1 truncate">
          {preview}
        </span>
        {showExport && (
          <button 
            className="opacity-0 group-hover:opacity-100 px-2 py-0.5 text-xs border border-static-whisper text-static-muted hover:border-unsettling-cyan hover:text-unsettling-cyan transition-all"
            onClick={(e) => {
              e.stopPropagation();
              handleExport();
            }}
            title="Export entry"
          >
            ↗
          </button>
        )}
      </div>
      
      {/* Expanded content */}
      {isExpanded && (
        <div className="px-3 py-3 bg-void-surface border-l-2 border-unsettling-cyan text-static-white text-xs leading-relaxed">
          {isCode ? (
            <pre className="p-3 bg-mirror-black border border-static-whisper overflow-x-auto">
              <code className="text-static-white">{message.content}</code>
            </pre>
          ) : (
            <div className="whitespace-pre-wrap break-words">
              {message.content}
            </div>
          )}
        </div>
      )}
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

export default MessageHistory;
