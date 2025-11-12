/**
 * Profile Refiner Service
 * 
 * Refines existing style profiles based on new conversation messages.
 * Uses confidence-weighted pattern merging to incrementally improve profiles
 * without replacing existing patterns completely.
 * 
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 9.1, 9.2, 9.3, 9.4, 9.5
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');
const config = require('../config');

class ProfileRefinerService {
  constructor() {
    // Initialize Gemini API client (reuse existing StyleAnalyzer logic)
    this.genAI = new GoogleGenerativeAI(config.GEMINI_API_KEY);
    this.model = this.genAI.getGenerativeModel({ model: config.GEMINI_MODEL });
  }

  /**
   * Main refinement method
   * Analyzes new messages and merges patterns with existing profile
   * 
   * @param {Object} currentProfile - Current style profile
   * @param {string[]} newMessages - Array of user messages
   * @returns {Promise<Object>} Refinement result with updated profile and delta report
   * 
   * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 9.1, 9.2, 9.3, 9.4, 9.5
   */
  async refineProfile(currentProfile, newMessages) {
    try {
      // Concatenate messages into single text sample (Requirement 9.2)
      const combinedText = newMessages.join('\n\n');
      const newWordCount = combinedText.trim().split(/\s+/).length;

      // Analyze new messages using existing StyleAnalyzer logic (Requirement 9.1)
      const newPatterns = await this.analyzeMessages(combinedText);

      // Merge patterns with confidence weighting (Requirements 5.1, 5.2, 5.3)
      const updatedProfile = this.mergePatterns(
        currentProfile,
        newPatterns,
        newWordCount
      );

      // Generate delta report showing changes (Requirement 5.4)
      const deltaReport = this.generateDeltaReport(
        currentProfile,
        updatedProfile,
        newWordCount
      );

      return {
        success: true,
        updatedProfile,
        deltaReport
      };
    } catch (error) {
      console.error('[Profile Refiner] Error:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Analyze new messages using existing StyleAnalyzer logic
   * Reuses the same prompt and parsing logic for consistency
   * 
   * @param {string} text - Combined message text
   * @returns {Promise<Object>} Extracted writing patterns
   * 
   * Requirements: 9.1, 9.2, 9.3
   */
  async analyzeMessages(text) {
    // Use same prompt structure as GmailStyleAnalyzer for consistency
    const prompt = `Analyze the following conversation messages and extract the author's writing style patterns.

MESSAGES:
${text}

Analyze and respond with a JSON object containing these exact fields:
{
  "tone": "conversational" | "professional" | "neutral",
  "formality": "casual" | "formal" | "balanced",
  "sentenceLength": "short" | "medium" | "long",
  "vocabulary": ["descriptive", "concise", "straightforward", "relatable", "clear", "direct"],
  "avoidance": ["emojis", "excessive-punctuation", "slang", "none"]
}

Guidelines:
- tone: "conversational" if friendly/personal, "professional" if business-like, "neutral" if balanced
- formality: "casual" if uses contractions/informal language, "formal" if structured/polished, "balanced" if mixed
- sentenceLength: "short" if avg <15 words, "medium" if 15-25 words, "long" if >25 words
- vocabulary: Select 2-4 terms that best describe word choice and style
- avoidance: List elements the author avoids (or "none" if they use everything)

Respond ONLY with the JSON object, no additional text.`;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const responseText = response.text();
      
      // Extract JSON from response (handle markdown code blocks)
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Failed to extract JSON from Gemini response');
      }
      
      const patterns = JSON.parse(jsonMatch[0]);
      
      // Validate and normalize patterns
      return this._validatePatterns(patterns);
    } catch (error) {
      console.error('[Profile Refiner] Pattern extraction error:', error.message);
      // Return default patterns on error
      return this._getDefaultPatterns();
    }
  }

  /**
   * Merge patterns with confidence-weighted adjustment
   * High confidence = small changes, low confidence = large changes
   * 
   * @param {Object} currentProfile - Current style profile
   * @param {Object} newPatterns - Newly extracted patterns
   * @param {number} newWordCount - Word count from new messages
   * @returns {Object} Updated style profile
   * 
   * Requirements: 5.1, 5.2, 5.3, 9.4
   */
  mergePatterns(currentProfile, newPatterns, newWordCount) {
    // Initialize attribute confidence if not present
    if (!currentProfile.attributeConfidence) {
      currentProfile.attributeConfidence = {
        tone: currentProfile.confidence || 0.5,
        formality: currentProfile.confidence || 0.5,
        sentenceLength: currentProfile.confidence || 0.5,
        vocabulary: currentProfile.confidence || 0.5,
        avoidance: currentProfile.confidence || 0.5
      };
    }

    // Initialize learning metadata if not present
    if (!currentProfile.learningMetadata) {
      currentProfile.learningMetadata = {
        enabled: true,
        lastRefinement: null,
        totalRefinements: 0,
        wordsFromConversations: 0
      };
    }

    // Initialize conversationWords if not present
    if (!currentProfile.sampleCount.conversationWords) {
      currentProfile.sampleCount.conversationWords = 0;
    }

    const updatedProfile = JSON.parse(JSON.stringify(currentProfile)); // Deep clone

    // Merge tone (categorical attribute)
    updatedProfile.writing.tone = this._mergeCategoricalAttribute(
      currentProfile.writing.tone,
      newPatterns.tone,
      currentProfile.attributeConfidence.tone,
      newWordCount
    );

    // Merge formality (categorical attribute)
    updatedProfile.writing.formality = this._mergeCategoricalAttribute(
      currentProfile.writing.formality,
      newPatterns.formality,
      currentProfile.attributeConfidence.formality,
      newWordCount
    );

    // Merge sentence length (categorical attribute)
    updatedProfile.writing.sentenceLength = this._mergeCategoricalAttribute(
      currentProfile.writing.sentenceLength,
      newPatterns.sentenceLength,
      currentProfile.attributeConfidence.sentenceLength,
      newWordCount
    );

    // Merge vocabulary (array attribute)
    updatedProfile.writing.vocabulary = this._mergeArrayAttribute(
      currentProfile.writing.vocabulary,
      newPatterns.vocabulary,
      currentProfile.attributeConfidence.vocabulary,
      newWordCount
    );

    // Merge avoidance (array attribute)
    updatedProfile.writing.avoidance = this._mergeArrayAttribute(
      currentProfile.writing.avoidance,
      newPatterns.avoidance,
      currentProfile.attributeConfidence.avoidance,
      newWordCount
    );

    // Update confidence scores (Requirement 5.4)
    const confidenceUpdate = this._updateConfidence(
      currentProfile.attributeConfidence,
      newWordCount
    );
    updatedProfile.attributeConfidence = confidenceUpdate.attributeConfidences;
    updatedProfile.confidence = confidenceUpdate.confidence;

    // Update sample counts and metadata (Requirement 5.5)
    updatedProfile.sampleCount.conversationWords += newWordCount;
    updatedProfile.learningMetadata.lastRefinement = Date.now();
    updatedProfile.learningMetadata.totalRefinements += 1;
    updatedProfile.learningMetadata.wordsFromConversations += newWordCount;
    updatedProfile.lastUpdated = Date.now();

    // Preserve coding style unchanged (Requirement 9.5)
    updatedProfile.coding = currentProfile.coding;

    return updatedProfile;
  }

  /**
   * Merge categorical attribute (tone, formality, sentenceLength)
   * Only changes if new value differs AND adjustment threshold is met
   * 
   * @param {string} currentValue - Current attribute value
   * @param {string} newValue - New attribute value from analysis
   * @param {number} confidence - Attribute confidence score
   * @param {number} newWordCount - Word count from new messages
   * @returns {string} Merged attribute value
   * 
   * Requirements: 5.2, 5.3
   */
  _mergeCategoricalAttribute(currentValue, newValue, confidence, newWordCount) {
    // If values match, no change needed
    if (currentValue === newValue) {
      return currentValue;
    }

    // Calculate max adjustment based on confidence (Requirement 5.2, 5.3)
    let maxAdjustment;
    if (confidence >= 0.8) {
      maxAdjustment = 0.05; // 5% max change for high confidence
    } else if (confidence >= 0.5) {
      maxAdjustment = 0.10; // 10% max change for medium confidence
    } else {
      maxAdjustment = 0.20; // 20% max change for low confidence
    }

    // Scale adjustment by word count (more words = more influence)
    // 100 words = 50% of max, 500+ words = 100% of max
    const wordFactor = Math.min(1.0, newWordCount / 500);
    const actualAdjustment = maxAdjustment * wordFactor;

    // Require higher threshold for high-confidence profiles
    const changeThreshold = confidence >= 0.8 ? 0.04 : 0.03;

    // Change value if adjustment factor exceeds threshold
    if (actualAdjustment >= changeThreshold) {
      return newValue;
    }

    return currentValue;
  }

  /**
   * Merge array attribute (vocabulary, avoidance)
   * Blends arrays with weighted preference for existing terms
   * 
   * @param {string[]} currentArray - Current attribute array
   * @param {string[]} newArray - New attribute array from analysis
   * @param {number} confidence - Attribute confidence score
   * @param {number} newWordCount - Word count from new messages
   * @returns {string[]} Merged attribute array
   * 
   * Requirements: 5.2, 5.3
   */
  _mergeArrayAttribute(currentArray, newArray, confidence, newWordCount) {
    // Calculate adjustment weight based on confidence
    let maxAdjustment;
    if (confidence >= 0.8) {
      maxAdjustment = 0.05;
    } else if (confidence >= 0.5) {
      maxAdjustment = 0.10;
    } else {
      maxAdjustment = 0.20;
    }

    // Scale by word count
    const wordFactor = Math.min(1.0, newWordCount / 500);
    const weight = maxAdjustment * wordFactor;

    // Create term scores
    const termScores = {};

    // Existing terms get higher base score (1.0 - weight)
    currentArray.forEach(term => {
      termScores[term] = 1.0 - weight;
    });

    // New terms get lower score (weight)
    newArray.forEach(term => {
      if (termScores[term]) {
        termScores[term] += weight; // Boost if appears in both
      } else {
        termScores[term] = weight;
      }
    });

    // Sort by score and take top N
    const sorted = Object.entries(termScores)
      .sort((a, b) => b[1] - a[1])
      .map(([term]) => term);

    // Keep same array size as current
    return sorted.slice(0, currentArray.length);
  }

  /**
   * Update confidence scores with diminishing returns
   * Each refinement increases confidence slightly
   * 
   * @param {Object} attributeConfidence - Current attribute confidence scores
   * @param {number} newWordCount - Word count from new messages
   * @returns {Object} Updated confidence scores
   * 
   * Requirements: 5.4
   */
  _updateConfidence(attributeConfidence, newWordCount) {
    // Base increase per refinement
    const baseIncrease = 0.05;

    // Scale increase by word count (more words = more confidence)
    const wordFactor = Math.min(1.0, newWordCount / 500);
    const actualIncrease = baseIncrease * wordFactor;

    // Update each attribute confidence with diminishing returns
    const updatedAttributeConfidences = {};
    for (const [attr, currentConf] of Object.entries(attributeConfidence)) {
      // Apply increase with diminishing returns
      const newConf = currentConf + (actualIncrease * (1.0 - currentConf));
      // Cap at 0.95 (never 100% certain)
      updatedAttributeConfidences[attr] = Math.min(0.95, newConf);
    }

    // Calculate overall confidence as average of attribute confidences
    const confidenceValues = Object.values(updatedAttributeConfidences);
    const avgConfidence = confidenceValues.reduce((sum, c) => sum + c, 0) / confidenceValues.length;

    return {
      confidence: parseFloat(avgConfidence.toFixed(2)),
      attributeConfidences: updatedAttributeConfidences
    };
  }

  /**
   * Generate delta report showing attribute changes
   * 
   * @param {Object} oldProfile - Profile before refinement
   * @param {Object} newProfile - Profile after refinement
   * @param {number} wordsAnalyzed - Word count from new messages
   * @returns {Object} Delta report
   * 
   * Requirements: 5.4
   */
  generateDeltaReport(oldProfile, newProfile, wordsAnalyzed) {
    const changes = [];

    // Check tone change
    if (oldProfile.writing.tone !== newProfile.writing.tone) {
      changes.push({
        attribute: 'tone',
        oldValue: oldProfile.writing.tone,
        newValue: newProfile.writing.tone,
        changePercent: 100 // Categorical change = 100%
      });
    }

    // Check formality change
    if (oldProfile.writing.formality !== newProfile.writing.formality) {
      changes.push({
        attribute: 'formality',
        oldValue: oldProfile.writing.formality,
        newValue: newProfile.writing.formality,
        changePercent: 100
      });
    }

    // Check sentence length change
    if (oldProfile.writing.sentenceLength !== newProfile.writing.sentenceLength) {
      changes.push({
        attribute: 'sentenceLength',
        oldValue: oldProfile.writing.sentenceLength,
        newValue: newProfile.writing.sentenceLength,
        changePercent: 100
      });
    }

    // Check vocabulary changes
    const vocabChanges = this._calculateArrayChanges(
      oldProfile.writing.vocabulary,
      newProfile.writing.vocabulary
    );
    if (vocabChanges.changePercent > 0) {
      changes.push({
        attribute: 'vocabulary',
        oldValue: oldProfile.writing.vocabulary.join(', '),
        newValue: newProfile.writing.vocabulary.join(', '),
        changePercent: vocabChanges.changePercent
      });
    }

    // Check avoidance changes
    const avoidanceChanges = this._calculateArrayChanges(
      oldProfile.writing.avoidance,
      newProfile.writing.avoidance
    );
    if (avoidanceChanges.changePercent > 0) {
      changes.push({
        attribute: 'avoidance',
        oldValue: oldProfile.writing.avoidance.join(', '),
        newValue: newProfile.writing.avoidance.join(', '),
        changePercent: avoidanceChanges.changePercent
      });
    }

    // Calculate confidence change
    const confidenceChange = parseFloat(
      (newProfile.confidence - oldProfile.confidence).toFixed(2)
    );

    return {
      changes,
      wordsAnalyzed,
      confidenceChange,
      timestamp: Date.now()
    };
  }

  /**
   * Calculate percentage change between two arrays
   * 
   * @param {string[]} oldArray - Old array
   * @param {string[]} newArray - New array
   * @returns {Object} Change statistics
   * @private
   */
  _calculateArrayChanges(oldArray, newArray) {
    const oldSet = new Set(oldArray);
    const newSet = new Set(newArray);

    // Count items that changed
    let changedCount = 0;
    newArray.forEach(item => {
      if (!oldSet.has(item)) changedCount++;
    });

    const changePercent = Math.round((changedCount / newArray.length) * 100);

    return {
      changePercent,
      added: newArray.filter(item => !oldSet.has(item)),
      removed: oldArray.filter(item => !newSet.has(item))
    };
  }

  /**
   * Validate and normalize pattern object
   * Ensures all required fields are present and have valid values
   * 
   * @param {Object} patterns - Patterns to validate
   * @returns {Object} Validated patterns
   * @private
   */
  _validatePatterns(patterns) {
    const validTones = ['conversational', 'professional', 'neutral'];
    const validFormality = ['casual', 'formal', 'balanced'];
    const validSentenceLength = ['short', 'medium', 'long'];

    return {
      tone: validTones.includes(patterns.tone) ? patterns.tone : 'neutral',
      formality: validFormality.includes(patterns.formality) ? patterns.formality : 'balanced',
      sentenceLength: validSentenceLength.includes(patterns.sentenceLength) ? patterns.sentenceLength : 'medium',
      vocabulary: Array.isArray(patterns.vocabulary) ? patterns.vocabulary.slice(0, 4) : ['clear', 'direct'],
      avoidance: Array.isArray(patterns.avoidance) ? patterns.avoidance.slice(0, 3) : ['none']
    };
  }

  /**
   * Get default patterns when analysis fails
   * 
   * @returns {Object} Default pattern object
   * @private
   */
  _getDefaultPatterns() {
    return {
      tone: 'neutral',
      formality: 'balanced',
      sentenceLength: 'medium',
      vocabulary: ['clear', 'direct'],
      avoidance: ['none']
    };
  }
}

module.exports = ProfileRefinerService;
