import { useState } from 'react';
import './InputArea.css';

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
    // Submit on Ctrl+Enter or Cmd+Enter
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  };

  const characterCount = input.length;
  const isNearLimit = characterCount > MAX_INPUT_LENGTH * 0.9;

  return (
    <div className="input-area">
      <textarea
        className={`input-textarea ${error ? 'error' : ''}`}
        placeholder="Type your message..."
        value={input}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        rows={6}
      />
      {error && <div className="input-error">{error}</div>}
      <div className="input-footer">
        <p className="input-hint">
          Press Ctrl+Enter to send
          {isNearLimit && (
            <span className={`char-count ${characterCount >= MAX_INPUT_LENGTH ? 'limit-reached' : ''}`}>
              {' '}• {characterCount}/{MAX_INPUT_LENGTH}
            </span>
          )}
        </p>
        <button 
          className="submit-button" 
          onClick={handleSubmit}
          disabled={!input.trim() || !!error}
        >
          <svg className="submit-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
          </svg>
          Send
        </button>
      </div>
    </div>
  );
};

export default InputArea;
