/**
 * MirrorInterface Component
 * Black Mirror aesthetic - The Chasm between human and AI
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
    <div className="relative w-full h-screen bg-mirror-black overflow-hidden" style={{ marginTop: '60px', height: 'calc(100vh - 60px)' }}>
      {/* Scanline effect */}
      <div className="scanline" />
      
      {/* System status indicators - top right */}
      <div className="fixed top-20 right-4 flex flex-col gap-2 font-mono text-xs text-static-ghost z-50">
        <div className="flex items-center gap-2">
          <span className="w-1 h-1 bg-system-active rounded-full animate-pulse" />
          <span>SYSTEM_ONLINE</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-1 h-1 bg-unsettling-cyan rounded-full animate-pulse" />
          <span>MIRROR_ACTIVE</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-1 h-1 bg-system-active rounded-full animate-pulse" style={{ animationDelay: '0.5s' }} />
          <span>MONITORING</span>
        </div>
      </div>
      
      {/* Split container */}
      <div className="grid grid-cols-1 md:grid-cols-2 w-full h-full relative">
        <LeftPanel 
          onSubmit={handleSubmit}
          messages={messages}
        />
        
        {/* THE CHASM - Dimensional void between human and AI */}
        <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-32 -translate-x-1/2 pointer-events-none z-10">
          {/* The void gradient */}
          <div className="absolute inset-0 bg-gradient-to-r from-chasm-start via-chasm-mid to-chasm-end opacity-30" />
          
          {/* Vertical scan lines */}
          <div 
            className="absolute inset-0" 
            style={{
              background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0, 217, 255, 0.03) 2px, rgba(0, 217, 255, 0.03) 4px)'
            }}
          />
          
          {/* Center line - barely visible */}
          <div className="absolute left-1/2 top-0 bottom-0 w-px bg-unsettling-cyan opacity-20" />
          
          {/* Pulsing nodes at intervals - data transfer points */}
          <div className="absolute left-1/2 top-1/4 w-1 h-1 -translate-x-1/2 bg-unsettling-cyan rounded-full animate-pulse-slow" />
          <div className="absolute left-1/2 top-1/2 w-1 h-1 -translate-x-1/2 bg-unsettling-cyan rounded-full animate-pulse-slow" style={{ animationDelay: '1s' }} />
          <div className="absolute left-1/2 top-3/4 w-1 h-1 -translate-x-1/2 bg-unsettling-cyan rounded-full animate-pulse-slow" style={{ animationDelay: '2s' }} />
        </div>
        
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
    <div className="relative flex items-start justify-center p-8 md:p-12 overflow-y-auto scrollbar-minimal">
      <div className="w-full max-w-md pt-8">
        {/* Panel header - terminal style */}
        <div className="mb-8">
          <div className="font-mono text-xs text-static-ghost mb-4">
            [TERMINAL_HUMAN.exe]
          </div>
          <h1 className="text-3xl font-display font-bold text-static-white mb-2 tracking-tight">
            Human
          </h1>
          <p className="text-xs text-static-muted font-mono">
            &gt; Speak into the void...
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
    <div className="relative flex items-start justify-center p-8 md:p-12 overflow-y-auto scrollbar-minimal">
      <div className="w-full max-w-md pt-8">
        {/* Panel header - terminal style */}
        <div className="mb-8">
          <div className="font-mono text-xs text-static-ghost mb-4">
            [TERMINAL_AI.exe]
          </div>
          <h1 className="text-3xl font-display font-bold text-static-white mb-2 tracking-tight">
            Doppelgänger
          </h1>
          <p className="text-xs text-static-muted font-mono">
            &gt; ...the void speaks back
          </p>
        </div>
        
        <ResponseArea 
          content={response?.content}
          contentType={response?.contentType}
          language={response?.language}
          isLoading={isGenerating}
        />
        
        <div className="font-mono text-xs text-static-ghost text-center mt-6 animate-pulse-slow">
          [ SYSTEM: MIRROR_INITIALIZED ]
        </div>
        
        <MessageHistory messages={messages} role="ai" onExport={onExport} />
      </div>
    </div>
  );
};

export default MirrorInterface;
