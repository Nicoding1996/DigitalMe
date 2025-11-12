# Implementation Plan

- [x] 1. Backend: Create Profile Refiner Service
  - Implement ProfileRefinerService class with confidence-weighted pattern merging
  - Reuse existing StyleAnalyzer logic for text analysis consistency
  - Implement confidence update algorithm with diminishing returns
  - Implement delta report generation showing attribute changes
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 9.1, 9.2, 9.3, 9.4, 9.5_

- [x] 2. Backend: Create Refinement API Endpoint
  - Create POST /api/profile/refine endpoint in new routes/profileRefine.js file
  - Implement request validation (currentProfile structure, newMessages array, size limits)
  - Integrate ProfileRefinerService for pattern analysis and merging
  - Return updatedProfile and deltaReport in response
  - Implement error handling for validation, analysis, and internal errors
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 7.5_

- [x]* 2.1 Add rate limiting middleware
  - Implement rate limiting (max 10 refinements per hour per user)
  - Return 429 status when limit exceeded
  - _Requirements: 4.1_

- [ ]* 2.2 Write backend unit tests
  - Test ProfileRefinerService pattern merging logic
  - Test confidence weighting algorithm with various confidence levels
  - Test delta report generation accuracy
  - Test request validation edge cases
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [x] 3. Frontend: Create Message Collector Service
  - Create MessageCollector class in src/services/MessageCollector.js
  - Implement quality filter (10+ words, code block detection, whitespace handling)
  - Implement batch triggers (10 messages OR 5 minutes inactivity)
  - Implement learning toggle state management
  - Store batch in memory (not localStorage)
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 6.1, 6.2, 6.3, 6.4, 6.5_

- [x] 4. Frontend: Create Profile Refiner Client
  - Create ProfileRefinerClient class in src/services/ProfileRefinerClient.js
  - Implement POST request to /api/profile/refine endpoint
  - Implement retry logic (one retry after 2 seconds on network failure)
  - Implement response validation before applying updates
  - Update localStorage with new profile on success
  - _Requirements: 1.5, 7.1, 7.2, 7.3, 7.4_

- [x] 5. Frontend: Integrate Message Collector into Mirror Interface
  - Import MessageCollector into MirrorInterface component
  - Call addMessage() when user sends a message
  - Check shouldSendBatch() after each message
  - Call ProfileRefinerClient when batch is ready
  - Handle refinement success/failure responses
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [x] 6. Frontend: Add Learning Toggle to Settings Panel
  - Add "Enable Real-Time Learning" toggle to SettingsPanel component
  - Persist toggle state in localStorage
  - Load toggle state on component mount
  - Pass toggle state to MessageCollector
  - Clear pending batch when toggle is disabled
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [x] 7. Frontend: Enhance Profile Summary Component
  - Add Profile Completeness Score display (percentage)
  - Add Words Analyzed counter display
  - Animate score changes over 1 second when updated
  - Calculate completeness from sampleCount.conversationWords
  - _Requirements: 3.1, 3.4_

- [x] 8. Frontend: Create Refinement Notification Component
  - Create RefinementNotification component in src/components/RefinementNotification.js
  - Display notification when profile is updated
  - Auto-dismiss after 8 seconds (extended for better visibility)
  - Include "View Changes" button to open delta report modal
  - Style with subtle animation (slide in from top)
  - _Requirements: 3.2, 3.5_

- [x] 9. Frontend: Create Delta Report Modal Component
  - Create DeltaReportModal component in src/components/DeltaReportModal.js
  - Display list of changed attributes with old → new values
  - Show change percentage for each attribute
  - Display words analyzed and confidence change summary
  - Include dismiss button to close modal
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [x] 10. Frontend: Integrate Notification Components into App
  - Import RefinementNotification and DeltaReportModal into App.js
  - Add state management for notification visibility and delta report data
  - Update handleProfileUpdate to show notification when profile is refined
  - Wire up "View Changes" button to open DeltaReportModal
  - Implement auto-dismiss after 8 seconds for notification
  - Add error notification display for refinement failures
  - _Requirements: 3.2, 3.5, 7.2, 8.1, 8.2, 8.3, 8.4, 8.5_

- [x] 11. Frontend: Implement Profile Migration for Existing Users
  - Add attributeConfidence field to StyleProfile model
  - Add learningMetadata field to StyleProfile model
  - Add conversationWords to sampleCount
  - Create migration function to initialize new fields for existing profiles
  - Run migration on app load if fields are missing
  - _Requirements: 10.1, 10.2, 10.5_

- [x] 12. Frontend: Implement Session Persistence
  - Load learning toggle state from localStorage on app mount
  - Load current styleProfile from localStorage on app mount
  - Discard pending batch on browser close (no persistence)
  - Start with empty batch on app reopen
  - _Requirements: 10.1, 10.2, 10.3, 10.4_

- [ ]* 13. Write frontend unit tests
  - Test MessageCollector quality filter with various message types
  - Test batch trigger logic (count and time-based)
  - Test ProfileRefinerClient retry logic
  - Test response validation
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 7.1, 7.2, 7.3, 7.4_

- [ ]* 14. Write integration tests
  - Test end-to-end refinement flow (10 messages → batch sent → profile updated)
  - Test error handling (network failure → retry → graceful degradation)
  - Test confidence weighting (low confidence → large changes, high confidence → small changes)
  - Test localStorage persistence across page reloads
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 7.1, 7.2, 7.3, 7.4_

- [x] 15. Manual testing and polish
  - Test toggle on/off behavior ✅
  - Test quality filter with short messages ✅
  - Test 5-minute inactivity trigger ✅
  - Test delta report display ✅
  - Test error notifications ✅
  - Test profile completeness score updates ✅
  - Improved toggle UI with better spacing and animation ✅
  - Extended notification duration to 8 seconds for visibility ✅
  - _Requirements: All_
  
## Implementation Notes

**What Gets Updated During Live Learning:**
- ✅ Basic writing style (tone, formality, sentenceLength, vocabulary, avoidance)
- ✅ Confidence scores with diminishing returns
- ✅ Word counts (conversationWords tracked separately)
- ✅ Learning metadata (lastRefinement, totalRefinements)
- ❌ Source attribution (conversations not tracked as separate source)
- ❌ Advanced patterns (phrases, thought patterns, personality markers)

**Design Decision:** Live learning focuses on lightweight, incremental updates to basic style attributes. Advanced pattern analysis remains a manual operation triggered by the user in settings. This keeps the refinement fast and prevents "polluting" carefully extracted patterns with short conversational fragments.
