/**
 * Gemini NLP Service
 * 
 * Provides advanced NLP analysis using Google Gemini API.
 * Handles API calls with retry logic, prompt building for different
 * analysis types, and response parsing.
 * 
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');
const crypto = require('crypto');
const config = require('../config');

class GeminiNLPService {
  constructor() {
    // Initialize Gemini API client
    this.genAI = new GoogleGenerativeAI(config.GEMINI_API_KEY);
    this.model = this.genAI.getGenerativeModel({ model: config.GEMINI_MODEL });
    
    // Retry configuration
    this.MAX_RETRIES = 3; // Increased to 3 for rate limit scenarios
    this.BASE_DELAY = 1000; // 1 second base delay for exponential backoff
    
    // Response cache with TTL (Requirements: 7.1, 7.2)
    this.cache = new Map();
    this.CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
  }

  /**
   * Call Gemini API with retry logic and exponential backoff
   * 
   * Attempts to call the Gemini API up to MAX_RETRIES times,
   * with exponential backoff between retries.
   * 
   * @param {string} prompt - The prompt to send to Gemini
   * @param {Object} options - Optional configuration
   * @returns {Promise<string>} The API response text
   * @throws {Error} If all retries fail
   * 
   * Requirements: 5.4, 5.5
   */
  async callWithRetry(prompt, options = {}) {
    let lastError;

    for (let attempt = 0; attempt <= this.MAX_RETRIES; attempt++) {
      try {
        const result = await this.model.generateContent(prompt);
        const response = await result.response;
        return response.text();
      } catch (error) {
        lastError = error;
        console.error(`Gemini API call failed (attempt ${attempt + 1}/${this.MAX_RETRIES + 1}):`, error.message);

        // If this was the last retry, throw the error
        if (attempt === this.MAX_RETRIES) {
          throw new Error(`Gemini API failed after ${this.MAX_RETRIES + 1} attempts: ${error.message}`);
        }

        // Extract retry delay from Google's error response if available
        let delay = this.BASE_DELAY * Math.pow(2, attempt); // Default exponential backoff
        
        // Check if error message contains Google's recommended retry delay
        const retryDelayMatch = error.message.match(/"retryDelay":"(\d+)s"/);
        if (retryDelayMatch) {
          const googleDelay = parseInt(retryDelayMatch[1]) * 1000; // Convert seconds to ms
          delay = Math.max(delay, googleDelay); // Use the longer delay
          console.log(`Google recommends waiting ${retryDelayMatch[1]}s, using ${delay}ms`);
        }
        
        console.log(`Retrying in ${delay}ms...`);
        await this._delay(delay);
      }
    }

    // This should never be reached, but just in case
    throw lastError;
  }

  /**
   * Build analysis prompt for specific analysis type
   * 
   * Creates structured prompts for different types of advanced
   * style analysis (phrases, thought flow, quirks, contextual).
   * 
   * @param {string} text - Text to analyze
   * @param {string} analysisType - Type of analysis ('phrases', 'thoughtFlow', 'quirks', 'contextual')
   * @returns {string} Formatted prompt for Gemini API
   * 
   * Requirements: 5.1, 5.2, 5.3
   */
  buildPrompt(text, analysisType) {
    const prompts = {
      phrases: `Analyze the following text and extract recurring phrase patterns.

TEXT TO ANALYZE:
${text}

TASK:
1. Identify recurring multi-word phrases that appear at least twice
2. Categorize transition phrases (e.g., "I think", "kind of", "to be honest", "basically")
3. Identify signature expressions unique to this writer
4. Count frequency of each phrase

Return a JSON array with the top 10 most frequent phrases:
[
  {
    "phrase": "the actual phrase",
    "frequency": number of occurrences,
    "category": "signature" | "transition" | "filler"
  }
]

Respond ONLY with the JSON array, no additional text.`,

      thoughtFlow: `Analyze the thought organization and flow in this text.

TEXT TO ANALYZE:
${text}

TASK:
1. Determine if the writing is structured (clear topic progression) or stream-of-consciousness
2. Count how often the writer uses parentheses, em-dashes, or nested clauses
3. Identify how the writer transitions between ideas (smooth transitions, abrupt shifts, etc.)
4. Assign a flow score from 0 (highly structured) to 100 (pure stream-of-consciousness)

Return a JSON object:
{
  "flowScore": 0-100,
  "parentheticalFrequency": number per 1000 words,
  "transitionStyle": "smooth" | "abrupt" | "mixed"
}

Respond ONLY with the JSON object, no additional text.`,

      quirks: `Identify personality quirks and distinctive writing patterns in this text.

TEXT TO ANALYZE:
${text}

TASK:
1. Find self-referential comments about writing style (e.g., "I make a lot of grammar mistakes")
2. Identify humor patterns (sarcasm, self-deprecating humor, jokes)
3. Extract personal context mentions (e.g., "because of my ADD", "I'm dyslexic")
4. Note any unique writing quirks or idiosyncrasies

IMPORTANT: You MUST return a valid JSON array starting with [ and ending with ].

Return a JSON array with up to 5 personality markers:
[
  {
    "text": "the original text snippet",
    "type": "self-aware" | "humor" | "personal-context",
    "context": "brief description of the quirk"
  }
]

If no quirks are found, return an empty array: []

Respond ONLY with the JSON array (starting with [ and ending with ]), no additional text before or after.`,

      contextual: `Analyze how writing style varies by topic or context in this text.

TEXT TO ANALYZE:
${text}

TASK:
1. Identify different topic categories present (technical, personal, professional, creative)
2. For each topic, measure formality level
3. Detect sentiment/tone variations by context
4. Identify topics where more technical vocabulary is used

Return a JSON object mapping topics to style variations:
{
  "technical": {
    "formality": "casual" | "balanced" | "formal",
    "tone": "enthusiastic" | "neutral" | "critical",
    "vocabulary": ["example", "technical", "terms"]
  },
  "personal": { ... },
  "professional": { ... },
  "creative": { ... }
}

Only include topics that are actually present in the text.
Respond ONLY with the JSON object, no additional text.`
    };

    if (!prompts[analysisType]) {
      throw new Error(`Unknown analysis type: ${analysisType}`);
    }

    return prompts[analysisType];
  }

  /**
   * Parse Gemini API response to extract JSON
   * 
   * Extracts JSON from Gemini response, handling various formats
   * including markdown code blocks and plain JSON.
   * 
   * @param {string} response - Raw response from Gemini API
   * @param {string} analysisType - Type of analysis (for validation)
   * @returns {Object|Array} Parsed JSON data
   * @throws {Error} If JSON cannot be extracted or parsed
   * 
   * Requirements: 5.3, 5.5
   */
  parseResponse(response, analysisType) {
    if (!response || typeof response !== 'string') {
      throw new Error('Invalid response: empty or not a string');
    }

    let jsonString = '';

    // Try to extract JSON from markdown code blocks first
    const markdownMatch = response.match(/```json\s*([\s\S]*?)\s*```/);
    if (markdownMatch) {
      jsonString = markdownMatch[1];
    } else {
      // No markdown block - look for raw JSON
      // Determine if we expect an array or object based on analysis type
      const expectsArray = analysisType === 'phrases' || analysisType === 'quirks';
      
      if (expectsArray) {
        // For arrays, match from first [ to last ]
        const arrayMatch = response.match(/\[[\s\S]*\]/);
        if (arrayMatch) {
          jsonString = arrayMatch[0];
        }
      } else {
        // For objects, match from first { to last }
        const objectMatch = response.match(/\{[\s\S]*\}/);
        if (objectMatch) {
          jsonString = objectMatch[0];
        }
      }
    }

    if (!jsonString) {
      console.error('Failed to extract JSON. Full response:', response);
      throw new Error('Failed to extract JSON from Gemini response');
    }
    
    console.log(`[JSON Extraction] Original length: ${response.length}, Extracted length: ${jsonString.length}`);
    console.log(`[JSON Extraction] First 50 chars: "${jsonString.substring(0, 50)}"`);
    console.log(`[JSON Extraction] Last 50 chars: "${jsonString.substring(jsonString.length - 50)}"`);
    
    // Fix common Gemini formatting issues
    const trimmed = jsonString.trim();
    
    // Check if this looks like array items but missing opening bracket
    // Pattern: starts with { and ends with }] (has closing bracket but not opening)
    if (trimmed.startsWith('{') && trimmed.endsWith('}]')) {
      console.log('[JSON Fix] Detected array missing opening bracket - adding [');
      jsonString = '[' + trimmed.slice(0, -1) + ']'; // Remove the stray ] and wrap properly
    }
    // Check if starts with { and has multiple objects (missing both brackets)
    else if (trimmed.startsWith('{') && trimmed.includes('},')) {
      const hasMultipleObjects = (trimmed.match(/\},\s*\{/g) || []).length > 0;
      if (hasMultipleObjects) {
        console.log('[JSON Fix] Detected array items without brackets - wrapping in []');
        jsonString = '[' + trimmed + ']';
      }
    }
    
    // Clean up the JSON string - remove any trailing text after valid JSON
    // This handles cases where Gemini adds extra commentary after the JSON
    try {
      // Try to find where valid JSON ends by parsing incrementally
      let validJson = jsonString;
      let parsed = null;
      
      // First try parsing the whole string
      try {
        parsed = JSON.parse(validJson);
      } catch (e) {
        // If that fails, try to find the end of valid JSON
        // Look for the last closing bracket/brace that makes valid JSON
        const isArray = validJson.trim().startsWith('[');
        const closingChar = isArray ? ']' : '}';
        
        // Find all positions of the closing character
        const positions = [];
        for (let i = 0; i < validJson.length; i++) {
          if (validJson[i] === closingChar) {
            positions.push(i);
          }
        }
        
        // Try parsing from each closing position (from end to start)
        for (let i = positions.length - 1; i >= 0; i--) {
          const testString = validJson.substring(0, positions[i] + 1);
          try {
            parsed = JSON.parse(testString);
            validJson = testString;
            break;
          } catch (e2) {
            // Continue trying
          }
        }
        
        if (!parsed) {
          throw new Error(`Could not find valid JSON in response: ${e.message}`);
        }
      }
      
      // Basic validation based on analysis type
      this._validateParsedResponse(parsed, analysisType);
      
      return parsed;
    } catch (error) {
      console.error('JSON parsing error. Raw response:', response);
      console.error('Extracted JSON string:', jsonString);
      throw new Error(`Failed to parse JSON: ${error.message}`);
    }
  }

  /**
   * Validate parsed response structure
   * 
   * @param {Object|Array} parsed - Parsed JSON data
   * @param {string} analysisType - Type of analysis
   * @throws {Error} If validation fails
   * @private
   */
  _validateParsedResponse(parsed, analysisType) {
    switch (analysisType) {
      case 'phrases':
        if (!Array.isArray(parsed)) {
          throw new Error('Phrases analysis must return an array');
        }
        break;
      
      case 'thoughtFlow':
        if (typeof parsed !== 'object' || Array.isArray(parsed)) {
          throw new Error('Thought flow analysis must return an object');
        }
        if (typeof parsed.flowScore !== 'number') {
          throw new Error('Thought flow must include flowScore');
        }
        break;
      
      case 'quirks':
        if (!Array.isArray(parsed)) {
          throw new Error('Quirks analysis must return an array');
        }
        break;
      
      case 'contextual':
        if (typeof parsed !== 'object' || Array.isArray(parsed)) {
          throw new Error('Contextual analysis must return an object');
        }
        break;
    }
  }

  /**
   * Generate cache key from text and analysis type
   * 
   * Creates a hash of the text and analysis type to use as cache key.
   * 
   * @param {string} text - Text to analyze
   * @param {string} analysisType - Type of analysis
   * @returns {string} Cache key (hash)
   * @private
   * 
   * Requirements: 7.1, 7.2
   */
  _getCacheKey(text, analysisType) {
    const hash = crypto.createHash('sha256');
    hash.update(`${analysisType}:${text}`);
    return hash.digest('hex');
  }

  /**
   * Get cached response if available and not expired
   * 
   * @param {string} cacheKey - Cache key
   * @returns {Object|null} Cached response or null if not found/expired
   * @private
   * 
   * Requirements: 7.1, 7.2
   */
  _getCachedResponse(cacheKey) {
    const cached = this.cache.get(cacheKey);
    
    if (!cached) {
      return null;
    }
    
    // Check if cache entry has expired
    const now = Date.now();
    if (now - cached.timestamp > this.CACHE_TTL) {
      // Remove expired entry
      this.cache.delete(cacheKey);
      return null;
    }
    
    console.log(`Cache hit for key: ${cacheKey.substring(0, 16)}...`);
    return cached.data;
  }

  /**
   * Store response in cache with timestamp
   * 
   * @param {string} cacheKey - Cache key
   * @param {Object|Array} data - Data to cache
   * @private
   * 
   * Requirements: 7.1, 7.2
   */
  _setCachedResponse(cacheKey, data) {
    this.cache.set(cacheKey, {
      data,
      timestamp: Date.now()
    });
    console.log(`Cached response for key: ${cacheKey.substring(0, 16)}...`);
  }

  /**
   * Clear expired cache entries
   * 
   * Removes all cache entries older than TTL.
   * Should be called periodically to prevent memory leaks.
   * 
   * @private
   * 
   * Requirements: 7.1, 7.2
   */
  _clearExpiredCache() {
    const now = Date.now();
    let clearedCount = 0;
    
    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp > this.CACHE_TTL) {
        this.cache.delete(key);
        clearedCount++;
      }
    }
    
    if (clearedCount > 0) {
      console.log(`Cleared ${clearedCount} expired cache entries`);
    }
  }

  /**
   * Delay helper for exponential backoff
   * 
   * @param {number} ms - Milliseconds to delay
   * @returns {Promise<void>}
   * @private
   */
  _delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Analyze text with specific analysis type
   * 
   * High-level method that combines prompt building, API call, and parsing.
   * Checks cache before making API calls to improve performance.
   * 
   * @param {string} text - Text to analyze
   * @param {string} analysisType - Type of analysis
   * @param {Object} options - Optional configuration
   * @returns {Promise<Object|Array>} Parsed analysis results
   * 
   * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 7.1, 7.2
   */
  async analyze(text, analysisType, options = {}) {
    try {
      // Generate cache key from text and analysis type
      const cacheKey = this._getCacheKey(text, analysisType);
      
      // Check cache first (Requirements: 7.1, 7.2)
      const cachedResult = this._getCachedResponse(cacheKey);
      if (cachedResult) {
        return cachedResult;
      }
      
      // Build the prompt
      const prompt = this.buildPrompt(text, analysisType);
      
      // Call API with retry logic
      const response = await this.callWithRetry(prompt, options);
      
      // Parse and validate response
      const parsed = this.parseResponse(response, analysisType);
      
      // Store in cache for future requests
      this._setCachedResponse(cacheKey, parsed);
      
      // Periodically clear expired cache entries (every 10th request)
      if (Math.random() < 0.1) {
        this._clearExpiredCache();
      }
      
      return parsed;
    } catch (error) {
      console.error(`Analysis failed for type ${analysisType}:`, error.message);
      throw error;
    }
  }
}

module.exports = GeminiNLPService;
