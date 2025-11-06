import { useState } from 'react';
import InputArea from './InputArea';
import ResponseArea from './ResponseArea';
import MessageHistory from './MessageHistory';
import { generateId } from '../models';
import './MirrorInterface.css';

const MirrorInterface = ({ styleProfile, conversationHistory = [], onSubmit }) => {
  const [messages, setMessages] = useState(conversationHistory);
  const [currentResponse, setCurrentResponse] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleSubmit = (input) => {
    // Add user message
    const userMessage = {
      id: generateId(),
      userId: 'user-1',
      role: 'user',
      content: input,
      contentType: 'text',
      language: null,
      timestamp: Date.now(),
      feedback: null
    };
    
    setMessages(prev => [...prev, userMessage]);
    setIsGenerating(true);
    setCurrentResponse(null);
    
    // Simulate AI generation
    setTimeout(() => {
      const aiMessage = {
        id: generateId(),
        userId: 'user-1',
        role: 'ai',
        content: `Echo: ${input}`,
        contentType: 'text',
        language: null,
        timestamp: Date.now(),
        feedback: null
      };
      
      setMessages(prev => [...prev, aiMessage]);
      setCurrentResponse({
        content: aiMessage.content,
        contentType: aiMessage.contentType,
        language: aiMessage.language
      });
      setIsGenerating(false);
    }, 1500);
    
    if (onSubmit) {
      onSubmit(input);
    }
  };

  return (
    <div className="mirror-interface">
      <div className="mirror-split-container">
        <LeftPanel 
          onSubmit={handleSubmit}
          messages={messages}
        />
        <RightPanel 
          response={currentResponse}
          isGenerating={isGenerating}
          messages={messages}
        />
      </div>
    </div>
  );
};

const LeftPanel = ({ onSubmit, messages }) => {
  return (
    <div className="mirror-panel left-panel">
      <div className="panel-content">
        <h1 className="panel-title">Human</h1>
        <p className="panel-subtitle">Speak into the void...</p>
        <InputArea onSubmit={onSubmit} />
        <MessageHistory messages={messages} role="user" />
      </div>
    </div>
  );
};

const RightPanel = ({ response, isGenerating, messages }) => {
  return (
    <div className="mirror-panel right-panel">
      <div className="panel-content">
        <h1 className="panel-title glitch-effect" data-text="Doppelgänger">
          Doppelgänger
        </h1>
        <p className="panel-subtitle">...the void speaks back</p>
        <ResponseArea 
          content={response?.content}
          contentType={response?.contentType}
          language={response?.language}
          isLoading={isGenerating}
        />
        <div className="system-status">
          [ SYSTEM: Mirror initialized ]
        </div>
        <MessageHistory messages={messages} role="ai" />
      </div>
    </div>
  );
};

export default MirrorInterface;
