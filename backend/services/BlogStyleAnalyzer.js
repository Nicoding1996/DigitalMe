/**
 * BlogStyleAnalyzer
 * Analyzes blog content to extract writing style patterns
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');
const config = require('../config');

class BlogStyleAnalyzer {
  constructor() {
    this.genAI = new GoogleGenerativeAI(config.GEMINI_API_KEY);
    this.model = this.genAI.getGenerativeModel({ model: config.GEMINI_MODEL });
  }

  /**
   * Analyze blog articles to extract writing style
   * @param {string} combinedText - Combined text from all articles
   * @param {number} wordCount - Total word count
   * @returns {Promise<Object>} Writing style profile
   */
  async analyzeArticles(combinedText, wordCount) {
    console.log(`[Blog Analyzer] Analyzing ${wordCount} words of blog content...`);

    try {
      const prompt = this.buildPrompt(combinedText);
      
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const analysisText = response.text();

      // Parse the AI response
      const writingStyle = this.parseAnalysis(analysisText);

      console.log('[Blog Analyzer] Analysis complete:', writingStyle);

      return {
        success: true,
        profile: {
          writing: writingStyle,
          metadata: {
            wordCount,
            sourceType: 'blog'
          }
        },
        text: combinedText // Store for advanced analysis
      };

    } catch (error) {
      console.error('[Blog Analyzer] Error:', error);
      throw new Error('Failed to analyze blog content: ' + error.message);
    }
  }

  /**
   * Build analysis prompt for Gemini AI
   * @param {string} text - Blog text to analyze
   * @returns {string} Formatted prompt
   */
  buildPrompt(text) {
    // Truncate if too long (keep first 8000 chars for style analysis)
    const truncatedText = text.length > 8000 ? text.substring(0, 8000) + '...' : text;

    return `Analyze the writing style of these blog articles. Focus on HOW the author writes, not WHAT they write about.

BLOG CONTENT:
${truncatedText}

Extract the following writing style attributes:

1. TONE: Choose ONE that best fits:
   - conversational (friendly, personal, like talking to a friend)
   - professional (business-like, formal, authoritative)
   - neutral (balanced, informative, neither too casual nor too formal)

2. FORMALITY: Choose ONE:
   - casual (uses contractions, informal language, personal anecdotes)
   - balanced (mix of formal and informal, adaptable)
   - formal (proper grammar, no contractions, structured)

3. SENTENCE_LENGTH: Choose ONE:
   - short (mostly under 15 words, punchy, direct)
   - medium (15-25 words, balanced)
   - long (over 25 words, complex, detailed)

4. VOCABULARY: List 3-4 characteristic words or short phrases this author frequently uses or prefers. Examples: "essentially", "in other words", "the key is", "fundamentally"

5. AVOIDANCE: List 2-3 things this author seems to avoid in their writing (e.g., "jargon", "passive-voice", "exclamation-marks", "emojis", "slang"). If nothing obvious, say "none".

Respond in this EXACT JSON format:
{
  "tone": "conversational|professional|neutral",
  "formality": "casual|balanced|formal",
  "sentenceLength": "short|medium|long",
  "vocabulary": ["phrase1", "phrase2", "phrase3"],
  "avoidance": ["thing1", "thing2"] or ["none"]
}`;
  }

  /**
   * Parse AI response into WritingStyle object
   * @param {string} analysisText - Raw AI response
   * @returns {Object} WritingStyle object
   */
  parseAnalysis(analysisText) {
    try {
      // Extract JSON from response (handle markdown code blocks)
      let jsonText = analysisText;
      
      // Remove markdown code blocks if present
      jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      
      // Find JSON object
      const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        jsonText = jsonMatch[0];
      }

      const parsed = JSON.parse(jsonText);

      // Validate and normalize
      return {
        tone: this.normalizeTone(parsed.tone),
        formality: this.normalizeFormality(parsed.formality),
        sentenceLength: this.normalizeSentenceLength(parsed.sentenceLength),
        vocabulary: Array.isArray(parsed.vocabulary) ? parsed.vocabulary.slice(0, 4) : [],
        avoidance: Array.isArray(parsed.avoidance) ? parsed.avoidance.slice(0, 3) : ['none']
      };

    } catch (error) {
      console.error('[Blog Analyzer] Parse error:', error);
      
      // Return default style if parsing fails
      return {
        tone: 'neutral',
        formality: 'balanced',
        sentenceLength: 'medium',
        vocabulary: ['clear', 'direct', 'informative'],
        avoidance: ['none']
      };
    }
  }

  /**
   * Normalize tone value
   */
  normalizeTone(tone) {
    const valid = ['conversational', 'professional', 'neutral'];
    const normalized = String(tone).toLowerCase().trim();
    return valid.includes(normalized) ? normalized : 'neutral';
  }

  /**
   * Normalize formality value
   */
  normalizeFormality(formality) {
    const valid = ['casual', 'balanced', 'formal'];
    const normalized = String(formality).toLowerCase().trim();
    return valid.includes(normalized) ? normalized : 'balanced';
  }

  /**
   * Normalize sentence length value
   */
  normalizeSentenceLength(length) {
    const valid = ['short', 'medium', 'long'];
    const normalized = String(length).toLowerCase().trim();
    return valid.includes(normalized) ? normalized : 'medium';
  }
}

module.exports = BlogStyleAnalyzer;
