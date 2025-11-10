/**
 * Backward Compatibility Tests for Multi-Source Style Merging
 * Tests that the new merging algorithm maintains compatibility with existing code
 */

import {
  buildStyleProfile,
  recalculateStyleProfile,
  mergeWritingStyles,
  calculateSourceWeight,
  normalizeWeights,
  validateSource
} from './StyleAnalyzer';

// ============================================================================
// TEST HELPERS
// ============================================================================

/**
 * Create a mock Gmail source with profile
 */
const createGmailSource = (wordCount = 1000) => ({
  type: 'gmail',
  result: {
    success: true,
    profile: {
      writing: {
        tone: 'conversational',
        formality: 'casual',
        sentenceLength: 'medium',
        vocabulary: ['clear', 'direct', 'friendly', 'relatable'],
        avoidance: ['emojis', 'slang']
      },
      sampleCount: {
        emails: 50,
        emailWords: wordCount,
        textWords: wordCount
      }
    },
    metrics: {
      wordCount: wordCount
    }
  }
});

/**
 * Create a mock text source
 */
const createTextSource = (wordCount = 800) => ({
  type: 'text',
  result: {
    success: true,
    writingStyle: {
      tone: 'professional',
      formality: 'balanced',
      sentenceLength: 'long',
      vocabulary: ['descriptive', 'clear', 'concise', 'direct'],
      avoidance: ['excessive-punctuation']
    },
    metrics: {
      wordCount: wordCount
    }
  }
});

/**
 * Create a mock blog source
 */
const createBlogSource = (wordCount = 1500) => ({
  type: 'blog',
  result: {
    success: true,
    writingStyle: {
      tone: 'professional',
      formality: 'formal',
      sentenceLength: 'long',
      vocabulary: ['descriptive', 'technical', 'precise', 'clear'],
      avoidance: ['slang', 'emojis']
    },
    metrics: {
      totalWords: wordCount
    }
  }
});

/**
 * Create a legacy profile without sourceAttribution (pre-merging)
 */
const createLegacyProfile = () => ({
  id: 'profile-123',
  userId: 'user-1',
  version: 1,
  lastUpdated: Date.now(),
  coding: {
    language: 'JavaScript',
    framework: 'React',
    componentStyle: 'functional',
    namingConvention: 'camelCase',
    commentFrequency: 'moderate',
    patterns: ['hooks', 'composition']
  },
  writing: {
    tone: 'conversational',
    formality: 'casual',
    sentenceLength: 'medium',
    vocabulary: ['clear', 'direct', 'friendly', 'relatable'],
    avoidance: ['emojis', 'slang']
  },
  confidence: 0.75,
  sampleCount: {
    codeLines: 1000,
    textWords: 5000,
    repositories: 2,
    articles: 3,
    emails: 0
  }
  // Note: No sourceAttribution field
});

// ============================================================================
// BACKWARD COMPATIBILITY TESTS
// ============================================================================

describe('Backward Compatibility Tests', () => {
  
  describe('Single-Source Profiles', () => {
    test('Single Gmail source produces 100% attribution', async () => {
      const sources = [createGmailSource(1000)];
      const result = await buildStyleProfile(sources, 'user-1');
      
      expect(result.success).toBe(true);
      expect(result.profile).toBeDefined();
      expect(result.profile.writing).toBeDefined();
      expect(result.profile.sourceAttribution).toBeDefined();
      
      // Check that attribution shows 100% from Gmail
      const attribution = result.profile.sourceAttribution;
      expect(attribution.tone.sources).toHaveLength(1);
      expect(attribution.tone.sources[0].type).toBe('gmail');
      expect(attribution.tone.sources[0].contribution).toBe(100);
      
      expect(attribution.formality.sources).toHaveLength(1);
      expect(attribution.formality.sources[0].type).toBe('gmail');
      expect(attribution.formality.sources[0].contribution).toBe(100);
    });

    test('Single text source produces valid profile', async () => {
      const sources = [createTextSource(800)];
      const result = await buildStyleProfile(sources, 'user-1');
      
      expect(result.success).toBe(true);
      expect(result.profile.writing).toBeDefined();
      expect(result.profile.sourceAttribution).toBeDefined();
      expect(result.profile.confidence).toBeGreaterThan(0);
    });

    test('Single blog source produces valid profile', async () => {
      const sources = [createBlogSource(1500)];
      const result = await buildStyleProfile(sources, 'user-1');
      
      expect(result.success).toBe(true);
      expect(result.profile.writing).toBeDefined();
      expect(result.profile.sourceAttribution).toBeDefined();
      expect(result.profile.confidence).toBeGreaterThan(0);
    });
  });

  describe('Profile Structure Compatibility', () => {
    test('Profile contains all required fields', async () => {
      const sources = [createGmailSource(), createTextSource()];
      const result = await buildStyleProfile(sources, 'user-1');
      
      const profile = result.profile;
      
      // Check all existing required fields are present
      expect(profile.id).toBeDefined();
      expect(profile.userId).toBe('user-1');
      expect(profile.version).toBe(1);
      expect(profile.lastUpdated).toBeDefined();
      expect(profile.coding).toBeDefined();
      expect(profile.writing).toBeDefined();
      expect(profile.confidence).toBeDefined();
      expect(profile.sampleCount).toBeDefined();
      
      // Check new field is present
      expect(profile.sourceAttribution).toBeDefined();
    });

    test('Writing style has all required attributes', async () => {
      const sources = [createGmailSource()];
      const result = await buildStyleProfile(sources, 'user-1');
      
      const writing = result.profile.writing;
      
      expect(writing.tone).toBeDefined();
      expect(writing.formality).toBeDefined();
      expect(writing.sentenceLength).toBeDefined();
      expect(writing.vocabulary).toBeDefined();
      expect(Array.isArray(writing.vocabulary)).toBe(true);
      expect(writing.avoidance).toBeDefined();
      expect(Array.isArray(writing.avoidance)).toBe(true);
    });

    test('Sample count includes all metrics', async () => {
      const sources = [createGmailSource(1000), createTextSource(800)];
      const result = await buildStyleProfile(sources, 'user-1');
      
      const sampleCount = result.profile.sampleCount;
      
      expect(sampleCount.codeLines).toBeDefined();
      expect(sampleCount.textWords).toBeDefined();
      expect(sampleCount.repositories).toBeDefined();
      expect(sampleCount.articles).toBeDefined();
      expect(sampleCount.emails).toBeDefined();
    });
  });

  describe('Code Reading profile.writing', () => {
    test('profile.writing is directly accessible', async () => {
      const sources = [createGmailSource(), createTextSource()];
      const result = await buildStyleProfile(sources, 'user-1');
      
      // Simulate how App.js reads the profile
      const profile = result.profile;
      const writing = profile.writing;
      
      expect(writing).toBeDefined();
      expect(writing.tone).toBeDefined();
      expect(writing.formality).toBeDefined();
      expect(writing.sentenceLength).toBeDefined();
      expect(writing.vocabulary).toBeDefined();
      expect(writing.avoidance).toBeDefined();
    });

    test('Writing style values are valid strings/arrays', async () => {
      const sources = [createGmailSource()];
      const result = await buildStyleProfile(sources, 'user-1');
      
      const writing = result.profile.writing;
      
      expect(typeof writing.tone).toBe('string');
      expect(typeof writing.formality).toBe('string');
      expect(typeof writing.sentenceLength).toBe('string');
      expect(Array.isArray(writing.vocabulary)).toBe(true);
      expect(Array.isArray(writing.avoidance)).toBe(true);
    });
  });

  describe('recalculateStyleProfile Compatibility', () => {
    test('Works with legacy profile without sourceAttribution', async () => {
      const legacyProfile = createLegacyProfile();
      const newSources = [createGmailSource(), createTextSource()];
      
      const updatedProfile = await recalculateStyleProfile(legacyProfile, newSources);
      
      expect(updatedProfile).toBeDefined();
      expect(updatedProfile.version).toBe(legacyProfile.version + 1);
      expect(updatedProfile.previousVersion).toBe(legacyProfile.version);
      expect(updatedProfile.writing).toBeDefined();
      expect(updatedProfile.sourceAttribution).toBeDefined(); // New field added
    });

    test('Works with new profile with sourceAttribution', async () => {
      const sources = [createGmailSource()];
      const initialResult = await buildStyleProfile(sources, 'user-1');
      const initialProfile = initialResult.profile;
      
      const newSources = [createGmailSource(), createTextSource()];
      const updatedProfile = await recalculateStyleProfile(initialProfile, newSources);
      
      expect(updatedProfile).toBeDefined();
      expect(updatedProfile.version).toBe(initialProfile.version + 1);
      expect(updatedProfile.sourceAttribution).toBeDefined();
    });

    test('Preserves userId across recalculation', async () => {
      const legacyProfile = createLegacyProfile();
      const newSources = [createGmailSource()];
      
      const updatedProfile = await recalculateStyleProfile(legacyProfile, newSources);
      
      expect(updatedProfile.userId).toBe(legacyProfile.userId);
    });
  });

  describe('Multi-Source Merging', () => {
    test('Two sources produce valid merged profile', async () => {
      const sources = [createGmailSource(1000), createTextSource(800)];
      const result = await buildStyleProfile(sources, 'user-1');
      
      expect(result.success).toBe(true);
      expect(result.profile.writing).toBeDefined();
      expect(result.profile.sourceAttribution).toBeDefined();
      
      // Check that both sources contributed
      const attribution = result.profile.sourceAttribution;
      const toneSourceTypes = attribution.tone.sources.map(s => s.type);
      expect(toneSourceTypes.length).toBeGreaterThan(0);
    });

    test('Three sources produce valid merged profile', async () => {
      const sources = [
        createGmailSource(1000),
        createTextSource(800),
        createBlogSource(1500)
      ];
      const result = await buildStyleProfile(sources, 'user-1');
      
      expect(result.success).toBe(true);
      expect(result.profile.writing).toBeDefined();
      expect(result.profile.sourceAttribution).toBeDefined();
      expect(result.profile.confidence).toBeGreaterThan(0.5); // Higher confidence with more sources
    });

    test('Confidence increases with more sources', async () => {
      const singleSource = [createGmailSource(1000)];
      const twoSources = [createGmailSource(1000), createTextSource(800)];
      const threeSources = [createGmailSource(1000), createTextSource(800), createBlogSource(1500)];
      
      const result1 = await buildStyleProfile(singleSource, 'user-1');
      const result2 = await buildStyleProfile(twoSources, 'user-1');
      const result3 = await buildStyleProfile(threeSources, 'user-1');
      
      expect(result2.profile.confidence).toBeGreaterThan(result1.profile.confidence);
      expect(result3.profile.confidence).toBeGreaterThan(result2.profile.confidence);
    });
  });

  describe('Source Attribution Structure', () => {
    test('Attribution has correct structure for all attributes', async () => {
      const sources = [createGmailSource(), createTextSource()];
      const result = await buildStyleProfile(sources, 'user-1');
      
      const attribution = result.profile.sourceAttribution;
      
      // Check tone attribution
      expect(attribution.tone).toBeDefined();
      expect(attribution.tone.value).toBeDefined();
      expect(Array.isArray(attribution.tone.sources)).toBe(true);
      
      // Check formality attribution
      expect(attribution.formality).toBeDefined();
      expect(attribution.formality.value).toBeDefined();
      expect(Array.isArray(attribution.formality.sources)).toBe(true);
      
      // Check sentence length attribution
      expect(attribution.sentenceLength).toBeDefined();
      expect(attribution.sentenceLength.value).toBeDefined();
      expect(Array.isArray(attribution.sentenceLength.sources)).toBe(true);
      
      // Check vocabulary attribution
      expect(attribution.vocabulary).toBeDefined();
      expect(attribution.vocabulary.value).toBeDefined();
      expect(Array.isArray(attribution.vocabulary.value)).toBe(true);
      expect(typeof attribution.vocabulary.sources).toBe('object');
      
      // Check avoidance attribution
      expect(attribution.avoidance).toBeDefined();
      expect(attribution.avoidance.value).toBeDefined();
      expect(Array.isArray(attribution.avoidance.value)).toBe(true);
      expect(typeof attribution.avoidance.sources).toBe('object');
    });

    test('Contribution percentages are integers 0-100', async () => {
      const sources = [createGmailSource(), createTextSource()];
      const result = await buildStyleProfile(sources, 'user-1');
      
      const attribution = result.profile.sourceAttribution;
      
      // Check tone contributions
      attribution.tone.sources.forEach(source => {
        expect(Number.isInteger(source.contribution)).toBe(true);
        expect(source.contribution).toBeGreaterThanOrEqual(0);
        expect(source.contribution).toBeLessThanOrEqual(100);
      });
      
      // Check formality contributions
      attribution.formality.sources.forEach(source => {
        expect(Number.isInteger(source.contribution)).toBe(true);
        expect(source.contribution).toBeGreaterThanOrEqual(0);
        expect(source.contribution).toBeLessThanOrEqual(100);
      });
    });
  });

  describe('Error Handling', () => {
    test('Handles empty sources array gracefully', async () => {
      const sources = [];
      const result = await buildStyleProfile(sources, 'user-1');
      
      expect(result.success).toBe(true);
      expect(result.profile).toBeDefined();
      expect(result.profile.writing).toBeDefined();
      expect(result.profile.confidence).toBeLessThan(0.5); // Low confidence
    });

    test('Handles invalid source gracefully', async () => {
      const sources = [
        createGmailSource(),
        { type: 'invalid', result: null } // Invalid source
      ];
      const result = await buildStyleProfile(sources, 'user-1');
      
      expect(result.success).toBe(true);
      expect(result.profile).toBeDefined();
      expect(result.profile.writing).toBeDefined();
    });

    test('Handles missing word count metadata', async () => {
      const sourceWithoutWordCount = {
        type: 'text',
        result: {
          success: true,
          writingStyle: {
            tone: 'conversational',
            formality: 'casual',
            sentenceLength: 'medium',
            vocabulary: ['clear', 'direct'],
            avoidance: ['none']
          },
          metrics: {} // No word count
        }
      };
      
      const sources = [sourceWithoutWordCount];
      const result = await buildStyleProfile(sources, 'user-1');
      
      expect(result.success).toBe(true);
      expect(result.profile).toBeDefined();
    });
  });

  describe('Weight Calculation', () => {
    test('Gmail sources have highest quality weight', () => {
      const gmailSource = createGmailSource(1000);
      const textSource = createTextSource(1000);
      const blogSource = createBlogSource(1000);
      
      const gmailWeight = calculateSourceWeight(gmailSource);
      const textWeight = calculateSourceWeight(textSource);
      const blogWeight = calculateSourceWeight(blogSource);
      
      expect(gmailWeight).toBeGreaterThan(textWeight);
      expect(textWeight).toBeGreaterThan(blogWeight);
    });

    test('Larger samples have higher quantity factor', () => {
      const smallSource = createGmailSource(300);
      const mediumSource = createGmailSource(1000);
      const largeSource = createGmailSource(2000);
      
      const smallWeight = calculateSourceWeight(smallSource);
      const mediumWeight = calculateSourceWeight(mediumSource);
      const largeWeight = calculateSourceWeight(largeSource);
      
      expect(mediumWeight).toBeGreaterThan(smallWeight);
      expect(largeWeight).toBeGreaterThan(mediumWeight);
    });

    test('Weights normalize to sum of 1.0', () => {
      const sources = [
        { ...createGmailSource(), weight: 1.0 },
        { ...createTextSource(), weight: 0.8 },
        { ...createBlogSource(), weight: 0.6 }
      ];
      
      const normalized = normalizeWeights(sources);
      const sum = normalized.reduce((acc, s) => acc + s.weight, 0);
      
      expect(sum).toBeCloseTo(1.0, 5);
    });
  });

  describe('Source Validation', () => {
    test('Valid Gmail source passes validation', () => {
      const source = createGmailSource();
      expect(validateSource(source)).toBe(true);
    });

    test('Valid text source passes validation', () => {
      const source = createTextSource();
      expect(validateSource(source)).toBe(true);
    });

    test('Source without writing style fails validation', () => {
      const invalidSource = {
        type: 'text',
        result: {
          success: true,
          metrics: { wordCount: 1000 }
          // Missing writingStyle
        }
      };
      expect(validateSource(invalidSource)).toBe(false);
    });

    test('Source with missing attributes fails validation', () => {
      const invalidSource = {
        type: 'text',
        result: {
          success: true,
          writingStyle: {
            tone: 'conversational',
            formality: 'casual'
            // Missing sentenceLength, vocabulary, avoidance
          }
        }
      };
      expect(validateSource(invalidSource)).toBe(false);
    });
  });
});

// Run tests if this file is executed directly
if (typeof describe === 'undefined') {
  console.log('Test file created successfully. Run with: npm test');
}
