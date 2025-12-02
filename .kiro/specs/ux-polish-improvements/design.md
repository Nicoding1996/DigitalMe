# Design Document: Critical UX Polish & Functional Improvements

## Overview

This design document outlines the implementation approach for critical quality-of-life improvements to DigitalMe. The focus is on enhancing error handling, adding response regeneration capabilities, visualizing source attribution, improving loading states, persisting session state, fixing mobile responsiveness, and adding keyboard shortcuts. These improvements will create a more polished, professional application suitable for hackathon demonstration.

## Architecture

### High-Level Architecture

The improvements follow DigitalMe's existing architecture:
- **Frontend (React)**: UI components, state management, localStorage persistence
- **Backend (Express)**: API endpoints, error handling, streaming responses

### Component Architecture

The improvements are organized into several key areas:

1. **Error Handling Layer**
   - Frontend error boundaries for component crashes
   - Backend error middleware for API failures
   - Connection status monitoring
   - Retry mechanisms with exponential backoff

2. **State Management Layer**
   - Session state persistence (CMD number, conversation history)
   - Draft auto-save functionality
   - UI state persistence (active tab, scroll position)
   - Recovery from interrupted operations

3. **UI Enhancement Layer**
   - Response regeneration controls
   - Source attribution visualization
   - Progress indicators and loading states
   - Mobile-responsive layouts
   - Keyboard shortcut system

4. **Data Flow**
   - User input → State persistence → Backend API → Streaming response → UI update
   - Error detection → Error display → Retry mechanism → Recovery
   - Keyboard event → Shortcut handler → Action dispatch

## Components and Interfaces

### New Components

#### ErrorBoundary (Enhanced)
```javascript
// Catches React component errors and displays fallback UI
<ErrorBoundary>
  - onError(error, errorInfo): Logs error and shows recovery UI
  - reset(): Clears error state and attempts recovery
  - fallback: Custom error display with retry button
</ErrorBoundary>
```

#### ConnectionStatus
```javascript
// Displays backend connection status with auto-retry
<ConnectionStatus>
  - status: 'connected' | 'disconnected' | 'reconnecting'
  - checkConnection(): Pings backend health endpoint
  - autoRetry(): Retries connection every 5 seconds
</ConnectionStatus>
```

#### RegenerateButton
```javascript
// Allows regenerating AI responses
<RegenerateButton>
  - messageId: ID of message to regenerate
  - onRegenerate(messageId): Triggers new generation
  - loading: Shows spinner during regeneration
</RegenerateButton>
```

#### SourceAttribution
```javascript
// Visualizes which sources contributed to style attributes
<SourceAttribution>
  - attribute: Style attribute to show attribution for
  - sources: Array of {source, percentage, wordCount}
  - showDetails: Toggles detailed breakdown
</SourceAttribution>
```

#### ProgressIndicator
```javascript
// Shows progress for long-running operations
<ProgressIndicator>
  - step: Current step name
  - progress: Percentage (0-100)
  - estimatedTime: Remaining time estimate
  - message: Status message
</ProgressIndicator>
```

#### KeyboardShortcutsHelp
```javascript
// Displays keyboard shortcuts overlay
<KeyboardShortcutsHelp>
  - shortcuts: Array of {key, description, action}
  - visible: Controls overlay visibility
  - onClose(): Closes the overlay
</KeyboardShortcutsHelp>
```

### Modified Components

#### App.js
- Add keyboard event listeners for global shortcuts
- Add session state persistence logic
- Add connection status monitoring
- Add draft auto-save functionality

#### MirrorInterface.js
- Add mobile responsive layout (vertical stacking)
- Add regenerate button to response area
- Add keyboard shortcut handlers
- Improve touch targets for mobile

#### ResponseArea.js
- Add streaming text display
- Add regenerate button integration
- Add error display with retry

#### ProfileSummary.js
- Add source attribution visualization
- Add detailed breakdown tooltips
- Enhance mobile layout

#### SourceConnector.js
- Add error handling for failed connections
- Add retry buttons for failed sources
- Show which sources succeeded/failed

### Backend Enhancements

#### Error Middleware
```javascript
// Centralized error handling
errorHandler(err, req, res, next) {
  - Categorizes errors (network, validation, API)
  - Returns structured error responses
  - Logs errors without exposing sensitive data
}
```

#### Health Check Endpoint
```javascript
// GET /api/health
// Returns backend status for connection monitoring
{
  status: 'ok' | 'degraded',
  timestamp: Date,
  services: {
    gemini: 'available' | 'unavailable',
    gmail: 'available' | 'unavailable'
  }
}
```

## Data Models

### Session State
```javascript
{
  cmdNumber: number,              // Current CMD number
  conversationHistory: Message[], // Recent messages
  activeTab: string,              // Current active tab
  scrollPosition: number,         // Scroll position
  newCmdToggle: boolean,          // New CMD toggle state
  lastSaved: Date                 // Last save timestamp
}
```

### Draft State
```javascript
{
  content: string,     // Draft message content
  timestamp: Date,     // Last edit time
  autoSaved: boolean   // Whether auto-saved
}
```

### Error State
```javascript
{
  type: 'network' | 'api' | 'validation' | 'unknown',
  message: string,           // User-friendly error message
  details: string,           // Technical details (optional)
  retryable: boolean,        // Whether retry is possible
  timestamp: Date,           // When error occurred
  context: object            // Additional context
}
```

### Source Attribution
```javascript
{
  attribute: string,         // Style attribute name
  sources: [
    {
      source: 'gmail' | 'blog' | 'github' | 'text',
      percentage: number,    // Contribution percentage
      wordCount: number,     // Words from this source
      quality: number        // Quality weight
    }
  ],
  totalWords: number,        // Total words analyzed
  confidence: number         // Overall confidence
}
```

### Keyboard Shortcut
```javascript
{
  key: string,              // Key combination (e.g., 'Ctrl+Enter')
  description: string,      // Human-readable description
  action: () => void,       // Function to execute
  enabled: boolean          // Whether shortcut is active
} 

#
# Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Error Handling Properties

**Property 1: Network error display**
*For any* network error during analysis, the system should display an error message and a retry button
**Validates: Requirements 1.1**

**Property 2: Authentication error recovery**
*For any* Gmail authentication failure, the system should display the specific error and provide retry capability without requiring page refresh
**Validates: Requirements 1.2**

**Property 3: Graceful source failure**
*For any* blog URL that fails to scrape, the system should continue analysis with remaining sources and report which URL failed
**Validates: Requirements 1.3**

**Property 4: Connection monitoring**
*For any* backend disconnection, the system should display a connection status indicator and attempt reconnection every 5 seconds
**Validates: Requirements 1.4**

**Property 5: Generation failure recovery**
*For any* AI generation failure, the system should preserve the user's input and allow regeneration
**Validates: Requirements 1.5**

### Response Regeneration Properties

**Property 6: Regenerate button presence**
*For any* completed AI response, the system should display a regenerate button below the response
**Validates: Requirements 2.1**

**Property 7: Regeneration with same input**
*For any* regeneration request, the system should generate a new response using the original input message
**Validates: Requirements 2.2**

**Property 8: Refinement detection**
*For any* refinement instruction (e.g., "make it shorter", "more formal"), the system should detect it and apply the changes to the previous response
**Validates: Requirements 2.3**

**Property 9: Regeneration UI state**
*For any* regeneration in progress, the system should show a loading indicator and preserve the original message
**Validates: Requirements 2.4**

**Property 10: Refinement failure preservation**
*For any* refinement failure, the system should keep the previous response unchanged and display an error message
**Validates: Requirements 2.5**

### Source Attribution Properties

**Property 11: Attribution display completeness**
*For any* style profile with multiple sources, the profile summary should display source attribution for each style attribute
**Validates: Requirements 3.1**

**Property 12: Vocabulary source breakdown**
*For any* vocabulary term, the system should show which sources contributed the term with percentage contributions
**Validates: Requirements 3.2**

**Property 13: Tone and formality attribution**
*For any* tone or formality attribute, the system should show a breakdown by source with visual indicators
**Validates: Requirements 3.3**

**Property 14: Low contribution visual indication**
*For any* source with contribution below 20%, the system should display it with muted color styling
**Validates: Requirements 3.4**

**Property 15: Attribution detail on hover**
*For any* attribution element, hovering should reveal detailed breakdown including word counts from each source
**Validates: Requirements 3.5**

### Progress Feedback Properties

**Property 16: Analysis progress display**
*For any* analysis operation, the system should show a progress bar with current step name and estimated time remaining
**Validates: Requirements 4.1**

**Property 17: Streaming text display**
*For any* AI generation, the system should display text incrementally as it streams from the backend
**Validates: Requirements 4.2**

**Property 18: Save confirmation**
*For any* profile save operation, the system should display a brief success confirmation message
**Validates: Requirements 4.3**

**Property 19: Long operation feedback**
*For any* operation exceeding 3 seconds, the system should display a "Still working..." message
**Validates: Requirements 4.5**

### Session Persistence Properties

**Property 20: Session state round-trip**
*For any* session state (CMD number, conversation history), refreshing the page should restore the exact same state
**Validates: Requirements 5.1**

**Property 21: Draft auto-save timing**
*For any* message being typed, the system should auto-save the draft to localStorage every 2 seconds
**Validates: Requirements 5.2**

**Property 22: UI state round-trip**
*For any* UI state (active tab, scroll position), closing and reopening the app should restore the exact same state
**Validates: Requirements 5.3**

**Property 23: Toggle state persistence**
*For any* new CMD toggle state, refreshing the page should preserve the toggle's active/inactive state
**Validates: Requirements 5.4**

**Property 24: Resumable operations**
*For any* interrupted analysis operation, the system should allow resuming from the last completed step
**Validates: Requirements 5.5**

### Mobile Responsiveness Properties

**Property 25: Mobile layout stacking**
*For any* mobile viewport (width < 768px), the mirror interface should stack vertically instead of side-by-side
**Validates: Requirements 6.1**

**Property 26: Mobile keyboard adjustment**
*For any* mobile keyboard appearance, the textarea should adjust size to prevent overlap
**Validates: Requirements 6.2**

**Property 27: Scroll stability**
*For any* scroll operation on mobile, the layout should not shift (Cumulative Layout Shift = 0)
**Validates: Requirements 6.3**

**Property 28: Touch target feedback**
*For any* button tap on mobile, the system should provide visual feedback and ensure touch targets are at least 44x44px
**Validates: Requirements 6.4**

**Property 29: Mobile modal behavior**
*For any* modal opened on mobile viewport, it should display full-screen with a visible close button
**Validates: Requirements 6.5**

### Keyboard Shortcut Properties

**Property 30: Submit shortcut**
*For any* Ctrl+Enter key press, the system should submit the current message in the input field
**Validates: Requirements 7.1**

**Property 31: New CMD shortcut**
*For any* Ctrl+N key press, the system should start a new CMD session
**Validates: Requirements 7.2**

**Property 32: Escape shortcut**
*For any* Escape key press, the system should close any currently open modal or panel
**Validates: Requirements 7.3**

**Property 33: Focus shortcut**
*For any* Ctrl+K key press, the system should move focus to the input field
**Validates: Requirements 7.4**

**Property 34: Help shortcut**
*For any* Ctrl+/ key press, the system should display the keyboard shortcuts help overlay
**Validates: Requirements 7.5**

## Error Handling

### Error Categories

1. **Network Errors**
   - Connection timeout
   - Backend unreachable
   - API rate limiting
   - DNS resolution failures

2. **Authentication Errors**
   - OAuth token expired
   - Invalid credentials
   - Permission denied
   - Token refresh failure

3. **Data Errors**
   - Invalid blog URL
   - Scraping failure
   - Malformed response
   - Empty data source

4. **Generation Errors**
   - AI API failure
   - Streaming interrupted
   - Invalid prompt
   - Content policy violation

5. **State Errors**
   - localStorage quota exceeded
   - Corrupted session data
   - Invalid state transition
   - Missing required data

### Error Handling Strategy

#### Frontend Error Handling

1. **Component-Level Errors**
   - Use ErrorBoundary to catch React component crashes
   - Display fallback UI with error details and recovery options
   - Log errors to console for debugging
   - Provide "Try Again" button to reset error state

2. **API Call Errors**
   - Wrap all API calls in try-catch blocks
   - Display user-friendly error messages
   - Provide retry buttons for retryable errors
   - Preserve user input on failure

3. **State Errors**
   - Validate localStorage data before use
   - Provide fallback to default state if corrupted
   - Clear corrupted data and notify user
   - Implement state migration for version changes

#### Backend Error Handling

1. **Centralized Error Middleware**
   - Catch all unhandled errors
   - Categorize errors by type
   - Return structured error responses
   - Log errors without exposing sensitive data

2. **API Error Responses**
   ```javascript
   {
     error: {
       type: 'network' | 'auth' | 'data' | 'generation' | 'state',
       message: 'User-friendly error message',
       retryable: boolean,
       details: 'Technical details (optional)'
     }
   }
   ```

3. **Retry Logic**
   - Implement exponential backoff for retries
   - Maximum 3 retry attempts
   - Different retry strategies per error type
   - Cancel retries on user action

### Connection Monitoring

1. **Health Check Polling**
   - Poll /api/health endpoint every 10 seconds
   - Display connection status indicator
   - Auto-retry on disconnection every 5 seconds
   - Notify user when connection restored

2. **Graceful Degradation**
   - Queue operations when offline
   - Execute queued operations when reconnected
   - Warn user about offline state
   - Disable features requiring backend

## Testing Strategy

### Unit Testing

We will use **Jest** and **React Testing Library** for unit tests.

#### Frontend Unit Tests

1. **Component Tests**
   - Test error boundary fallback rendering
   - Test connection status indicator states
   - Test regenerate button click handling
   - Test source attribution rendering
   - Test progress indicator updates
   - Test keyboard shortcut help overlay
   - Test mobile responsive layout changes

2. **State Management Tests**
   - Test session state save/load
   - Test draft auto-save timing
   - Test UI state persistence
   - Test error state management

3. **Utility Function Tests**
   - Test error categorization
   - Test retry logic
   - Test localStorage helpers
   - Test keyboard event handlers

#### Backend Unit Tests

1. **Error Middleware Tests**
   - Test error categorization
   - Test error response formatting
   - Test sensitive data sanitization

2. **Health Check Tests**
   - Test health endpoint response
   - Test service availability detection

### Property-Based Testing

We will use **fast-check** for property-based testing in JavaScript.

#### Configuration
- Each property test should run a minimum of 100 iterations
- Each test must be tagged with the format: `**Feature: ux-polish-improvements, Property {number}: {property_text}**`
- Each correctness property must be implemented by a single property-based test

#### Property Test Categories

1. **Error Handling Properties (Properties 1-5)**
   - Generate random error scenarios
   - Verify error display and retry functionality
   - Test graceful degradation

2. **Regeneration Properties (Properties 6-10)**
   - Generate random messages and responses
   - Verify regeneration preserves input
   - Test refinement detection across various instructions

3. **Attribution Properties (Properties 11-15)**
   - Generate random multi-source profiles
   - Verify attribution display completeness
   - Test visual indicators for contribution levels

4. **Progress Properties (Properties 16-19)**
   - Generate random operation durations
   - Verify progress indicators appear
   - Test timing-based feedback

5. **Persistence Properties (Properties 20-24)**
   - Generate random session states
   - Verify round-trip persistence
   - Test auto-save timing

6. **Mobile Properties (Properties 25-29)**
   - Generate random viewport sizes
   - Verify responsive layout changes
   - Test touch interaction feedback

7. **Keyboard Properties (Properties 30-34)**
   - Generate random keyboard events
   - Verify shortcut actions execute
   - Test shortcut conflicts

### Integration Testing

1. **End-to-End Error Recovery**
   - Simulate network failures during analysis
   - Verify error display and successful retry
   - Test session recovery after errors

2. **Multi-Source Analysis with Failures**
   - Test analysis with one source failing
   - Verify other sources continue
   - Test attribution with partial data

3. **Mobile User Flow**
   - Test complete user journey on mobile viewport
   - Verify all interactions work with touch
   - Test keyboard appearance handling

4. **Keyboard Navigation Flow**
   - Test complete workflow using only keyboard
   - Verify all shortcuts work together
   - Test shortcut help discoverability

### Manual Testing Checklist

1. **Error Scenarios**
   - [ ] Disconnect network during analysis
   - [ ] Fail Gmail authentication
   - [ ] Provide invalid blog URL
   - [ ] Stop backend server
   - [ ] Trigger AI generation failure

2. **Mobile Testing**
   - [ ] Test on actual mobile device
   - [ ] Test with mobile keyboard
   - [ ] Test touch interactions
   - [ ] Test modal behavior
   - [ ] Test responsive breakpoints

3. **Keyboard Shortcuts**
   - [ ] Test all shortcuts individually
   - [ ] Test shortcuts in different contexts
   - [ ] Test shortcut help overlay
   - [ ] Test shortcut conflicts

4. **Session Persistence**
   - [ ] Refresh during conversation
   - [ ] Close and reopen browser
   - [ ] Test with multiple tabs
   - [ ] Test localStorage limits

5. **Performance**
   - [ ] Test with slow network
   - [ ] Test with large profiles
   - [ ] Test streaming performance
   - [ ] Test auto-save performance
