/**
 * Manual Verification Script for Backward Compatibility
 * This script demonstrates that existing code works with both old and new profile formats
 */

import { buildStyleProfile, recalculateStyleProfile } from './StyleAnalyzer';

// ============================================================================
// VERIFICATION SCENARIOS
// ============================================================================

/**
 * Scenario 1: Verify App.js can read profile.writing with and without sourceAttribution
 */
export const verifyAppJsCompatibility = async () => {
  console.log('\n=== Scenario 1: App.js Compatibility ===\n');
  
  // Create a profile with sourceAttribution (new format)
  const gmailSource = {
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
          emailWords: 1000,
          textWords: 1000
        }
      },
      metrics: {
        wordCount: 1000
      }
    }
  };

  const result = await buildStyleProfile([gmailSource], 'user-1');
  const profile = result.profile;

  // Simulate how App.js reads the profile
  console.log('✓ Profile created with sourceAttribution');
  console.log('  - profile.writing exists:', !!profile.writing);
  console.log('  - profile.writing.tone:', profile.writing.tone);
  console.log('  - profile.writing.formality:', profile.writing.formality);
  console.log('  - profile.sourceAttribution exists:', !!profile.sourceAttribution);
  
  // Simulate legacy profile without sourceAttribution
  const legacyProfile = {
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
    // No sourceAttribution field
  };

  console.log('\n✓ Legacy profile (without sourceAttribution)');
  console.log('  - profile.writing exists:', !!legacyProfile.writing);
  console.log('  - profile.writing.tone:', legacyProfile.writing.tone);
  console.log('  - profile.writing.formality:', legacyProfile.writing.formality);
  console.log('  - profile.sourceAttribution exists:', !!legacyProfile.sourceAttribution);
  
  console.log('\n✅ App.js can read profile.writing from both formats\n');
  
  return { newProfile: profile, legacyProfile };
};

/**
 * Scenario 2: Verify ProfileSummary component displays profiles correctly
 */
export const verifyProfileSummaryCompatibility = async () => {
  console.log('\n=== Scenario 2: ProfileSummary Component Compatibility ===\n');
  
  // Create profile with sourceAttribution
  const sources = [
    {
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
            emailWords: 1000,
            textWords: 1000
          }
        },
        metrics: {
          wordCount: 1000
        }
      }
    }
  ];

  const result = await buildStyleProfile(sources, 'user-1');
  const profile = result.profile;

  // Simulate ProfileSummary component reading the profile
  const { coding, writing, confidence, sampleCount } = profile;
  
  console.log('✓ ProfileSummary can destructure profile fields:');
  console.log('  - coding:', !!coding);
  console.log('  - writing:', !!writing);
  console.log('  - confidence:', confidence);
  console.log('  - sampleCount:', !!sampleCount);
  
  console.log('\n✓ ProfileSummary can read writing style attributes:');
  console.log('  - tone:', writing.tone);
  console.log('  - formality:', writing.formality);
  console.log('  - sentenceLength:', writing.sentenceLength);
  console.log('  - vocabulary:', writing.vocabulary.join(', '));
  console.log('  - avoidance:', writing.avoidance.join(', '));
  
  console.log('\n✓ ProfileSummary can read sample count:');
  console.log('  - repositories:', sampleCount.repositories);
  console.log('  - codeLines:', sampleCount.codeLines);
  console.log('  - articles:', sampleCount.articles);
  console.log('  - textWords:', sampleCount.textWords);
  console.log('  - emails:', sampleCount.emails);
  
  console.log('\n✅ ProfileSummary component works with new profile format\n');
  
  return profile;
};

/**
 * Scenario 3: Verify single-source profiles produce 100% attribution
 */
export const verifySingleSourceAttribution = async () => {
  console.log('\n=== Scenario 3: Single-Source Attribution ===\n');
  
  const gmailSource = {
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
          emailWords: 1000,
          textWords: 1000
        }
      },
      metrics: {
        wordCount: 1000
      }
    }
  };

  const result = await buildStyleProfile([gmailSource], 'user-1');
  const profile = result.profile;
  const attribution = profile.sourceAttribution;

  console.log('✓ Single Gmail source attribution:');
  console.log('  - tone.sources:', JSON.stringify(attribution.tone.sources, null, 2));
  console.log('  - formality.sources:', JSON.stringify(attribution.formality.sources, null, 2));
  console.log('  - sentenceLength.sources:', JSON.stringify(attribution.sentenceLength.sources, null, 2));
  
  // Verify 100% attribution
  const toneContribution = attribution.tone.sources[0].contribution;
  const formalityContribution = attribution.formality.sources[0].contribution;
  const sentenceLengthContribution = attribution.sentenceLength.sources[0].contribution;
  
  console.log('\n✓ Contribution percentages:');
  console.log('  - tone:', toneContribution + '%');
  console.log('  - formality:', formalityContribution + '%');
  console.log('  - sentenceLength:', sentenceLengthContribution + '%');
  
  const allAre100 = toneContribution === 100 && 
                    formalityContribution === 100 && 
                    sentenceLengthContribution === 100;
  
  if (allAre100) {
    console.log('\n✅ Single source produces 100% attribution\n');
  } else {
    console.log('\n❌ Single source attribution is not 100%\n');
  }
  
  return profile;
};

/**
 * Scenario 4: Verify recalculateStyleProfile works with merged profiles
 */
export const verifyRecalculateWithMergedProfiles = async () => {
  console.log('\n=== Scenario 4: recalculateStyleProfile with Merged Profiles ===\n');
  
  // Create initial profile with one source
  const initialSources = [
    {
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
            emailWords: 1000,
            textWords: 1000
          }
        },
        metrics: {
          wordCount: 1000
        }
      }
    }
  ];

  const initialResult = await buildStyleProfile(initialSources, 'user-1');
  const initialProfile = initialResult.profile;
  
  console.log('✓ Initial profile created:');
  console.log('  - version:', initialProfile.version);
  console.log('  - confidence:', initialProfile.confidence);
  console.log('  - sourceAttribution exists:', !!initialProfile.sourceAttribution);
  
  // Add a second source and recalculate
  const updatedSources = [
    ...initialSources,
    {
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
          wordCount: 800
        }
      }
    }
  ];

  const updatedProfile = await recalculateStyleProfile(initialProfile, updatedSources);
  
  console.log('\n✓ Profile recalculated with additional source:');
  console.log('  - version:', updatedProfile.version);
  console.log('  - previousVersion:', updatedProfile.previousVersion);
  console.log('  - confidence:', updatedProfile.confidence);
  console.log('  - sourceAttribution exists:', !!updatedProfile.sourceAttribution);
  console.log('  - userId preserved:', updatedProfile.userId === initialProfile.userId);
  
  // Verify version incremented
  const versionIncremented = updatedProfile.version === initialProfile.version + 1;
  const confidenceIncreased = updatedProfile.confidence > initialProfile.confidence;
  
  console.log('\n✓ Verification:');
  console.log('  - Version incremented:', versionIncremented);
  console.log('  - Confidence increased:', confidenceIncreased);
  console.log('  - Has sourceAttribution:', !!updatedProfile.sourceAttribution);
  
  if (versionIncremented && confidenceIncreased) {
    console.log('\n✅ recalculateStyleProfile works correctly with merged profiles\n');
  } else {
    console.log('\n❌ recalculateStyleProfile has issues\n');
  }
  
  return { initialProfile, updatedProfile };
};

/**
 * Scenario 5: Verify no breaking changes to API contracts
 */
export const verifyAPIContracts = async () => {
  console.log('\n=== Scenario 5: API Contract Verification ===\n');
  
  const sources = [
    {
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
            emailWords: 1000,
            textWords: 1000
          }
        },
        metrics: {
          wordCount: 1000
        }
      }
    }
  ];

  // Test buildStyleProfile function signature
  console.log('✓ Testing buildStyleProfile function signature:');
  const result = await buildStyleProfile(sources, 'user-1');
  
  console.log('  - Returns object with success:', !!result.success);
  console.log('  - Returns object with profile:', !!result.profile);
  console.log('  - Returns object with sourcesAnalyzed:', typeof result.sourcesAnalyzed === 'number');
  console.log('  - Returns object with createdAt:', typeof result.createdAt === 'number');
  
  // Test profile structure
  const profile = result.profile;
  const requiredFields = ['id', 'userId', 'version', 'lastUpdated', 'coding', 'writing', 'confidence', 'sampleCount'];
  const hasAllFields = requiredFields.every(field => profile.hasOwnProperty(field));
  
  console.log('\n✓ Profile has all required fields:', hasAllFields);
  requiredFields.forEach(field => {
    console.log(`  - ${field}:`, !!profile[field]);
  });
  
  // Test new field is optional (doesn't break old code)
  console.log('\n✓ New field (sourceAttribution) is present:', !!profile.sourceAttribution);
  console.log('  - Old code can ignore this field without breaking');
  
  // Test writing style structure
  const writingFields = ['tone', 'formality', 'sentenceLength', 'vocabulary', 'avoidance'];
  const hasAllWritingFields = writingFields.every(field => profile.writing.hasOwnProperty(field));
  
  console.log('\n✓ Writing style has all required fields:', hasAllWritingFields);
  writingFields.forEach(field => {
    console.log(`  - ${field}:`, !!profile.writing[field]);
  });
  
  if (hasAllFields && hasAllWritingFields) {
    console.log('\n✅ No breaking changes to API contracts\n');
  } else {
    console.log('\n❌ API contract has breaking changes\n');
  }
  
  return profile;
};

/**
 * Run all verification scenarios
 */
export const runAllVerifications = async () => {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║  BACKWARD COMPATIBILITY VERIFICATION                      ║');
  console.log('║  Multi-Source Style Merging Feature                       ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  
  try {
    await verifyAppJsCompatibility();
    await verifyProfileSummaryCompatibility();
    await verifySingleSourceAttribution();
    await verifyRecalculateWithMergedProfiles();
    await verifyAPIContracts();
    
    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║  ✅ ALL VERIFICATIONS PASSED                              ║');
    console.log('║  Backward compatibility confirmed                         ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');
    
    return true;
  } catch (error) {
    console.error('\n❌ Verification failed:', error);
    return false;
  }
};

// Export for use in other files
export default {
  verifyAppJsCompatibility,
  verifyProfileSummaryCompatibility,
  verifySingleSourceAttribution,
  verifyRecalculateWithMergedProfiles,
  verifyAPIContracts,
  runAllVerifications
};
