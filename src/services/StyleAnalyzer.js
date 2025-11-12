/**
 * StyleAnalyzer Service
 * Analyzes digital footprint sources to build user style profiles
 * Mock implementation with simulated delays for MVP
 */

import {
  generateId,
  generateMockCodingStyle,
  generateMockWritingStyle,
  generateEmptyAdvancedAnalysis,
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
    gmail: 1.0,     // Natural, unedited writing (gold standard)
    existing: 0.9,  // Previously analyzed profile (high quality, already validated)
    text: 0.85,     // User-provided samples (benefit of doubt for authenticity)
    blog: 0.65,     // Polished, edited content (still personal voice)
    github: 0.7     // Technical but authentic (commit messages, comments)
  };

  // Get quality weight, default to 0.5 for invalid types
  const qualityWeight = qualityWeights[source.type] || 0.5;

  // Extract word count from source metadata
  let wordCount = 500; // Default if missing

  // Different sources store word count in different places
  if (source.type === 'gmail') {
    // Gmail stores in profile.sampleCount.emailWords or metadata.wordCount
    const rawCount = source.result?.profile?.sampleCount?.emailWords ?? source.result?.metadata?.wordCount ?? source.result?.metrics?.wordCount;
    wordCount = (rawCount !== undefined && rawCount !== null) ? rawCount : 500;
  } else if (source.type === 'existing') {
    // Existing profile stores in profile.sampleCount (textWords or emailWords)
    const rawCount = source.result?.profile?.sampleCount?.textWords ?? source.result?.profile?.sampleCount?.emailWords ?? source.result?.metrics?.wordCount;
    wordCount = (rawCount !== undefined && rawCount !== null) ? rawCount : 500;
  } else if (source.type === 'text') {
    // Text samples store in metrics.wordCount
    const rawCount = source.result?.metrics?.wordCount;
    wordCount = (rawCount !== undefined && rawCount !== null) ? rawCount : 500;
  } else if (source.type === 'blog') {
    // Blog stores in metrics.totalWords
    const rawCount = source.result?.metrics?.totalWords;
    wordCount = (rawCount !== undefined && rawCount !== null) ? rawCount : 500;
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

    // Normalize tone value to handle invalid values
    const tone = normalizeTone(writingStyle.tone);
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

    // Normalize formality value to handle invalid values
    const formality = normalizeFormality(writingStyle.formality);
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

/**
 * Merge sentence length attributes using weighted voting strategy
 * @param {Array<Object>} sources - Sources with normalized weights and writing styles
 * @returns {Object} Merged sentence length and attribution data
 */
export const mergeSentenceLength = (sources) => {
  // Initialize vote tally for all possible sentence length values
  const voteTally = {
    short: 0,
    medium: 0,
    long: 0
  };

  // Track which sources contributed to each sentence length for attribution
  const sourceContributions = {
    short: [],
    medium: [],
    long: []
  };

  // Accumulate weighted votes for each sentence length
  sources.forEach(source => {
    // Extract sentence length from source (handle different result structures)
    const writingStyle = source.result?.writingStyle || source.result?.profile?.writing;
    if (!writingStyle || !writingStyle.sentenceLength) return;

    // Normalize sentence length value to handle invalid values
    const sentenceLength = normalizeSentenceLength(writingStyle.sentenceLength);
    const weight = source.weight || 0;

    // Add weight to the tally for this sentence length
    if (voteTally.hasOwnProperty(sentenceLength)) {
      voteTally[sentenceLength] += weight;
      sourceContributions[sentenceLength].push({
        type: source.type,
        weight: weight
      });
    }
  });

  // Find the sentence length with the highest total weight
  let maxWeight = -1;
  let selectedSentenceLength = 'medium'; // Default fallback
  let tiedSentenceLengths = [];

  for (const [sentenceLength, weight] of Object.entries(voteTally)) {
    if (weight > maxWeight) {
      maxWeight = weight;
      selectedSentenceLength = sentenceLength;
      tiedSentenceLengths = [sentenceLength];
    } else if (weight === maxWeight && weight > 0) {
      tiedSentenceLengths.push(sentenceLength);
    }
  }

  // Handle ties: select sentence length from highest-quality source
  if (tiedSentenceLengths.length > 1) {
    // Quality order: gmail (1.0) > text (0.8) > blog (0.6)
    const qualityOrder = ['gmail', 'text', 'blog'];
    
    for (const sourceType of qualityOrder) {
      for (const sentenceLength of tiedSentenceLengths) {
        const hasSourceType = sourceContributions[sentenceLength].some(s => s.type === sourceType);
        if (hasSourceType) {
          selectedSentenceLength = sentenceLength;
          break;
        }
      }
      if (selectedSentenceLength) break;
    }
  }

  // Generate attribution data
  const attribution = sourceContributions[selectedSentenceLength].map(contrib => ({
    type: contrib.type,
    contribution: Math.round(contrib.weight * 100)
  }));

  return {
    value: selectedSentenceLength,
    attribution: attribution
  };
};

/**
 * Merge vocabulary attributes using weighted union strategy
 * @param {Array<Object>} sources - Sources with normalized weights and writing styles
 * @returns {Object} Merged vocabulary and attribution data
 */
export const mergeVocabulary = (sources) => {
  // Create a term score map to accumulate weights for each vocabulary term
  const termScores = {};
  
  // Track which sources contributed to each term for attribution
  const termSources = {};

  // Accumulate weights for each vocabulary term across all sources
  sources.forEach(source => {
    // Extract vocabulary from source (handle different result structures)
    const writingStyle = source.result?.writingStyle || source.result?.profile?.writing;
    if (!writingStyle || !writingStyle.vocabulary || !Array.isArray(writingStyle.vocabulary)) return;

    const vocabulary = writingStyle.vocabulary;
    const weight = source.weight || 0;

    // For each term in this source's vocabulary, add the source's weight to its score
    vocabulary.forEach(term => {
      if (!term || typeof term !== 'string') return;

      // Initialize term score if not exists
      if (!termScores[term]) {
        termScores[term] = 0;
        termSources[term] = [];
      }

      // Add this source's weight to the term's total score
      termScores[term] += weight;
      
      // Track source contribution for attribution
      termSources[term].push({
        type: source.type,
        weight: weight
      });
    });
  });

  // Convert term scores to array and sort by score (descending)
  const sortedTerms = Object.entries(termScores)
    .sort((a, b) => b[1] - a[1]) // Sort by score descending
    .map(([term, score]) => ({ term, score }));

  // Select top 4 terms with highest scores
  const topTerms = sortedTerms.slice(0, 4);
  const mergedVocabulary = topTerms.map(t => t.term);

  // Generate attribution data for the selected terms
  const attribution = {};
  topTerms.forEach(({ term }) => {
    attribution[term] = termSources[term].map(contrib => ({
      type: contrib.type,
      contribution: Math.round(contrib.weight * 100)
    }));
  });

  return {
    value: mergedVocabulary,
    attribution: attribution,
    termScores: topTerms.reduce((acc, { term, score }) => {
      acc[term] = parseFloat(score.toFixed(2));
      return acc;
    }, {})
  };
};

/**
 * Merge avoidance attributes using weighted intersection strategy
 * @param {Array<Object>} sources - Sources with normalized weights and writing styles
 * @returns {Object} Merged avoidance and attribution data
 */
export const mergeAvoidance = (sources) => {
  // Create a term frequency map tracking count and total weight for each avoidance term
  const termFrequency = {};
  
  // Track which sources contributed to each term for attribution
  const termSources = {};

  // Total number of sources (for calculating appearance percentage)
  const totalSources = sources.length;

  // Accumulate frequency and weights for each avoidance term across all sources
  sources.forEach(source => {
    // Extract avoidance from source (handle different result structures)
    const writingStyle = source.result?.writingStyle || source.result?.profile?.writing;
    if (!writingStyle || !writingStyle.avoidance || !Array.isArray(writingStyle.avoidance)) return;

    const avoidance = writingStyle.avoidance;
    const weight = source.weight || 0;

    // For each term in this source's avoidance list (skip 'none')
    avoidance.forEach(term => {
      if (!term || typeof term !== 'string' || term === 'none') return;

      // Initialize term frequency if not exists
      if (!termFrequency[term]) {
        termFrequency[term] = {
          count: 0,
          totalWeight: 0
        };
        termSources[term] = [];
      }

      // Increment count and add weight
      termFrequency[term].count += 1;
      termFrequency[term].totalWeight += weight;
      
      // Track source contribution for attribution
      termSources[term].push({
        type: source.type,
        weight: weight
      });
    });
  });

  // Calculate appearance percentage for each term
  const termsWithPercentage = Object.entries(termFrequency).map(([term, data]) => ({
    term,
    count: data.count,
    totalWeight: data.totalWeight,
    appearancePercentage: (data.count / totalSources) * 100
  }));

  // Strategy 1: Select terms appearing in ≥50% of sources
  let selectedTerms = termsWithPercentage.filter(t => t.appearancePercentage >= 50);

  // Strategy 2: Fallback to terms with total weight >0.6 if no terms meet 50% threshold
  if (selectedTerms.length === 0) {
    selectedTerms = termsWithPercentage.filter(t => t.totalWeight > 0.6);
  }

  // Strategy 3: Return ['none'] if no terms qualify
  if (selectedTerms.length === 0) {
    return {
      value: ['none'],
      attribution: [],
      strategy: 'none'
    };
  }

  // Sort by appearance percentage (descending), then by total weight (descending)
  selectedTerms.sort((a, b) => {
    if (b.appearancePercentage !== a.appearancePercentage) {
      return b.appearancePercentage - a.appearancePercentage;
    }
    return b.totalWeight - a.totalWeight;
  });

  // Limit to maximum 3 terms
  const topTerms = selectedTerms.slice(0, 3);
  const mergedAvoidance = topTerms.map(t => t.term);

  // Determine which strategy was used
  const strategy = topTerms[0].appearancePercentage >= 50 ? 'intersection' : 'weighted';

  // Generate attribution data for the selected terms
  const attribution = {};
  topTerms.forEach(({ term }) => {
    attribution[term] = termSources[term].map(contrib => ({
      type: contrib.type,
      contribution: Math.round(contrib.weight * 100)
    }));
  });

  return {
    value: mergedAvoidance,
    attribution: attribution,
    strategy: strategy,
    termStats: topTerms.reduce((acc, { term, count, totalWeight, appearancePercentage }) => {
      acc[term] = {
        count,
        totalWeight: parseFloat(totalWeight.toFixed(2)),
        appearancePercentage: parseFloat(appearancePercentage.toFixed(1))
      };
      return acc;
    }, {})
  };
};

// ============================================================================
// SOURCE ATTRIBUTION METADATA
// ============================================================================

/**
 * Generate source attribution metadata from merge function results
 * @param {Object} attributions - Attribution data from merge functions
 * @param {Object} attributions.tone - Tone merge result with attribution
 * @param {Object} attributions.formality - Formality merge result with attribution
 * @param {Object} attributions.sentenceLength - Sentence length merge result with attribution
 * @param {Object} attributions.vocabulary - Vocabulary merge result with attribution
 * @param {Object} attributions.avoidance - Avoidance merge result with attribution
 * @returns {Object} Formatted attribution metadata
 */
export const generateSourceAttribution = (attributions) => {
  const sourceAttribution = {};

  // Process tone attribution
  if (attributions.tone) {
    sourceAttribution.tone = {
      value: attributions.tone.value,
      sources: attributions.tone.attribution.map(contrib => ({
        type: contrib.type,
        contribution: Math.round(contrib.contribution) // Ensure integer 0-100
      }))
    };
  }

  // Process formality attribution
  if (attributions.formality) {
    sourceAttribution.formality = {
      value: attributions.formality.value,
      sources: attributions.formality.attribution.map(contrib => ({
        type: contrib.type,
        contribution: Math.round(contrib.contribution) // Ensure integer 0-100
      }))
    };
  }

  // Process sentence length attribution
  if (attributions.sentenceLength) {
    sourceAttribution.sentenceLength = {
      value: attributions.sentenceLength.value,
      sources: attributions.sentenceLength.attribution.map(contrib => ({
        type: contrib.type,
        contribution: Math.round(contrib.contribution) // Ensure integer 0-100
      }))
    };
  }

  // Process vocabulary attribution
  if (attributions.vocabulary) {
    sourceAttribution.vocabulary = {
      value: attributions.vocabulary.value,
      sources: {}
    };

    // For vocabulary, attribution is per-term
    Object.entries(attributions.vocabulary.attribution).forEach(([term, contribs]) => {
      sourceAttribution.vocabulary.sources[term] = contribs.map(contrib => ({
        type: contrib.type,
        contribution: Math.round(contrib.contribution) // Ensure integer 0-100
      }));
    });
  }

  // Process avoidance attribution
  if (attributions.avoidance) {
    sourceAttribution.avoidance = {
      value: attributions.avoidance.value,
      sources: {}
    };

    // For avoidance, attribution is per-term (unless value is ['none'])
    if (attributions.avoidance.value[0] !== 'none') {
      Object.entries(attributions.avoidance.attribution).forEach(([term, contribs]) => {
        sourceAttribution.avoidance.sources[term] = contribs.map(contrib => ({
          type: contrib.type,
          contribution: Math.round(contrib.contribution) // Ensure integer 0-100
        }));
      });
    } else {
      // If avoidance is ['none'], sources is empty object
      sourceAttribution.avoidance.sources = {};
    }
  }

  return sourceAttribution;
};

// ============================================================================
// ERROR HANDLING AND VALIDATION
// ============================================================================

/**
 * Validate that a source has all required style attributes
 * @param {Object} source - Source object to validate
 * @returns {boolean} True if source is valid, false otherwise
 */
export const validateSource = (source) => {
  // Check if source exists
  if (!source || typeof source !== 'object') {
    console.warn('Invalid source: source is null or not an object');
    return false;
  }

  // Extract writing style from source (handle different result structures)
  const writingStyle = source.result?.writingStyle || source.result?.profile?.writing;
  
  // Check if writing style exists
  if (!writingStyle || typeof writingStyle !== 'object') {
    console.warn(`Source ${source.type || 'unknown'} missing writingStyle or profile.writing`);
    return false;
  }

  // Check for required attributes
  const requiredAttributes = ['tone', 'formality', 'sentenceLength', 'vocabulary', 'avoidance'];
  const missingFields = [];

  for (const attr of requiredAttributes) {
    if (writingStyle[attr] === undefined || writingStyle[attr] === null) {
      missingFields.push(attr);
    }
  }

  // Log warning if any fields are missing
  if (missingFields.length > 0) {
    console.warn(
      `Source ${source.type || 'unknown'} missing required fields: ${missingFields.join(', ')}`
    );
    return false;
  }

  return true;
};

/**
 * Normalize tone value to valid option, mapping invalid values to 'neutral'
 * @param {string} tone - Tone value to normalize
 * @returns {string} Normalized tone value
 */
export const normalizeTone = (tone) => {
  const validTones = ['conversational', 'professional', 'neutral'];
  
  if (!tone || typeof tone !== 'string') {
    console.warn(`Invalid tone value "${tone}", defaulting to "neutral"`);
    return 'neutral';
  }

  const normalizedTone = tone.toLowerCase().trim();
  
  if (!validTones.includes(normalizedTone)) {
    console.warn(`Unrecognized tone value "${tone}", mapping to "neutral"`);
    return 'neutral';
  }

  return normalizedTone;
};

/**
 * Normalize formality value to valid option, mapping invalid values to 'balanced'
 * @param {string} formality - Formality value to normalize
 * @returns {string} Normalized formality value
 */
export const normalizeFormality = (formality) => {
  const validFormality = ['casual', 'balanced', 'formal'];
  
  if (!formality || typeof formality !== 'string') {
    console.warn(`Invalid formality value "${formality}", defaulting to "balanced"`);
    return 'balanced';
  }

  const normalizedFormality = formality.toLowerCase().trim();
  
  if (!validFormality.includes(normalizedFormality)) {
    console.warn(`Unrecognized formality value "${formality}", mapping to "balanced"`);
    return 'balanced';
  }

  return normalizedFormality;
};

/**
 * Normalize sentence length value to valid option, mapping invalid values to 'medium'
 * @param {string} sentenceLength - Sentence length value to normalize
 * @returns {string} Normalized sentence length value
 */
export const normalizeSentenceLength = (sentenceLength) => {
  const validSentenceLengths = ['short', 'medium', 'long'];
  
  if (!sentenceLength || typeof sentenceLength !== 'string') {
    console.warn(`Invalid sentence length value "${sentenceLength}", defaulting to "medium"`);
    return 'medium';
  }

  const normalizedLength = sentenceLength.toLowerCase().trim();
  
  if (!validSentenceLengths.includes(normalizedLength)) {
    console.warn(`Unrecognized sentence length value "${sentenceLength}", mapping to "medium"`);
    return 'medium';
  }

  return normalizedLength;
};

/**
 * Get default writing style for when all sources are invalid
 * @returns {Object} Default writing style with low confidence
 */
const getDefaultWritingStyle = () => {
  return {
    writingStyle: {
      tone: 'neutral',
      formality: 'balanced',
      sentenceLength: 'medium',
      vocabulary: ['clear', 'direct', 'concise', 'relatable'],
      avoidance: ['none']
    },
    sourceAttribution: {},
    confidence: 0.30,
    sourcesUsed: 0
  };
};

// ============================================================================
// MAIN MERGING ORCHESTRATOR
// ============================================================================

/**
 * Merge writing styles from multiple sources using weighted averaging algorithm
 * @param {Array<Object>} sources - Array of source objects with analysis results
 * @returns {Object} Merged writing style with attribution metadata
 */
export const mergeWritingStyles = (sources) => {
  // Filter sources to only include those with valid writing styles
  const validSources = sources.filter(source => validateSource(source));

  // Handle edge case: return default style if no valid sources
  if (validSources.length === 0) {
    console.warn('No valid sources found for merging. Returning default style with confidence 0.3');
    return getDefaultWritingStyle();
  }

  // Calculate weights for each source
  const sourcesWithWeights = validSources.map(source => ({
    ...source,
    weight: calculateSourceWeight(source)
  }));

  // Normalize weights to sum to 1.0
  const normalizedSources = normalizeWeights(sourcesWithWeights);

  // Merge each attribute using appropriate strategy
  const toneResult = mergeTone(normalizedSources);
  const formalityResult = mergeFormality(normalizedSources);
  const sentenceLengthResult = mergeSentenceLength(normalizedSources);
  const vocabularyResult = mergeVocabulary(normalizedSources);
  const avoidanceResult = mergeAvoidance(normalizedSources);

  // Calculate confidence score
  const confidence = calculateMergedConfidence(validSources);

  // Generate source attribution metadata
  const sourceAttribution = generateSourceAttribution({
    tone: toneResult,
    formality: formalityResult,
    sentenceLength: sentenceLengthResult,
    vocabulary: vocabularyResult,
    avoidance: avoidanceResult
  });

  // Return complete merged style object
  return {
    writingStyle: {
      tone: toneResult.value,
      formality: formalityResult.value,
      sentenceLength: sentenceLengthResult.value,
      vocabulary: vocabularyResult.value,
      avoidance: avoidanceResult.value
    },
    sourceAttribution,
    confidence,
    sourcesUsed: validSources.length
  };
};

// ============================================================================
// CONFIDENCE CALCULATION
// ============================================================================

/**
 * Detect spam/duplication within a single text source
 * Checks for repeated sentences that indicate copy-paste behavior
 * @param {string} text - Text to analyze
 * @returns {boolean} True if spam detected (< 30% unique sentences)
 */
const detectSpam = (text) => {
  if (!text || typeof text !== 'string' || text.length < 100) {
    return false; // Too short to analyze
  }

  // Split into sentences
  const sentences = text
    .split(/[.!?]+/)
    .map(s => s.trim().toLowerCase())
    .filter(s => s.length > 10); // Ignore very short sentences

  if (sentences.length < 5) {
    return false; // Too few sentences to detect spam
  }

  // Count unique sentences
  const uniqueSentences = new Set(sentences);
  const uniqueRatio = uniqueSentences.size / sentences.length;

  // If less than 30% unique sentences = likely spam/copy-paste
  return uniqueRatio < 0.3;
};

/**
 * Calculate vocabulary diversity across all sources
 * Measures unique words vs total words to detect extremely low variety
 * Note: Natural repetition across sources (style patterns) is expected and good
 * @param {Array<Object>} sources - All sources with text data
 * @returns {number} Diversity ratio (0.0 - 1.0)
 */
const calculateVocabularyDiversity = (sources) => {
  const allWords = new Set();
  let totalWords = 0;

  sources.forEach(source => {
    let text = '';

    // Extract text from different source types
    if (source.type === 'text' && source.result?.text) {
      text = source.result.text;
    } else if (source.type === 'gmail' && source.result?.profile?.metadata?.emailTexts) {
      text = source.result.profile.metadata.emailTexts.join(' ');
    } else if (source.type === 'blog' && source.result?.text) {
      text = source.result.text;
    }

    if (text) {
      // Extract words (ignore punctuation, short words)
      const words = text
        .toLowerCase()
        .replace(/[^\w\s]/g, '') // Remove punctuation
        .split(/\s+/)
        .filter(w => w.length > 3); // Ignore very short words (the, and, etc.)

      words.forEach(w => allWords.add(w));
      totalWords += words.length;
    }
  });

  // Return diversity ratio (unique words / total words)
  return totalWords > 0 ? allWords.size / totalWords : 0;
};

/**
 * Calculate confidence score for merged profile based on total word count and quality indicators
 * Uses research-based thresholds for linguistic style analysis accuracy
 * Includes spam detection and vocabulary diversity checks
 * @param {Array<Object>} sources - All sources with metadata
 * @returns {number} Confidence score (0.20 - 0.95)
 */
export const calculateMergedConfidence = (sources) => {
  // Handle edge case: no sources
  if (!sources || sources.length === 0) {
    return 0.30;
  }

  // Calculate total word count and check for spam
  let totalWordCount = 0;
  let hasSpam = false;

  sources.forEach(source => {
    let wordCount = 0;
    let text = '';

    // Extract word count and text based on source type
    if (source.type === 'gmail') {
      wordCount = source.result?.profile?.sampleCount?.emailWords ?? 
                  source.result?.metadata?.wordCount ?? 
                  source.result?.metrics?.wordCount ?? 0;
      text = source.result?.profile?.metadata?.emailTexts?.join(' ') || '';
    } else if (source.type === 'existing') {
      wordCount = source.result?.profile?.sampleCount?.textWords ?? 
                  source.result?.profile?.sampleCount?.emailWords ?? 
                  source.result?.metrics?.wordCount ?? 0;
      // Existing profiles don't have raw text
    } else if (source.type === 'text') {
      wordCount = source.result?.metrics?.wordCount ?? 0;
      text = source.result?.text || '';
    } else if (source.type === 'blog') {
      wordCount = source.result?.metrics?.totalWords ?? 0;
      text = source.result?.text || '';
    } else if (source.type === 'github') {
      wordCount = source.result?.metrics?.wordCount ?? 0;
      // GitHub text not used for spam detection
    }

    // Check for spam within this source
    if (text && detectSpam(text)) {
      hasSpam = true;
      console.warn(`[Quality Check] Spam detected in ${source.type} source`);
    }

    totalWordCount += wordCount;
  });

  // Base confidence from word count (logarithmic curve based on NLP research)
  // 500 words: minimum for basic style detection
  // 1,500 words: reliable tone and vocabulary patterns
  // 3,000 words: strong style profile with quirks
  // 5,000+ words: highly accurate personality markers
  let baseConfidence;
  if (totalWordCount < 100) {
    baseConfidence = 0.20; // Insufficient data
  } else if (totalWordCount < 500) {
    baseConfidence = 0.35; // Basic patterns only
  } else if (totalWordCount < 1500) {
    baseConfidence = 0.55; // Minimum viable - tone detectable
  } else if (totalWordCount < 3000) {
    baseConfidence = 0.70; // Good - reliable style profile
  } else if (totalWordCount < 5000) {
    baseConfidence = 0.80; // Strong - quirks and patterns clear
  } else if (totalWordCount < 10000) {
    baseConfidence = 0.88; // Excellent - high accuracy
  } else {
    baseConfidence = 0.92; // Optimal - personality markers strong
  }

  // QUALITY PENALTY 1: Spam detection (copy-paste within single source)
  if (hasSpam) {
    baseConfidence *= 0.5; // 50% penalty for detected spam
    console.warn('[Quality Check] Applying 50% penalty for spam detection');
  }

  // QUALITY PENALTY 2: Extremely low vocabulary diversity
  // Only penalize VERY low diversity (< 0.15) to catch extreme cases
  // Natural repetition across sources (style patterns) is expected and good
  const diversity = calculateVocabularyDiversity(sources);
  if (diversity < 0.15 && totalWordCount > 500) {
    baseConfidence *= 0.7; // 30% penalty for extremely low diversity
    console.warn(`[Quality Check] Applying 30% penalty for low diversity (${(diversity * 100).toFixed(1)}%)`);
  }

  // Quality bonuses (max +8% total)
  let bonuses = 0;
  
  // Diverse contexts: multiple source types provide varied writing contexts
  // This is GOOD - repeated phrases across sources = consistent style patterns
  const sourceTypes = new Set(sources.map(s => s.type));
  if (sourceTypes.size >= 2) {
    bonuses += 0.03; // +3% for source diversity
  }
  
  // Consistent patterns: multiple sources allow cross-validation
  // This is GOOD - validates that patterns are genuine, not one-off
  if (sources.length >= 2) {
    bonuses += 0.03; // +3% for pattern consistency
  }
  
  // Advanced analysis successful: deeper linguistic analysis completed
  const hasAdvanced = sources.some(s => 
    s.result?.profile?.advanced || s.result?.advanced
  );
  if (hasAdvanced) {
    bonuses += 0.02; // +2% for advanced analysis
  }

  // Final confidence (capped at 95% - perfect replication is impossible)
  const finalConfidence = Math.min(0.95, baseConfidence + bonuses);

  // Round result to 2 decimal places
  return parseFloat(finalConfidence.toFixed(2));
};

// ============================================================================
// GITHUB ANALYSIS
// ============================================================================

/**
 * Analyze GitHub repositories to extract communication style
 * @param {string} username - GitHub username
 * @param {Function} onProgress - Optional progress callback
 * @returns {Promise<Object>} Analysis results
 */
export const analyzeGitHub = async (username, onProgress = null) => {
  const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:3001';
  
  try {
    // Show progress
    if (onProgress) {
      onProgress({ message: 'Fetching GitHub data...', progress: 20 });
    }
    
    // Call backend API
    const response = await fetch(`${backendUrl}/api/analyze-github`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username })
    });
    
    if (onProgress) {
      onProgress({ message: 'Analyzing communication style...', progress: 60 });
    }
    
    const data = await response.json();
    
    if (!response.ok) {
      return {
        success: false,
        error: {
          message: data.message || 'Failed to analyze GitHub profile'
        }
      };
    }
    
    if (onProgress) {
      onProgress({ message: 'Building style profile...', progress: 90 });
    }
    
    // Return in expected format
    return {
      success: true,
      writingStyle: data.profile.writing,
      text: data.text, // For advanced analysis
      metrics: {
        wordCount: data.metadata.totalWords,
        totalRepos: data.metadata.repositoriesAnalyzed,
        commitsAnalyzed: data.metadata.commitsAnalyzed
      },
      analyzedAt: Date.now()
    };
    
  } catch (error) {
    console.error('[GitHub Analysis] Error:', error);
    return {
      success: false,
      error: {
        message: error.message || 'Network error occurred while analyzing GitHub'
      }
    };
  }
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
  const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:3001';
  
  try {
    // Show progress
    if (onProgress) {
      onProgress({ message: 'Fetching blog content...', progress: 20 });
    }
    
    // Call backend API
    const response = await fetch(`${backendUrl}/api/analyze-blog`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ urls })
    });
    
    if (onProgress) {
      onProgress({ message: 'Analyzing writing patterns...', progress: 60 });
    }
    
    const data = await response.json();
    
    if (!response.ok) {
      return {
        success: false,
        error: {
          message: data.message || 'Failed to analyze blog content',
          failed: data.failed || []
        }
      };
    }
    
    if (onProgress) {
      onProgress({ message: 'Building writing profile...', progress: 90 });
    }
    
    // Return in expected format
    return {
      success: true,
      writingStyle: data.profile.writing,
      text: data.text, // For advanced analysis
      metrics: {
        totalWords: data.metadata.totalWords,
        totalPosts: data.metadata.articlesAnalyzed,
        avgWordsPerPost: data.metadata.avgWordsPerArticle
      },
      analyzedAt: Date.now()
    };
    
  } catch (error) {
    console.error('[Blog Analysis] Error:', error);
    return {
      success: false,
      error: {
        message: error.message || 'Network error occurred while analyzing blog'
      }
    };
  }
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
    text, // Store original text for advanced analysis
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
// ADVANCED ANALYSIS VALIDATION AND MIGRATION
// ============================================================================

/**
 * Validate advanced analysis structure
 * @param {Object} advancedAnalysis - Advanced analysis object to validate
 * @returns {boolean} True if valid, false otherwise
 */
export const isValidAdvancedAnalysis = (advancedAnalysis) => {
  // Check if advancedAnalysis exists and is an object
  if (!advancedAnalysis || typeof advancedAnalysis !== 'object') {
    return false;
  }

  // Check for required fields
  const hasRequiredFields = 
    'phrases' in advancedAnalysis &&
    'thoughtPatterns' in advancedAnalysis &&
    'personalityMarkers' in advancedAnalysis &&
    'contextualPatterns' in advancedAnalysis;

  if (!hasRequiredFields) {
    return false;
  }

  // Validate phrases array
  if (!Array.isArray(advancedAnalysis.phrases)) {
    return false;
  }

  // Validate personalityMarkers array
  if (!Array.isArray(advancedAnalysis.personalityMarkers)) {
    return false;
  }

  // Validate contextualPatterns object
  if (typeof advancedAnalysis.contextualPatterns !== 'object') {
    return false;
  }

  // thoughtPatterns can be null or an object
  if (advancedAnalysis.thoughtPatterns !== null && typeof advancedAnalysis.thoughtPatterns !== 'object') {
    return false;
  }

  return true;
};

/**
 * Migrate profile to add empty advanced field if missing
 * @param {Object} profile - Style profile to migrate
 * @returns {Object} Migrated profile with advanced field
 */
export const migrateProfile = (profile) => {
  // Check if profile exists
  if (!profile || typeof profile !== 'object') {
    console.warn('Cannot migrate invalid profile');
    return profile;
  }

  // Check if advanced field already exists
  if ('advanced' in profile) {
    // Profile already has advanced field, no migration needed
    return profile;
  }

  // Add empty advanced field for backward compatibility
  const migratedProfile = {
    ...profile,
    advanced: generateEmptyAdvancedAnalysis()
  };

  console.log(`Migrated profile ${profile.id} to include advanced field`);
  return migratedProfile;
};

// ============================================================================
// STYLE PROFILE BUILDER
// ============================================================================

/**
 * Build unified style profile from multiple sources
 * @param {Object[]} sources - Array of analysis results from different sources
 * @param {string} userId - User ID
 * @param {Object} [advancedAnalysis] - Optional advanced analysis results to merge
 * @returns {Promise<Object>} Complete style profile
 */
export const buildStyleProfile = async (sources, userId = 'user-1', advancedAnalysis = null) => {
  await delay(500);

  // Combine coding styles from GitHub sources
  const codingSources = sources.filter(s => s.type === 'github' && s.result?.codingStyle);
  const codingStyle = codingSources.length > 0
    ? codingSources[0].result.codingStyle
    : generateMockCodingStyle();

  // Combine writing styles from blog, text, Gmail, GitHub, and existing profile sources using merging algorithm
  const writingSources = sources.filter(
    s => (s.type === 'blog' || s.type === 'text' || s.type === 'gmail' || s.type === 'github' || s.type === 'existing') && (s.result?.writingStyle || s.result?.profile?.writing)
  );
  
  // Use mergeWritingStyles to intelligently blend all writing sources
  const mergeResult = mergeWritingStyles(writingSources);
  const writingStyle = mergeResult.writingStyle;
  const sourceAttribution = mergeResult.sourceAttribution;
  const mergedConfidence = mergeResult.confidence;

  // Calculate total metrics
  const totalCodeLines = codingSources.reduce(
    (sum, s) => sum + (s.result?.metrics?.linesAnalyzed || 0),
    0
  );
  const totalTextWords = writingSources.reduce(
    (sum, s) => {
      // Handle different word count locations based on source type
      if (s.type === 'gmail') {
        // Gmail stores word count in profile.sampleCount.emailWords or metadata.wordCount
        return sum + (s.result?.profile?.sampleCount?.emailWords || s.result?.metadata?.wordCount || 0);
      } else if (s.type === 'existing') {
        // Existing profile stores in sampleCount (textWords or emailWords)
        return sum + (s.result?.profile?.sampleCount?.textWords || s.result?.profile?.sampleCount?.emailWords || 0);
      } else {
        // Other sources use metrics.totalWords or metrics.wordCount
        return sum + (s.result?.metrics?.totalWords || s.result?.metrics?.wordCount || 0);
      }
    },
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

  // Use merged confidence score from mergeWritingStyles
  // Add additional confidence boosts for coding data if present
  let confidence = mergedConfidence;
  
  if (totalCodeLines >= 500) confidence += 0.05;
  if (totalCodeLines >= 2000) confidence += 0.05;
  
  // Cap at 95%
  confidence = Math.min(0.95, confidence);

  const profile = {
    id: generateId(),
    userId,
    version: 1,
    lastUpdated: Date.now(),
    coding: codingStyle,
    writing: writingStyle,
    sourceAttribution, // Add sourceAttribution field to profile
    confidence: parseFloat(confidence.toFixed(2)),
    sampleCount: {
      codeLines: totalCodeLines,
      textWords: totalTextWords,
      repositories: totalRepos,
      articles: totalArticles,
      emails: totalEmails // Add emails to sample count
    }
  };

  // Merge advanced analysis results if provided
  if (advancedAnalysis && isValidAdvancedAnalysis(advancedAnalysis)) {
    profile.advanced = advancedAnalysis;
  }

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
