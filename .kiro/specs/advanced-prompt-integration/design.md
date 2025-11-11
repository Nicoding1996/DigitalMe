# Design Document

## Overview

This feature enhances the `buildMetaPrompt()` function in `backend/server.js` to incorporate advanced style analysis data into the dynamic prompt construction. The design focuses on translating rich linguistic patterns (signature phrases, idiosyncrasies, contextual vocabulary, thought flow) into actionable instructions for the Gemini API.

## Architecture

### Current Flow
```
User Request → ContentGenerator → /api/generate → buildMetaPrompt(prompt, styleProfile) → Gemini API
                                                          ↓
                                                  Only uses styleProfile.writing & styleProfile.coding
```

### Enhanced Flow
```
User Request → ContentGenerator → /api/generate → buildMetaPrompt(prompt, styleProfile) → Gemini API
                                                          ↓
                                                  Uses styleProfile.writing, styleProfile.coding, 
                                                  AND styleProfile.advanced (phrases, idiosyncrasies, 
                                                  contextual patterns, thought patterns)
```

## Components and Interfaces

### 1. Enhanced buildMetaPrompt Function

**Location:** `backend/server.js`

**Signature:**
```javascript
function buildMetaPrompt(userPrompt, styleProfile)
```

**Input:**
- `userPrompt` (string): User's request
- `styleProfile` (object): Complete style profile with structure:
  ```javascript
  {
    writing: { tone, formality, sentenceLength, vocabulary, avoidance },
    coding: { language, framework, componentStyle, namingConvention, commentFrequency, patterns },
    advanced: {
      phrases: [{ phrase, frequency, category }],
      idiosyncrasies: [{ text, explanation, category }],
      contextualPatterns: { technical, personal, creative },
      thoughtPatterns: { flowScore, parentheticalFrequency, transitionStyle }
    }
  }
  ```

**Output:**
- Enhanced meta-prompt string with advanced pattern instructions

### 2. Advanced Pattern Formatters

**Purpose:** Convert raw analysis data into natural language instructions for Gemini

**Functions:**

```javascript
// Format signature phrases into prompt instructions
function formatSignaturePhrases(phrases) {
  // Returns: String with top phrases and usage guidance
}

// Format idiosyncrasies into replication instructions
function formatIdiosyncrasies(idiosyncrasies) {
  // Returns: String with quirk examples and how to use them
}

// Format contextual vocabulary into categorized lists
function formatContextualVocabulary(contextualPatterns) {
  // Returns: String with technical/personal/creative vocabulary
}

// Format thought patterns into structural instructions
function formatThoughtPatterns(thoughtPatterns) {
  // Returns: String with flow, transition, and parenthetical guidance
}
```

## Data Models

### Advanced Analysis Data Structure

```javascript
{
  phrases: [
    {
      phrase: "my luvins",
      frequency: 3,
      category: "signature"  // signature, filler, transition
    }
  ],
  idiosyncrasies: [
    {
      text: "Hi bebboo was knocked out kanaina :(((",
      explanation: "Heavy use of non-standard, variable terms of endearment...",
      category: "IDIOSYNCRASY"  // IDIOSYNCRASY, HUMOR, STRUCTURE
    }
  ],
  contextualPatterns: {
    technical: {
      formality: "casual",
      tone: "concerned",
      vocabulary: ["typhoon", "electricity", "water", "solar", "blackout"]
    },
    personal: {
      formality: "casual",
      tone: "affectionate",
      vocabulary: ["beboo", "luvins", "my love", "kanaina"]
    },
    creative: {
      formality: "casual",
      tone: "enthusiastic",
      vocabulary: ["beautiful", "mid century Persian style"]
    }
  },
  thoughtPatterns: {
    flowScore: 90,
    parentheticalFrequency: 0,
    transitionStyle: "abrupt"
  }
}
```

## Implementation Strategy

### Phase 1: Add Helper Functions

Create formatter functions that convert each advanced analysis component into prompt-ready text:

1. `formatSignaturePhrases()` - Extract top 5-7 phrases, format with frequency indicators
2. `formatIdiosyncrasies()` - Extract top 5 quirks, provide clear replication examples
3. `formatContextualVocabulary()` - Organize vocabulary by context type
4. `formatThoughtPatterns()` - Translate numeric scores into writing instructions

### Phase 2: Enhance buildMetaPrompt

Modify `buildMetaPrompt()` to:

1. Check if `styleProfile.advanced` exists and has data
2. Call formatter functions for each advanced component
3. Inject formatted instructions into appropriate sections of meta-prompt
4. Maintain backward compatibility when advanced data is missing

### Phase 3: Prompt Structure

**Enhanced Meta-Prompt Structure:**

```
[CORE IDENTITY]
You are my digital twin...

[BASIC WRITING STYLE]
- Tone: conversational
- Formality: casual
...

[SIGNATURE EXPRESSIONS] ← NEW
Use these recurring phrases naturally:
- "my luvins" (very frequent - use often)
- "huhuhu" (frequent - for expressing sadness/frustration)
...

[UNIQUE QUIRKS] ← NEW
Mirror these distinctive patterns:
- Use non-standard terms of endearment (beboo, luvins, kanaina)
- Mix English with Tagalog/Filipino expressions naturally
- Use expressive onomatopoeia (huhuhu, heueheu)
...

[CONTEXTUAL VOCABULARY] ← NEW
Match vocabulary to context:
- Technical topics: typhoon, electricity, water, solar, blackout
- Personal topics: beboo, luvins, my love, kanaina
- Creative topics: beautiful, mid century Persian style
...

[THOUGHT STRUCTURE] ← NEW
- Flow: Maintain smooth, connected prose (score: 90/100)
- Transitions: Use abrupt, direct transitions between ideas
- Parentheticals: Minimal use of parenthetical asides
...

[CODING STYLE]
...

[USER REQUEST]
...
```

## Error Handling

### Graceful Degradation

1. **Missing advanced data:** If `styleProfile.advanced` is null/undefined, use only basic profile
2. **Partial advanced data:** If some components are missing, use available components
3. **Empty arrays:** If phrases/idiosyncrasies arrays are empty, skip those sections
4. **Invalid data types:** Validate data structure before formatting

### Logging

```javascript
if (!styleProfile.advanced) {
  console.log('No advanced analysis data available, using basic profile only');
} else {
  console.log('Using advanced analysis:', {
    phrases: styleProfile.advanced.phrases?.length || 0,
    idiosyncrasies: styleProfile.advanced.idiosyncrasies?.length || 0,
    hasContextual: !!styleProfile.advanced.contextualPatterns,
    hasThoughtPatterns: !!styleProfile.advanced.thoughtPatterns
  });
}
```

## Testing Strategy

### Unit Testing

1. Test `formatSignaturePhrases()` with various phrase arrays
2. Test `formatIdiosyncrasies()` with different quirk types
3. Test `formatContextualVocabulary()` with complete and partial context data
4. Test `formatThoughtPatterns()` with different score ranges
5. Test `buildMetaPrompt()` with and without advanced data

### Integration Testing

1. Test complete flow: text sample → advanced analysis → prompt generation → AI response
2. Verify AI responses actually use signature phrases
3. Verify AI responses mirror idiosyncrasies
4. Verify AI responses adapt vocabulary to context
5. Test backward compatibility with profiles lacking advanced data

### Manual Testing

1. Analyze sample text with distinctive patterns
2. Generate multiple AI responses
3. Verify responses feel authentically like the user's voice
4. Check that signature phrases appear naturally
5. Confirm quirks are replicated appropriately

## Performance Considerations

### Prompt Length

- Advanced data will increase meta-prompt length by ~500-1000 characters
- Gemini API has generous context limits (>100k tokens), so this is acceptable
- Monitor total prompt length to ensure it stays under API limits

### Formatting Overhead

- Formatter functions are simple string operations (O(n) complexity)
- Negligible performance impact (<1ms per format operation)
- No caching needed at this layer

## Security Considerations

- Advanced analysis data comes from user's own text, no external sources
- No new security risks introduced
- Maintain existing security practices (no logging of sensitive data)
- Sanitize any user-provided text before including in prompts

## Future Enhancements

1. **Dynamic weighting:** Adjust how heavily to emphasize different pattern types based on user feedback
2. **Context detection:** Automatically detect if user request is technical/personal/creative and emphasize relevant vocabulary
3. **Pattern evolution:** Update advanced patterns over time as user's style evolves
4. **A/B testing:** Compare responses with and without advanced patterns to measure improvement
