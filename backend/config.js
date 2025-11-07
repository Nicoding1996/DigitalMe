require('dotenv').config();

/**
 * Environment configuration module
 * Loads and validates environment variables with sensible defaults
 * 
 * SECURITY CONSIDERATIONS:
 * - API keys are loaded from environment variables only, never hardcoded
 * - API keys are never logged or exposed in any output
 * - Configuration validation happens at startup to fail fast
 * - Sensitive values are kept in memory only and not written to disk
 */

// Validate required environment variables
function validateConfig() {
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY environment variable is required');
  }
  
  if (!apiKey.startsWith('AIza')) {
    throw new Error('GEMINI_API_KEY must start with "AIza"');
  }
}

// Validate configuration on module load
validateConfig();

// Export configuration object
const config = {
  // SECURITY: API key is stored in memory only and never logged
  GEMINI_API_KEY: process.env.GEMINI_API_KEY,
  PORT: parseInt(process.env.PORT, 10) || 3001,
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3000',
  GEMINI_MODEL: process.env.GEMINI_MODEL || 'gemini-2.0-flash-exp'
};

// Override toString to prevent accidental logging of sensitive data
config.toString = function() {
  return '[Configuration Object - Sensitive Data Hidden]';
};

// Override JSON.stringify to prevent accidental serialization of API key
config.toJSON = function() {
  return {
    PORT: this.PORT,
    FRONTEND_URL: this.FRONTEND_URL,
    GEMINI_MODEL: this.GEMINI_MODEL,
    GEMINI_API_KEY: '[REDACTED]'
  };
};

module.exports = config;
