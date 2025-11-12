/**
 * Text Preprocessor Utility
 * 
 * Provides text preprocessing functions for advanced style analysis:
 * - Anonymization of personally identifiable information (PII)
 * - Text chunking at sentence boundaries
 * - Metadata extraction (word count, sentence count, punctuation frequency)
 * 
 * Requirements: 5.1, 5.2, 8.3, 8.4
 */

class TextPreprocessor {
  /**
   * Anonymize text by replacing PII with placeholders
   * 
   * Replaces emails, phone numbers, and common name patterns with
   * generic placeholders while preserving writing style and structure.
   * 
   * @param {string} text - Text to anonymize
   * @returns {string} Anonymized text
   * 
   * Requirements: 5.1, 8.3, 8.4
   */
  static anonymizeText(text) {
    if (!text || typeof text !== 'string') {
      return '';
    }

    let anonymized = text;

    // Replace email addresses with [EMAIL]
    // Matches standard email format: user@domain.com
    anonymized = anonymized.replace(
      /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
      '[EMAIL]'
    );

    // Replace phone numbers with [PHONE]
    // Matches various formats: (123) 456-7890, 123-456-7890, 123.456.7890, +1 123 456 7890
    anonymized = anonymized.replace(
      /(\+\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g,
      '[PHONE]'
    );

    // Replace URLs with [URL] (optional, preserves context)
    anonymized = anonymized.replace(
      /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/g,
      '[URL]'
    );

    // Replace common name patterns (capitalized words that might be names)
    // This is a simple heuristic - only replaces obvious patterns like "Dear John" or "Hi Sarah"
    anonymized = anonymized.replace(
      /\b(Dear|Hi|Hello|Hey)\s+([A-Z][a-z]+)\b/g,
      '$1 [NAME]'
    );

    return anonymized;
  }

  /**
   * Chunk text at sentence boundaries with maximum chunk size
   * 
   * Splits text into chunks that don't exceed maxChunkSize, breaking
   * at sentence boundaries to preserve context and readability.
   * 
   * @param {string} text - Text to chunk
   * @param {number} maxChunkSize - Maximum words per chunk (default: 2000)
   * @returns {Array<string>} Array of text chunks
   * 
   * Requirements: 5.2
   */
  static chunkText(text, maxChunkSize = 2000) {
    if (!text || typeof text !== 'string') {
      return [];
    }

    // Split text into sentences using common sentence terminators
    // Handles periods, question marks, exclamation points, and ellipses
    const sentences = text.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [text];

    const chunks = [];
    let currentChunk = '';
    let currentWordCount = 0;

    for (const sentence of sentences) {
      const sentenceWords = sentence.trim().split(/\s+/).length;

      // If adding this sentence would exceed max chunk size, start a new chunk
      if (currentWordCount + sentenceWords > maxChunkSize && currentChunk) {
        chunks.push(currentChunk.trim());
        currentChunk = sentence;
        currentWordCount = sentenceWords;
      } else {
        currentChunk += (currentChunk ? ' ' : '') + sentence;
        currentWordCount += sentenceWords;
      }
    }

    // Add the last chunk if it has content
    if (currentChunk.trim()) {
      chunks.push(currentChunk.trim());
    }

    return chunks;
  }

  /**
   * Extract metadata from text
   * 
   * Calculates word count, sentence count, average sentence length,
   * and punctuation frequency for text analysis.
   * 
   * @param {string} text - Text to analyze
   * @returns {Object} Metadata object with counts and frequencies
   * 
   * Requirements: 5.1, 8.4
   */
  static extractMetadata(text) {
    if (!text || typeof text !== 'string') {
      return {
        wordCount: 0,
        sentenceCount: 0,
        paragraphCount: 0,
        avgSentenceLength: 0,
        punctuationFrequency: {
          commas: 0,
          periods: 0,
          exclamations: 0,
          questions: 0,
          semicolons: 0,
          colons: 0,
          dashes: 0,
          parentheses: 0
        }
      };
    }

    // Count words (split by whitespace)
    const words = text.trim().split(/\s+/);
    const wordCount = words.length;

    // Count sentences (split by sentence terminators OR paragraph breaks)
    // This handles both formal punctuation and casual line-break-separated thoughts
    const sentences = text
      .split(/[.!?]+|\n\s*\n/)
      .filter(s => s.trim().length > 10);
    const sentenceCount = sentences.length || 1;

    // Count paragraphs (split by double newlines or more)
    const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim());
    const paragraphCount = paragraphs.length || 1;

    // Calculate average sentence length
    const avgSentenceLength = sentenceCount > 0 
      ? Math.round(wordCount / sentenceCount) 
      : wordCount;

    // Count punctuation marks
    const punctuationFrequency = {
      commas: (text.match(/,/g) || []).length,
      periods: (text.match(/\./g) || []).length,
      exclamations: (text.match(/!/g) || []).length,
      questions: (text.match(/\?/g) || []).length,
      semicolons: (text.match(/;/g) || []).length,
      colons: (text.match(/:/g) || []).length,
      dashes: (text.match(/[-—–]/g) || []).length,
      parentheses: (text.match(/[()]/g) || []).length
    };

    return {
      wordCount,
      sentenceCount,
      paragraphCount,
      avgSentenceLength,
      punctuationFrequency
    };
  }
}

module.exports = TextPreprocessor;
