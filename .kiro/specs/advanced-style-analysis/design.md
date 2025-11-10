# Design Document - Advanced Style Analysis

## Overview

The Advanced Style Analysis feature extends DigitalMe's style profiling with deep NLP analysis to capture unique expressions, thought patterns, personality quirks, and contextual variations. This design leverages the Gemini API for sophisticated text analysis while maintaining performance and user privacy.

## Architecture

### High-Level Flow

```
User Provides Text
       ↓
Basic Style Analysis (existing)
       ↓
Advanced Analysis Opt-in Check
       ↓
[IF opted-in]
       ↓
Text Preprocessing & Chunking
       ↓
Parallel NLP Analysis:
  - Phrase Pattern Detection
  - Thought Flow Analysis  
  - Personality Quirk Detection
  - Contextual Pattern Analysis
       ↓
Result Aggregation & Merging
       ↓
Extended Style Profile Storage
```

### Component Architecture

```
Frontend (React)
├── SourceConnector (modified)
│   └── Advanced Analysis Opt-in Checkbox
├── AnalysisProgress (modified)
│   └── Advanced Analysis Progress Indicators
├── ProfileSummary (modified)
│   └── Advanced Patterns Display Section
└── AdvancedPatternsView (new)
    └── Expandable view for phrases, quirks, etc.

Backend (Express)
├── /api/analyze-advanced (new endpoint)
├── AdvancedStyleAnalyzer.js (new service)
│   ├── analyzePhrasePatterns()
│   ├── analyzeThoughtFlow()
│   ├── analyzePersonalityQuirks()
│   └── analyzeContextualPatterns()
├── GeminiNLPService.js (new service)
│   ├── callGeminiAPI()
│   ├── buildAnalysisPrompt()
│   └── parseGeminiResponse()
└── TextPreprocessor.js (new utility)
    ├── anonymizeText()
    ├── chunkText()
    └── extractMetadata()
```

## Components and Interfaces

### 1. Frontend Components

#### AdvancedAnalysisOptIn Component (new)
```javascript
// Checkbox in SourceConnector for opting into advanced analysis
<AdvancedAnalysisOptIn 
  isEnabled={advancedAnalysisEnabled}
  onToggle={setAdvancedAnalysisEnabled}
/>
```

**Props:**
- `isEnabled`: boolean - Current opt-in state
- `onToggle`: function - Callback when user toggles

**UI:**
- Checkbox with label: "Enable Advanced Style Analysis (captures unique phrases and patterns)"
- Info tooltip explaining what data is analyzed
- Privacy note: "Personal information is anonymized"

#### AdvancedPatternsView Component (new)
```javascript
// Displays advanced analysis results in ProfileSummary
<AdvancedPatternsView 
  phrases={profile.advanced.phrases}
  thoughtPatterns={profile.advanced.thoughtPatterns}
  personalityMarkers={profile.advanced.personalityMarkers}
  contextualPatterns={profile.advanced.contextualPatterns}
/>
```

**Sections:**
1. **Signature Phrases** - List of recurring expressions with frequency
2. **Thought Flow** - Visual representation of structure vs stream-of-consciousness
3. **Personality Quirks** - Detected self-aware comments and humor patterns
4. **Contextual Variations** - How style changes by topic

### 2. Backend Services

#### AdvancedStyleAnalyzer Service (new)

**File:** `backend/services/AdvancedStyleAnalyzer.js`

**Main Function:**
```javascript
async function analyzeAdvanced(text, options = {}) {
  // Preprocess text
  const preprocessed = TextPreprocessor.anonymizeText(text);
  const chunks = TextPreprocessor.chunkText(preprocessed, 2000);
  
  // Run analyses in parallel
  const [phrases, thoughtFlow, quirks, contextual] = await Promise.all([
    analyzePhrasePatterns(chunks),
    analyzeThoughtFlow(chunks),
    analyzePersonalityQuirks(chunks),
    analyzeContextualPatterns(chunks)
  ]);
  
  // Aggregate results
  return {
    phrases,
    thoughtPatterns: thoughtFlow,
    personalityMarkers: quirks,
    contextualPatterns: contextual
  };
}
```

**Sub-Functions:**

1. **analyzePhrasePatterns(chunks)**
   - Calls Gemini API with prompt: "Extract recurring phrases, transitions, and signature expressions"
   - Returns: `{ phrase, frequency, category }[]`
   - Categories: 'signature', 'transition', 'filler'

2. **analyzeThoughtFlow(chunks)**
   - Calls Gemini API with prompt: "Analyze thought organization: structured vs stream-of-consciousness"
   - Returns: `{ flowScore, parentheticalFrequency, transitionStyle }`
   - flowScore: 0-100 (0=structured, 100=stream-of-consciousness)

3. **analyzePersonalityQuirks(chunks)**
   - Calls Gemini API with prompt: "Identify self-referential comments, humor patterns, personal context"
   - Returns: `{ text, type, context }[]`
   - Types: 'self-aware', 'humor', 'personal-context'

4. **analyzeContextualPatterns(chunks)**
   - Calls Gemini API with prompt: "Detect topic categories and style variations by context"
   - Returns: `{ [topic]: { formality, tone, vocabulary } }`
   - Topics: 'technical', 'personal', 'professional', 'creative'

#### GeminiNLPService (new)

**File:** `backend/services/GeminiNLPService.js`

**Interface:**
```javascript
class GeminiNLPService {
  async analyze(text, analysisType, options = {}) {
    const prompt = this.buildPrompt(text, analysisType);
    const response = await this.callWithRetry(prompt, options);
    return this.parseResponse(response, analysisType);
  }
  
  buildPrompt(text, analysisType) {
    // Structured prompts for each analysis type
    const prompts = {
      phrases: `Analyze the following text and extract:
1. Recurring multi-word phrases (appearing 2+ times)
2. Transition phrases (e.g., "I think", "kind of")
3. Signature expressions unique to this writer

Return JSON: [{ phrase, frequency, category }]

Text: ${text}`,
      
      thoughtFlow: `Analyze the thought organization in this text:
1. Is it structured (clear topic progression) or stream-of-consciousness?
2. How often does the writer use parentheses or nested clauses?
3. How does the writer transition between ideas?

Return JSON: { flowScore: 0-100, parentheticalFrequency: number, transitionStyle: string }

Text: ${text}`,
      
      // ... similar for quirks and contextual
    };
    
    return prompts[analysisType];
  }
  
  async callWithRetry(prompt, options, retries = 2) {
    for (let i = 0; i <= retries; i++) {
      try {
        const response = await this.geminiAPI.generateContent(prompt);
        return response.text();
      } catch (error) {
        if (i === retries) throw error;
        await this.delay(Math.pow(2, i) * 1000); // Exponential backoff
      }
    }
  }
  
  parseResponse(response, analysisType) {
    // Extract JSON from Gemini response
    const jsonMatch = response.match(/```json\n([\s\S]*?)\n```/) || 
                      response.match(/\{[\s\S]*\}/) ||
                      response.match(/\[[\s\S]*\]/);
    
    if (!jsonMatch) {
      throw new Error('Failed to parse Gemini response');
    }
    
    return JSON.parse(jsonMatch[1] || jsonMatch[0]);
  }
}
```

#### TextPreprocessor Utility (new)

**File:** `backend/utils/TextPreprocessor.js`

**Functions:**

1. **anonymizeText(text)**
   - Replaces email addresses with `[EMAIL]`
   - Replaces phone numbers with `[PHONE]`
   - Replaces names (using NER if available) with `[NAME]`
   - Preserves writing style and patterns

2. **chunkText(text, maxChunkSize = 2000)**
   - Splits text into chunks at sentence boundaries
   - Ensures chunks don't exceed Gemini API token limits
   - Returns array of text chunks

3. **extractMetadata(text)**
   - Word count, sentence count, paragraph count
   - Average sentence length
   - Punctuation frequency
   - Returns metadata object

## Data Models

### Extended Style Profile Structure

```javascript
{
  // Existing fields
  id: string,
  userId: string,
  writing: { tone, formality, sentenceLength, vocabulary, avoidance },
  coding: { ... },
  confidence: number,
  sampleCount: { ... },
  sourceAttribution: { ... },
  
  // NEW: Advanced analysis fields
  advanced: {
    phrases: [
      {
        phrase: string,           // e.g., "I think"
        frequency: number,        // e.g., 12
        category: string          // 'signature' | 'transition' | 'filler'
      }
    ],
    
    thoughtPatterns: {
      flowScore: number,          // 0-100 (0=structured, 100=stream)
      parentheticalFrequency: number,  // Uses per 1000 words
      transitionStyle: string     // 'abrupt' | 'smooth' | 'mixed'
    },
    
    personalityMarkers: [
      {
        text: string,             // Original snippet
        type: string,             // 'self-aware' | 'humor' | 'personal-context'
        context: string           // Brief description
      }
    ],
    
    contextualPatterns: {
      technical: {
        formality: string,        // 'casual' | 'balanced' | 'formal'
        tone: string,
        vocabulary: string[]
      },
      personal: { ... },
      professional: { ... },
      creative: { ... }
    },
    
    analyzedAt: number,           // Timestamp
    version: string               // Analysis version (e.g., '1.0')
  }
}
```

## Error Handling

### Gemini API Failures

**Strategy:** Graceful degradation
- If advanced analysis fails, continue with basic analysis
- Store partial results if some analyses succeed
- Log errors for monitoring
- Show user-friendly message: "Advanced analysis unavailable, using basic profile"

**Retry Logic:**
- Retry failed API calls up to 2 times
- Exponential backoff: 1s, 2s, 4s
- After retries exhausted, mark analysis as failed

### Invalid Response Parsing

**Strategy:** Validation and fallback
- Validate Gemini response structure
- If parsing fails, log raw response
- Return empty/default values for failed analyses
- Don't block profile creation

## Testing Strategy

### Unit Tests

1. **TextPreprocessor Tests**
   - Test anonymization of emails, phones, names
   - Test chunking at sentence boundaries
   - Test metadata extraction accuracy

2. **GeminiNLPService Tests**
   - Mock Gemini API responses
   - Test prompt building for each analysis type
   - Test response parsing with various formats
   - Test retry logic with simulated failures

3. **AdvancedStyleAnalyzer Tests**
   - Test phrase pattern aggregation
   - Test thought flow scoring
   - Test personality marker extraction
   - Test contextual pattern detection

### Integration Tests

1. **End-to-End Analysis Flow**
   - Submit text with advanced analysis enabled
   - Verify all 4 analysis types complete
   - Verify results stored in profile
   - Verify UI displays advanced patterns

2. **Error Scenarios**
   - Gemini API timeout
   - Invalid response format
   - Partial analysis failure
   - Verify graceful degradation

### Performance Tests

1. **Timing Benchmarks**
   - 500 words: < 10s
   - 2000 words: < 30s
   - 5000 words: < 60s with progress updates

2. **Parallel Execution**
   - Verify analyses run in parallel
   - Measure speedup vs sequential

## Performance Considerations

### Optimization Strategies

1. **Parallel Processing**
   - Run 4 analysis types concurrently using `Promise.all()`
   - Reduces total time from 40s (4×10s) to ~10s

2. **Text Chunking**
   - Split large texts into 2000-word chunks
   - Process chunks in parallel
   - Aggregate results

3. **Caching**
   - Cache Gemini API responses by text hash
   - Avoid re-analyzing same text
   - TTL: 24 hours

4. **Progressive Enhancement**
   - Show basic profile immediately
   - Stream advanced results as they complete
   - Update UI incrementally

### Resource Management

- **API Rate Limiting:** Respect Gemini API quotas
- **Memory:** Process large texts in streams
- **Timeouts:** 30s timeout per API call

## Privacy and Security

### Data Anonymization

**Before sending to Gemini:**
1. Replace emails with `[EMAIL]`
2. Replace phone numbers with `[PHONE]`
3. Replace detected names with `[NAME]`
4. Remove URLs containing personal info

**Preserved for analysis:**
- Writing style and patterns
- Phrase usage and frequency
- Thought organization
- Tone and formality

### User Control

1. **Opt-in Required:** Advanced analysis disabled by default
2. **Transparency:** Clear explanation of what's analyzed
3. **Data Deletion:** Users can delete advanced analysis results
4. **No PII Storage:** Anonymized text not stored permanently

## Migration Strategy

### Existing Users

**Backward Compatibility:**
- Existing profiles without `advanced` field continue to work
- Advanced analysis can be run retroactively on existing sources
- UI gracefully handles missing `advanced` data

**Opt-in Flow:**
- Show one-time prompt: "Enable Advanced Style Analysis?"
- Explain benefits and privacy measures
- Allow users to enable later in settings

### Data Structure Migration

```javascript
// Migration function
function migrateProfile(profile) {
  if (!profile.advanced) {
    profile.advanced = {
      phrases: [],
      thoughtPatterns: null,
      personalityMarkers: [],
      contextualPatterns: {},
      analyzedAt: null,
      version: null
    };
  }
  return profile;
}
```

## Future Enhancements

1. **Real-time Analysis:** Analyze as user types (for text input)
2. **Comparative Analysis:** Show how user's style compares to others
3. **Style Evolution:** Track how patterns change over time
4. **Custom Patterns:** Let users define their own phrase patterns
5. **Multi-language Support:** Extend to non-English texts
