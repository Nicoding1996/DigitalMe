/**
 * Data Models and Type Definitions for DigitalMe
 * Using JSDoc for type documentation in JavaScript
 */

// ============================================================================
// TYPE DEFINITIONS (JSDoc)
// ============================================================================

/**
 * @typedef {Object} CodingStyle
 * @property {string} language - Primary programming language
 * @property {string} framework - Preferred framework
 * @property {string} componentStyle - Component style (e.g., 'functional', 'class')
 * @property {string} namingConvention - Naming convention (e.g., 'camelCase', 'snake_case')
 * @property {string} commentFrequency - Comment frequency ('low', 'moderate', 'high')
 * @property {string[]} patterns - Common code patterns used
 */

/**
 * @typedef {Object} WritingStyle
 * @property {string} tone - Writing tone (e.g., 'analytical', 'casual')
 * @property {string} formality - Formality level ('formal', 'informal')
 * @property {string} sentenceLength - Average sentence length ('short', 'medium', 'long')
 * @property {string[]} vocabulary - Vocabulary characteristics
 * @property {string[]} avoidance - Things to avoid in writing
 */

/**
 * @typedef {Object} SampleCount
 * @property {number} codeLines - Number of code lines analyzed
 * @property {number} textWords - Number of text words analyzed
 * @property {number} repositories - Number of repositories analyzed
 * @property {number} articles - Number of articles analyzed
 * @property {number} emails - Number of emails analyzed
 * @property {number} emailWords - Total words from analyzed emails
 */

/**
 * @typedef {Object} StyleProfile
 * @property {string} id - Unique identifier
 * @property {string} userId - Associated user ID
 * @property {number} version - Profile version number
 * @property {number} lastUpdated - Timestamp of last update
 * @property {CodingStyle} coding - Coding style characteristics
 * @property {WritingStyle} writing - Writing style characteristics
 * @property {number} confidence - Confidence score (0-1)
 * @property {SampleCount} sampleCount - Sample counts for analysis
 * @property {SourceAttribution} [sourceAttribution] - Optional source attribution metadata
 */

/**
 * @typedef {Object} SourceAttribution
 * @property {AttributeAttribution} tone - Tone attribution
 * @property {AttributeAttribution} formality - Formality attribution
 * @property {AttributeAttribution} sentenceLength - Sentence length attribution
 * @property {AttributeAttribution} vocabulary - Vocabulary attribution
 * @property {AttributeAttribution} avoidance - Avoidance attribution
 */

/**
 * @typedef {Object} AttributeAttribution
 * @property {string|string[]} value - The merged value
 * @property {SourceContribution[]|Object} sources - Contributing sources (array for simple attributes, object for vocabulary/avoidance)
 */

/**
 * @typedef {Object} SourceContribution
 * @property {string} type - Source type ('gmail', 'text', 'blog')
 * @property {number} contribution - Percentage contribution (0-100)
 */

/**
 * @typedef {Object} Source
 * @property {string} id - Unique identifier
 * @property {string} userId - Associated user ID
 * @property {'github'|'blog'|'text'|'gmail'} type - Source type
 * @property {string} url - Source URL or identifier
 * @property {'pending'|'analyzing'|'complete'|'error'} status - Analysis status
 * @property {number} addedAt - Timestamp when added
 * @property {number} lastAnalyzed - Timestamp of last analysis
 * @property {Object} metadata - Additional metadata (for Gmail: connectedAt, emailsAnalyzed, lastSync)
 */

/**
 * @typedef {Object} Message
 * @property {string} id - Unique identifier
 * @property {string} userId - Associated user ID
 * @property {'user'|'ai'} role - Message role
 * @property {string} content - Message content
 * @property {'text'|'code'} contentType - Content type
 * @property {string|null} language - Programming language (for code)
 * @property {number} timestamp - Message timestamp
 * @property {'positive'|'negative'|null} feedback - User feedback
 */

/**
 * @typedef {Object} UserPreferences
 * @property {'dark'|'light'} theme - UI theme
 * @property {'low'|'medium'|'high'} glitchIntensity - Glitch effect intensity
 * @property {boolean} autoSave - Auto-save enabled
 * @property {'markdown'|'plain'} exportFormat - Default export format
 * @property {boolean} notifications - Notifications enabled
 */

// ============================================================================
// MOCK DATA GENERATORS
// ============================================================================

/**
 * Generate a unique ID
 * @returns {string} Unique identifier
 */
export const generateId = () => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Generate mock coding style
 * @returns {CodingStyle}
 */
export const generateMockCodingStyle = () => {
  return {
    language: 'JavaScript',
    framework: 'React',
    componentStyle: 'functional',
    namingConvention: 'camelCase',
    commentFrequency: 'moderate',
    patterns: ['hooks', 'arrow-functions', 'destructuring', 'async-await']
  };
};

/**
 * Generate mock writing style
 * @returns {WritingStyle}
 */
export const generateMockWritingStyle = () => {
  return {
    tone: 'conversational',
    formality: 'casual',
    sentenceLength: 'medium',
    vocabulary: ['clear', 'direct', 'relatable'],
    avoidance: ['corporate-jargon', 'overly-formal-language']
  };
};

/**
 * Generate mock style profile
 * @param {string} userId - User ID
 * @returns {StyleProfile}
 */
export const generateMockStyleProfile = (userId = 'user-1') => {
  return {
    id: generateId(),
    userId,
    version: 1,
    lastUpdated: Date.now(),
    coding: generateMockCodingStyle(),
    writing: generateMockWritingStyle(),
    confidence: 0.85,
    sampleCount: {
      codeLines: 15420,
      textWords: 8750,
      repositories: 12,
      articles: 8,
      emails: 0,
      emailWords: 0
    }
  };
};

/**
 * Generate mock source
 * @param {'github'|'blog'|'text'|'gmail'} type - Source type
 * @param {string} url - Source URL
 * @param {string} userId - User ID
 * @returns {Source}
 */
export const generateMockSource = (type, url, userId = 'user-1') => {
  const now = Date.now();
  return {
    id: generateId(),
    userId,
    type,
    url,
    status: 'complete',
    addedAt: now, // Use actual current time
    lastAnalyzed: now, // Use actual current time
    metadata: {
      itemsAnalyzed: Math.floor(Math.random() * 50) + 10,
      dataSize: Math.floor(Math.random() * 1000000) + 100000
    }
  };
};

/**
 * Generate Gmail source object
 * @param {Object} stats - Gmail analysis statistics
 * @param {number} stats.emailsAnalyzed - Number of emails analyzed
 * @param {number} stats.emailWords - Total words from emails
 * @param {number} stats.connectedAt - Timestamp when Gmail was connected
 * @param {string} userId - User ID
 * @returns {Source}
 */
export const generateGmailSource = (stats, userId = 'user-1') => {
  const now = Date.now();
  return {
    id: generateId(),
    userId,
    type: 'gmail',
    url: 'gmail:sent',
    status: 'complete',
    addedAt: stats.connectedAt || now,
    lastAnalyzed: now,
    metadata: {
      connectedAt: stats.connectedAt || now,
      emailsAnalyzed: stats.emailsAnalyzed || 0,
      lastSync: now,
      itemsAnalyzed: stats.emailsAnalyzed || 0,
      dataSize: stats.emailWords || 0
    }
  };
};

/**
 * Generate mock message
 * @param {'user'|'ai'} role - Message role
 * @param {string} content - Message content
 * @param {'text'|'code'} contentType - Content type
 * @param {string|null} language - Programming language
 * @param {string} userId - User ID
 * @returns {Message}
 */
export const generateMockMessage = (
  role,
  content,
  contentType = 'text',
  language = null,
  userId = 'user-1'
) => {
  return {
    id: generateId(),
    userId,
    role,
    content,
    contentType,
    language,
    timestamp: Date.now(),
    feedback: null
  };
};

/**
 * Generate default user preferences
 * @returns {UserPreferences}
 */
export const generateDefaultPreferences = () => {
  return {
    theme: 'dark',
    glitchIntensity: 'medium',
    autoSave: true,
    exportFormat: 'markdown',
    notifications: true
  };
};

/**
 * Generate mock conversation history
 * @param {number} messageCount - Number of messages to generate
 * @returns {Message[]}
 */
export const generateMockConversation = (messageCount = 6) => {
  const conversations = [
    {
      user: 'Write a function to validate email addresses',
      ai: `const validateEmail = (email) => {
  const emailRegex = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/;
  return emailRegex.test(email);
};`,
      type: 'code',
      language: 'javascript'
    },
    {
      user: 'Explain the benefits of functional components in React',
      ai: 'Functional components offer several advantages: they are more concise, easier to test, and support hooks for state management. They eliminate the complexity of class lifecycle methods and provide better performance through optimization techniques like React.memo.',
      type: 'text',
      language: null
    },
    {
      user: 'Create a custom hook for fetching data',
      ai: `const useFetch = (url) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(url);
        const result = await response.json();
        setData(result);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [url]);

  return { data, loading, error };
};`,
      type: 'code',
      language: 'javascript'
    }
  ];

  const messages = [];
  const count = Math.min(messageCount, conversations.length * 2);
  
  for (let i = 0; i < count; i += 2) {
    const conv = conversations[Math.floor(i / 2)];
    messages.push(
      generateMockMessage('user', conv.user, 'text', null)
    );
    messages.push(
      generateMockMessage('ai', conv.ai, conv.type, conv.language)
    );
  }

  return messages;
};

// ============================================================================
// MOCK DATA SETS
// ============================================================================

/**
 * Mock GitHub repositories data
 */
export const mockGitHubRepos = [
  {
    name: 'react-dashboard',
    language: 'JavaScript',
    stars: 45,
    description: 'Modern dashboard built with React and hooks'
  },
  {
    name: 'api-wrapper',
    language: 'JavaScript',
    stars: 23,
    description: 'Clean API wrapper with async/await patterns'
  },
  {
    name: 'component-library',
    language: 'JavaScript',
    stars: 67,
    description: 'Reusable React component library'
  }
];

/**
 * Mock blog posts data
 */
export const mockBlogPosts = [
  {
    title: 'Understanding React Hooks',
    url: 'https://example.com/react-hooks',
    wordCount: 1250,
    excerpt: 'An analytical exploration of React hooks and their practical applications...'
  },
  {
    title: 'Modern JavaScript Patterns',
    url: 'https://example.com/js-patterns',
    wordCount: 980,
    excerpt: 'Examining contemporary JavaScript patterns for cleaner, more maintainable code...'
  }
];
