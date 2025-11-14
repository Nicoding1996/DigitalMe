/**
 * MessageHistory Component
 * Black Mirror aesthetic - Evidence Log / Surveillance Transcript
 */
import { useEffect, useRef, useState } from 'react';

const MessageHistory = ({ messages = [], role = 'user', expandedMessageIndex, onToggleExpand }) => {
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
  
  // Group messages by CMD number
  const groupedMessages = roleMessages.reduce((groups, message) => {
    const cmdNumber = message.cmdNumber || 1;
    if (!groups[cmdNumber]) {
      groups[cmdNumber] = [];
    }
    groups[cmdNumber].push(message);
    return groups;
  }, {});
  
  const cmdNumbers = Object.keys(groupedMessages).map(Number).sort((a, b) => a - b);
  const currentCmd = cmdNumbers[cmdNumbers.length - 1];

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
      
      {/* Log entries grouped by CMD */}
      <div className="flex flex-col gap-0 max-h-[500px] overflow-y-auto scrollbar-minimal font-mono text-xs">
        {cmdNumbers.map((cmdNumber, cmdIndex) => (
          <div key={cmdNumber}>
            {/* CMD Transition Divider (show before all CMDs except the first) */}
            {cmdIndex > 0 && <CmdTransition cmdNumber={cmdNumber} />}
            
            {/* Messages for this CMD */}
            <div className={cmdNumber !== currentCmd ? 'opacity-60' : ''}>
              {groupedMessages[cmdNumber].map((message, localIndex) => {
                // Find this message's position in the FULL conversation (all roles)
                const allMessagesInCmd = messages.filter(m => (m.cmdNumber || 1) === cmdNumber);
                const positionInCmd = allMessagesInCmd.findIndex(m => m.id === message.id);
                // Use floor division to pair user+AI messages (0,1 -> 0; 2,3 -> 1; etc)
                const pairIndex = Math.floor(positionInCmd / 2);
                const pairKey = `${cmdNumber}-${pairIndex}`;
                
                return (
                  <LogEntry 
                    key={message.id} 
                    message={message} 
                    pairKey={pairKey}
                    expandedPairKey={expandedMessageIndex}
                    onToggleExpand={onToggleExpand}
                  />
                );
              })}
            </div>
          </div>
        ))}
        <div ref={historyEndRef} />
      </div>
    </div>
  );
};

const CmdTransition = ({ cmdNumber }) => {
  return (
    <div className="relative my-6 flex items-center justify-center">
      {/* Horizontal line */}
      <div className="absolute inset-0 flex items-center">
        <div className="w-full border-t border-neon-green/30" />
      </div>
      {/* CMD label */}
      <div className="relative px-3 bg-void-deep">
        <span className="text-neon-green/50 text-xs font-mono">
          [CMD_{cmdNumber.toString().padStart(2, '0')}]
        </span>
      </div>
    </div>
  );
};

const LogEntry = ({ message, pairKey, expandedPairKey, onToggleExpand }) => {
  const isExpanded = expandedPairKey === pairKey;
  const isCode = message.contentType === 'code';
  
  // Truncate content for preview
  const preview = message.content.length > 80 
    ? message.content.substring(0, 80) + '...'
    : message.content;
  
  // Use cmdNumber from message, fallback to 1 for old messages
  const cmdNumber = message.cmdNumber || 1;
  
  const handleClick = () => {
    // Toggle: if already expanded, collapse; otherwise expand this pair
    onToggleExpand(isExpanded ? null : pairKey);
  };
  
  return (
    <div className="group hover:bg-void-elevated transition-colors duration-200">
      {/* Entry header - log line */}
      <div 
        className="flex items-center gap-4 py-2 px-3 border-l-2 border-static-whisper group-hover:border-unsettling-cyan cursor-pointer"
        onClick={handleClick}
      >
        <span className="text-static-ghost w-16">
          [CMD_{cmdNumber.toString().padStart(2, '0')}]
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
