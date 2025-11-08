/**
 * MirrorInterface Component
 * Black Mirror aesthetic - Split-screen human-AI duality
 */
import { useState, useEffect } from 'react';
import InputArea from './InputArea';
import ResponseArea from './ResponseArea';
import MessageHistory from './MessageHistory';
import { generateId } from '../models';
import { generateContent } from '../services/ContentGenerator';

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
    <div className="relative w-full h-screen bg-void-deep overflow-hidden" style={{ marginTop: '60px', height: 'calc(100vh - 60px)' }}>
      {/* Scanline effect */}
      <div className="scanline" />
      
      {/* Split container */}
      <div className="grid grid-cols-1 md:grid-cols-2 w-full h-full relative">
        <LeftPanel 
          onSubmit={handleSubmit}
          messages={messages}
        />
        
        {/* Center divider with glow */}
        <div className="hidden md:block divider-glow left-1/2 -translate-x-1/2" />
        
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
    <div className="relative flex items-start justify-center p-8 md:p-12 overflow-y-auto">
      <div className="w-full max-w-md pt-8">
        <div className="mb-8">
          <h1 className="text-4xl font-display font-bold text-static-white mb-2 tracking-tight">
            Human
          </h1>
          <p className="text-sm text-static-muted italic">
            Speak into the void...
          </p>
        </div>
        
        <InputArea onSubmit={onSubmit} />
        
        <MessageHistory messages={messages} role="user" />
      </div>
    </div>
  );
};

const RightPanel = ({ response, isGenerating, messages, onExport }) => {
  return (
    <div className="relative flex items-start justify-center p-8 md:p-12 overflow-y-auto">
      <div className="w-full max-w-md pt-8">
        <div className="mb-8">
          <h1 className="text-4xl font-display font-bold text-static-white mb-2 tracking-tight">
            Doppelgänger
          </h1>
          <p className="text-sm text-static-muted italic">
            ...the void speaks back
          </p>
        </div>
        
        <ResponseArea 
          content={response?.content}
          contentType={response?.contentType}
          language={response?.language}
          isLoading={isGenerating}
        />
        
        <div className="system-text text-static-ghost text-center mt-6 animate-pulse-slow">
          [ SYSTEM: MIRROR INITIALIZED ]
        </div>
        
        <MessageHistory messages={messages} role="ai" onExport={onExport} />
      </div>
    </div>
  );
};

export default MirrorInterface;
