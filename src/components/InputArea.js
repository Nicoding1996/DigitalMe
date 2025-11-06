import { useState } from 'react';
import './InputArea.css';

const InputArea = ({ onSubmit }) => {
  const [input, setInput] = useState('');

  const handleSubmit = () => {
    if (input.trim()) {
      onSubmit(input);
      setInput('');
    }
  };

  const handleKeyDown = (e) => {
    // Submit on Ctrl+Enter or Cmd+Enter
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="input-area">
      <textarea
        className="input-textarea"
        placeholder="Type your message..."
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        rows={6}
      />
      <button 
        className="submit-button" 
        onClick={handleSubmit}
        disabled={!input.trim()}
      >
        <svg className="submit-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
        </svg>
        Send
      </button>
      <p className="input-hint">Press Ctrl+Enter to send</p>
    </div>
  );
};

export default InputArea;
