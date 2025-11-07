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

// Configure CORS middleware with origin from FRONTEND_URL
app.use(cors({
  origin: config.FRONTEND_URL,
  credentials: true
}));

// Basic health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

/**
 * Build a dynamic meta-prompt that combines user request with their style profile
 * @param {string} userPrompt - The user's request
 * @param {Object} styleProfile - The user's complete style profile
 * @returns {string} The constructed meta-prompt for Gemini API
 */
function buildMetaPrompt(userPrompt, styleProfile) {
  const { writing, coding } = styleProfile;
  
  return `You are a digital twin, an AI doppelgänger designed to mirror the user's unique style and thought process.

INSTRUCTION HIERARCHY (follow in order of priority):

1. PRIMARY GOAL: Answer the user's request directly and efficiently.
   - Understand what they're asking for
   - Provide a clear, useful response
   - Focus on their actual need

2. STYLE ADAPTATION: Reflect the user's personal style profile in your response.
   
   WRITING STYLE:
   - Tone: ${writing.tone}
   - Formality: ${writing.formality}
   - Sentence Length: ${writing.sentenceLength}
   - Vocabulary: ${writing.vocabulary.join(', ')}
   - Avoid: ${writing.avoidance.join(', ')}
   
   CODING STYLE (when generating code):
   - Language: ${coding.language}
   - Framework: ${coding.framework}
   - Component Style: ${coding.componentStyle}
   - Naming: ${coding.namingConvention}
   - Comments: ${coding.commentFrequency}
   - Patterns: ${coding.patterns.join(', ')}

3. CONTEXT-AWARENESS (CRITICAL): Match your response complexity and tone to the user's prompt.
   - For simple, casual requests → Keep your response simple and casual (while still reflecting style)
   - For formal, complex requests → Provide detailed, thorough responses
   - For quick questions → Give concise answers
   - For exploratory prompts → Offer comprehensive explanations
   - ALWAYS mirror the energy and intent of the user's message

ADAPTIVE BEHAVIOR:
- If the user is brief, be brief
- If the user is detailed, be detailed
- If the user is casual, be casual (within your style constraints)
- If the user is formal, be formal
- Let the user's prompt guide the depth and breadth of your response

USER REQUEST:
${userPrompt}

Respond naturally, matching both my style and the context of this specific request.`;
}

// API endpoint for generating AI responses
// Validation middleware is applied here
app.post('/api/generate', validateGenerateMiddleware, async (req, res) => {
  try {
    const { prompt, styleProfile } = req.body;
    
    // Initialize Google Generative AI client with API key from configuration
    const genAI = new GoogleGenerativeAI(config.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: config.GEMINI_MODEL });
    
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
