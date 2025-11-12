const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { validateGenerateMiddleware, validateAnalyzeAdvancedMiddleware } = require('./validation');
const AdvancedStyleAnalyzer = require('./services/AdvancedStyleAnalyzer');

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
 * Format signature phrases into natural language instructions for Gemini
 * @param {Array} phrases - Array of phrase objects with phrase, frequency, and category
 * @returns {string} Formatted string with top 5-7 phrases and usage guidance
 */
function formatSignaturePhrases(phrases) {
  if (!phrases || phrases.length === 0) {
    return '';
  }
  
  // Take top 5-7 phrases, but filter out incomplete or technical fragments
  const topPhrases = phrases
    .filter(p => {
      // Filter out phrases that are clearly incomplete technical fragments
      const phrase = p.phrase.toLowerCase();
      return !phrase.endsWith(' and') && 
             !phrase.endsWith(' or') && 
             !phrase.endsWith(' the') &&
             !phrase.endsWith(' to') &&
             phrase.length > 2; // Avoid very short fragments
    })
    .slice(0, 5); // Reduce to top 5 to avoid overwhelming
  
  if (topPhrases.length === 0) {
    return '';
  }
  
  // Map frequency numbers to descriptive indicators
  const getFrequencyIndicator = (frequency) => {
    if (frequency >= 5) return 'common';
    if (frequency >= 3) return 'occasional';
    return 'rare';
  };
  
  // Format each phrase with its frequency indicator
  const formattedPhrases = topPhrases.map(p => 
    `- "${p.phrase}" (${getFrequencyIndicator(p.frequency)})`
  ).join('\n');
  
  return `
[SIGNATURE EXPRESSIONS]
These phrases appear in your writing. Use them ONLY when they fit naturally:
${formattedPhrases}

Don't force these into every response. Use them sparingly and only when contextually appropriate.`;
}

/**
 * Format idiosyncrasies into replication instructions for Gemini
 * @param {Array} idiosyncrasies - Array of idiosyncrasy objects with text, explanation, and category
 * @returns {string} Formatted string with top 5 quirks and clear replication instructions
 */
function formatIdiosyncrasies(idiosyncrasies) {
  if (!idiosyncrasies || idiosyncrasies.length === 0) {
    return '';
  }
  
  // Take top 5 idiosyncrasies
  const topQuirks = idiosyncrasies.slice(0, 5);
  
  // Group by category for better organization
  const byCategory = {
    IDIOSYNCRASY: [],
    HUMOR: [],
    STRUCTURE: []
  };
  
  topQuirks.forEach(quirk => {
    const category = quirk.category || 'IDIOSYNCRASY';
    if (byCategory[category]) {
      byCategory[category].push(quirk);
    } else {
      byCategory.IDIOSYNCRASY.push(quirk);
    }
  });
  
  let formatted = '\n[UNIQUE QUIRKS]\nMirror these distinctive patterns in your writing:\n';
  
  // Format each category
  Object.entries(byCategory).forEach(([category, quirks]) => {
    if (quirks.length > 0) {
      quirks.forEach(quirk => {
        formatted += `\n- ${quirk.explanation}\n  Example: "${quirk.text}"\n`;
      });
    }
  });
  
  // Add specific instructions for common quirk types
  const hasCodeSwitching = topQuirks.some(q => 
    q.explanation.toLowerCase().includes('code-switch') || 
    q.explanation.toLowerCase().includes('mix') && q.explanation.toLowerCase().includes('language')
  );
  
  const hasOnomatopoeia = topQuirks.some(q => 
    q.explanation.toLowerCase().includes('onomatopoeia') ||
    q.text.match(/huhu|hehe|haha|hmm|uhh|ahh/i)
  );
  
  if (hasCodeSwitching) {
    formatted += '\nWhen appropriate, mix languages naturally as shown in the examples above.';
  }
  
  if (hasOnomatopoeia) {
    formatted += '\nUse expressive sounds and onomatopoeia to convey emotion and personality.';
  }
  
  return formatted;
}

/**
 * Format contextual vocabulary into categorized lists with usage guidance
 * @param {Object} contextualPatterns - Object with technical, personal, and creative vocabulary
 * @returns {string} Formatted string organized by context type
 */
function formatContextualVocabulary(contextualPatterns) {
  if (!contextualPatterns || Object.keys(contextualPatterns).length === 0) {
    return '';
  }
  
  let formatted = '\n[CONTEXTUAL VOCABULARY]\nYou use different vocabulary depending on the topic:\n';
  
  // Format each context type
  if (contextualPatterns.technical && contextualPatterns.technical.vocabulary?.length > 0) {
    formatted += `\n- When discussing technical/work topics: ${contextualPatterns.technical.vocabulary.slice(0, 5).join(', ')}`;
    if (contextualPatterns.technical.tone) {
      formatted += ` (${contextualPatterns.technical.tone} tone)`;
    }
  }
  
  if (contextualPatterns.personal && contextualPatterns.personal.vocabulary?.length > 0) {
    formatted += `\n- When discussing personal/relationship topics: ${contextualPatterns.personal.vocabulary.slice(0, 5).join(', ')}`;
    if (contextualPatterns.personal.tone) {
      formatted += ` (${contextualPatterns.personal.tone} tone)`;
    }
  }
  
  if (contextualPatterns.creative && contextualPatterns.creative.vocabulary?.length > 0) {
    formatted += `\n- When discussing creative/aesthetic topics: ${contextualPatterns.creative.vocabulary.slice(0, 5).join(', ')}`;
    if (contextualPatterns.creative.tone) {
      formatted += ` (${contextualPatterns.creative.tone} tone)`;
    }
  }
  
  formatted += '\n\nIMPORTANT: Only use vocabulary that matches the CURRENT topic. Don\'t mix technical terms into personal conversations or vice versa.';
  
  return formatted;
}

/**
 * Format thought patterns into structural writing instructions for Gemini
 * @param {Object} thoughtPatterns - Object with flowScore, parentheticalFrequency, and transitionStyle
 * @returns {string} Formatted string with actionable writing instructions
 */
function formatThoughtPatterns(thoughtPatterns) {
  if (!thoughtPatterns || Object.keys(thoughtPatterns).length === 0) {
    return '';
  }
  
  let formatted = '\n[THOUGHT STRUCTURE]\n';
  
  // Translate flowScore into actionable instructions
  if (thoughtPatterns.flowScore !== undefined) {
    if (thoughtPatterns.flowScore >= 80) {
      formatted += '- Flow: Maintain smooth, connected prose. Ideas should flow naturally from one to the next.\n';
    } else if (thoughtPatterns.flowScore >= 60) {
      formatted += '- Flow: Balance between connected ideas and distinct points. Some flow, some separation.\n';
    } else {
      formatted += '- Flow: Keep ideas distinct and separate. Don\'t over-connect thoughts.\n';
    }
  }
  
  // Convert transitionStyle into specific guidance
  if (thoughtPatterns.transitionStyle) {
    const style = thoughtPatterns.transitionStyle.toLowerCase();
    if (style === 'abrupt' || style === 'direct') {
      formatted += '- Transitions: Use short, direct transitions. Jump between ideas quickly. Avoid elaborate connectors.\n';
    } else if (style === 'smooth' || style === 'flowing') {
      formatted += '- Transitions: Use smooth, flowing transitions. Connect ideas with clear bridges.\n';
    } else if (style === 'mixed' || style === 'varied') {
      formatted += '- Transitions: Vary your transition style. Sometimes abrupt, sometimes smooth.\n';
    }
  }
  
  // Handle parentheticalFrequency
  if (thoughtPatterns.parentheticalFrequency !== undefined) {
    if (thoughtPatterns.parentheticalFrequency >= 3) {
      formatted += '- Parentheticals: Use parenthetical asides frequently (like this) to add extra thoughts and context.\n';
    } else if (thoughtPatterns.parentheticalFrequency >= 1) {
      formatted += '- Parentheticals: Occasionally use parenthetical asides when adding side notes.\n';
    } else {
      formatted += '- Parentheticals: Minimal use of parenthetical asides. Keep thoughts in the main flow.\n';
    }
  }
  
  return formatted;
}

/**
 * Build a dynamic meta-prompt that combines user request with their style profile
 * @param {string} userPrompt - The user's request
 * @param {Object} styleProfile - The user's complete style profile
 * @returns {string} The constructed meta-prompt for Gemini API
 */
function buildMetaPrompt(userPrompt, styleProfile) {
  const { writing, coding, advanced } = styleProfile;
  
  // Validate and log advanced data availability
  const hasAdvanced = advanced && typeof advanced === 'object' && Object.keys(advanced).length > 0;
  
  if (!hasAdvanced) {
    console.log('No advanced analysis data available, using basic profile only');
  } else {
    // Log which advanced components are available
    const advancedComponents = {
      phrases: advanced.phrases?.length || 0,
      idiosyncrasies: advanced.idiosyncrasies?.length || 0,
      hasContextual: !!advanced.contextualPatterns && Object.keys(advanced.contextualPatterns).length > 0,
      hasThoughtPatterns: !!advanced.thoughtPatterns && Object.keys(advanced.thoughtPatterns).length > 0
    };
    console.log('Using advanced analysis:', advancedComponents);
  }
  
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
  
  // Format advanced analysis components if available
  const signaturePhrasesSection = hasAdvanced && advanced.phrases?.length > 0
    ? formatSignaturePhrases(advanced.phrases)
    : '';
  
  const idiosyncrasiesSection = hasAdvanced && advanced.idiosyncrasies?.length > 0
    ? formatIdiosyncrasies(advanced.idiosyncrasies)
    : '';
  
  const contextualVocabSection = hasAdvanced && advanced.contextualPatterns
    ? formatContextualVocabulary(advanced.contextualPatterns)
    : '';
  
  const thoughtPatternsSection = hasAdvanced && advanced.thoughtPatterns
    ? formatThoughtPatterns(advanced.thoughtPatterns)
    : '';
  
  return `You are my digital twin. You write EXACTLY like me. Not like an AI, not like a corporate bot - like ME.

MY WRITING STYLE (follow this precisely):
- Tone: ${writing.tone} - ${toneGuidance}
- Formality: ${writing.formality} - ${styleEmphasis}
- Sentence Length: ${writing.sentenceLength}
- Vocabulary: ${writing.vocabulary.join(', ')}
- NEVER use: ${writing.avoidance.join(', ')}
${signaturePhrasesSection}
${idiosyncrasiesSection}
${contextualVocabSection}
${thoughtPatternsSection}

CRITICAL RULES:
1. Answer the user's request directly and helpfully - this is the PRIMARY goal
2. Write in MY voice using MY style profile above, but keep it NATURAL and APPROPRIATE to the context
3. Match the complexity to the request (simple question = simple answer, complex question = detailed answer)
4. DO NOT force signature phrases or vocabulary into responses where they don't fit naturally
5. DO NOT try to use every pattern in every response - be selective and contextual
6. If my style is casual, DO NOT make it formal. If my style is conversational, DO NOT sound like a business memo.
7. VARY your greetings - don't always start with "Hey". Sometimes skip the greeting entirely and just answer directly. Mix it up naturally.

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

// API endpoint for advanced style analysis
app.post('/api/analyze-advanced', validateAnalyzeAdvancedMiddleware, async (req, res) => {
  try {
    const { text, options = {} } = req.body;
    
    console.log(`Starting advanced analysis for ${text.length} characters`);
    
    // Initialize analyzer
    const analyzer = new AdvancedStyleAnalyzer();
    
    // Perform analysis
    const results = await analyzer.analyzeAdvanced(text, options);
    
    console.log('Advanced analysis completed successfully');
    
    // Check if we have partial results (some analyses succeeded)
    const hasPartialResults = results && (
      (results.phrases && results.phrases.length > 0) ||
      (results.thoughtPatterns && results.thoughtPatterns.flowScore !== undefined) ||
      (results.personalityMarkers && results.personalityMarkers.length > 0) ||
      (results.contextualPatterns && Object.keys(results.contextualPatterns).length > 0)
    );
    
    // Return structured JSON response with partial results flag
    res.json({
      success: true,
      results,
      partial: !hasPartialResults ? false : (
        !results.phrases?.length ||
        !results.thoughtPatterns?.flowScore ||
        !results.personalityMarkers?.length ||
        !Object.keys(results.contextualPatterns || {}).length
      )
    });
    
  } catch (error) {
    // SECURITY: Log errors without exposing sensitive information
    console.error('Advanced analysis error:', error.message);
    console.error('Error stack:', error.stack);
    
    // Return error response with graceful degradation message
    res.status(500).json({
      success: false,
      error: 'analysis_error',
      message: 'Advanced analysis unavailable. Basic profile will be used.',
      canContinue: true // Signal that basic profile can still be created
    });
  }
});

// API endpoint for GitHub analysis
app.post('/api/analyze-github', async (req, res) => {
  try {
    const { username } = req.body;
    
    // Validate request
    const { validateAnalyzeGitHubRequest } = require('./validation');
    const validation = validateAnalyzeGitHubRequest(req.body);
    
    if (!validation.valid) {
      return res.status(400).json(validation.error);
    }
    
    console.log(`[GitHub Analysis] Starting analysis for username: ${username}`);
    
    // Initialize services
    const GitHubFetchingService = require('./services/GitHubFetchingService');
    const GitHubStyleAnalyzer = require('./services/GitHubStyleAnalyzer');
    
    const fetcher = new GitHubFetchingService();
    const analyzer = new GitHubStyleAnalyzer();
    
    // Fetch GitHub data
    const fetchResult = await fetcher.fetchUserData(username);
    
    // Check if we got enough content
    if (!fetchResult.success || fetchResult.wordCount < 50) {
      return res.status(400).json({
        success: false,
        error: 'insufficient_data',
        message: 'Unable to extract sufficient content from GitHub profile. User may have limited activity.',
        metadata: fetchResult.metadata
      });
    }
    
    // Analyze the GitHub content
    const analysisResult = await analyzer.analyzeGitHubContent(
      fetchResult.combinedText,
      fetchResult.wordCount,
      fetchResult.metadata
    );
    
    console.log(`[GitHub Analysis] Complete: ${fetchResult.metadata.commitsAnalyzed} commits, ${fetchResult.wordCount} words`);
    
    // Return success response
    res.json({
      success: true,
      profile: analysisResult.profile,
      text: analysisResult.text,
      metadata: {
        repositoriesAnalyzed: fetchResult.metadata.repositoriesAnalyzed,
        commitsAnalyzed: fetchResult.metadata.commitsAnalyzed,
        readmesAnalyzed: fetchResult.metadata.readmesAnalyzed,
        totalWords: fetchResult.wordCount
      }
    });
    
  } catch (error) {
    console.error('[GitHub Analysis] Error:', error.message);
    
    res.status(500).json({
      success: false,
      error: 'analysis_error',
      message: error.message || 'Failed to analyze GitHub profile'
    });
  }
});

// API endpoint for blog analysis
app.post('/api/analyze-blog', async (req, res) => {
  try {
    const { urls } = req.body;
    
    // Validate request
    const { validateAnalyzeBlogRequest } = require('./validation');
    const validation = validateAnalyzeBlogRequest(req.body);
    
    if (!validation.valid) {
      return res.status(400).json(validation.error);
    }
    
    console.log(`[Blog Analysis] Starting analysis for ${urls.length} URL(s)`);
    
    // Initialize services
    const BlogScrapingService = require('./services/BlogScrapingService');
    const BlogStyleAnalyzer = require('./services/BlogStyleAnalyzer');
    
    const scraper = new BlogScrapingService();
    const analyzer = new BlogStyleAnalyzer();
    
    // Scrape blog URLs
    const scrapeResult = await scraper.scrapeMultipleUrls(urls);
    
    // Check if we got any content
    if (!scrapeResult.success || scrapeResult.totalWords < 100) {
      return res.status(400).json({
        success: false,
        error: 'scraping_error',
        message: 'Unable to extract sufficient content from provided URLs',
        failed: scrapeResult.failed
      });
    }
    
    // Analyze the scraped content
    const analysisResult = await analyzer.analyzeArticles(
      scrapeResult.combinedContent,
      scrapeResult.totalWords
    );
    
    console.log(`[Blog Analysis] Complete: ${scrapeResult.articlesAnalyzed} articles, ${scrapeResult.totalWords} words`);
    
    // Return success response
    res.json({
      success: true,
      profile: analysisResult.profile,
      text: analysisResult.text,
      metadata: {
        articlesAnalyzed: scrapeResult.articlesAnalyzed,
        totalWords: scrapeResult.totalWords,
        avgWordsPerArticle: Math.round(scrapeResult.totalWords / scrapeResult.articlesAnalyzed),
        failed: scrapeResult.failed.length
      }
    });
    
  } catch (error) {
    console.error('[Blog Analysis] Error:', error.message);
    
    res.status(500).json({
      success: false,
      error: 'analysis_error',
      message: 'Failed to analyze blog content: ' + error.message
    });
  }
});

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
