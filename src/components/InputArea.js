/**
 * InputArea Component
 * Black Mirror aesthetic - Minimal message input
 */
import { useState } from 'react';

const MAX_INPUT_LENGTH = 5000;

const InputArea = ({ onSubmit }) => {
  const [input, setInput] = useState('');
  const [error, setError] = useState('');

  const handleInputChange = (e) => {
    const value = e.target.value;
    
    if (value.length > MAX_INPUT_LENGTH) {
      setError(`Input exceeds maximum length of ${MAX_INPUT_LENGTH} characters`);
      return;
    }
    
    setInput(value);
    setError('');
  };

  const handleSubmit = () => {
    const trimmedInput = input.trim();
    
    if (!trimmedInput) {
      setError('Please enter a message');
      return;
    }
    
    if (trimmedInput.length > MAX_INPUT_LENGTH) {
      setError(`Input exceeds maximum length of ${MAX_INPUT_LENGTH} characters`);
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
    <div className="mb-6">
      <textarea
        className={`input-field min-h-[160px] resize-none ${error ? 'border-glitch-red' : ''}`}
        placeholder="Type your message..."
        value={input}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        rows={6}
      />
      
      {error && (
        <div className="text-glitch-red text-xs font-mono mt-2">{error}</div>
      )}
      
      <div className="flex items-center justify-between mt-3">
        <p className="text-xs text-static-ghost font-mono">
          CTRL+ENTER TO SEND
          {isNearLimit && (
            <span className={`ml-2 ${characterCount >= MAX_INPUT_LENGTH ? 'text-glitch-red' : 'text-warning-amber'}`}>
              • {characterCount}/{MAX_INPUT_LENGTH}
            </span>
          )}
        </p>
        
        <button 
          className="btn-primary px-6 py-2 text-sm disabled:opacity-40 disabled:cursor-not-allowed group"
          onClick={handleSubmit}
          disabled={!input.trim() || !!error}
        >
          <span className="flex items-center gap-2">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
            </svg>
            SEND
          </span>
        </button>
      </div>
    </div>
  );
};

export default InputArea;
