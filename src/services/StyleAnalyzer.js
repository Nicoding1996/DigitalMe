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
  const casualMarkers = ['yeah', 'gonna', 'wanna', 'kinda', 'sorta', 'hey', 'cool', 'awesome'];
  const formalMarkers = ['therefore', 'furthermore', 'consequently', 'nevertheless', 'accordingly'];
  const conversationalMarkers = ['i think', 'you know', 'basically', 'actually', 'honestly'];
  
  const hasCasual = casualMarkers.some(marker => lowerText.includes(marker));
  const hasFormal = formalMarkers.some(marker => lowerText.includes(marker));
  const hasConversational = conversationalMarkers.some(marker => lowerText.includes(marker));
  
  let tone = 'neutral';
  if (hasCasual || hasConversational) tone = 'conversational';
  if (hasFormal) tone = 'professional';
  
  // Detect formality
  const contractions = (text.match(/\b\w+'\w+\b/g) || []).length;
  const hasContractions = contractions > wordCount * 0.02;
  const formality = hasContractions ? 'casual' : 'balanced';
  
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

  // Combine writing styles from blog and text sources
  const writingSources = sources.filter(
    s => (s.type === 'blog' || s.type === 'text') && s.result?.writingStyle
  );
  const writingStyle = writingSources.length > 0
    ? writingSources[0].result.writingStyle
    : generateMockWritingStyle();

  // Calculate total metrics
  const totalCodeLines = codingSources.reduce(
    (sum, s) => sum + (s.result?.metrics?.linesAnalyzed || 0),
    0
  );
  const totalTextWords = writingSources.reduce(
    (sum, s) => sum + (s.result?.metrics?.totalWords || s.result?.metrics?.wordCount || 0),
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

  // Calculate confidence based on data quantity
  const dataPoints = sources.length;
  const confidence = Math.min(0.95, 0.5 + (dataPoints * 0.15));

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
