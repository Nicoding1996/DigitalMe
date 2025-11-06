import React, { useState } from 'react';
import './App.css';

function App() {
  const [humanMessage, setHumanMessage] = useState('');
  const [aiResponse, setAiResponse] = useState('');

  const handleSend = () => {
    if (humanMessage.trim()) {
      // Simulate AI response
      setAiResponse(`Echo: ${humanMessage}`);
    }
  };

  return (
    <div className="app">
      <div className="split-container">
        {/* Left Side - Human */}
        <div className="side left-side">
          <div className="content">
            <h1 className="title">Human</h1>
            <p className="subtitle">Speak into the void...</p>
            
            <textarea
              className="message-input"
              placeholder="Type your message..."
              value={humanMessage}
              onChange={(e) => setHumanMessage(e.target.value)}
            />
            
            <button className="send-button" onClick={handleSend}>
              <svg className="send-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
              </svg>
              Send
            </button>
          </div>
        </div>

        {/* Center Divider with Glow */}
        <div className="divider"></div>

        {/* Right Side - AI */}
        <div className="side right-side">
          <div className="content">
            <h1 className="title glitch" data-text="Doppelgänger">
              Doppelgänger
            </h1>
            <p className="subtitle">...the void speaks back</p>
            
            <div className="response-area">
              {aiResponse ? (
                <p className="response-text">{aiResponse}</p>
              ) : (
                <p className="placeholder-text">Your reflection awaits...</p>
              )}
            </div>
            
            <div className="system-status">
              [ SYSTEM: Mirror initialized ]
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
