/**
 * InputArea Component
 * Black Mirror aesthetic - Command Terminal Interface
 */
import { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';

const MAX_INPUT_LENGTH = 5000;
const DRAFT_KEY = 'digitalme_draft';
const AUTO_SAVE_INTERVAL = 2000; // 2 seconds (Requirement 5.2)

const InputArea = forwardRef(({ onSubmit, messageCount = 0, currentCmdNumber = 1, onNewCommand }, ref) => {
  // Restore draft on app load (Requirement 5.2)
  const [input, setInput] = useState(() => {
    try {
      const savedDraft = localStorage.getItem(DRAFT_KEY);
      if (savedDraft) {
        const draft = JSON.parse(savedDraft);
        // Only restore if draft is recent (within last 24 hours)
        const draftAge = Date.now() - draft.timestamp;
        if (draftAge < 24 * 60 * 60 * 1000) {
          return draft.content || '';
        }
      }
    } catch (error) {
      console.error('Failed to restore draft:', error);
      localStorage.removeItem(DRAFT_KEY);
    }
    return '';
  });
  
  const [error, setError] = useState('');
  const [justSent, setJustSent] = useState(false);
  const autoSaveTimerRef = useRef(null);
  const textareaRef = useRef(null);
  
  // Persist new command state to localStorage
  const [isNewCommand, setIsNewCommand] = useState(() => {
    const saved = localStorage.getItem('digitalme_new_command_active');
    return saved === 'true';
  });

  // Expose focus method to parent via ref (Requirement 7.4)
  useImperativeHandle(ref, () => ({
    focus: () => {
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
    }
  }));

  // Auto-save draft every 2 seconds (Requirement 5.2)
  useEffect(() => {
    // Clear any existing timer
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }
    
    // Only auto-save if there's content
    if (input.trim()) {
      autoSaveTimerRef.current = setTimeout(() => {
        try {
          const draft = {
            content: input,
            timestamp: Date.now(),
            autoSaved: true
          };
          localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
        } catch (error) {
          console.error('Failed to auto-save draft:', error);
        }
      }, AUTO_SAVE_INTERVAL);
    } else {
      // Clear draft if input is empty
      localStorage.removeItem(DRAFT_KEY);
    }
    
    // Cleanup timer on unmount
    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [input]);

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
    onSubmit(trimmedInput, isNewCommand);
    setInput('');
    
    // Clear draft after successful message send (Requirement 5.2)
    localStorage.removeItem(DRAFT_KEY);
    
    // Reset new command flag after submission
    if (isNewCommand) {
      setIsNewCommand(false);
      localStorage.setItem('digitalme_new_command_active', 'false');
    }
    
    // Show transmission feedback
    setJustSent(true);
    setTimeout(() => setJustSent(false), 1500);
  };

  const handleNewCommand = () => {
    const newValue = !isNewCommand;
    setIsNewCommand(newValue);
    localStorage.setItem('digitalme_new_command_active', newValue.toString());
  };

  const handleKeyDown = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  };

  const characterCount = input.length;
  const isNearLimit = characterCount > MAX_INPUT_LENGTH * 0.9;
  const displayCmdNumber = isNewCommand ? currentCmdNumber + 1 : currentCmdNumber;
  
  // Determine placeholder text based on state
  let placeholderText;
  if (messageCount === 0) {
    placeholderText = "Enter command...";
  } else if (isNewCommand) {
    placeholderText = "Enter new command...";
  } else {
    placeholderText = "Continue...";
  }

  return (
    <div className="w-full mb-6 border border-static-whisper bg-void-surface">
      {/* Terminal header */}
      <div className="flex items-center justify-between px-4 py-2 bg-void-elevated border-b border-static-whisper">
        <div className="flex items-center gap-2 font-mono text-xs text-static-muted">
          <span className="w-2 h-2 rounded-full bg-glitch-red" />
          <span className="w-2 h-2 rounded-full bg-system-warning" />
          <span className="w-2 h-2 rounded-full bg-system-active" />
          <span className="ml-4">TERMINAL_INPUT.exe</span>
          {messageCount > 0 && (
            <span className={`ml-2 ${isNewCommand ? 'text-unsettling-cyan animate-pulse' : 'text-unsettling-cyan'}`}>
              [CMD_{displayCmdNumber.toString().padStart(2, '0')}]
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          {justSent && (
            <span className="font-mono text-xs text-system-active animate-pulse">
              [TRANSMITTED]
            </span>
          )}
          <span className="font-mono text-xs text-static-ghost">
            [{characterCount}/{MAX_INPUT_LENGTH}]
          </span>
        </div>
      </div>
      
      {/* Terminal body */}
      <div className="p-4">
        {/* Command prompt */}
        <div className="flex items-start gap-2 font-mono text-sm">
          <span className="text-unsettling-cyan select-none pt-1">&gt;</span>
          <textarea
            ref={textareaRef}
            className="flex-1 bg-transparent text-static-white font-mono text-sm leading-relaxed resize-none outline-none placeholder:text-static-ghost"
            placeholder={placeholderText}
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
        <div className="flex items-center gap-3">
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
          {messageCount > 0 && (
            <button
              onClick={handleNewCommand}
              disabled={isNewCommand}
              className={`px-3 py-2 min-h-[44px] border font-mono text-xs transition-all touch-manipulation ${
                isNewCommand
                  ? 'bg-void-elevated border-unsettling-cyan text-unsettling-cyan cursor-default'
                  : 'bg-void-surface border-static-whisper text-static-white hover:border-unsettling-cyan hover:text-unsettling-cyan active:bg-void-elevated'
              }`}
            >
              {isNewCommand ? '[NEW_CMD_ACTIVE]' : '[NEW_CMD]'}
            </button>
          )}
          <button 
            onClick={handleSubmit}
            disabled={!input.trim() || !!error}
            className="px-4 py-2 min-h-[44px] bg-void-surface border border-static-whisper text-static-white hover:border-unsettling-cyan hover:text-unsettling-cyan active:bg-void-elevated disabled:opacity-30 disabled:cursor-not-allowed transition-all touch-manipulation"
          >
            EXECUTE
          </button>
        </div>
      </div>
    </div>
  );
});

InputArea.displayName = 'InputArea';

export default InputArea;
