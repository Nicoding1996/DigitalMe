/**
 * MirrorInterface Component
 * Black Mirror aesthetic - The Chasm between human and AI
 */
import { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import InputArea from './InputArea';
import ResponseArea from './ResponseArea';
import MessageHistory from './MessageHistory';
import GlitchEffect from './GlitchEffect';
import { generateId } from '../models';
import { generateContent } from '../services/ContentGenerator';
import MessageCollector from '../services/MessageCollector';
import ProfileRefinerClient from '../services/ProfileRefinerClient';

const MirrorInterface = forwardRef(({ styleProfile, conversationHistory = [], preferences, cmdNumber = 1, onSubmit, onConversationUpdate, onProfileUpdate, onCmdNumberUpdate }, ref) => {
  const [messages, setMessages] = useState(conversationHistory);
  const [currentResponse, setCurrentResponse] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentCmdNumber, setCurrentCmdNumber] = useState(cmdNumber);
  const [expandedPairKey, setExpandedPairKey] = useState(null);
  const [streamingText, setStreamingText] = useState(null); // For streaming display (Requirement 4.2)
  
  // Initialize MessageCollector and ProfileRefinerClient
  const messageCollectorRef = useRef(null);
  const profileRefinerClientRef = useRef(null);
  const inputAreaRef = useRef(null);
  
  // Expose focus method to parent via ref (Requirement 7.4)
  useImperativeHandle(ref, () => ({
    focusInput: () => {
      if (inputAreaRef.current) {
        inputAreaRef.current.focus();
      }
    }
  }));
  
  // Initialize services on mount
  useEffect(() => {
    // Get learning toggle state from localStorage (default: true)
    const learningEnabled = localStorage.getItem('learningEnabled') !== 'false';
    
    // Initialize MessageCollector
    messageCollectorRef.current = new MessageCollector(learningEnabled);
    
    // Initialize ProfileRefinerClient
    profileRefinerClientRef.current = new ProfileRefinerClient();
    
    console.log('Living Profile services initialized:', { learningEnabled });
  }, []);

  // Listen for learning toggle changes (Requirement 2.2, 2.3, 2.4)
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'learningEnabled' && messageCollectorRef.current) {
        const newValue = e.newValue !== 'false';
        console.log('Learning toggle changed via storage event:', newValue);
        messageCollectorRef.current.setLearningEnabled(newValue);
      }
    };

    // Listen for storage events (changes from other tabs/windows)
    window.addEventListener('storage', handleStorageChange);

    // Also check for changes periodically (for same-tab changes)
    const checkInterval = setInterval(() => {
      if (messageCollectorRef.current) {
        const currentEnabled = messageCollectorRef.current.isLearningEnabled();
        const storedEnabled = localStorage.getItem('learningEnabled') !== 'false';
        
        if (currentEnabled !== storedEnabled) {
          console.log('Learning toggle changed (same tab):', storedEnabled);
          messageCollectorRef.current.setLearningEnabled(storedEnabled);
        }
      }
    }, 1000); // Check every second

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(checkInterval);
    };
  }, []);

  // Periodic check for inactivity-based batch sending (Requirement 1.4)
  useEffect(() => {
    const checkInterval = setInterval(() => {
      if (messageCollectorRef.current && messageCollectorRef.current.shouldSendBatch()) {
        console.log('Inactivity threshold reached, sending batch');
        handleProfileRefinement();
      }
    }, 60000); // Check every minute

    return () => clearInterval(checkInterval);
  }, [styleProfile]); // Re-create interval if styleProfile changes

  // Sync messages with conversationHistory prop (e.g., when history is cleared)
  useEffect(() => {
    setMessages(conversationHistory);
  }, [conversationHistory]);

  // Sync currentCmdNumber with cmdNumber prop (Requirement 5.1)
  useEffect(() => {
    setCurrentCmdNumber(cmdNumber);
  }, [cmdNumber]);

  // Keyboard shortcut: Ctrl+N for new CMD
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        handleNewCmd();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const updateMessages = (newMessages) => {
    setMessages(newMessages);
    if (onConversationUpdate) {
      onConversationUpdate(newMessages);
    }
  };

  /**
   * Handle profile refinement when batch is ready
   * Requirements: 1.5, 7.1, 7.2, 7.3, 7.4
   */
  const handleProfileRefinement = async () => {
    if (!messageCollectorRef.current || !profileRefinerClientRef.current) {
      console.warn('Living Profile services not initialized');
      return;
    }

    // Get batch and clear collector
    const batch = messageCollectorRef.current.getBatch();
    
    if (batch.length === 0) {
      console.log('No messages to refine');
      return;
    }

    console.log(`Refining profile with ${batch.length} messages`);

    try {
      // Send refinement request (Requirement 1.5)
      const result = await profileRefinerClientRef.current.refineProfile(
        styleProfile,
        batch
      );

      if (result.success) {
        console.log('Profile refinement successful:', result.deltaReport);
        
        // Notify parent component of profile update (Requirement 1.5)
        if (onProfileUpdate) {
          onProfileUpdate(result.updatedProfile, result.deltaReport);
        }
        
        // Note: ProfileRefinerClient already saves to localStorage (Requirement 1.5)
      } else {
        // Handle refinement failure (Requirement 7.1, 7.2)
        console.error('Profile refinement failed:', result.error);
        
        // Profile remains unchanged (Requirement 7.1)
        // Error notification will be handled by parent component
        if (onProfileUpdate) {
          onProfileUpdate(null, null, result.error);
        }
      }
    } catch (error) {
      // Handle unexpected errors (Requirement 7.4)
      console.error('Unexpected error during profile refinement:', error);
      
      // Discard batch and log error (Requirement 7.4)
      if (onProfileUpdate) {
        onProfileUpdate(null, null, 'Unable to update profile. Your current profile is unchanged.');
      }
    }
  };

  const handleNewCmd = () => {
    setCurrentCmdNumber(prev => {
      const newCmdNumber = prev + 1;
      // Notify parent component to persist CMD number (Requirement 5.1)
      if (onCmdNumberUpdate) {
        onCmdNumberUpdate(newCmdNumber);
      }
      return newCmdNumber;
    });
  };

  const handleSubmit = async (input, isNewCommand = false) => {
    // Determine the command number for this message
    const cmdNumber = isNewCommand ? currentCmdNumber + 1 : currentCmdNumber;
    
    // Increment command number if this is a new command
    if (isNewCommand) {
      setCurrentCmdNumber(cmdNumber);
      // Notify parent component to persist CMD number (Requirement 5.1)
      if (onCmdNumberUpdate) {
        onCmdNumberUpdate(cmdNumber);
      }
    }
    
    // Add user message
    const userMessage = {
      id: generateId(),
      userId: 'user-1',
      role: 'user',
      content: input,
      contentType: 'text',
      language: null,
      timestamp: Date.now(),
      feedback: null,
      cmdNumber: cmdNumber
    };
    
    const messagesWithUser = [...messages, userMessage];
    updateMessages(messagesWithUser);
    setIsGenerating(true);
    setCurrentResponse(null);
    setStreamingText(null); // Reset streaming text (Requirement 4.2)
    
    // Living Profile: Add message to collector (Requirement 1.1)
    if (messageCollectorRef.current) {
      messageCollectorRef.current.addMessage(input);
      
      // Check if batch should be sent (Requirements 1.3, 1.4)
      if (messageCollectorRef.current.shouldSendBatch()) {
        handleProfileRefinement();
      }
    }
    
    // Filter conversation history to only include messages from current CMD
    // Use messagesWithUser to include the current user message in context
    const currentCmdContext = messagesWithUser.filter(msg => msg.cmdNumber === cmdNumber);
    
    // Generate AI response using ContentGenerator service with scoped context and streaming callback
    try {
      // Streaming callback to update UI as chunks arrive (Requirement 4.2)
      const handleChunk = (accumulatedText) => {
        setStreamingText(accumulatedText);
      };
      
      const result = await generateContent(input, styleProfile, currentCmdContext, handleChunk);
      
      if (result.success) {
        const aiMessage = {
          id: generateId(),
          userId: 'user-1',
          role: 'ai',
          content: result.content,
          contentType: result.contentType,
          language: result.language,
          timestamp: Date.now(),
          feedback: null,
          cmdNumber: cmdNumber
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
          feedback: null,
          cmdNumber: cmdNumber
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
        feedback: null,
        cmdNumber: cmdNumber
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
      setStreamingText(null); // Clear streaming text when done (Requirement 4.2)
    }
    
    if (onSubmit) {
      onSubmit(input);
    }
  };

  return (
    <div className="relative w-full h-screen bg-mirror-black overflow-hidden" style={{ marginTop: '60px', height: 'calc(100vh - 60px)' }}>
      {/* Scanline effect */}
      <div className="scanline" />
      
      {/* System status indicators - top right (hidden on mobile to save space) */}
      <div className="hidden md:flex fixed top-20 right-4 flex-col gap-2 font-mono text-xs text-static-ghost z-50">
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
      
      {/* Split container - Vertical stack on mobile (< 768px), side-by-side on desktop */}
      <div className="flex flex-col md:grid md:grid-cols-2 w-full h-full relative">
        <LeftPanel 
          ref={inputAreaRef}
          onSubmit={handleSubmit}
          messages={messages}
          currentCmdNumber={currentCmdNumber}
          onNewCmd={handleNewCmd}
          expandedPairKey={expandedPairKey}
          onToggleExpand={setExpandedPairKey}
        />
        
        {/* THE CHASM - Dimensional void between human and AI (desktop only) */}
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
        
        {/* Mobile divider - Horizontal separator between panels */}
        <div className="md:hidden w-full h-px bg-unsettling-cyan opacity-20 my-2" />
        
        <RightPanel 
          response={currentResponse}
          isGenerating={isGenerating}
          messages={messages}
          glitchIntensity={preferences?.glitchIntensity || 'medium'}
          currentCmdNumber={currentCmdNumber}
          onNewCmd={handleNewCmd}
          expandedPairKey={expandedPairKey}
          onToggleExpand={setExpandedPairKey}
          streamingText={streamingText}
        />
      </div>
    </div>
  );
});

MirrorInterface.displayName = 'MirrorInterface';

const LeftPanel = forwardRef(({ onSubmit, messages, currentCmdNumber, onNewCmd, expandedPairKey, onToggleExpand }, ref) => {
  return (
    <div className="relative flex items-start justify-center p-4 md:p-8 lg:p-12 overflow-y-auto scrollbar-minimal">
      <div className="w-full max-w-md pt-4 md:pt-8">
        {/* Panel header - terminal style */}
        <div className="mb-6 md:mb-8">
          <div className="font-mono text-xs text-static-ghost mb-4">
            [TERMINAL_HUMAN.exe]
          </div>
          <h1 className="text-2xl md:text-3xl font-display font-bold text-static-white mb-2 tracking-tight">
            Human
          </h1>
          <p className="text-xs text-static-muted font-mono">
            &gt; Speak to your reflection...
          </p>
        </div>
        
        <InputArea 
          ref={ref}
          onSubmit={onSubmit} 
          messageCount={messages.filter(m => m.role === 'user').length}
          currentCmdNumber={currentCmdNumber}
        />
        
        <MessageHistory 
          messages={messages} 
          role="user"
          expandedMessageIndex={expandedPairKey}
          onToggleExpand={onToggleExpand}
        />
      </div>
    </div>
  );
});

LeftPanel.displayName = 'LeftPanel';

const RightPanel = ({ response, isGenerating, messages, glitchIntensity, currentCmdNumber, onNewCmd, expandedPairKey, onToggleExpand, streamingText }) => {
  const [shouldGlitch, setShouldGlitch] = useState(false);
  const scrollContainerRef = useRef(null);

  // Smart auto-scroll when response completes - only if user is near bottom
  useEffect(() => {
    if (!isGenerating && response && scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const scrollBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
      const isNearBottom = scrollBottom < 100;
      
      // Only auto-scroll if user is already near the bottom
      if (isNearBottom) {
        container.scrollTo({
          top: container.scrollHeight,
          behavior: 'smooth'
        });
      }
    }
  }, [isGenerating, response]);

  // Random glitch effect every 15-25 seconds
  useEffect(() => {
    const triggerRandomGlitch = () => {
      setShouldGlitch(true);
      setTimeout(() => setShouldGlitch(false), 50); // Reset after brief moment
      
      // Schedule next glitch
      const nextGlitch = 15000 + Math.random() * 10000; // 15-25 seconds
      setTimeout(triggerRandomGlitch, nextGlitch);
    };

    // Start the glitch cycle
    const initialDelay = 10000 + Math.random() * 5000; // 10-15 seconds initial delay
    const timer = setTimeout(triggerRandomGlitch, initialDelay);

    return () => clearTimeout(timer);
  }, []);

  // Also glitch when AI starts generating
  useEffect(() => {
    if (isGenerating) {
      setShouldGlitch(true);
      setTimeout(() => setShouldGlitch(false), 50);
    }
  }, [isGenerating]);

  return (
    <div ref={scrollContainerRef} className="relative flex items-start justify-center p-4 md:p-8 lg:p-12 overflow-y-auto scrollbar-mirrored">
      <div className="w-full max-w-md pt-4 md:pt-8">
        {/* Panel header - terminal style */}
        <div className="mb-6 md:mb-8">
          <div className="font-mono text-xs text-static-ghost mb-4">
            [TERMINAL_AI.exe]
          </div>
          <GlitchEffect trigger={shouldGlitch} intensity="low" autoGlitch={true}>
            <h1 className="text-2xl md:text-3xl font-display font-bold text-static-white mb-2 tracking-tight">
              Doppelgänger
            </h1>
          </GlitchEffect>
          <p className="text-xs text-static-muted font-mono">
            &gt; REFLECTING_INPUT...
          </p>
        </div>
        
        <ResponseArea 
          content={response?.content}
          contentType={response?.contentType}
          language={response?.language}
          isLoading={isGenerating}
          glitchIntensity={glitchIntensity}
          streamingText={streamingText}
        />
        
        <div className="font-mono text-xs text-static-ghost text-center mt-6 animate-pulse-slow">
          [ SYSTEM: MIRROR_INITIALIZED ]
        </div>
        
        <MessageHistory 
          messages={messages} 
          role="ai"
          expandedMessageIndex={expandedPairKey}
          onToggleExpand={onToggleExpand}
        />
      </div>
    </div>
  );
};

RightPanel.displayName = 'RightPanel';

export default MirrorInterface;
