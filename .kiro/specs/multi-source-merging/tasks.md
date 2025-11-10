# Implementation Plan: Multi-Source Style Merging

- [ ] 1. Implement core weight calculation utilities
  - Create `calculateSourceWeight()` function that determines weight based on source type and word count
  - Implement quality weight mapping (Gmail: 1.0, Text: 0.8, Blog: 0.6)
  - Implement quantity factor calculation based on word count thresholds (<500: 0.5, 500-1500: 1.0, >1500: 1.5)
  - Handle edge cases: missing word count defaults to 500, invalid type defaults to 0.5
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 2.1, 2.2, 2.3, 2.4, 2.5_

- [ ] 2. Implement weight normalization
  - Create `normalizeWeights()` function that normalizes source weights to sum to 1.0
  - Handle edge case where sum is zero by assigning equal weights
  - Handle single source case where weight becomes 1.0
  - _Requirements: 2.5_

- [ ] 3. Implement tone merging with weighted voting
  - Create `mergeTone()` function using weighted voting strategy
  - Build vote tally for each tone value (conversational, professional, neutral)
  - Select tone with highest total weight
  - Handle ties by selecting tone from highest-quality source
  - Return merged tone value and attribution data
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [ ] 4. Implement formality merging with weighted averaging
  - Create `mergeFormality()` function using weighted averaging strategy
  - Map formality values to numeric scores (casual: 0, balanced: 1, formal: 2)
  - Calculate weighted average across all sources
  - Map averaged score back to formality value (<0.5: casual, 0.5-1.5: balanced, >1.5: formal)
  - Return merged formality value and attribution data
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [ ] 5. Implement sentence length merging with weighted voting
  - Create `mergeSentenceLength()` function using weighted voting strategy
  - Build vote tally for each sentence length value (short, medium, long)
  - Select sentence length with highest total weight
  - Handle ties by selecting value from highest-quality source
  - Return merged sentence length value and attribution data
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [ ] 6. Implement vocabulary merging with weighted union
  - Create `mergeVocabulary()` function using weighted union strategy
  - Build term score map by accumulating weights for each vocabulary term
  - Sort terms by total weight in descending order
  - Select top 4 terms with highest scores
  - Return merged vocabulary array and attribution data
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [ ] 7. Implement avoidance merging with weighted intersection
  - Create `mergeAvoidance()` function using weighted intersection strategy
  - Build term frequency map tracking count and total weight for each avoidance term
  - Calculate appearance percentage for each term (count / total sources)
  - Select terms appearing in ≥50% of sources
  - Fallback to terms with total weight >0.6 if no terms meet 50% threshold
  - Return ['none'] if no terms qualify
  - Limit result to maximum 3 terms
  - Return merged avoidance array and attribution data
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [ ] 8. Implement confidence score calculation
  - Create `calculateMergedConfidence()` function
  - Set base confidence to 0.5 for single source
  - Add 0.15 per additional source (max 4 sources)
  - Calculate total word count across all sources
  - Add 0.05 bonus if total exceeds 1000 words
  - Add 0.05 bonus if total exceeds 2000 words
  - Cap maximum confidence at 0.95
  - Round result to 2 decimal places
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7_

- [ ] 9. Implement source attribution metadata generation
  - Create `generateSourceAttribution()` function
  - Format attribution data from merge functions into structured metadata
  - Calculate percentage contributions for each source per attribute
  - Create attribution object with value and sources array for each attribute
  - Format percentages as integers between 0 and 100
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

- [ ] 10. Implement main merging orchestrator
  - Create `mergeWritingStyles()` function as main entry point
  - Filter sources to only include those with valid writing styles
  - Handle edge case: return default style if no valid sources
  - Call `calculateSourceWeight()` for each source
  - Call `normalizeWeights()` to normalize all weights
  - Call merge functions for each attribute (tone, formality, sentence length, vocabulary, avoidance)
  - Call `calculateMergedConfidence()` to compute confidence score
  - Call `generateSourceAttribution()` to create attribution metadata
  - Return complete merged style object with writingStyle, sourceAttribution, confidence, and sourcesUsed
  - _Requirements: 12.1_

- [ ] 11. Implement error handling and validation
  - Create `validateSource()` helper function to check for required style attributes
  - Create `normalizeTone()` helper to map invalid tone values to 'neutral'
  - Create `normalizeFormality()` helper to map invalid formality values to 'balanced'
  - Create `normalizeSentenceLength()` helper to map invalid sentence length values to 'medium'
  - Implement logging for invalid sources and missing fields
  - Handle missing word count metadata by defaulting to 500
  - Return default style with confidence 0.3 when all sources are invalid
  - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_

- [ ] 12. Refactor buildStyleProfile to use merging algorithm
  - Update `buildStyleProfile()` function to call `mergeWritingStyles()` instead of priority selection
  - Remove old priority selection logic (Gmail > Text > Blog)
  - Maintain existing function signature for API compatibility
  - Add sourceAttribution field to returned profile object
  - Ensure backward compatibility with single-source profiles
  - Update confidence calculation to use merged confidence score
  - Preserve all existing profile fields (id, userId, version, lastUpdated, coding, writing, sampleCount)
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 12.2, 12.3_

- [ ]* 13. Write unit tests for weight calculation
  - Test `calculateSourceWeight()` with each source type (Gmail, Text, Blog)
  - Test quantity factors for word counts: <500, 500-1500, >1500
  - Test edge cases: missing word count, zero words, invalid source type
  - Test `normalizeWeights()` with various weight distributions
  - Test normalization edge cases: zero sum, single source
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 2.1, 2.2, 2.3, 2.4, 2.5_

- [ ]* 14. Write unit tests for attribute merging functions
  - Test `mergeTone()` with various weight distributions and tie scenarios
  - Test `mergeFormality()` with boundary cases for averaging (0.49, 0.5, 1.5, 1.51)
  - Test `mergeSentenceLength()` with voting and tie scenarios
  - Test `mergeVocabulary()` with overlapping terms and weight accumulation
  - Test `mergeAvoidance()` with various threshold scenarios (50%, fallback, none)
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 4.1, 4.2, 4.3, 4.4, 4.5, 5.1, 5.2, 5.3, 5.4, 5.5, 6.1, 6.2, 6.3, 6.4, 6.5, 7.1, 7.2, 7.3, 7.4, 7.5_

- [ ]* 15. Write unit tests for confidence and attribution
  - Test `calculateMergedConfidence()` with 1-5 sources
  - Test word count bonuses (1000, 2000 thresholds)
  - Test confidence capping at 0.95
  - Test rounding to 2 decimal places
  - Test `generateSourceAttribution()` for each attribute type
  - Test percentage calculation accuracy
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 9.1, 9.2, 9.3, 9.4, 9.5_

- [ ]* 16. Write unit tests for error handling
  - Test invalid source filtering with missing attributes
  - Test attribute value normalization (invalid tone, formality, sentence length)
  - Test missing metadata handling (word count estimation)
  - Test empty source array handling (default style return)
  - Test all sources invalid scenario (confidence 0.3)
  - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_

- [ ]* 17. Write integration tests for end-to-end merging
  - Test merging 2 sources (Gmail + Text) with real-like data
  - Test merging 3 sources (Gmail + Text + Blog) with diverse styles
  - Test merging with one invalid source (should exclude and continue)
  - Test merging with all invalid sources (should return default)
  - Test backward compatibility with single source
  - Test `buildStyleProfile()` integration with merging algorithm
  - Verify profile structure includes sourceAttribution
  - Verify confidence calculation matches expectations
  - Verify sample count aggregation works correctly
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 12.1, 12.2, 12.3_

- [ ] 18. Update TypeScript/JSDoc type definitions
  - Add `SourceAttribution` type definition to models.js
  - Add `AttributeAttribution` type definition
  - Add `SourceContribution` type definition
  - Update `StyleProfile` type to include optional `sourceAttribution` field
  - Add `SourceWithWeight` internal type definition
  - Document all new functions with JSDoc comments
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

- [ ] 19. Verify backward compatibility
  - Test that existing profiles without sourceAttribution continue to work
  - Test that single-source profiles produce correct attribution (100% from one source)
  - Test that buildStyleProfile maintains same function signature
  - Test that existing code reading profile.writing continues to work
  - Verify no breaking changes to API contracts
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_
