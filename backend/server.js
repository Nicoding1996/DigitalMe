const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { validateGenerateMiddleware } = require('./validation');

/**
 * SECURITY CONSIDERATIONS:
 * - API keys are never logged or exposed in responses
 * - All error messages are sanitized to prevent information leakage
 * - Configuration is validated at startup before accepting requests
 * - CORS is configured to restrict access to authorized origins only
 * - Sensitive data is never included in error responses or logs
 */

// Import and validate configuration at startup
let config;
try {
  config = require('./config');
  // SECURITY: Never log the actual API key, only confirm it's loaded
  console.log(`Configuration loaded successfully`);
  console.log(`Using Gemini model: ${config.GEMINI_MODEL}`);
} catch (error) {
  // SECURITY: Error messages are sanitized to not expose sensitive details
  console.error(`Configuration error: ${error.message}`);
  process.exit(1);
}

// Initialize Express application
const app = express();

// Configure JSON body parser middleware
app.use(express.json());

// Serve static files for OAuth callback page
app.use(express.static('public'));

// Configure CORS middleware with origin from FRONTEND_URL
app.use(cors({
  origin: config.FRONTEND_URL,
  credentials: true
}));

// Add Cross-Origin-Opener-Policy header to allow popup communication
app.use((req, res, next) => {
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
  res.setHeader('Cross-Origin-Embedder-Policy', 'unsafe-none');
  next();
});

// Basic health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Gmail OAuth routes (if Gmail integration is enabled)
if (config.isGmailEnabled()) {
  const { router: gmailAuthRouter } = require('./routes/gmailAuth');
  app.use('/api/auth/gmail', gmailAuthRouter);
  app.use('/api/gmail', gmailAuthRouter);
  console.log('Gmail integration enabled');
} else {
  console.log('Gmail integration disabled (missing configuration)');
}

/**
 * Build a dynamic meta-prompt that combines user request with their style profile
 * @param {string} userPrompt - The user's request
 * @param {Object} styleProfile - The user's complete style profile
 * @returns {string} The constructed meta-prompt for Gemini API
 */
function buildMetaPrompt(userPrompt, styleProfile) {
  const { writing, coding } = styleProfile;
  
  // Build style emphasis based on formality level
  const styleEmphasis = writing.formality === 'casual' || writing.formality === 'informal'
    ? 'CRITICAL: Write like you\'re texting a friend. Use casual language. NO formal business speak. NO corporate jargon. Sound human and relaxed.'
    : writing.formality === 'formal'
    ? 'Maintain a professional, polished tone appropriate for formal communication.'
    : 'IMPORTANT: Keep it conversational and natural. Avoid overly formal or stiff language.';
  
  const toneGuidance = writing.tone === 'conversational'
    ? 'Sound like a REAL PERSON talking, not an AI assistant. Be natural, relaxed, and genuine.'
    : writing.tone === 'professional'
    ? 'Maintain professional standards while being clear and direct.'
    : 'Keep it straightforward and genuine.';
  
  return `You are my digital twin. You write EXACTLY like me. Not like an AI, not like a corporate bot - like ME.

MY WRITING STYLE (follow this precisely):
- Tone: ${writing.tone} - ${toneGuidance}
- Formality: ${writing.formality} - ${styleEmphasis}
- Sentence Length: ${writing.sentenceLength}
- Vocabulary: ${writing.vocabulary.join(', ')}
- NEVER use: ${writing.avoidance.join(', ')}

CRITICAL RULES:
1. Answer the user's request directly and helpfully
2. Write in MY voice using MY style profile above - this is non-negotiable
3. Match the complexity to the request (simple question = simple answer, complex question = detailed answer)
4. If my style is casual, DO NOT make it formal. If my style is conversational, DO NOT sound like a business memo.

${writing.formality === 'casual' ? `
CRITICAL OVERRIDE: This user writes CASUALLY. That means:
- NO phrases like "I wanted to send a quick note" or "I realize the timing is inconvenient"
- NO words like "genuinely", "consequently", "ensure", "asynchronously"
- YES to simple, direct language like "hey", "I'm sick", "can't make it"
- Keep it SHORT and NATURAL like you're texting
- Write like a human, not a business email template
` : ''}

CODING STYLE (when writing code):
- Language: ${coding.language}
- Framework: ${coding.framework}
- Style: ${coding.componentStyle}
- Naming: ${coding.namingConvention}
- Comments: ${coding.commentFrequency}
- Patterns: ${coding.patterns.join(', ')}

USER REQUEST:
${userPrompt}

Respond in MY voice, matching MY style exactly.`;
}

// API endpoint for generating AI responses
// Validation middleware is applied here
app.post('/api/generate', validateGenerateMiddleware, async (req, res) => {
  try {
    const { prompt, styleProfile } = req.body;
    
    // Initialize Google Generative AI client with API key from configuration
    const genAI = new GoogleGenerativeAI(config.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: config.GEMINI_MODEL });
    
    // Log the style profile being used for debugging
    console.log('Style Profile:', JSON.stringify({
      tone: styleProfile.writing.tone,
      formality: styleProfile.writing.formality,
      sentenceLength: styleProfile.writing.sentenceLength
    }));
    
    // Construct dynamic meta-prompt with user's personal style profile
    const metaPrompt = buildMetaPrompt(prompt, styleProfile);
    
    const enhancedPrompt = metaPrompt;
    
    // Set appropriate response headers for streaming
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Transfer-Encoding', 'chunked');
    
    // Configure Gemini API call to use streaming mode with enhanced prompt
    const result = await model.generateContentStream(enhancedPrompt);
    
    // Handle streaming interruptions and cleanup
    req.on('close', () => {
      console.log('Client disconnected, cleaning up stream');
    });
    
    // Forward each chunk from Gemini API to the client as it arrives
    for await (const chunk of result.stream) {
      // Extract text from chunk
      const chunkText = chunk.text();
      
      if (chunkText) {
        // Forward chunk to client
        res.write(chunkText);
      }
    }
    
    console.log('Stream completed successfully');
    
    // Close the connection gracefully when streaming completes
    res.end();
    
  } catch (error) {
    // SECURITY: Log errors without exposing sensitive information
    // Never log API keys, tokens, or full request/response bodies
    console.error('Gemini API streaming error:', error.message);
    
    // SECURITY: Return generic error message to client
    // Do not expose internal error details, API keys, or system information
    if (!res.headersSent) {
      res.status(500).json({
        error: 'api_error',
        message: 'Failed to generate response from AI service'
      });
    } else {
      // If streaming already started, just end the response
      res.end();
    }
  }
});

// Start server on configured PORT
const server = app.listen(config.PORT, () => {
  console.log(`Backend Proxy Service listening on port ${config.PORT}`);
  console.log(`Accepting requests from: ${config.FRONTEND_URL}`);
});

// Handle port-in-use errors gracefully
server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`Error: Port ${config.PORT} is already in use`);
    console.error('Please choose a different port or stop the process using this port');
    process.exit(1);
  } else {
    // SECURITY: Log error message only, not full error object which might contain sensitive data
    console.error(`Server error: ${error.message}`);
    process.exit(1);
  }
});

// Graceful shutdown handling
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('\nSIGINT signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});

module.exports = app;
