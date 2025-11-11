/**
 * Gmail Style Analyzer Service
 * 
 * Extracts writing patterns from cleansed email content using Gemini API.
 * Analyzes formality, tone, vocabulary, and sentence structure to build
 * a comprehensive writing style profile.
 * 
 * Requirements: 6.1, 6.2, 6.3
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');
const config = require('../config');

class GmailStyleAnalyzer {
  constructor() {
    // Initialize Gemini API client
    this.genAI = new GoogleGenerativeAI(config.GEMINI_API_KEY);
    this.model = this.genAI.getGenerativeModel({ model: config.GEMINI_MODEL });
    
    // Batch size for Gemini API calls (20 emails per call)
    this.BATCH_SIZE = 20;
  }

  /**
   * Analyze email content to extract writing patterns
   * 
   * Processes cleansed emails in batches, extracts writing patterns using Gemini API,
   * and generates a comprehensive style profile with confidence scoring.
   * 
   * @param {Array<Object>} cleansedEmails - Array of cleansed email objects
   * @returns {Promise<Object>} Analysis result with writing patterns and metadata
   * 
   * Requirements: 6.1, 6.2, 6.3
   */
  async analyzeEmailContent(cleansedEmails) {
    if (!Array.isArray(cleansedEmails) || cleansedEmails.length === 0) {
      return {
        success: false,
        error: 'No valid emails to analyze',
        patterns: null
      };
    }

    try {
      // Process emails in batches
      const batches = this._createBatches(cleansedEmails, this.BATCH_SIZE);
      const batchResults = [];

      for (const batch of batches) {
        const batchText = batch.map(email => email.cleanedBody).join('\n\n---EMAIL SEPARATOR---\n\n');
        const patterns = await this.extractWritingPatterns(batchText);
        batchResults.push(patterns);
      }

      // Merge patterns from all batches
      const mergedPatterns = this._mergeBatchPatterns(batchResults);
      
      // Calculate confidence based on sample size
      const confidence = this._calculateConfidence(cleansedEmails.length);
      
      // Calculate total word count
      const totalWords = cleansedEmails.reduce((sum, email) => sum + email.wordCount, 0);
      
      // Store email texts for advanced analysis
      const emailTexts = cleansedEmails.map(email => email.cleanedBody);

      return {
        success: true,
        patterns: mergedPatterns,
        metadata: {
          emailCount: cleansedEmails.length,
          wordCount: totalWords,
          avgEmailLength: Math.round(totalWords / cleansedEmails.length),
          confidence,
          emailTexts // Add email texts for advanced analysis
        }
      };
    } catch (error) {
      console.error('Gmail style analysis error:', error.message);
      return {
        success: false,
        error: error.message,
        patterns: null
      };
    }
  }

  /**
   * Extract writing patterns from text using Gemini API
   * 
   * Analyzes text to identify formality, tone, vocabulary preferences,
   * and sentence structure patterns.
   * 
   * @param {string} text - Combined email text to analyze
   * @returns {Promise<Object>} Extracted writing patterns
   * 
   * Requirements: 6.1, 6.2
   */
  async extractWritingPatterns(text) {
    const prompt = `Analyze the following email writing samples and extract the author's writing style patterns.

EMAIL SAMPLES:
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
      console.error('Pattern extraction error:', error.message);
      // Return default patterns on error
      return this._getDefaultPatterns();
    }
  }

  /**
   * Merge Gmail patterns with existing style profile
   * 
   * Combines newly extracted Gmail patterns with existing profile data,
   * giving appropriate weight to each source based on sample size.
   * 
   * @param {Object} newPatterns - Patterns extracted from Gmail
   * @param {Object} existingProfile - Current style profile (or null)
   * @returns {Object} Merged style profile
   * 
   * Requirements: 6.2, 6.3
   */
  mergeWithExistingProfile(newPatterns, existingProfile) {
    // If no existing profile, return Gmail patterns as the profile
    if (!existingProfile || !existingProfile.writing) {
      return {
        writing: newPatterns,
        sampleCount: {
          emails: newPatterns.metadata?.emailCount || 0,
          emailWords: newPatterns.metadata?.wordCount || 0
        },
        sources: [{
          type: 'gmail',
          connectedAt: new Date().toISOString(),
          emailsAnalyzed: newPatterns.metadata?.emailCount || 0,
          lastSync: new Date().toISOString()
        }]
      };
    }

    // Merge patterns intelligently
    // Gmail data is typically more representative of actual writing style
    // than mock data, so we prioritize it
    const merged = {
      writing: {
        tone: newPatterns.tone || existingProfile.writing.tone,
        formality: newPatterns.formality || existingProfile.writing.formality,
        sentenceLength: newPatterns.sentenceLength || existingProfile.writing.sentenceLength,
        vocabulary: this._mergeArrays(newPatterns.vocabulary, existingProfile.writing.vocabulary),
        avoidance: this._mergeArrays(newPatterns.avoidance, existingProfile.writing.avoidance)
      },
      sampleCount: {
        ...existingProfile.sampleCount,
        emails: (existingProfile.sampleCount?.emails || 0) + (newPatterns.metadata?.emailCount || 0),
        emailWords: (existingProfile.sampleCount?.emailWords || 0) + (newPatterns.metadata?.wordCount || 0)
      },
      sources: [
        ...(existingProfile.sources || []),
        {
          type: 'gmail',
          connectedAt: new Date().toISOString(),
          emailsAnalyzed: newPatterns.metadata?.emailCount || 0,
          lastSync: new Date().toISOString()
        }
      ]
    };

    return merged;
  }

  /**
   * Create batches of emails for processing
   * 
   * @param {Array} emails - Array of emails
   * @param {number} batchSize - Size of each batch
   * @returns {Array<Array>} Array of email batches
   * @private
   */
  _createBatches(emails, batchSize) {
    const batches = [];
    for (let i = 0; i < emails.length; i += batchSize) {
      batches.push(emails.slice(i, i + batchSize));
    }
    return batches;
  }

  /**
   * Merge patterns from multiple batches
   * 
   * Takes the most common values across batches for categorical fields,
   * and combines arrays for list fields.
   * 
   * @param {Array<Object>} batchResults - Array of pattern objects from each batch
   * @returns {Object} Merged patterns
   * @private
   */
  _mergeBatchPatterns(batchResults) {
    if (batchResults.length === 0) {
      return this._getDefaultPatterns();
    }

    if (batchResults.length === 1) {
      return batchResults[0];
    }

    // Count occurrences of each value for categorical fields
    const toneCounts = {};
    const formalityCounts = {};
    const sentenceLengthCounts = {};
    const allVocabulary = [];
    const allAvoidance = [];

    for (const result of batchResults) {
      toneCounts[result.tone] = (toneCounts[result.tone] || 0) + 1;
      formalityCounts[result.formality] = (formalityCounts[result.formality] || 0) + 1;
      sentenceLengthCounts[result.sentenceLength] = (sentenceLengthCounts[result.sentenceLength] || 0) + 1;
      allVocabulary.push(...result.vocabulary);
      allAvoidance.push(...result.avoidance);
    }

    // Select most common values
    const tone = Object.keys(toneCounts).reduce((a, b) => toneCounts[a] > toneCounts[b] ? a : b);
    const formality = Object.keys(formalityCounts).reduce((a, b) => formalityCounts[a] > formalityCounts[b] ? a : b);
    const sentenceLength = Object.keys(sentenceLengthCounts).reduce((a, b) => sentenceLengthCounts[a] > sentenceLengthCounts[b] ? a : b);

    // Get unique vocabulary and avoidance items
    const vocabulary = [...new Set(allVocabulary)].slice(0, 4);
    const avoidance = [...new Set(allAvoidance)].slice(0, 3);

    return {
      tone,
      formality,
      sentenceLength,
      vocabulary,
      avoidance: avoidance.length > 0 ? avoidance : ['none']
    };
  }

  /**
   * Calculate confidence score based on sample size
   * 
   * More emails = higher confidence, with diminishing returns.
   * 
   * @param {number} emailCount - Number of emails analyzed
   * @returns {number} Confidence score between 0 and 1
   * @private
   * 
   * Requirements: 6.3
   */
  _calculateConfidence(emailCount) {
    // Confidence formula: starts at 0.5 for 10 emails, approaches 0.95 for 200+
    // Uses logarithmic scale for diminishing returns
    if (emailCount < 10) {
      return 0.3;
    }
    
    if (emailCount >= 200) {
      return 0.95;
    }
    
    // Logarithmic scale between 10 and 200 emails
    const normalized = (emailCount - 10) / 190; // 0 to 1 range
    const confidence = 0.5 + (normalized * 0.45); // 0.5 to 0.95 range
    
    return parseFloat(confidence.toFixed(2));
  }

  /**
   * Validate and normalize pattern object
   * 
   * Ensures all required fields are present and have valid values.
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

  /**
   * Merge two arrays, removing duplicates and limiting size
   * 
   * @param {Array} arr1 - First array
   * @param {Array} arr2 - Second array
   * @returns {Array} Merged array
   * @private
   */
  _mergeArrays(arr1, arr2) {
    const merged = [...new Set([...(arr1 || []), ...(arr2 || [])])];
    return merged.slice(0, 4); // Limit to 4 items
  }
}

module.exports = GmailStyleAnalyzer;
