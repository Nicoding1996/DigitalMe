import { useState, useEffect } from 'react';
import InputArea from './InputArea';
import ResponseArea from './ResponseArea';
import MessageHistory from './MessageHistory';
import { generateId } from '../models';
import { generateContent } from '../services/ContentGenerator';
import './MirrorInterface.css';

const MirrorInterface = ({ styleProfile, conversationHistory = [], onSubmit, onExport, onConversationUpdate }) => {
  const [messages, setMessages] = useState(conversationHistory);
  const [currentResponse, setCurrentResponse] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Sync messages with conversationHistory prop (e.g., when history is cleared)
  useEffect(() => {
    setMessages(conversationHistory);
  }, [conversationHistory]);

  const updateMessages = (newMessages) => {
    setMessages(newMessages);
    if (onConversationUpdate) {
      onConversationUpdate(newMessages);
    }
  };

  const handleSubmit = async (input) => {
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
    
    const messagesWithUser = [...messages, userMessage];
    updateMessages(messagesWithUser);
    setIsGenerating(true);
    setCurrentResponse(null);
    
    // Generate AI response using ContentGenerator service
    try {
      const result = await generateContent(input, styleProfile, messages);
      
      if (result.success) {
        const aiMessage = {
          id: generateId(),
          userId: 'user-1',
          role: 'ai',
          content: result.content,
          contentType: result.contentType,
          language: result.language,
          timestamp: Date.now(),
          feedback: null
        };
        
        const messagesWithAI = [...messagesWithUser, aiMessage];
        updateMessages(messagesWithAI);
        setCurrentResponse({
          content: aiMessage.content,
          contentType: aiMessage.contentType,
          language: aiMessage.language
        });
      } else {
        // Handle generation error
        const errorMessage = {
          id: generateId(),
          userId: 'user-1',
          role: 'ai',
          content: `Error: ${result.error.message}`,
          contentType: 'text',
          language: null,
          timestamp: Date.now(),
          feedback: null
        };
        
        const messagesWithError = [...messagesWithUser, errorMessage];
        updateMessages(messagesWithError);
        setCurrentResponse({
          content: errorMessage.content,
          contentType: errorMessage.contentType,
          language: errorMessage.language
        });
      }
    } catch (error) {
      console.error('Generation failed:', error);
      
      const errorMessage = {
        id: generateId(),
        userId: 'user-1',
        role: 'ai',
        content: 'An unexpected error occurred. Please try again.',
        contentType: 'text',
        language: null,
        timestamp: Date.now(),
        feedback: null
      };
      
      const messagesWithError = [...messagesWithUser, errorMessage];
      updateMessages(messagesWithError);
      setCurrentResponse({
        content: errorMessage.content,
        contentType: errorMessage.contentType,
        language: errorMessage.language
      });
    } finally {
      setIsGenerating(false);
    }
    
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
          onExport={onExport}
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

const RightPanel = ({ response, isGenerating, messages, onExport }) => {
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
        <MessageHistory messages={messages} role="ai" onExport={onExport} />
      </div>
    </div>
  );
};

export default MirrorInterface;
