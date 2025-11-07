require('dotenv').config();

/**
 * Environment configuration module
 * Loads and validates environment variables with sensible defaults
 */

// Validate required environment variables
function validateConfig() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY environment variable is required');
  }
  
  if (!apiKey.startsWith('sk-ant-')) {
    throw new Error('ANTHROPIC_API_KEY must start with "sk-ant-"');
  }
}

// Validate configuration on module load
validateConfig();

// Export configuration object
const config = {
  ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
  PORT: parseInt(process.env.PORT, 10) || 3001,
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3000',
  CLAUDE_MODEL: process.env.CLAUDE_MODEL || 'claude-3-5-sonnet-20241022'
};

module.exports = config;
