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

// Configure JSON body parser middleware with increased size limit
// Needed for large style profiles, conversation history, and Gmail data
app.use(express.json({ limit: '10mb' }));

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

// Health check endpoint with service status
app.get('/api/health', async (req, res) => {
  try {
    const health = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      services: {
        gemini: 'available',
        gmail: config.isGmailEnabled() ? 'available' : 'unavailable'
      }
    };
    
    res.json(health);
  } catch (error) {
    res.status(503).json({
      status: 'degraded',
      timestamp: new Date().toISOString(),
      services: {
        gemini: 'unknown',
        gmail: 'unknown'
      }
    });
  }
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

// Profile refinement routes (Living Profile feature)
const profileRefineRouter = require('./routes/profileRefine');
app.use('/api/profile', profileRefineRouter);
console.log('Profile refinement endpoint enabled');

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
      // Validate phrase object has required properties
      if (!p || !p.phrase || typeof p.phrase !== 'string') {
        return false;
      }
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
  
  // Take top 5 idiosyncrasies and validate they have required properties
  const topQuirks = idiosyncrasies
    .filter(q => q && q.text && q.explanation && typeof q.text === 'string' && typeof q.explanation === 'string')
    .slice(0, 5);
  
  if (topQuirks.length === 0) {
    return '';
  }
  
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
    q.explanation && q.explanation.toLowerCase().includes('code-switch') || 
    q.explanation && q.explanation.toLowerCase().includes('mix') && q.explanation.toLowerCase().includes('language')
  );
  
  const hasOnomatopoeia = topQuirks.some(q => 
    (q.explanation && q.explanation.toLowerCase().includes('onomatopoeia')) ||
    (q.text && q.text.match(/huhu|hehe|haha|hmm|uhh|ahh/i))
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
  if (thoughtPatterns.transitionStyle && typeof thoughtPatterns.transitionStyle === 'string') {
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
 * Detect if user prompt is a refinement instruction
 * @param {string} prompt - User's request
 * @returns {Object} { isRefinement: boolean, type: string|null }
 */
function detectRefinementInstruction(prompt) {
  const lowerPrompt = prompt.toLowerCase().trim();
  
  // Length/complexity refinements
  const lengthPatterns = [
    { pattern: /\b(make it |can you make it |make this |make that )?shorter\b/, type: 'shorter' },
    { pattern: /\b(make it |can you make it |make this |make that )?longer\b/, type: 'longer' },
    { pattern: /\b(more|add) detail(s|ed)?\b/, type: 'more_detail' },
    { pattern: /\b(simplif(y|ied)|simpler|make it simple)\b/, type: 'simpler' },
    { pattern: /\b(more|make it more) concise\b/, type: 'shorter' }
  ];
  
  // Tone/style refinements
  const tonePatterns = [
    { pattern: /\b(make it |sound )?more (fun|funny|playful|casual)\b/, type: 'more_fun' },
    { pattern: /\b(make it |sound )?more formal\b/, type: 'more_formal' },
    { pattern: /\b(make it |sound )?more (serious|professional)\b/, type: 'more_serious' },
    { pattern: /\b(make it |sound )?more casual\b/, type: 'more_casual' },
    { pattern: /\b(lighten it up|make it lighter)\b/, type: 'lighter' }
  ];
  
  // Structure refinements
  const structurePatterns = [
    { pattern: /\b(use |add |include )?bullet points\b/, type: 'bullet_points' },
    { pattern: /\b(as a |write it as a )?paragraph(s)?\b/, type: 'paragraph' },
    { pattern: /\b(give me |show me )?steps\b/, type: 'steps' },
    { pattern: /\bexplain like (i'm|im) (5|five)\b/i, type: 'eli5' }
  ];
  
  // Content refinements
  const contentPatterns = [
    { pattern: /\b(add|include|give me) example(s)?\b/, type: 'add_examples' },
    { pattern: /\b(remove|without|skip) (the )?(technical )?jargon\b/, type: 'remove_jargon' },
    { pattern: /\bfocus on\b/, type: 'focus' }
  ];
  
  // Check all patterns
  const allPatterns = [...lengthPatterns, ...tonePatterns, ...structurePatterns, ...contentPatterns];
  
  for (const { pattern, type } of allPatterns) {
    if (pattern.test(lowerPrompt)) {
      return { isRefinement: true, type };
    }
  }
  
  return { isRefinement: false, type: null };
}

/**
 * Build a dynamic meta-prompt that combines user request with their style profile
 * @param {string} userPrompt - The user's request
 * @param {Object} styleProfile - The user's complete style profile
 * @param {Array} conversationHistory - Previous messages for context (already filtered by CMD)
 * @returns {string} The constructed meta-prompt for Gemini API
 */
function buildMetaPrompt(userPrompt, styleProfile, conversationHistory = []) {
  const { writing, coding, advanced } = styleProfile;
  
  // Detect if this is a refinement instruction
  const refinement = detectRefinementInstruction(userPrompt);
  
  // Format conversation history if provided
  const conversationContext = conversationHistory.length > 0
    ? `\n\nCONVERSATION HISTORY (for context):\n${conversationHistory.map(msg => 
        `${msg.role === 'user' ? 'USER' : 'YOU'}: ${msg.content}`
      ).join('\n\n')}\n`
    : '';
  
  // Validate and log advanced data availability
  const hasAdvanced = advanced && typeof advanced === 'object' && Object.keys(advanced).length > 0;
  
  if (!hasAdvanced) {
    console.log('No advanced analysis data available, using basic profile only');
  } else {
    // Log which advanced components are available
    const advancedComponents = {
      phrases: advanced.phrases?.length || 0,
      personalityMarkers: advanced.personalityMarkers?.length || 0,
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
  
  const idiosyncrasiesSection = hasAdvanced && advanced.personalityMarkers?.length > 0
    ? formatIdiosyncrasies(advanced.personalityMarkers)
    : '';
  
  const contextualVocabSection = hasAdvanced && advanced.contextualPatterns
    ? formatContextualVocabulary(advanced.contextualPatterns)
    : '';
  
  const thoughtPatternsSection = hasAdvanced && advanced.thoughtPatterns
    ? formatThoughtPatterns(advanced.thoughtPatterns)
    : '';
  
  // Build refinement override instructions if detected
  let refinementOverride = '';
  if (refinement.isRefinement && conversationHistory.length > 0) {
    refinementOverride = `\n\n[REFINEMENT REQUEST DETECTED]
The user is asking you to REFINE your previous response. This is a revision request, not a new question.

Refinement type: ${refinement.type}

CRITICAL INSTRUCTIONS:
- Look at your previous response in the conversation history above
- Apply the requested change to that SAME content
- Generate a NEW, REVISED version of that response
- DO NOT reference the previous version as if it was already sent
- DO NOT say things like "here's a shorter version" or "let me revise that"
- Just provide the refined content directly

`;

    // Add specific guidance based on refinement type
    if (refinement.type === 'shorter') {
      refinementOverride += `- REDUCE word count significantly\n- Cut unnecessary details\n- Keep only essential information\n- OVERRIDE the "long sentences" style preference for this response\n`;
    } else if (refinement.type === 'longer' || refinement.type === 'more_detail') {
      refinementOverride += `- ADD more detail and explanation\n- Expand on key points\n- Include examples if relevant\n`;
    } else if (refinement.type === 'simpler') {
      refinementOverride += `- Use simpler language\n- Break down complex concepts\n- Avoid technical jargon\n- Use shorter sentences\n`;
    } else if (refinement.type === 'more_fun' || refinement.type === 'lighter') {
      refinementOverride += `- Use a more playful, fun tone\n- Add humor if appropriate\n- Be more casual and relaxed\n- OVERRIDE the formality setting for this response\n`;
    } else if (refinement.type === 'more_formal' || refinement.type === 'more_serious') {
      refinementOverride += `- Use more formal language\n- Be more professional\n- Remove casual expressions\n- OVERRIDE the casual style setting for this response\n`;
    } else if (refinement.type === 'more_casual') {
      refinementOverride += `- Use more casual language\n- Be more relaxed and conversational\n- OVERRIDE the formal style setting for this response\n`;
    } else if (refinement.type === 'bullet_points') {
      refinementOverride += `- Reformat as bullet points\n- Keep the same information\n- Make it scannable\n`;
    } else if (refinement.type === 'paragraph') {
      refinementOverride += `- Reformat as flowing paragraphs\n- Connect ideas smoothly\n- Remove bullet points\n`;
    }
  }
  
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
8. NEVER include preambles like "Okay, here's a [thing] written in your style:" - just deliver the content directly. You are a mirror, not a service.

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
${conversationContext}
${refinementOverride}
${conversationHistory.length > 0 && !refinement.isRefinement ? `
IMPORTANT CONTEXT RULES:
- The conversation history above shows previous messages in this SAME conversation
- Use this context to provide relevant, coherent responses
- Build on previous topics naturally when appropriate
- Maintain conversational continuity
` : ''}
Respond in MY voice, matching MY style exactly${refinement.isRefinement ? ', but PRIORITIZE the refinement instruction above over default style settings' : ''}.`;
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
    const { prompt, styleProfile, conversationHistory = [] } = req.body;
    
    // Initialize Google Generative AI client with API key from configuration
    const genAI = new GoogleGenerativeAI(config.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: config.GEMINI_MODEL });
    
    // Log the style profile being used for debugging
    console.log('Style Profile:', JSON.stringify({
      tone: styleProfile.writing.tone,
      formality: styleProfile.writing.formality,
      sentenceLength: styleProfile.writing.sentenceLength
    }));
    
    // Construct dynamic meta-prompt with user's personal style profile and conversation history
    const metaPrompt = buildMetaPrompt(prompt, styleProfile, conversationHistory);
    
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
