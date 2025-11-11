/**
 * Advanced Style Analyzer Service
 * 
 * Orchestrates advanced style analysis using Gemini NLP Service.
 * Performs phrase pattern detection, thought flow analysis,
 * personality quirk detection, and contextual pattern analysis.
 * 
 * Requirements: 1.1-1.5, 2.1-2.5, 3.1-3.5, 4.1-4.5, 7.4
 */

const GeminiNLPService = require('./GeminiNLPService');
const TextPreprocessor = require('../utils/TextPreprocessor');

class AdvancedStyleAnalyzer {
  constructor() {
    this.nlpService = new GeminiNLPService();
  }

  /**
   * Perform complete advanced style analysis
   * 
   * Orchestrates all analysis types in parallel and aggregates results.
   * Preprocesses text with anonymization and chunking as needed.
   * 
   * @param {string} text - Text to analyze
   * @param {Object} options - Optional configuration
   * @returns {Promise<Object>} Complete advanced analysis results
   * 
   * Requirements: 7.4
   */
  async analyzeAdvanced(text, options = {}) {
    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      throw new Error('Invalid text: must be a non-empty string');
    }

    try {
      // Preprocess text: anonymize PII
      const anonymized = TextPreprocessor.anonymizeText(text);
      
      // Extract metadata for context
      const metadata = TextPreprocessor.extractMetadata(anonymized);
      
      // Chunk text if it's too large (over 2000 words) (Requirement: 7.3)
      // Process chunks in parallel and aggregate results
      const chunks = metadata.wordCount > 2000
        ? TextPreprocessor.chunkText(anonymized, 2000)
        : [anonymized];

      console.log(`Analyzing ${chunks.length} chunk(s) with ${metadata.wordCount} total words`);

      // Run all analyses in parallel for performance (Requirements: 7.1, 7.2, 7.3, 7.4)
      // Use Promise.allSettled to capture partial results even if some analyses fail
      const startTime = Date.now();
      const analysisPromises = await Promise.allSettled([
        this.analyzePhrasePatterns(chunks),
        this.analyzeThoughtFlow(chunks),
        this.analyzePersonalityQuirks(chunks),
        this.analyzeContextualPatterns(chunks)
      ]);
      const parallelTime = Date.now() - startTime;
      console.log(`Parallel analysis completed in ${parallelTime}ms`);
      
      // Extract results and handle failures gracefully (Requirement: 5.5, 7.5)
      const phrases = analysisPromises[0].status === 'fulfilled' 
        ? analysisPromises[0].value 
        : [];
      const thoughtFlow = analysisPromises[1].status === 'fulfilled' 
        ? analysisPromises[1].value 
        : { flowScore: 50, parentheticalFrequency: 0, transitionStyle: 'mixed' };
      const quirks = analysisPromises[2].status === 'fulfilled' 
        ? analysisPromises[2].value 
        : [];
      const contextual = analysisPromises[3].status === 'fulfilled' 
        ? analysisPromises[3].value 
        : {};
      
      // Log any failures for monitoring (Requirement: 5.5)
      const failedAnalyses = [];
      if (analysisPromises[0].status === 'rejected') {
        console.error('[MONITORING] Phrase pattern analysis failed:', analysisPromises[0].reason?.message);
        failedAnalyses.push('phrases');
      }
      if (analysisPromises[1].status === 'rejected') {
        console.error('[MONITORING] Thought flow analysis failed:', analysisPromises[1].reason?.message);
        failedAnalyses.push('thoughtFlow');
      }
      if (analysisPromises[2].status === 'rejected') {
        console.error('[MONITORING] Personality quirks analysis failed:', analysisPromises[2].reason?.message);
        failedAnalyses.push('quirks');
      }
      if (analysisPromises[3].status === 'rejected') {
        console.error('[MONITORING] Contextual patterns analysis failed:', analysisPromises[3].reason?.message);
        failedAnalyses.push('contextual');
      }
      
      if (failedAnalyses.length > 0) {
        console.log(`[MONITORING] Partial results: ${4 - failedAnalyses.length}/4 analyses succeeded`);
      }

      // Return aggregated results
      return {
        phrases,
        thoughtPatterns: thoughtFlow,
        personalityMarkers: quirks,
        contextualPatterns: contextual,
        analyzedAt: Date.now(),
        version: '1.0',
        metadata: {
          wordCount: metadata.wordCount,
          chunkCount: chunks.length
        }
      };
    } catch (error) {
      console.error('Advanced analysis failed:', error.message);
      throw error;
    }
  }

  /**
   * Analyze phrase patterns across text chunks
   * 
   * Detects recurring phrases, transitions, and signature expressions.
   * Aggregates results from multiple chunks.
   * 
   * @param {Array<string>} chunks - Text chunks to analyze
   * @returns {Promise<Array>} Array of phrase objects
   * 
   * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5
   */
  async analyzePhrasePatterns(chunks) {
    try {
      // Analyze each chunk in parallel (Requirements: 7.1, 7.2, 7.3, 7.4)
      const chunkResults = await Promise.all(
        chunks.map(chunk => this.nlpService.analyze(chunk, 'phrases'))
      );

      // Aggregate phrases from all chunks
      const phraseMap = new Map();

      for (const result of chunkResults) {
        if (Array.isArray(result)) {
          for (const phraseObj of result) {
            const key = phraseObj.phrase.toLowerCase();
            
            if (phraseMap.has(key)) {
              // Increment frequency for existing phrase
              const existing = phraseMap.get(key);
              existing.frequency += phraseObj.frequency;
            } else {
              // Add new phrase
              phraseMap.set(key, {
                phrase: phraseObj.phrase,
                frequency: phraseObj.frequency,
                category: phraseObj.category
              });
            }
          }
        }
      }

      // Convert map to array and sort by frequency
      const phrases = Array.from(phraseMap.values())
        .sort((a, b) => b.frequency - a.frequency)
        .slice(0, 10); // Keep top 10

      return phrases;
    } catch (error) {
      console.error('Phrase pattern analysis failed:', error.message);
      // Return empty array on failure (graceful degradation)
      return [];
    }
  }

  /**
   * Analyze thought flow and organization
   * 
   * Scores text on structure vs stream-of-consciousness scale,
   * measures parenthetical usage, and identifies transition style.
   * 
   * @param {Array<string>} chunks - Text chunks to analyze
   * @returns {Promise<Object>} Thought flow analysis object
   * 
   * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5
   */
  async analyzeThoughtFlow(chunks) {
    try {
      // Analyze each chunk in parallel (Requirements: 7.1, 7.2, 7.3, 7.4)
      const chunkResults = await Promise.all(
        chunks.map(chunk => this.nlpService.analyze(chunk, 'thoughtFlow'))
      );

      // Average the results from all chunks
      const avgFlowScore = chunkResults.reduce((sum, r) => sum + (r.flowScore || 0), 0) / chunkResults.length;
      const avgParentheticalFreq = chunkResults.reduce((sum, r) => sum + (r.parentheticalFrequency || 0), 0) / chunkResults.length;
      
      // Determine most common transition style
      const transitionStyles = chunkResults.map(r => r.transitionStyle).filter(Boolean);
      const transitionStyle = this._getMostCommon(transitionStyles) || 'mixed';

      return {
        flowScore: Math.round(avgFlowScore),
        parentheticalFrequency: Math.round(avgParentheticalFreq * 10) / 10, // Round to 1 decimal
        transitionStyle
      };
    } catch (error) {
      console.error('Thought flow analysis failed:', error.message);
      // Return default values on failure
      return {
        flowScore: 50,
        parentheticalFrequency: 0,
        transitionStyle: 'mixed'
      };
    }
  }

  /**
   * Analyze personality quirks and distinctive patterns
   * 
   * Extracts self-aware comments, humor patterns, and personal context.
   * 
   * @param {Array<string>} chunks - Text chunks to analyze
   * @returns {Promise<Array>} Array of personality marker objects
   * 
   * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5
   */
  async analyzePersonalityQuirks(chunks) {
    try {
      // Analyze each chunk in parallel (Requirements: 7.1, 7.2, 7.3, 7.4)
      const chunkResults = await Promise.all(
        chunks.map(chunk => this.nlpService.analyze(chunk, 'quirks'))
      );

      // Combine all quirks from all chunks
      const allQuirks = [];
      
      for (const result of chunkResults) {
        if (Array.isArray(result)) {
          allQuirks.push(...result);
        }
      }

      // Remove duplicates based on text similarity
      const uniqueQuirks = this._deduplicateQuirks(allQuirks);

      // Return up to 5 most interesting quirks
      return uniqueQuirks.slice(0, 5);
    } catch (error) {
      console.error('Personality quirk analysis failed:', error.message);
      // Return empty array on failure
      return [];
    }
  }

  /**
   * Analyze contextual patterns and topic-based variations
   * 
   * Detects how writing style varies by topic (technical, personal, etc.).
   * 
   * @param {Array<string>} chunks - Text chunks to analyze
   * @returns {Promise<Object>} Contextual patterns object
   * 
   * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5
   */
  async analyzeContextualPatterns(chunks) {
    try {
      // Analyze each chunk in parallel (Requirements: 7.1, 7.2, 7.3, 7.4)
      const chunkResults = await Promise.all(
        chunks.map(chunk => this.nlpService.analyze(chunk, 'contextual'))
      );

      // Merge contextual patterns from all chunks
      const mergedPatterns = {};

      for (const result of chunkResults) {
        if (result && typeof result === 'object') {
          for (const [topic, patterns] of Object.entries(result)) {
            if (!mergedPatterns[topic]) {
              mergedPatterns[topic] = patterns;
            } else {
              // Merge vocabulary arrays
              if (patterns.vocabulary && mergedPatterns[topic].vocabulary) {
                mergedPatterns[topic].vocabulary = [
                  ...new Set([...mergedPatterns[topic].vocabulary, ...patterns.vocabulary])
                ].slice(0, 5);
              }
            }
          }
        }
      }

      return mergedPatterns;
    } catch (error) {
      console.error('Contextual pattern analysis failed:', error.message);
      // Return empty object on failure
      return {};
    }
  }

  /**
   * Get most common value from array
   * 
   * @param {Array} arr - Array of values
   * @returns {*} Most common value
   * @private
   */
  _getMostCommon(arr) {
    if (!arr || arr.length === 0) return null;
    
    const counts = {};
    for (const item of arr) {
      counts[item] = (counts[item] || 0) + 1;
    }
    
    return Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b);
  }

  /**
   * Deduplicate quirks based on text similarity
   * 
   * Removes quirks with very similar text to avoid redundancy.
   * 
   * @param {Array} quirks - Array of quirk objects
   * @returns {Array} Deduplicated quirks
   * @private
   */
  _deduplicateQuirks(quirks) {
    if (!quirks || quirks.length === 0) return [];

    const unique = [];
    const seenTexts = new Set();

    for (const quirk of quirks) {
      // Normalize text for comparison
      const normalized = quirk.text.toLowerCase().trim();
      
      // Check if we've seen something very similar
      let isDuplicate = false;
      for (const seen of seenTexts) {
        if (this._textSimilarity(normalized, seen) > 0.8) {
          isDuplicate = true;
          break;
        }
      }

      if (!isDuplicate) {
        unique.push(quirk);
        seenTexts.add(normalized);
      }
    }

    return unique;
  }

  /**
   * Calculate simple text similarity (Jaccard similarity on words)
   * 
   * @param {string} text1 - First text
   * @param {string} text2 - Second text
   * @returns {number} Similarity score between 0 and 1
   * @private
   */
  _textSimilarity(text1, text2) {
    const words1 = new Set(text1.split(/\s+/));
    const words2 = new Set(text2.split(/\s+/));
    
    const intersection = new Set([...words1].filter(w => words2.has(w)));
    const union = new Set([...words1, ...words2]);
    
    return intersection.size / union.size;
  }
}

module.exports = AdvancedStyleAnalyzer;
