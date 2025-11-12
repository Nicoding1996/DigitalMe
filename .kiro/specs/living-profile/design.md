# Living Profile Design Document

## Overview

The Living Profile feature transforms DigitalMe from a static style analyzer into an adaptive learning system. By continuously collecting user messages from Mirror Interface conversations and periodically refining the styleProfile, the AI becomes progressively more personalized without requiring additional data source connections.

This design implements a **batch-and-refine architecture** that balances real-time responsiveness with computational efficiency. The system operates transparently, giving users full control and visibility into how their profile evolves.

### Key Design Principles

1. **Efficiency First**: Batch processing prevents API overload and reduces latency
2. **User Control**: Learning toggle provides opt-in/opt-out flexibility
3. **Graceful Degradation**: Failures never corrupt existing profiles
4. **Transparency**: Users see what changed and why
5. **Consistency**: Reuses existing StyleAnalyzer logic for uniform analysis

## Architecture

### High-Level Flow

```
User Message → Quality Filter → Message Collector → Batch Trigger → 
Refinement API → Profile Refiner → Updated Profile → localStorage
```

### Component Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND                              │
│                                                              │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐ │
│  │   Mirror     │───▶│   Message    │───▶│   Batch      │ │
│  │  Interface   │    │  Collector   │    │   Manager    │ │
│  └──────────────┘    └──────────────┘    └──────┬───────┘ │
│                                                   │          │
│  ┌──────────────┐    ┌──────────────┐           │          │
│  │  Settings    │───▶│   Learning   │           │          │
│  │   Panel      │    │    Toggle    │           │          │
│  └──────────────┘    └──────────────┘           │          │
│                                                   │          │
│  ┌──────────────┐                                │          │
│  │   Profile    │◀───────────────────────────────┘          │
│  │   Summary    │                                           │
│  └──────────────┘                                           │
└──────────────────────────────────┬───────────────────────────┘
                                   │ POST /api/profile/refine
                                   │ { currentProfile, newMessages }
                                   ▼
┌─────────────────────────────────────────────────────────────┐
│                        BACKEND                               │
│                                                              │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐ │
│  │  Refinement  │───▶│   Profile    │───▶│   Style      │ │
│  │   Endpoint   │    │   Refiner    │    │  Analyzer    │ │
│  └──────────────┘    └──────────────┘    └──────────────┘ │
│                                                              │
│                      Returns:                                │
│                      { updatedProfile, deltaReport }         │
└─────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### Frontend Components

#### 1. Message Collector

**Location**: `src/services/MessageCollector.js`

**Responsibilities**:
- Accumulate user messages in memory
- Apply quality filtering (word count, content validation)
- Trigger batch sends based on count or time thresholds
- Respect learning toggle state

**Interface**:
```javascript
class MessageCollector {
  constructor(learningEnabled = true)
  
  // Add a message to the batch
  addMessage(messageText: string): void
  
  // Check if batch should be sent
  shouldSendBatch(): boolean
  
  // Get current batch and clear it
  getBatch(): string[]
  
  // Clear batch without sending
  clearBatch(): void
  
  // Enable/disable learning
  setLearningEnabled(enabled: boolean): void
  
  // Get batch statistics
  getStats(): { messageCount: number, wordCount: number }
}
```

**Quality Filter Logic**:
```javascript
function passesQualityFilter(message) {
  // Remove whitespace
  const trimmed = message.trim();
  
  // Reject empty messages
  if (trimmed.length === 0) return false;
  
  // Count words (contractions = 1 word)
  const words = trimmed.split(/\s+/);
  const wordCount = words.length;
  
  // Accept if >= 10 words
  if (wordCount >= 10) return true;
  
  // Accept if contains code block (regardless of word count)
  if (trimmed.includes('```') || trimmed.includes('`')) return true;
  
  // Reject otherwise
  return false;
}
```

**Batch Trigger Logic**:
```javascript
function shouldSendBatch(messageCount, lastSentTime) {
  // Trigger 1: 10 or more messages
  if (messageCount >= 10) return true;
  
  // Trigger 2: 5 minutes of inactivity AND at least 1 message
  const fiveMinutes = 5 * 60 * 1000;
  const timeSinceLastSend = Date.now() - lastSentTime;
  if (messageCount >= 1 && timeSinceLastSend >= fiveMinutes) return true;
  
  return false;
}
```

#### 2. Profile Refiner Client

**Location**: `src/services/ProfileRefinerClient.js`

**Responsibilities**:
- Send refinement requests to backend
- Handle network errors and retries
- Parse and validate responses
- Update localStorage on success

**Interface**:
```javascript
class ProfileRefinerClient {
  constructor(backendUrl: string)
  
  // Send refinement request
  async refineProfile(
    currentProfile: StyleProfile,
    newMessages: string[]
  ): Promise<RefinementResult>
  
  // Validate response structure
  validateResponse(response: any): boolean
}

interface RefinementResult {
  success: boolean
  updatedProfile?: StyleProfile
  deltaReport?: DeltaReport
  error?: string
}

interface DeltaReport {
  changes: Array<{
    attribute: string
    oldValue: any
    newValue: any
    changePercent: number
  }>
  wordsAnalyzed: number
  confidenceChange: number
}
```

#### 3. Settings Panel Enhancement

**Location**: `src/components/SettingsPanel.js` (modify existing)

**New UI Elements**:
```jsx
<div className="learning-controls">
  <label className="toggle-label">
    <input
      type="checkbox"
      checked={learningEnabled}
      onChange={handleToggleLearning}
    />
    <span>Enable Real-Time Learning</span>
  </label>
  
  <p className="learning-description">
    Allow DigitalMe to learn from your conversations and refine 
    your style profile automatically.
  </p>
</div>
```

#### 4. Profile Summary Enhancement

**Location**: `src/components/ProfileSummary.js` (modify existing)

**New Display Elements**:
```jsx
<div className="profile-metrics">
  <div className="metric">
    <span className="metric-label">Profile Completeness</span>
    <span className="metric-value">{completeness}%</span>
  </div>
  
  <div className="metric">
    <span className="metric-label">Words Analyzed</span>
    <span className="metric-value">{wordsAnalyzed.toLocaleString()}</span>
  </div>
  
  <div className="metric">
    <span className="metric-label">Confidence</span>
    <span className="metric-value">{(confidence * 100).toFixed(0)}%</span>
  </div>
</div>
```

#### 5. Refinement Notification

**Location**: `src/components/RefinementNotification.js` (new component)

**Purpose**: Display subtle notification when profile updates

**Interface**:
```jsx
function RefinementNotification({ 
  visible, 
  deltaReport, 
  onDismiss, 
  onViewDetails 
}) {
  return (
    <div className={`refinement-notification ${visible ? 'visible' : ''}`}>
      <div className="notification-content">
        <span className="notification-icon">✨</span>
        <span className="notification-text">
          Style profile updated based on recent conversation
        </span>
        <button onClick={onViewDetails}>View Changes</button>
        <button onClick={onDismiss}>×</button>
      </div>
    </div>
  );
}
```

#### 6. Delta Report Modal

**Location**: `src/components/DeltaReportModal.js` (new component)

**Purpose**: Show detailed changes after refinement

**Interface**:
```jsx
function DeltaReportModal({ deltaReport, onClose }) {
  return (
    <div className="modal-overlay">
      <div className="delta-report-modal">
        <h2>Profile Changes</h2>
        
        <div className="changes-list">
          {deltaReport.changes.map(change => (
            <div key={change.attribute} className="change-item">
              <span className="attribute-name">{change.attribute}</span>
              <span className="change-arrow">
                {change.oldValue} → {change.newValue}
              </span>
              <span className="change-percent">
                ({change.changePercent > 0 ? '+' : ''}{change.changePercent}%)
              </span>
            </div>
          ))}
        </div>
        
        <div className="report-summary">
          <p>Words analyzed: {deltaReport.wordsAnalyzed}</p>
          <p>Confidence change: {deltaReport.confidenceChange > 0 ? '+' : ''}{deltaReport.confidenceChange}</p>
        </div>
        
        <button onClick={onClose}>Dismiss</button>
      </div>
    </div>
  );
}
```

### Backend Components

#### 1. Refinement Endpoint

**Location**: `backend/routes/profileRefine.js` (new file)

**Route**: `POST /api/profile/refine`

**Request Body**:
```javascript
{
  currentProfile: {
    writing: {
      tone: string,
      formality: string,
      sentenceLength: string,
      vocabulary: string[],
      avoidance: string[]
    },
    confidence: number,
    sampleCount: {
      textWords: number,
      // ... other counts
    }
  },
  newMessages: string[] // Array of user messages
}
```

**Response Body** (Success):
```javascript
{
  success: true,
  updatedProfile: StyleProfile,
  deltaReport: {
    changes: [
      {
        attribute: "formality",
        oldValue: "balanced",
        newValue: "casual",
        changePercent: -15
      }
    ],
    wordsAnalyzed: 247,
    confidenceChange: 0.02
  }
}
```

**Response Body** (Error):
```javascript
{
  success: false,
  error: "Error message",
  code: "VALIDATION_ERROR" | "ANALYSIS_ERROR" | "INTERNAL_ERROR"
}
```

**Validation Rules**:
- `currentProfile` must be a valid StyleProfile object
- `newMessages` must be a non-empty array of strings
- Total text length must be < 50,000 characters (prevent abuse)
- Each message must be < 5,000 characters

#### 2. Profile Refiner Service

**Location**: `backend/services/ProfileRefinerService.js` (new file)

**Responsibilities**:
- Analyze new messages using existing StyleAnalyzer logic
- Merge new patterns with existing profile using confidence weighting
- Calculate delta report
- Update confidence scores

**Interface**:
```javascript
class ProfileRefinerService {
  constructor()
  
  // Main refinement method
  async refineProfile(
    currentProfile: StyleProfile,
    newMessages: string[]
  ): Promise<RefinementResult>
  
  // Analyze new messages
  async analyzeMessages(messages: string[]): Promise<WritingStyle>
  
  // Merge patterns with confidence weighting
  mergePatterns(
    currentProfile: StyleProfile,
    newPatterns: WritingStyle,
    newWordCount: number
  ): StyleProfile
  
  // Calculate what changed
  generateDeltaReport(
    oldProfile: StyleProfile,
    newProfile: StyleProfile,
    wordsAnalyzed: number
  ): DeltaReport
  
  // Update confidence scores
  updateConfidence(
    currentConfidence: number,
    attributeConfidence: Map<string, number>,
    newWordCount: number
  ): { confidence: number, attributeConfidences: Map<string, number> }
}
```

**Confidence Weighting Algorithm**:

The key innovation is using **confidence scores** to determine how much new data should influence the profile.

```javascript
function mergeAttribute(currentValue, newValue, confidence, newWordCount) {
  // Calculate adjustment factor based on confidence
  // High confidence (0.8+) = small adjustments (max 5%)
  // Low confidence (<0.5) = large adjustments (up to 20%)
  
  let maxAdjustment;
  if (confidence >= 0.8) {
    maxAdjustment = 0.05; // 5% max change
  } else if (confidence >= 0.5) {
    maxAdjustment = 0.10; // 10% max change
  } else {
    maxAdjustment = 0.20; // 20% max change
  }
  
  // Scale adjustment by word count (more words = more influence)
  // 100 words = 50% of max, 500+ words = 100% of max
  const wordFactor = Math.min(1.0, newWordCount / 500);
  const actualAdjustment = maxAdjustment * wordFactor;
  
  // For categorical attributes (tone, formality, sentenceLength):
  // Only change if new value differs AND adjustment threshold is met
  if (typeof currentValue === 'string') {
    if (currentValue === newValue) {
      return currentValue; // No change
    }
    
    // Require higher threshold for high-confidence profiles
    const changeThreshold = confidence >= 0.8 ? 0.7 : 0.5;
    
    // In real implementation, we'd track "votes" for each value
    // For now, simplified: change if adjustment factor is high enough
    if (actualAdjustment >= changeThreshold) {
      return newValue;
    }
    return currentValue;
  }
  
  // For array attributes (vocabulary, avoidance):
  // Merge arrays with weighted preference for existing terms
  if (Array.isArray(currentValue)) {
    return mergeArrays(currentValue, newValue, actualAdjustment);
  }
  
  return currentValue;
}

function mergeArrays(currentArray, newArray, weight) {
  // Create term scores
  const termScores = {};
  
  // Existing terms get higher base score (1.0 - weight)
  currentArray.forEach(term => {
    termScores[term] = 1.0 - weight;
  });
  
  // New terms get lower score (weight)
  newArray.forEach(term => {
    if (termScores[term]) {
      termScores[term] += weight; // Boost if appears in both
    } else {
      termScores[term] = weight;
    }
  });
  
  // Sort by score and take top N
  const sorted = Object.entries(termScores)
    .sort((a, b) => b[1] - a[1])
    .map(([term]) => term);
  
  return sorted.slice(0, currentArray.length); // Keep same array size
}
```

**Confidence Update Algorithm**:

```javascript
function updateConfidence(currentConfidence, newWordCount, totalWordCount) {
  // Each refinement increases confidence slightly
  const baseIncrease = 0.05;
  
  // Scale increase by word count (more words = more confidence)
  const wordFactor = Math.min(1.0, newWordCount / 500);
  const actualIncrease = baseIncrease * wordFactor;
  
  // Apply increase with diminishing returns
  const newConfidence = currentConfidence + (actualIncrease * (1.0 - currentConfidence));
  
  // Cap at 0.95 (never 100% certain)
  return Math.min(0.95, newConfidence);
}
```

**Attribute-Level Confidence Tracking**:

Each style attribute should have its own confidence score:

```javascript
{
  writing: {
    tone: "conversational",
    formality: "casual",
    sentenceLength: "medium",
    vocabulary: ["clear", "direct", "relatable"],
    avoidance: ["jargon", "passive-voice"]
  },
  attributeConfidence: {
    tone: 0.85,
    formality: 0.78,
    sentenceLength: 0.82,
    vocabulary: 0.75,
    avoidance: 0.70
  },
  confidence: 0.80 // Overall confidence (average of attribute confidences)
}
```

## Data Models

### StyleProfile (Enhanced)

```javascript
{
  id: string,
  userId: string,
  version: number,
  lastUpdated: number, // timestamp
  
  writing: {
    tone: "conversational" | "professional" | "neutral",
    formality: "casual" | "balanced" | "formal",
    sentenceLength: "short" | "medium" | "long",
    vocabulary: string[], // 2-4 terms
    avoidance: string[]   // 2-3 terms or ["none"]
  },
  
  coding: { /* existing coding style */ },
  
  // NEW: Attribute-level confidence scores
  attributeConfidence: {
    tone: number,        // 0.0 - 1.0
    formality: number,
    sentenceLength: number,
    vocabulary: number,
    avoidance: number
  },
  
  confidence: number, // 0.0 - 1.0 (overall)
  
  sampleCount: {
    codeLines: number,
    textWords: number,
    repositories: number,
    articles: number,
    emails: number,
    conversationWords: number // NEW: words from conversations
  },
  
  // NEW: Learning metadata
  learningMetadata: {
    enabled: boolean,
    lastRefinement: number, // timestamp
    totalRefinements: number,
    wordsFromConversations: number
  }
}
```

### RefinementBatch

```javascript
{
  messages: string[],      // Array of user messages
  collectedAt: number,     // timestamp when batch was created
  wordCount: number,       // total words in batch
  messageCount: number     // number of messages
}
```

### DeltaReport

```javascript
{
  changes: [
    {
      attribute: string,     // "tone", "formality", etc.
      oldValue: any,
      newValue: any,
      changePercent: number  // -100 to +100
    }
  ],
  wordsAnalyzed: number,
  confidenceChange: number,  // Change in overall confidence
  timestamp: number
}
```

## Error Handling

### Frontend Error Scenarios

1. **Network Failure**
   - Retry once after 2 seconds
   - If retry fails, discard batch and show error notification
   - Keep existing profile unchanged

2. **Invalid Response**
   - Validate response structure before applying
   - If invalid, discard and log error
   - Show user-friendly error message

3. **localStorage Failure**
   - Catch and log storage errors
   - Continue operation (profile will reload from previous state)

### Backend Error Scenarios

1. **Validation Errors** (400)
   - Missing required fields
   - Invalid profile structure
   - Empty messages array
   - Text too long

2. **Analysis Errors** (500)
   - Gemini API failure
   - Parsing errors
   - Unexpected data format

3. **Rate Limiting** (429)
   - Too many refinement requests
   - Implement rate limiting: max 10 refinements per hour per user

### Error Response Format

```javascript
{
  success: false,
  error: "Human-readable error message",
  code: "ERROR_CODE",
  details: { /* optional additional context */ }
}
```

## Testing Strategy

### Unit Tests

**Frontend**:
- `MessageCollector.test.js`: Quality filter logic, batch triggers
- `ProfileRefinerClient.test.js`: API calls, retry logic, response validation
- `mergePatterns.test.js`: Confidence weighting algorithm

**Backend**:
- `ProfileRefinerService.test.js`: Pattern merging, confidence updates
- `refinementValidation.test.js`: Request validation logic
- `deltaReport.test.js`: Change calculation accuracy

### Integration Tests

1. **End-to-End Refinement Flow**
   - Send 10 messages → verify batch sent → verify profile updated
   - Verify localStorage persistence
   - Verify notification displayed

2. **Error Handling**
   - Simulate network failure → verify retry → verify graceful degradation
   - Send invalid profile → verify 400 error → verify profile unchanged

3. **Confidence Weighting**
   - Start with low confidence profile → refine → verify large changes
   - Start with high confidence profile → refine → verify small changes

### Manual Testing Checklist

- [ ] Toggle learning on/off → verify batch collection starts/stops
- [ ] Send 10 short messages → verify batch NOT sent (quality filter)
- [ ] Send 10 long messages → verify batch sent and profile updated
- [ ] Wait 5 minutes with 1 message → verify batch sent
- [ ] View delta report → verify changes displayed correctly
- [ ] Disconnect network → send messages → verify error handling
- [ ] Refresh page → verify learning state persisted
- [ ] Check profile completeness score increases after refinement

## Performance Considerations

### Frontend Optimizations

1. **Batch Size Limits**
   - Max 50 messages per batch (prevent memory bloat)
   - If exceeded, send batch immediately

2. **Debouncing**
   - Debounce inactivity timer (don't reset on every keystroke)
   - Only reset timer when message is actually sent

3. **localStorage Efficiency**
   - Only update localStorage on successful refinement
   - Use JSON.stringify once per update

### Backend Optimizations

1. **Text Analysis Caching**
   - Cache Gemini API responses for identical text (unlikely but possible)
   - Use in-memory cache with 1-hour TTL

2. **Rate Limiting**
   - Implement per-user rate limiting (max 10 refinements/hour)
   - Return 429 status if exceeded

3. **Request Validation**
   - Validate early, fail fast
   - Reject oversized requests before processing

## Security Considerations

1. **Input Sanitization**
   - Validate message content (no script injection)
   - Limit message length (max 5,000 chars per message)
   - Limit batch size (max 50 messages)

2. **Rate Limiting**
   - Prevent abuse through excessive refinement requests
   - Track requests per user/IP

3. **Data Privacy**
   - Messages are NOT stored on backend (processed and discarded)
   - Only styleProfile is persisted
   - User can disable learning at any time

4. **API Key Protection**
   - Gemini API key remains server-side only
   - No sensitive data in client-side code

## Future Enhancements

### Phase 2 Features (Not in Initial Implementation)

1. **Profile Versioning**
   - Keep history of profile snapshots
   - Allow users to "roll back" to previous versions
   - Show profile evolution timeline

2. **Context-Aware Learning**
   - Detect conversation context (work, creative, technical)
   - Maintain separate sub-profiles for different contexts
   - Switch profiles based on detected context

3. **Bidirectional Learning**
   - Learn from AI responses user doesn't refine (implicit approval)
   - Track which AI responses get refined vs. accepted
   - Adjust profile based on acceptance patterns

4. **Learning Analytics Dashboard**
   - Visualize profile changes over time
   - Show which conversations had biggest impact
   - Display confidence trends

5. **Collaborative Learning**
   - Anonymized aggregate learning from all users
   - Improve pattern detection algorithms
   - Suggest profile improvements based on similar users

## Migration Strategy

### Existing Profile Compatibility

Existing profiles without `attributeConfidence` or `learningMetadata` will be automatically migrated:

```javascript
function migrateProfile(profile) {
  if (!profile.attributeConfidence) {
    // Initialize attribute confidence based on overall confidence
    profile.attributeConfidence = {
      tone: profile.confidence || 0.5,
      formality: profile.confidence || 0.5,
      sentenceLength: profile.confidence || 0.5,
      vocabulary: profile.confidence || 0.5,
      avoidance: profile.confidence || 0.5
    };
  }
  
  if (!profile.learningMetadata) {
    profile.learningMetadata = {
      enabled: true, // Default to enabled
      lastRefinement: null,
      totalRefinements: 0,
      wordsFromConversations: 0
    };
  }
  
  if (!profile.sampleCount.conversationWords) {
    profile.sampleCount.conversationWords = 0;
  }
  
  return profile;
}
```

### Rollout Plan

1. **Phase 1**: Backend implementation and testing
2. **Phase 2**: Frontend components (toggle, collector)
3. **Phase 3**: UI enhancements (notifications, delta report)
4. **Phase 4**: Beta testing with opt-in users
5. **Phase 5**: Full rollout with learning enabled by default

## Open Questions

1. Should we allow users to manually trigger refinement (button in settings)?
2. Should we show a "learning in progress" indicator during batch processing?
3. Should we limit refinement frequency (e.g., max once per 10 minutes)?
4. Should we provide a "reset profile" option that clears conversation learning?

These questions should be answered during implementation based on user feedback and technical constraints.
