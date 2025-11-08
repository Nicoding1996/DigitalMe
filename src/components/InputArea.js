/**
 * InputArea Component
 * Black Mirror aesthetic - Command Terminal Interface
 */
import { useState } from 'react';

const MAX_INPUT_LENGTH = 5000;

const InputArea = ({ onSubmit }) => {
  const [input, setInput] = useState('');
  const [error, setError] = useState('');

  const handleInputChange = (e) => {
    const value = e.target.value;
    
    if (value.length > MAX_INPUT_LENGTH) {
      setError(`BUFFER_OVERFLOW`);
      return;
    }
    
    setInput(value);
    setError('');
  };

  const handleSubmit = () => {
    const trimmedInput = input.trim();
    
    if (!trimmedInput) {
      setError('EMPTY_INPUT');
      return;
    }
    
    if (trimmedInput.length > MAX_INPUT_LENGTH) {
      setError('BUFFER_OVERFLOW');
      return;
    }
    
    setError('');
    onSubmit(trimmedInput);
    setInput('');
  };

  const handleKeyDown = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  };

  const characterCount = input.length;
  const isNearLimit = characterCount > MAX_INPUT_LENGTH * 0.9;

  return (
    <div className="w-full mb-6 border border-static-whisper bg-void-surface">
      {/* Terminal header */}
      <div className="flex items-center justify-between px-4 py-2 bg-void-elevated border-b border-static-whisper">
        <div className="flex items-center gap-2 font-mono text-xs text-static-muted">
          <span className="w-2 h-2 rounded-full bg-glitch-red" />
          <span className="w-2 h-2 rounded-full bg-system-warning" />
          <span className="w-2 h-2 rounded-full bg-system-active" />
          <span className="ml-4">TERMINAL_INPUT.exe</span>
        </div>
        <span className="font-mono text-xs text-static-ghost">
          [{characterCount}/{MAX_INPUT_LENGTH}]
        </span>
      </div>
      
      {/* Terminal body */}
      <div className="p-4">
        {/* Command prompt */}
        <div className="flex items-start gap-2 font-mono text-sm">
          <span className="text-unsettling-cyan select-none pt-1">&gt;</span>
          <textarea
            className="flex-1 bg-transparent text-static-white font-mono text-sm leading-relaxed resize-none outline-none placeholder:text-static-ghost"
            placeholder="Enter command..."
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            rows={6}
          />
        </div>
      </div>
      
      {/* Terminal footer */}
      <div className="flex items-center justify-between px-4 py-2 bg-void-elevated border-t border-static-whisper font-mono text-xs">
        <span className="text-static-ghost">
          [CTRL+ENTER] EXECUTE
        </span>
        {error && (
          <span className="text-glitch-red">
            [ERROR: {error}]
          </span>
        )}
        {isNearLimit && !error && (
          <span className={characterCount >= MAX_INPUT_LENGTH ? 'text-glitch-red' : 'text-system-warning'}>
            [WARNING: BUFFER_{Math.round((characterCount / MAX_INPUT_LENGTH) * 100)}%]
          </span>
        )}
        <button 
          onClick={handleSubmit}
          disabled={!input.trim() || !!error}
          className="px-4 py-1 bg-void-surface border border-static-whisper text-static-white hover:border-unsettling-cyan hover:text-unsettling-cyan disabled:opacity-30 disabled:cursor-not-allowed transition-all"
        >
          EXECUTE
        </button>
      </div>
    </div>
  );
};

export default InputArea;
