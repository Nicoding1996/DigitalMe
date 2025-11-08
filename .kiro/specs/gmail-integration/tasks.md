# Implementation Plan

- [x] 1. Set up Google OAuth infrastructure and environment configuration
  - Create Google Cloud project and configure OAuth 2.0 credentials
  - Add new environment variables to `backend/.env.example`: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`, `TOKEN_ENCRYPTION_KEY`, `GMAIL_MAX_EMAILS`, `GMAIL_BATCH_SIZE`
  - Update `backend/config.js` to load and validate new Gmail-related environment variables
  - Install `googleapis` npm package in backend: `npm install googleapis`
  - _Requirements: 1.1, 1.3_

- [x] 2. Implement Gmail authentication service
  - [x] 2.1 Create `backend/services/GmailAuthService.js` with OAuth flow methods
    - Implement `generateAuthUrl(redirectUri)` to create Google OAuth URL with state token
    - Implement `exchangeCodeForToken(code, state)` to exchange authorization code for access token
    - Implement `encryptToken(token)` and `decryptToken(encryptedToken)` using AES-256-GCM
    - Implement `revokeAccess(token)` to revoke OAuth token
    - Add state token generation and validation with 10-minute expiration
    - _Requirements: 1.1, 1.3, 1.4, 8.2, 8.3_
  
  - [x] 2.2 Create OAuth API endpoints in backend
    - Add `POST /api/auth/gmail/initiate` endpoint to start OAuth flow
    - Add `GET /api/auth/gmail/callback` endpoint to handle OAuth callback
    - Add `POST /api/gmail/disconnect` endpoint to revoke access
    - Implement session management for tracking OAuth state
    - _Requirements: 1.1, 1.3, 1.4, 8.2_

- [x] 3. Implement email retrieval service
  - [x] 3.1 Create `backend/services/GmailRetrievalService.js` with Gmail API integration
    - Implement `fetchSentEmails(accessToken, maxResults)` to retrieve emails from Sent folder
    - Implement `getEmailContent(accessToken, messageId)` to fetch individual email details
    - Implement `parseEmailBody(payload)` to extract plain text from email payload
    - Implement `extractPlainText(parts)` to handle multipart email structures
    - Add pagination handling for batch retrieval (50 emails per batch)
    - Add error handling with exponential backoff for rate limiting
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_
  
  - [ ]* 3.2 Write unit tests for email retrieval
    - Test Gmail API client initialization
    - Test email fetching with mocked Gmail API responses
    - Test pagination and batch processing
    - Test error handling and retry logic
    - _Requirements: 2.1, 2.2, 2.5_

- [x] 4. Implement email cleansing pipeline
  - [x] 4.1 Create `backend/services/EmailCleansingService.js` with filtering logic
    - Implement `isAutomatedEmail(subject)` to filter automated emails by subject patterns
    - Implement `removeQuotedText(body)` to remove reply quotes and forwarded content
    - Implement `removeSignature(body)` to detect and remove email signatures
    - Implement `validateContentQuality(cleanedBody)` to ensure minimum 20 words
    - Implement `cleanseEmailBatch(emails)` to process multiple emails efficiently
    - Add regex patterns for automated email detection (Fwd, Re, Out of Office, etc.)
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 4.1, 4.2, 4.3, 4.4, 4.5, 5.1, 5.2, 5.3, 5.4, 5.5_
  
  - [ ]* 4.2 Write unit tests for cleansing pipeline
    - Test automated email filtering with various subject patterns
    - Test quoted text removal with different reply formats
    - Test signature detection and removal
    - Test content quality validation
    - Test edge cases (empty emails, malformed content)
    - _Requirements: 3.1, 3.7, 4.1, 4.5, 5.1, 5.4_

- [x] 5. Implement Gmail style analysis service
  - [x] 5.1 Create `backend/services/GmailStyleAnalyzer.js` for pattern extraction
    - Implement `analyzeEmailContent(cleansedEmails)` to extract writing patterns using Gemini API
    - Implement `extractWritingPatterns(text)` to identify formality, tone, and vocabulary
    - Implement `mergeWithExistingProfile(newPatterns, existingProfile)` to combine Gmail patterns with existing style profile
    - Implement batch processing (20 emails per Gemini API call)
    - Add confidence scoring based on sample size
    - _Requirements: 6.1, 6.2, 6.3_
  
  - [ ]* 5.2 Write unit tests for style analyzer
    - Test pattern extraction with sample email content
    - Test profile merging logic
    - Test batch processing
    - Test confidence scoring
    - _Requirements: 6.1, 6.2, 6.3_

- [x] 6. Create analysis session management
  - [x] 6.1 Implement session tracking for analysis progress
    - Create in-memory Map for storing analysis sessions with TTL (1 hour)
    - Add `GET /api/gmail/analysis-status/:sessionId` endpoint for progress polling
    - Implement progress update mechanism during retrieval, cleansing, and analysis
    - Add automatic session cleanup after completion or timeout
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_
  
  - [x] 6.2 Integrate all services into complete analysis flow
    - Create orchestration function that coordinates auth, retrieval, cleansing, and analysis
    - Implement progress tracking at each stage
    - Add error handling and rollback for failed analyses
    - Ensure style profile is only updated on successful completion
    - _Requirements: 2.5, 6.1, 6.4, 6.5, 7.4, 7.5_

- [x] 7. Update data models for Gmail integration
  - Update `src/models.js` to add Gmail source type to styleProfile
  - Add `emails` and `emailWords` fields to `sampleCount` object
  - Add Gmail source metadata (connectedAt, emailsAnalyzed, lastSync)
  - Create helper function `generateGmailSource(stats)` for creating Gmail source objects
  - _Requirements: 6.2, 6.3_

- [x] 8. Create frontend Gmail connection component
  - [x] 8.1 Create `src/components/GmailConnectButton.js` component
    - Implement OAuth popup window handling
    - Add connection status states (idle, connecting, retrieving, analyzing, complete, error)
    - Implement progress polling using `/api/gmail/analysis-status/:sessionId`
    - Add "Connect Gmail" and "Disconnect Gmail" button UI
    - Display progress messages and statistics during analysis
    - _Requirements: 1.1, 7.1, 7.2, 7.3, 7.4, 8.1, 8.4_
  
  - [ ]* 8.2 Write component tests for GmailConnectButton
    - Test OAuth popup handling
    - Test status updates and progress display
    - Test error handling
    - Test disconnect functionality
    - _Requirements: 1.1, 7.4, 8.1, 8.4_

- [x] 9. Integrate Gmail source into SourceConnector
  - Update `src/components/SourceConnector.js` to include Gmail as a source option
  - Add Gmail icon and "Connect Gmail Account" option to source selection UI
  - Integrate GmailConnectButton component into source connection flow
  - Handle Gmail authentication callback and analysis completion
  - Update source submission logic to handle Gmail source type
  - _Requirements: 1.1, 7.4_

- [x] 10. Add error handling and user feedback
  - Implement user-friendly error messages for OAuth failures (permission denied, invalid redirect, etc.)
  - Add error handling for Gmail API errors (rate limiting, token expiration, network timeout)
  - Display partial success messages when some emails fail cleansing
  - Add retry functionality for failed analyses
  - Ensure error messages never expose sensitive data
  - _Requirements: 1.4, 7.5_

- [x] 11. Implement security measures
  - Add CSRF protection with state token validation in OAuth callback
  - Implement rate limiting for Gmail API endpoints (10 requests/hour per user)
  - Add input validation and sanitization for all Gmail-related endpoints
  - Ensure tokens are never logged or exposed in error messages
  - Implement automatic token cleanup after 1 hour
  - _Requirements: 1.3, 1.4_

- [x] 12. Add documentation and configuration examples
  - Update `backend/.env.example` with Gmail configuration variables and comments
  - Create setup guide for obtaining Google OAuth credentials
  - Document Gmail API quota limits and rate limiting strategy
  - Add inline code comments for complex cleansing patterns
  - _Requirements: 1.1, 1.3_

- [x] 13. Create OAuth callback HTML page





  - Create `backend/public/gmail-callback.html` to handle OAuth redirect
  - Implement message posting to parent window with session ID or error
  - Add loading indicator and error display for user feedback
  - Ensure page closes automatically after successful callback
  - _Requirements: 1.1, 8.2_

- [x] 14. Test end-to-end Gmail integration flow





  - Verify OAuth flow works correctly with Google
  - Test email retrieval with real Gmail account
  - Validate cleansing pipeline with various email types
  - Confirm style analysis produces accurate patterns
  - Test error scenarios (permission denied, network issues, etc.)
  - _Requirements: 1.1, 2.1, 3.1, 6.1, 7.4_
