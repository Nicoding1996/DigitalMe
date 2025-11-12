# Quality Checks Implementation

## Overview
Added intelligent quality checks to the confidence calculation to prevent gaming the system while preserving genuine style patterns.

## Two-Layer Quality Detection

### 1. Spam Detection (Within Single Source)
**Purpose:** Catch copy-paste behavior where someone repeats the same text multiple times

**How It Works:**
- Splits text into sentences
- Counts unique vs total sentences
- If < 30% unique sentences → SPAM detected
- **Penalty:** 50% confidence reduction

**Example:**
```
Input: "I like coding. I like coding. I like coding..." (repeated 10x)
Detection: 10% unique sentences → SPAM
Result: 70% confidence → 35% confidence
```

### 2. Vocabulary Diversity Check (Across All Sources)
**Purpose:** Catch extremely low word variety (gibberish or minimal content)

**How It Works:**
- Collects all unique words across ALL sources
- Calculates: unique words / total words
- Only penalizes if < 15% unique AND > 500 words
- **Penalty:** 30% confidence reduction

**Example:**
```
Input: 1000 words but only 100 unique words (10% diversity)
Detection: Below 15% threshold → LOW DIVERSITY
Result: 55% confidence → 38% confidence
```

## What We DON'T Penalize (Important!)

### ✅ Natural Style Patterns (GOOD)
- Same phrases appearing across DIFFERENT sources
- Example: "I think", "basically", "you know" in both emails AND blog
- This is CONSISTENT STYLE, not spam
- **Bonus:** +3% for multiple sources (validates patterns)

### ✅ Technical Repetition
- Technical documentation with repeated terms
- Legal text with standard phrases
- Only penalized if EXTREME (< 15% diversity)

## Quality Check Thresholds

| Check | Threshold | Penalty | Rationale |
|-------|-----------|---------|-----------|
| Spam Detection | < 30% unique sentences | -50% | Clear copy-paste behavior |
| Low Diversity | < 15% unique words | -30% | Extremely limited vocabulary |
| Multiple Sources | 2+ sources | +3% | Cross-validates patterns |
| Source Diversity | 2+ types | +3% | Varied contexts |

## Example Scenarios

### Scenario 1: Legitimate User
```
Input: 2000 words of genuine writing
- Unique sentences: 85%
- Vocabulary diversity: 45%
Result: 70% base → No penalties → 70% confidence ✅
```

### Scenario 2: Copy-Paste Spam
```
Input: 200 words repeated 10x = 2000 words
- Unique sentences: 10% → SPAM DETECTED
- Vocabulary diversity: 8% → LOW DIVERSITY
Result: 70% base → 50% penalty → 35% → 30% penalty → 24% confidence ⚠️
```

### Scenario 3: Consistent Style Across Sources
```
Input: 1000 words email + 1000 words blog (same phrases naturally repeated)
- Unique sentences: 70% (no spam)
- Vocabulary diversity: 35% (natural repetition)
- Multiple sources: YES
Result: 55% base → No penalties → +3% bonus → 58% confidence ✅
```

### Scenario 4: Technical Documentation
```
Input: 1500 words of technical docs (repeated terms like "function", "parameter")
- Unique sentences: 60% (no spam)
- Vocabulary diversity: 25% (technical repetition, above 15% threshold)
Result: 55% base → No penalties → 55% confidence ✅
```

## Implementation Details

### Spam Detection Function
```javascript
const detectSpam = (text) => {
  // Split into sentences
  const sentences = text.split(/[.!?]+/)
    .map(s => s.trim().toLowerCase())
    .filter(s => s.length > 10);
  
  // Count unique
  const uniqueSentences = new Set(sentences);
  const uniqueRatio = uniqueSentences.size / sentences.length;
  
  // < 30% unique = spam
  return uniqueRatio < 0.3;
};
```

### Vocabulary Diversity Function
```javascript
const calculateVocabularyDiversity = (sources) => {
  const allWords = new Set();
  let totalWords = 0;
  
  sources.forEach(source => {
    // Extract text from each source
    const words = text.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(w => w.length > 3); // Ignore short words
    
    words.forEach(w => allWords.add(w));
    totalWords += words.length;
  });
  
  return allWords.size / totalWords;
};
```

## Benefits

1. **Prevents Gaming:** Can't fake high confidence with copy-paste
2. **Preserves Patterns:** Natural style repetition is rewarded, not penalized
3. **Smart Thresholds:** Only catches extreme cases, not normal writing
4. **Cross-Validation:** Multiple sources validate that patterns are genuine

## Testing Recommendations

1. **Test spam detection:**
   - Input same 200 words repeated 10x
   - Verify confidence drops significantly

2. **Test legitimate repetition:**
   - Input 1000 words email + 1000 words blog with natural phrase overlap
   - Verify confidence stays high

3. **Test technical content:**
   - Input technical documentation with repeated terms
   - Verify no false positive penalties

4. **Test edge cases:**
   - Very short text (< 100 words)
   - Single sentence repeated
   - Mixed quality sources
