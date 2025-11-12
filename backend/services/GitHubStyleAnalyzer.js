/**
 * GitHubStyleAnalyzer
 * Analyzes GitHub commit messages and documentation to extract communication style
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');
const config = require('../config');

class GitHubStyleAnalyzer {
  constructor() {
    this.genAI = new GoogleGenerativeAI(config.GEMINI_API_KEY);
    this.model = this.genAI.getGenerativeModel({ model: config.GEMINI_MODEL });
  }

  /**
   * Analyze GitHub content to extract communication style
   * @param {string} combinedText - Combined commit messages and READMEs
   * @param {number} wordCount - Total word count
   * @param {Object} metadata - Additional metadata
   * @returns {Promise<Object>} Writing style profile
   */
  async analyzeGitHubContent(combinedText, wordCount, metadata) {
    console.log(`[GitHub Analyzer] Analyzing ${wordCount} words from ${metadata.commitsAnalyzed} commits...`);

    try {
      const prompt = this.buildPrompt(combinedText, metadata);
      
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const analysisText = response.text();

      // Parse the AI response
      const writingStyle = this.parseAnalysis(analysisText);

      console.log('[GitHub Analyzer] Analysis complete:', writingStyle);

      return {
        success: true,
        profile: {
          writing: writingStyle,
          metadata: {
            wordCount,
            sourceType: 'github',
            commitsAnalyzed: metadata.commitsAnalyzed,
            repositoriesAnalyzed: metadata.repositoriesAnalyzed
          }
        },
        text: combinedText // Store for advanced analysis
      };

    } catch (error) {
      console.error('[GitHub Analyzer] Error:', error);
      throw new Error('Failed to analyze GitHub content: ' + error.message);
    }
  }

  /**
   * Build analysis prompt for Gemini AI
   * @param {string} text - GitHub text to analyze
   * @param {Object} metadata - Metadata about the content
   * @returns {string} Formatted prompt
   */
  buildPrompt(text, metadata) {
    // Truncate if too long (keep first 8000 chars for style analysis)
    const truncatedText = text.length > 8000 ? text.substring(0, 8000) + '...' : text;

    return `Analyze the communication style from these GitHub activities (${metadata.commitsAnalyzed} commit messages and ${metadata.readmesAnalyzed} README files).

Focus on HOW this person communicates technical information, not WHAT they're building.

GITHUB CONTENT:
${truncatedText}

Extract the following communication style attributes:

1. TONE: Choose ONE that best fits:
   - conversational (friendly, casual, uses "I/we", personal)
   - professional (business-like, formal, impersonal)
   - neutral (balanced, informative, straightforward)

2. FORMALITY: Choose ONE:
   - casual (uses contractions, informal language, emojis, humor)
   - balanced (mix of formal and informal, adaptable)
   - formal (proper grammar, no contractions, structured, technical)

3. SENTENCE_LENGTH: Choose ONE based on commit messages and documentation:
   - short (brief commits like "fix bug", "update readme")
   - medium (descriptive commits with context)
   - long (detailed explanations, multiple sentences)

4. VOCABULARY: List 3-4 characteristic words or short phrases this person uses in commits/docs. Examples: "refactor", "improve", "add support for", "fix issue with", "update", "🎉", "✨"

5. AVOIDANCE: List 2-3 things this person avoids in their technical writing (e.g., "emojis", "passive-voice", "vague-descriptions", "technical-jargon", "humor"). If nothing obvious, say "none".

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
      console.error('[GitHub Analyzer] Parse error:', error);
      
      // Return default style if parsing fails
      return {
        tone: 'neutral',
        formality: 'balanced',
        sentenceLength: 'short',
        vocabulary: ['update', 'fix', 'add', 'improve'],
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
    return valid.includes(normalized) ? normalized : 'short';
  }
}

module.exports = GitHubStyleAnalyzer;
