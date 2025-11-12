/**
 * ContentGenerator Service
 * Generates text and code content based on user's style profile
 * Mock implementation with style-aware responses for MVP
 */

import { generateId } from '../models';

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Simulate async delay for realistic mock behavior
 * @param {number} ms - Milliseconds to delay
 * @returns {Promise<void>}
 */
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Detect if prompt is requesting code generation
 * @param {string} prompt - User prompt
 * @returns {boolean} True if code-related
 */
const isCodeRequest = (prompt) => {
  const codeKeywords = [
    'function', 'component', 'code', 'implement', 'create',
    'write', 'build', 'hook', 'class', 'method', 'api',
    'algorithm', 'script', 'program'
  ];
  
  const lowerPrompt = prompt.toLowerCase();
  return codeKeywords.some(keyword => lowerPrompt.includes(keyword));
};

/**
 * Detect programming language from prompt
 * @param {string} prompt - User prompt
 * @returns {string} Detected language
 */
const detectLanguage = (prompt) => {
  const lowerPrompt = prompt.toLowerCase();
  
  if (lowerPrompt.includes('react') || lowerPrompt.includes('jsx')) return 'javascript';
  if (lowerPrompt.includes('python')) return 'python';
  if (lowerPrompt.includes('java')) return 'java';
  if (lowerPrompt.includes('css') || lowerPrompt.includes('style')) return 'css';
  if (lowerPrompt.includes('html')) return 'html';
  
  return 'javascript'; // Default to JavaScript
};

// ============================================================================
// PROMPT CONSTRUCTION
// ============================================================================

/**
 * Build AI prompt with style profile constraints
 * @param {string} userPrompt - User's request
 * @param {Object} styleProfile - User's style profile
 * @param {string} contentType - 'text' or 'code'
 * @returns {string} Constructed prompt for AI service
 */
export const buildPrompt = (userPrompt, styleProfile, contentType = 'text') => {
  const { coding, writing } = styleProfile;
  
  if (contentType === 'code') {
    return `You are a coding assistant that writes code matching a specific style.

Style Profile:
- Language: ${coding.language}
- Framework: ${coding.framework}
- Component Style: ${coding.componentStyle}
- Naming Convention: ${coding.namingConvention}
- Comment Frequency: ${coding.commentFrequency}
- Patterns: ${coding.patterns.join(', ')}

User Request: ${userPrompt}

Generate code that strictly follows the style profile above. Use ${coding.componentStyle} components, ${coding.namingConvention} naming, and include ${coding.commentFrequency} comments.`;
  } else {
    return `You are a writing assistant that writes in a specific style.

Style Profile:
- Tone: ${writing.tone}
- Formality: ${writing.formality}
- Sentence Length: ${writing.sentenceLength}
- Vocabulary: ${writing.vocabulary.join(', ')}
- Avoid: ${writing.avoidance.join(', ')}

User Request: ${userPrompt}

Generate text that matches the style profile above. Use ${writing.tone} tone, ${writing.formality} language, and ${writing.sentenceLength} sentences. Avoid ${writing.avoidance.join(', ')}.`;
  }
};

/**
 * Extract context from conversation history
 * @param {Array} conversationHistory - Previous messages
 * @param {number} maxMessages - Maximum messages to include
 * @returns {string} Context summary
 */
export const extractContext = (conversationHistory, maxMessages = 5) => {
  if (!conversationHistory || conversationHistory.length === 0) {
    return 'No previous context.';
  }

  const recentMessages = conversationHistory.slice(-maxMessages);
  const contextLines = recentMessages.map(msg => 
    `${msg.role === 'user' ? 'User' : 'AI'}: ${msg.content.substring(0, 100)}...`
  );

  return `Previous conversation:\n${contextLines.join('\n')}`;
};

// ============================================================================
// MOCK TEXT RESPONSES
// ============================================================================

const mockTextResponses = {
  email: `Subject: Project Update

The analysis phase has been completed successfully. Key findings indicate that the proposed architecture aligns with our technical requirements. The implementation timeline remains on track for the scheduled delivery date.

Next steps include finalizing the component specifications and initiating the development phase. Please review the attached documentation and provide feedback by end of week.`,

  blog: `The evolution of modern web development has fundamentally transformed how we approach application architecture. Component-based frameworks have emerged as the dominant paradigm, offering modularity and reusability that traditional approaches could not provide.

React's introduction of hooks represented a significant shift in state management patterns. This functional approach eliminates the complexity inherent in class-based components while maintaining the full power of stateful logic. The result is cleaner, more maintainable code that aligns with contemporary JavaScript practices.

Performance optimization remains a critical consideration. Techniques such as code splitting, lazy loading, and memoization enable applications to scale efficiently. These strategies, when applied judiciously, ensure responsive user experiences even as application complexity increases.`,

  documentation: `## Implementation Overview

This module provides core functionality for data processing and validation. The architecture follows established patterns for separation of concerns and maintainability.

### Key Features

- Asynchronous data handling with error recovery
- Input validation with detailed error messages
- Extensible plugin system for custom processors
- Comprehensive logging for debugging

### Usage

Import the required functions and configure according to your specific requirements. Refer to the API documentation for detailed parameter specifications.`,

  explanation: `The concept operates on the principle of asynchronous execution. When a function is invoked, it returns immediately with a promise object representing the eventual completion or failure of the operation.

This pattern enables non-blocking code execution, allowing the application to remain responsive while waiting for operations to complete. Error handling is managed through the promise chain, providing a clean mechanism for dealing with failure states.

The practical benefit is improved application performance and user experience, particularly for operations involving network requests or file system access.`
};

/**
 * Generate text content based on style profile
 * @param {string} prompt - User's text generation request
 * @param {Object} styleProfile - User's style profile
 * @param {Array} context - Conversation history
 * @returns {Promise<Object>} Generated text response
 */
export const generateText = async (prompt, styleProfile, context = []) => {
  try {
    // Call the real Kiro AI agent with style-aware prompt and conversation history
    const aiResponse = await callKiroAgent(prompt, styleProfile, context);
    
    return {
      success: true,
      content: aiResponse,
      contentType: 'text',
      language: null,
      metadata: {
        promptTokens: prompt.split(' ').length,
        responseTokens: aiResponse.split(' ').length,
        model: 'kiro-ai',
        styleProfile: {
          tone: styleProfile.writing.tone,
          formality: styleProfile.writing.formality
        }
      },
      generatedAt: Date.now()
    };
  } catch (error) {
    // Fallback to mock response if AI call fails
    console.warn('AI generation failed, using fallback:', error.message);
    
    const lowerPrompt = prompt.toLowerCase();
    let response;
    if (lowerPrompt.includes('email')) {
      response = mockTextResponses.email;
    } else if (lowerPrompt.includes('blog') || lowerPrompt.includes('article')) {
      response = mockTextResponses.blog;
    } else if (lowerPrompt.includes('document') || lowerPrompt.includes('readme')) {
      response = mockTextResponses.documentation;
    } else if (lowerPrompt.includes('explain') || lowerPrompt.includes('describe')) {
      response = mockTextResponses.explanation;
    } else {
      response = `The request has been analyzed according to the specified parameters. The approach involves systematic evaluation of the requirements and implementation of appropriate solutions.

Key considerations include maintainability, scalability, and adherence to established patterns. The methodology ensures consistent results while allowing for flexibility in specific implementation details.

This framework provides a solid foundation for addressing similar challenges in future scenarios.`;
    }
    
    return {
      success: true,
      content: response,
      contentType: 'text',
      language: null,
      metadata: {
        promptTokens: prompt.split(' ').length,
        responseTokens: response.split(' ').length,
        model: 'fallback-mock',
        styleProfile: {
          tone: styleProfile.writing.tone,
          formality: styleProfile.writing.formality
        }
      },
      generatedAt: Date.now()
    };
  }
};

// ============================================================================
// MOCK CODE RESPONSES
// ============================================================================

const mockCodeResponses = {
  component: `const UserProfile = ({ user, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState(user);

  const handleSubmit = async (e) => {
    e.preventDefault();
    await onUpdate(formData);
    setIsEditing(false);
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="user-profile">
      {isEditing ? (
        <form onSubmit={handleSubmit}>
          <input
            value={formData.name}
            onChange={(e) => handleChange('name', e.target.value)}
          />
          <button type="submit">Save</button>
        </form>
      ) : (
        <div>
          <h2>{user.name}</h2>
          <button onClick={() => setIsEditing(true)}>Edit</button>
        </div>
      )}
    </div>
  );
};`,

  hook: `const useLocalStorage = (key, initialValue) => {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error('Error reading from localStorage:', error);
      return initialValue;
    }
  });

  const setValue = (value) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error('Error writing to localStorage:', error);
    }
  };

  return [storedValue, setValue];
};`,

  function: `const debounce = (func, delay) => {
  let timeoutId;
  
  return (...args) => {
    clearTimeout(timeoutId);
    
    timeoutId = setTimeout(() => {
      func.apply(this, args);
    }, delay);
  };
};`,

  api: `const fetchUserData = async (userId) => {
  try {
    const response = await fetch(\`/api/users/\${userId}\`);
    
    if (!response.ok) {
      throw new Error(\`HTTP error: \${response.status}\`);
    }
    
    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    console.error('Failed to fetch user data:', error);
    return { success: false, error: error.message };
  }
};`,

  validation: `const validateForm = (formData) => {
  const errors = {};
  
  if (!formData.email || !formData.email.includes('@')) {
    errors.email = 'Valid email address is required';
  }
  
  if (!formData.password || formData.password.length < 8) {
    errors.password = 'Password must be at least 8 characters';
  }
  
  if (formData.password !== formData.confirmPassword) {
    errors.confirmPassword = 'Passwords must match';
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};`
};

/**
 * Call Kiro AI agent with style-aware prompt
 * @param {string} userMessage - User's request
 * @param {Object} styleProfile - User's style profile
 * @param {Array} conversationHistory - Previous messages for context
 * @returns {Promise<string>} AI response
 */
const callKiroAgent = async (userMessage, styleProfile, conversationHistory = []) => {
  // Call the backend proxy service with prompt, styleProfile, and conversation history
  // The backend will construct the meta-prompt dynamically with full context
  console.log('Calling backend with user message, style profile, and conversation history');
  
  // Format conversation history for backend (exclude the current user message that was just added)
  // Backend expects: [{ role: 'user'|'model', content: string }]
  const formattedHistory = conversationHistory
    .slice(0, -1) // Exclude the last message (current user input)
    .slice(-10) // Only send last 10 messages for context (5 exchanges)
    .map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      content: msg.content
    }));
  
  console.log('Formatted history:', formattedHistory.length, 'messages');
  
  const response = await fetch('http://localhost:3001/api/generate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ 
      prompt: userMessage,
      styleProfile: styleProfile,
      conversationHistory: formattedHistory
    })
  });

  console.log('Response status:', response.status);

  if (!response.ok) {
    throw new Error(`Backend API error: ${response.status}`);
  }

  // Read the streaming response properly
  if (!response.body) {
    throw new Error('Response body is null');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let fullText = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      
      if (done) {
        console.log('Stream complete. Total length:', fullText.length);
        break;
      }
      
      if (value) {
        const chunk = decoder.decode(value, { stream: true });
        fullText += chunk;
        console.log('Chunk received, length:', chunk.length);
      }
    }
  } catch (error) {
    console.error('Error reading stream:', error);
    throw error;
  }
  
  console.log('Response preview:', fullText.substring(0, 200));
  return fullText;
};

/**
 * Generate code content based on style profile
 * @param {string} prompt - User's code generation request
 * @param {Object} styleProfile - User's style profile
 * @param {Array} context - Conversation history
 * @returns {Promise<Object>} Generated code response
 */
export const generateCode = async (prompt, styleProfile, context = []) => {
  const language = detectLanguage(prompt);
  
  try {
    // Call the real Kiro AI agent with style-aware prompt and conversation history
    const aiResponse = await callKiroAgent(prompt, styleProfile, context);
    
    return {
      success: true,
      content: aiResponse,
      contentType: 'code',
      language,
      metadata: {
        promptTokens: prompt.split(' ').length,
        responseTokens: aiResponse.split(' ').length,
        model: 'kiro-ai',
        styleProfile: {
          language: styleProfile.coding.language,
          framework: styleProfile.coding.framework,
          componentStyle: styleProfile.coding.componentStyle
        }
      },
      generatedAt: Date.now()
    };
  } catch (error) {
    // Fallback to mock response if AI call fails
    console.warn('AI generation failed, using fallback:', error.message);
    
    // Use mock response as fallback
    const lowerPrompt = prompt.toLowerCase();
    let code;
    if (lowerPrompt.includes('component')) {
      code = mockCodeResponses.component;
    } else if (lowerPrompt.includes('hook')) {
      code = mockCodeResponses.hook;
    } else if (lowerPrompt.includes('api') || lowerPrompt.includes('fetch')) {
      code = mockCodeResponses.api;
    } else if (lowerPrompt.includes('validat')) {
      code = mockCodeResponses.validation;
    } else {
      code = mockCodeResponses.function;
    }
    
    return {
      success: true,
      content: code,
      contentType: 'code',
      language,
      metadata: {
        promptTokens: prompt.split(' ').length,
        responseTokens: code.split(' ').length,
        model: 'fallback-mock',
        styleProfile: {
          language: styleProfile.coding.language,
          framework: styleProfile.coding.framework,
          componentStyle: styleProfile.coding.componentStyle
        }
      },
      generatedAt: Date.now()
    };
  }
};

// ============================================================================
// UNIFIED GENERATION INTERFACE
// ============================================================================

/**
 * Generate content (text or code) based on prompt analysis
 * @param {string} prompt - User's generation request
 * @param {Object} styleProfile - User's style profile
 * @param {Array} context - Conversation history
 * @returns {Promise<Object>} Generated content response
 */
export const generateContent = async (prompt, styleProfile, context = []) => {
  if (!prompt || !styleProfile) {
    return {
      success: false,
      error: {
        message: 'Prompt and style profile are required',
        code: 'INVALID_INPUT'
      }
    };
  }

  // Determine content type
  const isCode = isCodeRequest(prompt);
  
  try {
    if (isCode) {
      return await generateCode(prompt, styleProfile, context);
    } else {
      return await generateText(prompt, styleProfile, context);
    }
  } catch (error) {
    return {
      success: false,
      error: {
        message: 'Content generation failed',
        code: 'GENERATION_ERROR',
        details: error.message
      }
    };
  }
};

// ============================================================================
// RESPONSE REFINEMENT
// ============================================================================

/**
 * Refine generated content based on user feedback
 * @param {string} originalContent - Original generated content
 * @param {string} feedback - User feedback
 * @param {Object} styleProfile - User's style profile
 * @returns {Promise<Object>} Refined content
 */
export const refineContent = async (originalContent, feedback, styleProfile) => {
  await delay(1500);

  // Mock refinement - in real implementation, this would call AI with feedback
  const refinedContent = `${originalContent}\n\n// Refined based on feedback: ${feedback}`;

  return {
    success: true,
    content: refinedContent,
    refinementApplied: feedback,
    generatedAt: Date.now()
  };
};

/**
 * Regenerate content with different parameters
 * @param {string} prompt - Original prompt
 * @param {Object} styleProfile - User's style profile
 * @param {Object} options - Regeneration options
 * @returns {Promise<Object>} Regenerated content
 */
export const regenerateContent = async (prompt, styleProfile, options = {}) => {
  const { temperature = 0.7, maxLength = null } = options;
  
  // Regenerate with potentially different result
  return await generateContent(prompt, styleProfile, []);
};

// ============================================================================
// ERROR SIMULATION
// ============================================================================

/**
 * Simulate generation error for testing
 * @param {string} errorType - Type of error to simulate
 * @returns {Object} Error response
 */
export const simulateGenerationError = (errorType = 'timeout') => {
  const errors = {
    timeout: {
      message: 'Generation taking longer than expected. Please try again.',
      code: 'TIMEOUT_ERROR'
    },
    filter: {
      message: 'Cannot generate this content. Please try a different prompt.',
      code: 'CONTENT_FILTER'
    },
    service: {
      message: 'AI service temporarily unavailable. Please try again later.',
      code: 'SERVICE_ERROR'
    }
  };

  return {
    success: false,
    error: errors[errorType] || errors.service
  };
};
