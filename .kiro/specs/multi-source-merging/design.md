# Design Document: Multi-Source Style Merging

## Overview

The Multi-Source Style Merging feature refactors the StyleAnalyzer service to intelligently blend writing styles from multiple data sources using a weighted averaging algorithm. This design replaces the current priority-based selection approach with a sophisticated merging system that considers both source quality and data quantity.

The solution introduces a modular architecture with dedicated functions for weight calculation, attribute-specific merging strategies, and source attribution tracking. The design maintains backward compatibility with existing profiles while adding transparency through detailed source attribution metadata.

## Architecture

### High-Level Flow

```
User Sources (Gmail, Text, Blog)
         ↓
   Extract Metadata
   (word count, type)
         ↓
  Calculate Weights
  (quality × quantity)
         ↓
   Normalize Weights
   (sum to 1.0)
         ↓
  Merge Each Attribute
  (strategy per type)
         ↓
  Calculate Confidence
  (sources + data size)
         ↓
   Generate Attribution
   (track contributions)
         ↓
  Return Merged Profile
```

### Module Structure

```
src/services/StyleAnalyzer.js
├── mergeWritingStyles()          [NEW] - Main merging orchestrator
├── calculateSourceWeight()        [NEW] - Weight calculation
├── normalizeWeights()             [NEW] - Weight normalization
├── mergeTone()                    [NEW] - Tone merging (voting)
├── mergeFormality()               [NEW] - Formality merging (averaging)
├── mergeSentenceLength()          [NEW] - Sentence length merging (voting)
├── mergeVocabulary()              [NEW] - Vocabulary merging (union)
├── mergeAvoidance()               [NEW] - Avoidance merging (intersection)
├── calculateMergedConfidence()    [NEW] - Confidence scoring
├── generateSourceAttribution()    [NEW] - Attribution metadata
├── buildStyleProfile()            [REFACTOR] - Updated to use merging
└── [existing functions unchanged]
```

## Components and Interfaces

### 1. Source Weight Calculator

**Purpose:** Calculate weighted influence for each data source based on quality and quantity.

**Function Signature:**
```javascript
/**
 * Calculate the weight for a data source
 * @param {Object} source - Source object with type and metadata
 * @param {string} source.type - Source type ('gmail', 'text', 'blog')
 * @param {Object} source.result - Analysis result with metrics
 * @returns {number} Calculated weight (0.0 - 2.0 range before normalization)
 */
const calculateSourceWeight = (source) => { ... }
```

**Algorithm:**
1. Determine quality weight based on source type:
   - Gmail: 1.0 (natural, unedited writing)
   - Text: 0.8 (user-provided samples)
   - Blog: 0.6 (polished, edited content)

2. Extract word count from source metadata:
   - Gmail: `result.metrics.wordCount` or `result.profile.sampleCount.emailWords`
   - Text: `result.metrics.wordCount`
   - Blog: `result.metrics.totalWords`

3. Calculate quantity factor:
   - < 500 words: 0.5
   - 500-1500 words: 1.0
   - > 1500 words: 1.5

4. Return: `qualityWeight × quantityFactor`

**Edge Cases:**
- Missing word count: default to 500 (quantity factor = 1.0)
- Invalid source type: default quality weight to 0.5
- Zero word count: treat as 100 words (quantity factor = 0.5)

### 2. Weight Normalizer

**Purpose:** Normalize source weights so they sum to 1.0 for proper weighted averaging.

**Function Signature:**
```javascript
/**
 * Normalize weights to sum to 1.0
 * @param {Array<Object>} sourcesWithWeights - Sources with calculated weights
 * @returns {Array<Object>} Sources with normalized weights
 */
const normalizeWeights = (sourcesWithWeights) => { ... }
```

**Algorithm:**
1. Calculate sum of all weights
2. Divide each weight by the sum
3. Return sources with normalized weights

**Edge Cases:**
- Sum is zero: assign equal weights (1/n) to all sources
- Single source: weight becomes 1.0

### 3. Tone Merger (Weighted Voting)

**Purpose:** Select the most representative tone across all sources using weighted voting.

**Function Signature:**
```javascript
/**
 * Merge tone attributes using weighted voting
 * @param {Array<Object>} sources - Sources with normalized weights
 * @returns {Object} Merged tone and attribution
 */
const mergeTone = (sources) => { ... }
```

**Algorithm:**
1. Create a vote tally object: `{ conversational: 0, professional: 0, neutral: 0 }`
2. For each source, add its normalized weight to the tally for its tone value
3. Select the tone with the highest total weight
4. If tied, select tone from highest-quality source
5. Return tone value and attribution breakdown

**Example:**
```javascript
// Input:
[
  { type: 'gmail', weight: 0.5, tone: 'conversational' },
  { type: 'text', weight: 0.3, tone: 'conversational' },
  { type: 'blog', weight: 0.2, tone: 'professional' }
]

// Tally: { conversational: 0.8, professional: 0.2 }
// Result: 'conversational'
```

### 4. Formality Merger (Weighted Averaging)

**Purpose:** Calculate average formality level across sources using numeric mapping.

**Function Signature:**
```javascript
/**
 * Merge formality attributes using weighted averaging
 * @param {Array<Object>} sources - Sources with normalized weights
 * @returns {Object} Merged formality and attribution
 */
const mergeFormality = (sources) => { ... }
```

**Algorithm:**
1. Map formality values to numbers:
   - 'casual' → 0
   - 'balanced' → 1
   - 'formal' → 2

2. Calculate weighted average:
   ```
   average = Σ(formalityScore × weight)
   ```

3. Map average back to formality:
   - < 0.5 → 'casual'
   - 0.5 to 1.5 → 'balanced'
   - > 1.5 → 'formal'

4. Return formality value and attribution breakdown

**Example:**
```javascript
// Input:
[
  { type: 'gmail', weight: 0.6, formality: 'casual' },    // 0 × 0.6 = 0.0
  { type: 'text', weight: 0.4, formality: 'balanced' }    // 1 × 0.4 = 0.4
]

// Average: 0.4 → maps to 'casual'
```

### 5. Sentence Length Merger (Weighted Voting)

**Purpose:** Determine typical sentence length using weighted voting (same strategy as tone).

**Function Signature:**
```javascript
/**
 * Merge sentence length attributes using weighted voting
 * @param {Array<Object>} sources - Sources with normalized weights
 * @returns {Object} Merged sentence length and attribution
 */
const mergeSentenceLength = (sources) => { ... }
```

**Algorithm:** Same as tone merger, but for sentence length values ('short', 'medium', 'long').

### 6. Vocabulary Merger (Weighted Union)

**Purpose:** Combine vocabulary terms from all sources, prioritizing terms from higher-weighted sources.

**Function Signature:**
```javascript
/**
 * Merge vocabulary attributes using weighted union
 * @param {Array<Object>} sources - Sources with normalized weights
 * @returns {Object} Merged vocabulary and attribution
 */
const mergeVocabulary = (sources) => { ... }
```

**Algorithm:**
1. Create a term score map: `{ term: totalWeight }`
2. For each source:
   - For each vocabulary term in that source
   - Add the source's weight to that term's score
3. Sort terms by score (descending)
4. Select top 4 terms
5. Return vocabulary array and attribution breakdown

**Example:**
```javascript
// Input:
[
  { weight: 0.5, vocabulary: ['clear', 'direct', 'concise'] },
  { weight: 0.3, vocabulary: ['clear', 'relatable'] },
  { weight: 0.2, vocabulary: ['descriptive', 'direct'] }
]

// Scores:
// clear: 0.8, direct: 0.7, concise: 0.5, relatable: 0.3, descriptive: 0.2

// Result: ['clear', 'direct', 'concise', 'relatable']
```

### 7. Avoidance Merger (Weighted Intersection)

**Purpose:** Identify elements consistently avoided across sources.

**Function Signature:**
```javascript
/**
 * Merge avoidance attributes using weighted intersection
 * @param {Array<Object>} sources - Sources with normalized weights
 * @returns {Object} Merged avoidance and attribution
 */
const mergeAvoidance = (sources) => { ... }
```

**Algorithm:**
1. Create a term frequency map: `{ term: { count, totalWeight } }`
2. For each source:
   - For each avoidance term (skip 'none')
   - Increment count and add source weight
3. Calculate appearance percentage: `count / totalSources`
4. Select terms appearing in ≥50% of sources
5. If none meet threshold, select terms with totalWeight > 0.6
6. If still none, return ['none']
7. Limit to 3 terms maximum
8. Return avoidance array and attribution breakdown

**Example:**
```javascript
// Input (3 sources):
[
  { weight: 0.5, avoidance: ['emojis', 'slang'] },
  { weight: 0.3, avoidance: ['emojis', 'excessive-punctuation'] },
  { weight: 0.2, avoidance: ['none'] }
]

// Frequency:
// emojis: 2/3 = 67% (meets 50% threshold)
// slang: 1/3 = 33%
// excessive-punctuation: 1/3 = 33%

// Result: ['emojis']
```

### 8. Confidence Calculator

**Purpose:** Calculate profile confidence based on source diversity and data quantity.

**Function Signature:**
```javascript
/**
 * Calculate confidence score for merged profile
 * @param {Array<Object>} sources - All sources with metadata
 * @returns {number} Confidence score (0.0 - 0.95)
 */
const calculateMergedConfidence = (sources) => { ... }
```

**Algorithm:**
1. Base confidence: 0.5 (single source)
2. Add 0.15 per additional source (max 4 sources)
3. Calculate total word count across all sources
4. Add 0.05 if total > 1000 words
5. Add 0.05 if total > 2000 words
6. Cap at 0.95
7. Round to 2 decimal places

**Example:**
```javascript
// 3 sources, 1500 total words
// Base: 0.5
// Additional sources: 0.15 × 2 = 0.3
// Word bonus: 0.05 (>1000)
// Total: 0.85
```

### 9. Source Attribution Generator

**Purpose:** Create transparency metadata showing which sources contributed to each attribute.

**Function Signature:**
```javascript
/**
 * Generate source attribution metadata
 * @param {Object} attributions - Attribution data from merge functions
 * @returns {Object} Formatted attribution metadata
 */
const generateSourceAttribution = (attributions) => { ... }
```

**Data Structure:**
```javascript
{
  tone: {
    value: 'conversational',
    sources: [
      { type: 'gmail', contribution: 60 },
      { type: 'text', contribution: 40 }
    ]
  },
  formality: {
    value: 'casual',
    sources: [
      { type: 'gmail', contribution: 70 },
      { type: 'blog', contribution: 30 }
    ]
  },
  // ... other attributes
}
```

### 10. Main Merging Orchestrator

**Purpose:** Coordinate the entire merging process and return the final merged style.

**Function Signature:**
```javascript
/**
 * Merge writing styles from multiple sources
 * @param {Array<Object>} sources - Array of source objects with analysis results
 * @returns {Object} Merged writing style with attribution
 */
export const mergeWritingStyles = (sources) => { ... }
```

**Algorithm:**
1. Filter sources to only include those with valid writing styles
2. Handle edge case: if no valid sources, return default style
3. Calculate weights for each source
4. Normalize weights
5. Merge each attribute using appropriate strategy:
   - Tone: weighted voting
   - Formality: weighted averaging
   - Sentence length: weighted voting
   - Vocabulary: weighted union
   - Avoidance: weighted intersection
6. Calculate confidence score
7. Generate source attribution metadata
8. Return merged style object

**Return Structure:**
```javascript
{
  writingStyle: {
    tone: 'conversational',
    formality: 'casual',
    sentenceLength: 'medium',
    vocabulary: ['clear', 'direct', 'concise', 'relatable'],
    avoidance: ['emojis', 'excessive-punctuation']
  },
  sourceAttribution: { /* attribution metadata */ },
  confidence: 0.85,
  sourcesUsed: 3
}
```

## Data Models

### Extended StyleProfile

```javascript
/**
 * @typedef {Object} StyleProfile
 * @property {string} id
 * @property {string} userId
 * @property {number} version
 * @property {number} lastUpdated
 * @property {CodingStyle} coding
 * @property {WritingStyle} writing
 * @property {number} confidence
 * @property {SampleCount} sampleCount
 * @property {SourceAttribution} sourceAttribution [NEW]
 */
```

### SourceAttribution

```javascript
/**
 * @typedef {Object} SourceAttribution
 * @property {AttributeAttribution} tone
 * @property {AttributeAttribution} formality
 * @property {AttributeAttribution} sentenceLength
 * @property {AttributeAttribution} vocabulary
 * @property {AttributeAttribution} avoidance
 */

/**
 * @typedef {Object} AttributeAttribution
 * @property {string|string[]} value - The merged value
 * @property {SourceContribution[]} sources - Contributing sources
 */

/**
 * @typedef {Object} SourceContribution
 * @property {string} type - Source type ('gmail', 'text', 'blog')
 * @property {number} contribution - Percentage contribution (0-100)
 */
```

### SourceWithWeight (Internal)

```javascript
/**
 * @typedef {Object} SourceWithWeight
 * @property {string} type - Source type
 * @property {number} weight - Normalized weight (0.0-1.0)
 * @property {WritingStyle} writingStyle - Style from this source
 * @property {number} wordCount - Word count for this source
 */
```

## Error Handling

### Invalid Source Handling

**Scenario:** Source lacks required style attributes

**Strategy:**
1. Log warning with source type and missing fields
2. Exclude source from merging
3. Continue with remaining valid sources
4. If all sources invalid, return default style with confidence 0.3

**Implementation:**
```javascript
const validateSource = (source) => {
  const required = ['tone', 'formality', 'sentenceLength', 'vocabulary', 'avoidance'];
  const style = source.result?.writingStyle || source.result?.profile?.writing;
  
  if (!style) return false;
  
  for (const field of required) {
    if (!style[field]) {
      console.warn(`Source ${source.type} missing field: ${field}`);
      return false;
    }
  }
  
  return true;
};
```

### Invalid Attribute Values

**Scenario:** Source has unrecognized tone/formality/sentence length value

**Strategy:**
1. Map invalid values to defaults:
   - Invalid tone → 'neutral'
   - Invalid formality → 'balanced'
   - Invalid sentence length → 'medium'
2. Log warning
3. Continue merging with corrected value

**Implementation:**
```javascript
const normalizeTone = (tone) => {
  const valid = ['conversational', 'professional', 'neutral'];
  if (!valid.includes(tone)) {
    console.warn(`Invalid tone "${tone}", defaulting to "neutral"`);
    return 'neutral';
  }
  return tone;
};
```

### Missing Metadata

**Scenario:** Source lacks word count metadata

**Strategy:**
1. Estimate word count as 500 (medium sample)
2. Log info message
3. Continue with estimated value

### Empty Source Array

**Scenario:** No sources provided to merging function

**Strategy:**
1. Return default writing style
2. Set confidence to 0.3
3. Set sourcesUsed to 0
4. Empty source attribution

## Testing Strategy

### Unit Tests

**Test Suite 1: Weight Calculation**
- Test quality weights for each source type
- Test quantity factors for different word counts
- Test edge cases (missing word count, zero words, invalid type)
- Test weight normalization with various input combinations

**Test Suite 2: Attribute Merging**
- Test tone merging with various weight distributions
- Test formality averaging with boundary cases
- Test sentence length voting with ties
- Test vocabulary union with overlapping terms
- Test avoidance intersection with various thresholds

**Test Suite 3: Confidence Calculation**
- Test confidence with 1-5 sources
- Test word count bonuses
- Test confidence capping at 0.95
- Test rounding to 2 decimal places

**Test Suite 4: Source Attribution**
- Test attribution generation for each attribute type
- Test percentage calculation accuracy
- Test attribution with single source
- Test attribution with multiple sources

**Test Suite 5: Error Handling**
- Test invalid source filtering
- Test invalid attribute value normalization
- Test missing metadata handling
- Test empty source array handling

### Integration Tests

**Test Suite 6: End-to-End Merging**
- Test merging 2 sources (Gmail + Text)
- Test merging 3 sources (Gmail + Text + Blog)
- Test merging with one invalid source
- Test merging with all invalid sources
- Test backward compatibility with single source

**Test Suite 7: buildStyleProfile Integration**
- Test buildStyleProfile calls mergeWritingStyles
- Test profile structure includes attribution
- Test confidence calculation matches expectations
- Test sample count aggregation

### Manual Testing Scenarios

**Scenario 1: Real Gmail + Text Sample**
- Connect Gmail with 50+ emails
- Provide 1000-word text sample
- Verify merged profile reflects both sources
- Check attribution shows Gmail dominance (higher weight)

**Scenario 2: Three Diverse Sources**
- Gmail: casual, conversational
- Text: balanced, neutral
- Blog: formal, professional
- Verify merged profile balances all three
- Check confidence score increases with more sources

**Scenario 3: Conflicting Sources**
- Source 1: casual, short sentences
- Source 2: formal, long sentences
- Verify weighted voting produces sensible result
- Check attribution shows split contributions

## Performance Considerations

### Time Complexity

- Weight calculation: O(n) where n = number of sources
- Weight normalization: O(n)
- Tone merging: O(n)
- Formality merging: O(n)
- Sentence length merging: O(n)
- Vocabulary merging: O(n × m) where m = avg vocabulary size (~3-4)
- Avoidance merging: O(n × k) where k = avg avoidance size (~2-3)
- Overall: O(n) linear time complexity

### Space Complexity

- Source weight array: O(n)
- Attribute tallies: O(1) constant size
- Vocabulary/avoidance maps: O(v) where v = unique terms (~10-20)
- Overall: O(n) linear space complexity

### Optimization Opportunities

1. **Lazy Evaluation:** Only calculate attribution if requested
2. **Caching:** Cache normalized weights if merging multiple profiles
3. **Early Exit:** Skip merging if only one valid source
4. **Parallel Processing:** Merge attributes in parallel (future enhancement)

## Migration Strategy

### Phase 1: Add New Functions (Non-Breaking)

1. Add all new merge functions to StyleAnalyzer.js
2. Keep existing buildStyleProfile logic intact
3. Add feature flag: `USE_MULTI_SOURCE_MERGING = false`
4. Deploy and monitor

### Phase 2: Enable Merging (Gradual Rollout)

1. Set feature flag to `true`
2. Update buildStyleProfile to use mergeWritingStyles
3. Monitor error rates and profile quality
4. Rollback flag if issues detected

### Phase 3: Cleanup (After Validation)

1. Remove feature flag
2. Remove old priority selection code
3. Update documentation
4. Mark as stable

### Backward Compatibility

**Existing Profiles:**
- Old profiles without sourceAttribution will continue to work
- Attribution will be added on next profile update
- No data migration required

**Single-Source Profiles:**
- Merging algorithm handles single source gracefully
- Weight becomes 1.0 after normalization
- Attribution shows 100% from single source

**API Compatibility:**
- buildStyleProfile maintains same function signature
- Return structure adds optional sourceAttribution field
- Existing code reading profile.writing continues to work

## Future Enhancements

### Phase 2 Improvements

1. **Machine Learning Weights:** Learn optimal weights from user feedback
2. **Temporal Weighting:** Weight recent sources higher than old ones
3. **Context-Aware Merging:** Different merge strategies for work vs personal contexts
4. **User-Adjustable Weights:** Let users manually adjust source weights
5. **Attribute-Specific Confidence:** Per-attribute confidence scores
6. **Visual Attribution UI:** Show attribution in profile display
7. **Source Quality Scoring:** Dynamic quality scores based on data characteristics

### Advanced Features

1. **Incremental Updates:** Update profile when new source added without re-analyzing all
2. **A/B Testing:** Compare merged profiles vs priority selection
3. **Profile Versioning:** Track profile changes over time
4. **Merge Strategy Selection:** Let users choose merge strategies
5. **Outlier Detection:** Identify and handle anomalous sources
