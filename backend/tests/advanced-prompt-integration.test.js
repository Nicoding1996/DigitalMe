/**
 * Advanced Prompt Integration Tests
 * 
 * Tests the integration of advanced style analysis data into the meta-prompt
 * construction, including:
 * - Complete advanced analysis data
 * - Backward compatibility without advanced data
 * - Partial advanced data handling
 * - Graceful degradation
 */

// Mock the server module to access internal functions
const mockConfig = {
  GEMINI_API_KEY: 'test-api-key',
  GEMINI_MODEL: 'gemini-2.0-flash-exp',
  PORT: 0, // Use port 0 to let the OS assign a random available port
  FRONTEND_URL: 'http://localhost:3000',
  isGmailEnabled: () => false
};

// Mock dependencies before requiring server
jest.mock('../config', () => mockConfig);
jest.mock('@google/generative-ai');
jest.mock('../validation', () => ({
  validateGenerateMiddleware: (req, res, next) => next(),
  validateAnalyzeAdvancedMiddleware: (req, res, next) => next()
}));

const request = require('supertest');

describe('Advanced Prompt Integration', () => {
  let app;
  
  beforeAll(() => {
    // Load the server once for all tests
    app = require('../server.js');
  });
  
  afterAll((done) => {
    // Give time for async operations to complete
    setTimeout(() => {
      done();
    }, 100);
  });
  
  beforeEach(() => {
    // Clear mocks between tests
    jest.clearAllMocks();
  });
  
  describe('Task 3.1: Complete Advanced Analysis Data', () => {
    const completeStyleProfile = {
      writing: {
        tone: 'conversational',
        formality: 'casual',
        sentenceLength: 'mixed',
        vocabulary: ['hey', 'cool', 'awesome'],
        avoidance: ['utilize', 'leverage', 'synergy']
      },
      coding: {
        language: 'JavaScript',
        framework: 'React',
        componentStyle: 'functional',
        namingConvention: 'camelCase',
        commentFrequency: 'moderate',
        patterns: ['hooks', 'composition']
      },
      advanced: {
        phrases: [
          { phrase: 'my luvins', frequency: 5, category: 'signature' },
          { phrase: 'huhuhu', frequency: 4, category: 'filler' },
          { phrase: 'kanaina', frequency: 3, category: 'signature' },
          { phrase: 'beboo', frequency: 3, category: 'signature' },
          { phrase: 'heueheu', frequency: 2, category: 'filler' }
        ],
        idiosyncrasies: [
          {
            text: 'Hi bebboo was knocked out kanaina :(((',
            explanation: 'Heavy use of non-standard, variable terms of endearment',
            category: 'IDIOSYNCRASY'
          },
          {
            text: 'huhuhu I\'m so sad',
            explanation: 'Use of onomatopoeia to express emotions',
            category: 'HUMOR'
          },
          {
            text: 'Mix English with Tagalog naturally',
            explanation: 'Code-switching between languages',
            category: 'IDIOSYNCRASY'
          }
        ],
        contextualPatterns: {
          technical: {
            formality: 'casual',
            tone: 'concerned',
            vocabulary: ['typhoon', 'electricity', 'water', 'solar', 'blackout']
          },
          personal: {
            formality: 'casual',
            tone: 'affectionate',
            vocabulary: ['beboo', 'luvins', 'my love', 'kanaina']
          },
          creative: {
            formality: 'casual',
            tone: 'enthusiastic',
            vocabulary: ['beautiful', 'mid century Persian style']
          }
        },
        thoughtPatterns: {
          flowScore: 90,
          parentheticalFrequency: 0,
          transitionStyle: 'abrupt'
        }
      }
    };
    
    test('should include signature phrases in meta-prompt', async () => {
      const { GoogleGenerativeAI } = require('@google/generative-ai');
      let capturedPrompt = '';
      
      // Mock the Gemini API
      GoogleGenerativeAI.mockImplementation(() => ({
        getGenerativeModel: () => ({
          generateContentStream: async (prompt) => {
            capturedPrompt = prompt;
            return {
              stream: (async function* () {
                yield { text: () => 'Test response' };
              })()
            };
          }
        })
      }));
      
      await request(app)
        .post('/api/generate')
        .send({
          prompt: 'Write a test message',
          styleProfile: completeStyleProfile
        });
      
      // Verify signature phrases are included
      expect(capturedPrompt).toContain('[SIGNATURE EXPRESSIONS]');
      expect(capturedPrompt).toContain('my luvins');
      expect(capturedPrompt).toContain('huhuhu');
      expect(capturedPrompt).toContain('kanaina');
      expect(capturedPrompt).toContain('very frequent');
      expect(capturedPrompt).toContain('frequent');
    });
    
    test('should include idiosyncrasies in meta-prompt', async () => {
      const { GoogleGenerativeAI } = require('@google/generative-ai');
      let capturedPrompt = '';
      
      GoogleGenerativeAI.mockImplementation(() => ({
        getGenerativeModel: () => ({
          generateContentStream: async (prompt) => {
            capturedPrompt = prompt;
            return {
              stream: (async function* () {
                yield { text: () => 'Test response' };
              })()
            };
          }
        })
      }));
      
      await request(app)
        .post('/api/generate')
        .send({
          prompt: 'Write a test message',
          styleProfile: completeStyleProfile
        });
      
      // Verify idiosyncrasies are included
      expect(capturedPrompt).toContain('[UNIQUE QUIRKS]');
      expect(capturedPrompt).toContain('non-standard, variable terms of endearment');
      expect(capturedPrompt).toContain('onomatopoeia');
      expect(capturedPrompt).toContain('Code-switching');
      expect(capturedPrompt).toContain('mix languages naturally');
      expect(capturedPrompt).toContain('expressive sounds');
    });
    
    test('should include contextual vocabulary in meta-prompt', async () => {
      const { GoogleGenerativeAI } = require('@google/generative-ai');
      let capturedPrompt = '';
      
      GoogleGenerativeAI.mockImplementation(() => ({
        getGenerativeModel: () => ({
          generateContentStream: async (prompt) => {
            capturedPrompt = prompt;
            return {
              stream: (async function* () {
                yield { text: () => 'Test response' };
              })()
            };
          }
        })
      }));
      
      await request(app)
        .post('/api/generate')
        .send({
          prompt: 'Write a test message',
          styleProfile: completeStyleProfile
        });
      
      // Verify contextual vocabulary is included
      expect(capturedPrompt).toContain('[CONTEXTUAL VOCABULARY]');
      expect(capturedPrompt).toContain('Technical topics');
      expect(capturedPrompt).toContain('typhoon, electricity, water, solar, blackout');
      expect(capturedPrompt).toContain('Personal topics');
      expect(capturedPrompt).toContain('beboo, luvins, my love, kanaina');
      expect(capturedPrompt).toContain('Creative topics');
      expect(capturedPrompt).toContain('beautiful, mid century Persian style');
    });
    
    test('should include thought patterns in meta-prompt', async () => {
      const { GoogleGenerativeAI } = require('@google/generative-ai');
      let capturedPrompt = '';
      
      GoogleGenerativeAI.mockImplementation(() => ({
        getGenerativeModel: () => ({
          generateContentStream: async (prompt) => {
            capturedPrompt = prompt;
            return {
              stream: (async function* () {
                yield { text: () => 'Test response' };
              })()
            };
          }
        })
      }));
      
      await request(app)
        .post('/api/generate')
        .send({
          prompt: 'Write a test message',
          styleProfile: completeStyleProfile
        });
      
      // Verify thought patterns are included
      expect(capturedPrompt).toContain('[THOUGHT STRUCTURE]');
      expect(capturedPrompt).toContain('smooth, connected prose');
      expect(capturedPrompt).toContain('short, direct transitions');
      expect(capturedPrompt).toContain('Minimal use of parenthetical');
    });
  });
  
  describe('Task 3.2: Backward Compatibility Without Advanced Data', () => {
    const basicStyleProfile = {
      writing: {
        tone: 'conversational',
        formality: 'casual',
        sentenceLength: 'mixed',
        vocabulary: ['hey', 'cool', 'awesome'],
        avoidance: ['utilize', 'leverage', 'synergy']
      },
      coding: {
        language: 'JavaScript',
        framework: 'React',
        componentStyle: 'functional',
        namingConvention: 'camelCase',
        commentFrequency: 'moderate',
        patterns: ['hooks', 'composition']
      }
    };
    
    test('should work without advanced property', async () => {
      const { GoogleGenerativeAI } = require('@google/generative-ai');
      let capturedPrompt = '';
      
      GoogleGenerativeAI.mockImplementation(() => ({
        getGenerativeModel: () => ({
          generateContentStream: async (prompt) => {
            capturedPrompt = prompt;
            return {
              stream: (async function* () {
                yield { text: () => 'Test response' };
              })()
            };
          }
        })
      }));
      
      const response = await request(app)
        .post('/api/generate')
        .send({
          prompt: 'Write a test message',
          styleProfile: basicStyleProfile
        });
      
      // Should not throw errors
      expect(response.status).not.toBe(500);
      
      // Should still include basic style information
      expect(capturedPrompt).toContain('conversational');
      expect(capturedPrompt).toContain('casual');
      
      // Should NOT include advanced sections
      expect(capturedPrompt).not.toContain('[SIGNATURE EXPRESSIONS]');
      expect(capturedPrompt).not.toContain('[UNIQUE QUIRKS]');
      expect(capturedPrompt).not.toContain('[CONTEXTUAL VOCABULARY]');
      expect(capturedPrompt).not.toContain('[THOUGHT STRUCTURE]');
    });
    
    test('should work with advanced = null', async () => {
      const { GoogleGenerativeAI } = require('@google/generative-ai');
      
      GoogleGenerativeAI.mockImplementation(() => ({
        getGenerativeModel: () => ({
          generateContentStream: async () => ({
            stream: (async function* () {
              yield { text: () => 'Test response' };
            })()
          })
        })
      }));
      
      const profileWithNull = {
        ...basicStyleProfile,
        advanced: null
      };
      
      const response = await request(app)
        .post('/api/generate')
        .send({
          prompt: 'Write a test message',
          styleProfile: profileWithNull
        });
      
      // Should not throw errors
      expect(response.status).not.toBe(500);
    });
    
    test('should work with advanced = {} (empty object)', async () => {
      const { GoogleGenerativeAI } = require('@google/generative-ai');
      let capturedPrompt = '';
      
      GoogleGenerativeAI.mockImplementation(() => ({
        getGenerativeModel: () => ({
          generateContentStream: async (prompt) => {
            capturedPrompt = prompt;
            return {
              stream: (async function* () {
                yield { text: () => 'Test response' };
              })()
            };
          }
        })
      }));
      
      const profileWithEmpty = {
        ...basicStyleProfile,
        advanced: {}
      };
      
      const response = await request(app)
        .post('/api/generate')
        .send({
          prompt: 'Write a test message',
          styleProfile: profileWithEmpty
        });
      
      // Should not throw errors
      expect(response.status).not.toBe(500);
      
      // Should not include advanced sections
      expect(capturedPrompt).not.toContain('[SIGNATURE EXPRESSIONS]');
      expect(capturedPrompt).not.toContain('[UNIQUE QUIRKS]');
    });
  });
  
  describe('Task 3.3: Partial Advanced Data', () => {
    const basicStyleProfile = {
      writing: {
        tone: 'conversational',
        formality: 'casual',
        sentenceLength: 'mixed',
        vocabulary: ['hey', 'cool', 'awesome'],
        avoidance: ['utilize', 'leverage', 'synergy']
      },
      coding: {
        language: 'JavaScript',
        framework: 'React',
        componentStyle: 'functional',
        namingConvention: 'camelCase',
        commentFrequency: 'moderate',
        patterns: ['hooks', 'composition']
      }
    };
    
    test('should handle only phrases (no idiosyncrasies or contextual patterns)', async () => {
      const { GoogleGenerativeAI } = require('@google/generative-ai');
      let capturedPrompt = '';
      
      GoogleGenerativeAI.mockImplementation(() => ({
        getGenerativeModel: () => ({
          generateContentStream: async (prompt) => {
            capturedPrompt = prompt;
            return {
              stream: (async function* () {
                yield { text: () => 'Test response' };
              })()
            };
          }
        })
      }));
      
      const profileWithOnlyPhrases = {
        ...basicStyleProfile,
        advanced: {
          phrases: [
            { phrase: 'my luvins', frequency: 5, category: 'signature' },
            { phrase: 'huhuhu', frequency: 4, category: 'filler' }
          ]
        }
      };
      
      const response = await request(app)
        .post('/api/generate')
        .send({
          prompt: 'Write a test message',
          styleProfile: profileWithOnlyPhrases
        });
      
      // Should not throw errors
      expect(response.status).not.toBe(500);
      
      // Should include phrases section
      expect(capturedPrompt).toContain('[SIGNATURE EXPRESSIONS]');
      expect(capturedPrompt).toContain('my luvins');
      
      // Should NOT include other sections
      expect(capturedPrompt).not.toContain('[UNIQUE QUIRKS]');
      expect(capturedPrompt).not.toContain('[CONTEXTUAL VOCABULARY]');
      expect(capturedPrompt).not.toContain('[THOUGHT STRUCTURE]');
    });
    
    test('should handle only idiosyncrasies (no phrases)', async () => {
      const { GoogleGenerativeAI } = require('@google/generative-ai');
      let capturedPrompt = '';
      
      GoogleGenerativeAI.mockImplementation(() => ({
        getGenerativeModel: () => ({
          generateContentStream: async (prompt) => {
            capturedPrompt = prompt;
            return {
              stream: (async function* () {
                yield { text: () => 'Test response' };
              })()
            };
          }
        })
      }));
      
      const profileWithOnlyIdiosyncrasies = {
        ...basicStyleProfile,
        advanced: {
          idiosyncrasies: [
            {
              text: 'Hi bebboo',
              explanation: 'Use of non-standard terms of endearment',
              category: 'IDIOSYNCRASY'
            }
          ]
        }
      };
      
      const response = await request(app)
        .post('/api/generate')
        .send({
          prompt: 'Write a test message',
          styleProfile: profileWithOnlyIdiosyncrasies
        });
      
      // Should not throw errors
      expect(response.status).not.toBe(500);
      
      // Should include idiosyncrasies section
      expect(capturedPrompt).toContain('[UNIQUE QUIRKS]');
      expect(capturedPrompt).toContain('non-standard terms of endearment');
      
      // Should NOT include other sections
      expect(capturedPrompt).not.toContain('[SIGNATURE EXPRESSIONS]');
      expect(capturedPrompt).not.toContain('[CONTEXTUAL VOCABULARY]');
      expect(capturedPrompt).not.toContain('[THOUGHT STRUCTURE]');
    });
    
    test('should handle only contextual patterns', async () => {
      const { GoogleGenerativeAI } = require('@google/generative-ai');
      let capturedPrompt = '';
      
      GoogleGenerativeAI.mockImplementation(() => ({
        getGenerativeModel: () => ({
          generateContentStream: async (prompt) => {
            capturedPrompt = prompt;
            return {
              stream: (async function* () {
                yield { text: () => 'Test response' };
              })()
            };
          }
        })
      }));
      
      const profileWithOnlyContextual = {
        ...basicStyleProfile,
        advanced: {
          contextualPatterns: {
            technical: {
              formality: 'casual',
              tone: 'concerned',
              vocabulary: ['typhoon', 'electricity']
            }
          }
        }
      };
      
      const response = await request(app)
        .post('/api/generate')
        .send({
          prompt: 'Write a test message',
          styleProfile: profileWithOnlyContextual
        });
      
      // Should not throw errors
      expect(response.status).not.toBe(500);
      
      // Should include contextual vocabulary section
      expect(capturedPrompt).toContain('[CONTEXTUAL VOCABULARY]');
      expect(capturedPrompt).toContain('typhoon, electricity');
      
      // Should NOT include other sections
      expect(capturedPrompt).not.toContain('[SIGNATURE EXPRESSIONS]');
      expect(capturedPrompt).not.toContain('[UNIQUE QUIRKS]');
      expect(capturedPrompt).not.toContain('[THOUGHT STRUCTURE]');
    });
    
    test('should handle empty arrays gracefully', async () => {
      const { GoogleGenerativeAI } = require('@google/generative-ai');
      let capturedPrompt = '';
      
      GoogleGenerativeAI.mockImplementation(() => ({
        getGenerativeModel: () => ({
          generateContentStream: async (prompt) => {
            capturedPrompt = prompt;
            return {
              stream: (async function* () {
                yield { text: () => 'Test response' };
              })()
            };
          }
        })
      }));
      
      const profileWithEmptyArrays = {
        ...basicStyleProfile,
        advanced: {
          phrases: [],
          idiosyncrasies: [],
          contextualPatterns: {},
          thoughtPatterns: {}
        }
      };
      
      const response = await request(app)
        .post('/api/generate')
        .send({
          prompt: 'Write a test message',
          styleProfile: profileWithEmptyArrays
        });
      
      // Should not throw errors
      expect(response.status).not.toBe(500);
      
      // Should not include any advanced sections
      expect(capturedPrompt).not.toContain('[SIGNATURE EXPRESSIONS]');
      expect(capturedPrompt).not.toContain('[UNIQUE QUIRKS]');
      expect(capturedPrompt).not.toContain('[CONTEXTUAL VOCABULARY]');
      expect(capturedPrompt).not.toContain('[THOUGHT STRUCTURE]');
    });
  });
});
