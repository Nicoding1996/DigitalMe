/**
 * StyleAnalyzer Service
 * Analyzes digital footprint sources to build user style profiles
 * Mock implementation with simulated delays for MVP
 */

import {
  generateId,
  generateMockCodingStyle,
  generateMockWritingStyle,
  mockGitHubRepos,
  mockBlogPosts
} from '../models';

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Simulate async delay for realistic mock behavior
 * @param {number} ms - Milliseconds to delay
 * @returns {Promise<void>}
 */
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Simulate progress updates during analysis
 * @param {Function} onProgress - Progress callback
 * @param {string[]} steps - Analysis steps
 * @returns {Promise<void>}
 */
const simulateProgress = async (onProgress, steps) => {
  for (let i = 0; i < steps.length; i++) {
    await delay(800);
    if (onProgress) {
      onProgress({
        step: i + 1,
        total: steps.length,
        message: steps[i],
        progress: ((i + 1) / steps.length) * 100
      });
    }
  }
};

// ============================================================================
// WEIGHT CALCULATION FOR MULTI-SOURCE MERGING
// ============================================================================

/**
 * Calculate the weight for a data source based on quality and quantity
 * @param {Object} source - Source object with type and analysis result
 * @param {string} source.type - Source type ('gmail', 'text', 'blog')
 * @param {Object} source.result - Analysis result with metrics
 * @returns {number} Calculated weight (0.0 - 2.0 range before normalization)
 */
export const calculateSourceWeight = (source) => {
  // Quality weight mapping based on source type
  const qualityWeights = {
    gmail: 1.0,  // Natural, unedited writing
    text: 0.8,   // User-provided samples
    blog: 0.6    // Polished, edited content
  };

  // Get quality weight, default to 0.5 for invalid types
  const qualityWeight = qualityWeights[source.type] || 0.5;

  // Extract word count from source metadata
  let wordCount = 500; // Default if missing

  if (source.result && source.result.metrics) {
    const metrics = source.result.metrics;
    
    // Different sources store word count in different places
    if (source.type === 'gmail') {
      // Gmail stores in profile.sampleCount.emailWords or metrics.wordCount
      const rawCount = metrics.wordCount ?? source.result.profile?.sampleCount?.emailWords;
      wordCount = (rawCount !== undefined && rawCount !== null) ? rawCount : 500;
    } else if (source.type === 'text') {
      // Text samples store in metrics.wordCount
      const rawCount = metrics.wordCount;
      wordCount = (rawCount !== undefined && rawCount !== null) ? rawCount : 500;
    } else if (source.type === 'blog') {
      // Blog stores in metrics.totalWords
      const rawCount = metrics.totalWords;
      wordCount = (rawCount !== undefined && rawCount !== null) ? rawCount : 500;
    }
  }

  // Handle edge case: zero word count
  if (wordCount === 0) {
    wordCount = 100;
  }

  // Calculate quantity factor based on word count thresholds
  let quantityFactor;
  if (wordCount < 500) {
    quantityFactor = 0.5;
  } else if (wordCount <= 1500) {
    quantityFactor = 1.0;
  } else {
    quantityFactor = 1.5;
  }

  // Return final weight: quality × quantity
  return qualityWeight * quantityFactor;
};

/**
 * Normalize source weights to sum to 1.0
 * @param {Array<Object>} sourcesWithWeights - Sources with calculated weights
 * @returns {Array<Object>} Sources with normalized weights
 */
export const normalizeWeights = (sourcesWithWeights) => {
  // Handle edge case: empty array
  if (!sourcesWithWeights || sourcesWithWeights.length === 0) {
    return [];
  }

  // Handle edge case: single source
  if (sourcesWithWeights.length === 1) {
    return [{
      ...sourcesWithWeights[0],
      weight: 1.0
    }];
  }

  // Calculate sum of all weights
  const totalWeight = sourcesWithWeights.reduce((sum, source) => sum + (source.weight || 0), 0);

  // Handle edge case: sum is zero - assign equal weights
  if (totalWeight === 0) {
    const equalWeight = 1.0 / sourcesWithWeights.length;
    return sourcesWithWeights.map(source => ({
      ...source,
      weight: equalWeight
    }));
  }

  // Normalize weights to sum to 1.0
  return sourcesWithWeights.map(source => ({
    ...source,
    weight: (source.weight || 0) / totalWeight
  }));
};

// ============================================================================
// ATTRIBUTE MERGING FUNCTIONS
// ============================================================================

/**
 * Merge tone attributes using weighted voting strategy
 * @param {Array<Object>} sources - Sources with normalized weights and writing styles
 * @returns {Object} Merged tone and attribution data
 */
export const mergeTone = (sources) => {
  // Initialize vote tally for all possible tone values
  const voteTally = {
    conversational: 0,
    professional: 0,
    neutral: 0
  };

  // Track which sources contributed to each tone for attribution
  const sourceContributions = {
    conversational: [],
    professional: [],
    neutral: []
  };

  // Accumulate weighted votes for each tone
  sources.forEach(source => {
    // Extract tone from source (handle different result structures)
    const writingStyle = source.result?.writingStyle || source.result?.profile?.writing;
    if (!writingStyle || !writingStyle.tone) return;

    const tone = writingStyle.tone;
    const weight = source.weight || 0;

    // Add weight to the tally for this tone
    if (voteTally.hasOwnProperty(tone)) {
      voteTally[tone] += weight;
      sourceContributions[tone].push({
        type: source.type,
        weight: weight
      });
    }
  });

  // Find the tone with the highest total weight
  let maxWeight = -1;
  let selectedTone = 'neutral'; // Default fallback
  let tiedTones = [];

  for (const [tone, weight] of Object.entries(voteTally)) {
    if (weight > maxWeight) {
      maxWeight = weight;
      selectedTone = tone;
      tiedTones = [tone];
    } else if (weight === maxWeight && weight > 0) {
      tiedTones.push(tone);
    }
  }

  // Handle ties: select tone from highest-quality source
  if (tiedTones.length > 1) {
    // Quality order: gmail (1.0) > text (0.8) > blog (0.6)
    const qualityOrder = ['gmail', 'text', 'blog'];
    
    for (const sourceType of qualityOrder) {
      for (const tone of tiedTones) {
        const hasSourceType = sourceContributions[tone].some(s => s.type === sourceType);
        if (hasSourceType) {
          selectedTone = tone;
          break;
        }
      }
      if (selectedTone) break;
    }
  }

  // Generate attribution data
  const attribution = sourceContributions[selectedTone].map(contrib => ({
    type: contrib.type,
    contribution: Math.round(contrib.weight * 100)
  }));

  return {
    value: selectedTone,
    attribution: attribution
  };
};

/**
 * Merge formality attributes using weighted averaging strategy
 * @param {Array<Object>} sources - Sources with normalized weights and writing styles
 * @returns {Object} Merged formality and attribution data
 */
export const mergeFormality = (sources) => {
  // Map formality values to numeric scores
  const formalityScores = {
    casual: 0,
    balanced: 1,
    formal: 2
  };

  // Track source contributions for attribution
  const sourceContributions = [];
  let weightedSum = 0;

  // Calculate weighted average of formality scores
  sources.forEach(source => {
    // Extract formality from source (handle different result structures)
    const writingStyle = source.result?.writingStyle || source.result?.profile?.writing;
    if (!writingStyle || !writingStyle.formality) return;

    const formality = writingStyle.formality;
    const weight = source.weight || 0;

    // Map formality to numeric score
    const score = formalityScores[formality];
    if (score !== undefined) {
      weightedSum += score * weight;
      sourceContributions.push({
        type: source.type,
        weight: weight,
        formality: formality,
        score: score
      });
    }
  });

  // Map averaged score back to formality value
  let mergedFormality = 'balanced'; // Default fallback
  
  if (weightedSum < 0.5) {
    mergedFormality = 'casual';
  } else if (weightedSum <= 1.5) {
    mergedFormality = 'balanced';
  } else {
    mergedFormality = 'formal';
  }

  // Generate attribution data - show all contributing sources
  const attribution = sourceContributions.map(contrib => ({
    type: contrib.type,
    contribution: Math.round(contrib.weight * 100)
  }));

  return {
    value: mergedFormality,
    attribution: attribution,
    averageScore: parseFloat(weightedSum.toFixed(2))
  };
};

// ============================================================================
// GITHUB ANALYSIS
// ============================================================================

/**
 * Analyze GitHub repositories to extract coding style
 * @param {string} username - GitHub username
 * @param {Function} onProgress - Optional progress callback
 * @returns {Promise<Object>} Analysis results
 */
export const analyzeGitHub = async (username, onProgress = null) => {
  const steps = [
    'Fetching repositories...',
    'Analyzing code patterns...',
    'Extracting naming conventions...',
    'Identifying framework preferences...',
    'Building coding profile...'
  ];

  await simulateProgress(onProgress, steps);

  // Simulate API delay
  await delay(1000);

  // Mock analysis results
  const codingStyle = generateMockCodingStyle();
  
  return {
    success: true,
    username,
    repositories: mockGitHubRepos,
    codingStyle,
    metrics: {
      totalRepos: mockGitHubRepos.length,
      totalStars: mockGitHubRepos.reduce((sum, repo) => sum + repo.stars, 0),
      primaryLanguage: 'JavaScript',
      linesAnalyzed: 15420,
      filesAnalyzed: 234
    },
    analyzedAt: Date.now()
  };
};

/**
 * Validate GitHub username format
 * @param {string} username - GitHub username to validate
 * @returns {boolean} True if valid
 */
export const validateGitHubUsername = (username) => {
  if (!username || typeof username !== 'string') return false;
  // GitHub username rules: alphanumeric and hyphens, 1-39 chars
  const regex = /^[a-zA-Z0-9](?:[a-zA-Z0-9]|-(?=[a-zA-Z0-9])){0,38}$/;
  return regex.test(username);
};

// ============================================================================
// BLOG ANALYSIS
// ============================================================================

/**
 * Analyze blog posts to extract writing style
 * @param {string[]} urls - Array of blog URLs
 * @param {Function} onProgress - Optional progress callback
 * @returns {Promise<Object>} Analysis results
 */
export const analyzeBlog = async (urls, onProgress = null) => {
  const steps = [
    'Fetching blog content...',
    'Parsing articles...',
    'Analyzing writing patterns...',
    'Extracting vocabulary...',
    'Building writing profile...'
  ];

  await simulateProgress(onProgress, steps);

  // Simulate network delay
  await delay(1200);

  // Mock analysis results
  const writingStyle = generateMockWritingStyle();
  
  return {
    success: true,
    urls,
    posts: mockBlogPosts,
    writingStyle,
    metrics: {
      totalPosts: mockBlogPosts.length,
      totalWords: mockBlogPosts.reduce((sum, post) => sum + post.wordCount, 0),
      avgWordsPerPost: Math.round(
        mockBlogPosts.reduce((sum, post) => sum + post.wordCount, 0) / mockBlogPosts.length
      ),
      vocabularySize: 1847,
      readingLevel: 'Advanced'
    },
    analyzedAt: Date.now()
  };
};

/**
 * Validate blog URL format
 * @param {string} url - Blog URL to validate
 * @returns {boolean} True if valid
 */
export const validateBlogUrl = (url) => {
  if (!url || typeof url !== 'string') return false;
  try {
    const urlObj = new URL(url);
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
  } catch {
    return false;
  }
};

// ============================================================================
// TEXT SAMPLE ANALYSIS
// ============================================================================

/**
 * Analyze text samples to extract writing style
 * @param {string} text - Text sample to analyze
 * @param {Function} onProgress - Optional progress callback
 * @returns {Promise<Object>} Analysis results
 */
export const analyzeTextSample = async (text, onProgress = null) => {
  const steps = [
    'Processing text sample...',
    'Analyzing sentence structure...',
    'Extracting style patterns...',
    'Building writing profile...'
  ];

  await simulateProgress(onProgress, steps);

  // Simulate processing delay
  await delay(800);

  const lowerText = text.toLowerCase();
  const wordCount = text.trim().split(/\s+/).length;
  const sentenceCount = text.split(/[.!?]+/).filter(s => s.trim().length > 0).length;
  const avgWordsPerSentence = Math.round(wordCount / sentenceCount);

  // Determine sentence length category
  let sentenceLength = 'medium';
  if (avgWordsPerSentence < 15) sentenceLength = 'short';
  if (avgWordsPerSentence > 25) sentenceLength = 'long';

  // Detect tone from text content
  const casualMarkers = ['yeah', 'gonna', 'wanna', 'kinda', 'sorta', 'hey', 'cool', 'awesome', 'kind of', 'i would say', 'thank god'];
  const formalMarkers = ['therefore', 'furthermore', 'consequently', 'nevertheless', 'accordingly', 'moreover'];
  const conversationalMarkers = ['i think', 'you know', 'basically', 'actually', 'honestly', 'i notice', 'i make'];
  
  const hasCasual = casualMarkers.some(marker => lowerText.includes(marker));
  const hasFormal = formalMarkers.some(marker => lowerText.includes(marker));
  const hasConversational = conversationalMarkers.some(marker => lowerText.includes(marker));
  
  let tone = 'neutral';
  if (hasCasual || hasConversational) tone = 'conversational';
  if (hasFormal) tone = 'professional';
  
  // Detect formality - be more aggressive about detecting casual style
  const contractions = (text.match(/\b\w+'\w+\b/g) || []).length;
  const hasContractions = contractions > 0; // Any contractions = casual
  const hasRunOnSentences = avgWordsPerSentence > 30;
  const hasStreamOfConsciousness = lowerText.includes('and') && avgWordsPerSentence > 25;
  
  let formality = 'balanced';
  if (hasContractions || hasCasual || hasRunOnSentences || hasStreamOfConsciousness) {
    formality = 'casual';
  }
  if (hasFormal && !hasCasual) {
    formality = 'formal';
  }
  
  // Detect vocabulary style
  const hasEmojis = /[\u{1F300}-\u{1F9FF}]/u.test(text);
  const hasExclamations = (text.match(/!/g) || []).length > sentenceCount * 0.3;
  
  const vocabulary = [];
  if (avgWordsPerSentence > 20) vocabulary.push('descriptive');
  if (avgWordsPerSentence < 15) vocabulary.push('concise');
  if (!hasEmojis && !hasExclamations) vocabulary.push('straightforward');
  if (hasConversational) vocabulary.push('relatable');
  if (vocabulary.length === 0) vocabulary.push('clear', 'direct');
  
  const avoidance = [];
  if (!hasEmojis) avoidance.push('emojis');
  if (!hasExclamations) avoidance.push('excessive-punctuation');
  if (!hasCasual) avoidance.push('slang');

  const writingStyle = {
    tone,
    formality,
    sentenceLength,
    vocabulary,
    avoidance: avoidance.length > 0 ? avoidance : ['none']
  };

  return {
    success: true,
    writingStyle,
    metrics: {
      wordCount,
      sentenceCount,
      avgWordsPerSentence,
      characterCount: text.length,
      paragraphCount: text.split(/\n\n+/).filter(p => p.trim().length > 0).length
    },
    analyzedAt: Date.now()
  };
};

/**
 * Validate text sample (minimum length requirement)
 * @param {string} text - Text to validate
 * @param {number} minWords - Minimum word count (default: 100)
 * @returns {Object} Validation result with message
 */
export const validateTextSample = (text, minWords = 100) => {
  if (!text || typeof text !== 'string') {
    return { valid: false, message: 'Text sample is required' };
  }

  const wordCount = text.trim().split(/\s+/).length;
  
  if (wordCount < minWords) {
    return {
      valid: false,
      message: `Text sample too short. Need at least ${minWords} words, got ${wordCount}.`
    };
  }

  return { valid: true, message: 'Valid text sample' };
};

// ============================================================================
// STYLE PROFILE BUILDER
// ============================================================================

/**
 * Build unified style profile from multiple sources
 * @param {Object[]} sources - Array of analysis results from different sources
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Complete style profile
 */
export const buildStyleProfile = async (sources, userId = 'user-1') => {
  await delay(500);

  // Combine coding styles from GitHub sources
  const codingSources = sources.filter(s => s.type === 'github' && s.result?.codingStyle);
  const codingStyle = codingSources.length > 0
    ? codingSources[0].result.codingStyle
    : generateMockCodingStyle();

  // Combine writing styles from blog, text, and Gmail sources
  // PRIORITY: Gmail (real analyzed emails), text samples, then blog
  const writingSources = sources.filter(
    s => (s.type === 'blog' || s.type === 'text' || s.type === 'gmail') && (s.result?.writingStyle || s.result?.profile?.writing)
  );
  
  // Prioritize Gmail since it contains real analyzed emails
  const gmailSource = writingSources.find(s => s.type === 'gmail');
  const textSource = writingSources.find(s => s.type === 'text');
  const writingStyle = gmailSource?.result?.profile?.writing
    || textSource?.result?.writingStyle
    || writingSources[0]?.result?.writingStyle
    || generateMockWritingStyle();

  // Calculate total metrics
  const totalCodeLines = codingSources.reduce(
    (sum, s) => sum + (s.result?.metrics?.linesAnalyzed || 0),
    0
  );
  const totalTextWords = writingSources.reduce(
    (sum, s) => sum + (s.result?.metrics?.totalWords || s.result?.metrics?.wordCount || s.result?.profile?.sampleCount?.textWords || 0),
    0
  );
  const totalRepos = codingSources.reduce(
    (sum, s) => sum + (s.result?.metrics?.totalRepos || 0),
    0
  );
  const totalArticles = writingSources.filter(s => s.type === 'blog').reduce(
    (sum, s) => sum + (s.result?.metrics?.totalPosts || 0),
    0
  );
  const totalEmails = writingSources.filter(s => s.type === 'gmail').reduce(
    (sum, s) => sum + (s.result?.profile?.sampleCount?.emails || 0),
    0
  );

  // Calculate confidence based on data quantity and quality
  const dataPoints = sources.length;
  
  // Base confidence from number of sources
  let confidence = 0.5 + (dataPoints * 0.15);
  
  // Boost confidence based on data quantity
  if (totalTextWords >= 500) confidence += 0.05;
  if (totalTextWords >= 1000) confidence += 0.05;
  if (totalTextWords >= 2000) confidence += 0.05;
  
  if (totalCodeLines >= 500) confidence += 0.05;
  if (totalCodeLines >= 2000) confidence += 0.05;
  
  if (totalEmails >= 10) confidence += 0.05;
  if (totalEmails >= 50) confidence += 0.05;
  
  // Cap at 95%
  confidence = Math.min(0.95, confidence);

  const profile = {
    id: generateId(),
    userId,
    version: 1,
    lastUpdated: Date.now(),
    coding: codingStyle,
    writing: writingStyle,
    confidence: parseFloat(confidence.toFixed(2)),
    sampleCount: {
      codeLines: totalCodeLines,
      textWords: totalTextWords,
      repositories: totalRepos,
      articles: totalArticles
    }
  };

  return {
    success: true,
    profile,
    sourcesAnalyzed: sources.length,
    createdAt: Date.now()
  };
};

/**
 * Recalculate style profile when sources change
 * @param {Object} currentProfile - Current style profile
 * @param {Object[]} newSources - Updated sources array
 * @returns {Promise<Object>} Updated style profile
 */
export const recalculateStyleProfile = async (currentProfile, newSources) => {
  await delay(1000);

  const result = await buildStyleProfile(newSources, currentProfile.userId);
  
  return {
    ...result.profile,
    version: currentProfile.version + 1,
    previousVersion: currentProfile.version
  };
};

// ============================================================================
// ERROR SIMULATION
// ============================================================================

/**
 * Simulate analysis error for testing error handling
 * @param {string} sourceType - Type of source that failed
 * @param {string} reason - Error reason
 * @returns {Object} Error result
 */
export const simulateAnalysisError = (sourceType, reason = 'Network error') => {
  return {
    success: false,
    error: {
      type: sourceType,
      message: `Failed to analyze ${sourceType}: ${reason}`,
      code: 'ANALYSIS_ERROR',
      timestamp: Date.now()
    }
  };
};
