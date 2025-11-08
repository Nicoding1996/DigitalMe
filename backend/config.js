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
  
  // Gmail OAuth configuration is optional - only validate if any Gmail var is set
  const hasGmailConfig = process.env.GOOGLE_CLIENT_ID || 
                         process.env.GOOGLE_CLIENT_SECRET || 
                         process.env.TOKEN_ENCRYPTION_KEY;
  
  if (hasGmailConfig) {
    if (!process.env.GOOGLE_CLIENT_ID) {
      throw new Error('GOOGLE_CLIENT_ID is required when Gmail integration is configured');
    }
    
    if (!process.env.GOOGLE_CLIENT_SECRET) {
      throw new Error('GOOGLE_CLIENT_SECRET is required when Gmail integration is configured');
    }
    
    if (!process.env.GOOGLE_REDIRECT_URI) {
      throw new Error('GOOGLE_REDIRECT_URI is required when Gmail integration is configured');
    }
    
    if (!process.env.TOKEN_ENCRYPTION_KEY) {
      throw new Error('TOKEN_ENCRYPTION_KEY is required when Gmail integration is configured');
    }
    
    // Validate TOKEN_ENCRYPTION_KEY is 64 hex characters (32 bytes)
    const encryptionKey = process.env.TOKEN_ENCRYPTION_KEY;
    if (!/^[0-9a-fA-F]{64}$/.test(encryptionKey)) {
      throw new Error('TOKEN_ENCRYPTION_KEY must be a 64-character hexadecimal string (32 bytes)');
    }
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
  GEMINI_MODEL: process.env.GEMINI_MODEL || 'gemini-2.0-flash-exp',
  
  // Gmail OAuth Configuration (optional)
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || null,
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET || null,
  GOOGLE_REDIRECT_URI: process.env.GOOGLE_REDIRECT_URI || null,
  TOKEN_ENCRYPTION_KEY: process.env.TOKEN_ENCRYPTION_KEY || null,
  
  // Gmail API Configuration
  GMAIL_MAX_EMAILS: parseInt(process.env.GMAIL_MAX_EMAILS, 10) || 200,
  GMAIL_BATCH_SIZE: parseInt(process.env.GMAIL_BATCH_SIZE, 10) || 50,
  
  // Helper to check if Gmail integration is enabled
  isGmailEnabled() {
    return !!(this.GOOGLE_CLIENT_ID && this.GOOGLE_CLIENT_SECRET && this.TOKEN_ENCRYPTION_KEY);
  }
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
    GEMINI_API_KEY: '[REDACTED]',
    GOOGLE_CLIENT_ID: this.GOOGLE_CLIENT_ID ? '[REDACTED]' : null,
    GOOGLE_CLIENT_SECRET: '[REDACTED]',
    TOKEN_ENCRYPTION_KEY: '[REDACTED]',
    GMAIL_MAX_EMAILS: this.GMAIL_MAX_EMAILS,
    GMAIL_BATCH_SIZE: this.GMAIL_BATCH_SIZE,
    isGmailEnabled: this.isGmailEnabled()
  };
};

module.exports = config;
