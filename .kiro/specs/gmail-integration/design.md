# Design Document: Gmail Integration

## Overview

The Gmail Integration feature extends DigitalMe's style analysis capabilities by enabling secure access to user-sent emails. This design integrates with the existing Express backend and React frontend, adding OAuth 2.0 authentication, email retrieval, intelligent content cleansing, and style profile enhancement.

The system follows a privacy-first approach, requesting minimal permissions (Sent folder only), processing data server-side, and never storing raw email content permanently.

## Architecture

### High-Level Flow

```
User clicks "Connect Gmail" 
  → Frontend initiates OAuth flow
  → Google OAuth consent screen
  → User grants permission (Sent folder only)
  → Backend receives authorization code
  → Backend exchanges code for access token
  → Backend retrieves 200 most recent sent emails
  → Cleansing Pipeline processes emails
  → Style analysis extracts patterns
  → Style Profile updated
  → Frontend displays success with statistics
```

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend (React)                      │
│  ┌──────────────────┐  ┌─────────────────────────────────┐ │
│  │ SourceConnector  │  │  GmailConnectButton Component   │ │
│  │   Component      │  │  - Initiates OAuth flow         │ │
│  │                  │  │  - Displays connection status   │ │
│  └──────────────────┘  └─────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              ↓ HTTP
┌─────────────────────────────────────────────────────────────┐
│                    Backend (Express/Node.js)                 │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              Gmail Integration Module                 │  │
│  │  ┌────────────────┐  ┌──────────────────────────┐   │  │
│  │  │ OAuth Handler  │  │  Email Retrieval Service │   │  │
│  │  │ - /auth/gmail  │  │  - Gmail API client      │   │  │
│  │  │ - /auth/callback│ │  - Fetch sent emails     │   │  │
│  │  └────────────────┘  └──────────────────────────┘   │  │
│  │  ┌────────────────────────────────────────────────┐ │  │
│  │  │         Cleansing Pipeline                     │ │  │
│  │  │  - Subject line filtering                      │ │  │
│  │  │  - Quote removal                               │ │  │
│  │  │  - Signature detection                         │ │  │
│  │  │  - Content quality validation                  │ │  │
│  │  └────────────────────────────────────────────────┘ │  │
│  │  ┌────────────────────────────────────────────────┐ │  │
│  │  │      Style Analysis Integration                │ │  │
│  │  │  - Extract writing patterns                    │ │  │
│  │  │  - Merge with existing profile                 │ │  │
│  │  └────────────────────────────────────────────────┘ │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                    Google Gmail API                          │
│  - OAuth 2.0 authentication                                  │
│  - gmail.readonly scope (Sent folder only)                   │
└─────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### 1. Frontend Components

#### GmailConnectButton Component

**Location:** `src/components/GmailConnectButton.js`

**Purpose:** Provides UI for initiating Gmail OAuth flow and displaying connection status

**Props:**
- `onConnectionStart: () => void` - Callback when OAuth flow begins
- `onConnectionComplete: (stats) => void` - Callback with analysis statistics
- `onConnectionError: (error) => void` - Callback for error handling
- `isConnected: boolean` - Current connection state

**State:**
- `connectionStatus: 'idle' | 'connecting' | 'retrieving' | 'analyzing' | 'complete' | 'error'`
- `progressMessage: string`
- `analysisStats: { emailsAnalyzed, emailsFiltered, patternsExtracted }`

**Methods:**
- `handleConnect()` - Opens OAuth popup window
- `handleDisconnect()` - Revokes Gmail access
- `pollAnalysisStatus()` - Checks backend for analysis progress

#### Integration with SourceConnector

**Location:** `src/components/SourceConnector.js`

**Modification:** Add Gmail as a new source type alongside GitHub, Blog, and Text

**New Source Type:**
```javascript
{
  type: 'gmail',
  label: 'Gmail Account',
  icon: 'email',
  requiresAuth: true
}
```

### 2. Backend API Endpoints

#### POST /api/auth/gmail/initiate

**Purpose:** Initiates OAuth 2.0 flow and returns authorization URL

**Request Body:**
```javascript
{
  redirectUri: string // Frontend callback URL
}
```

**Response:**
```javascript
{
  authUrl: string,      // Google OAuth consent URL
  state: string         // CSRF protection token
}
```

**Security:**
- Generates cryptographically secure state token
- Stores state in session with 10-minute expiration
- Validates redirectUri against whitelist

#### GET /api/auth/gmail/callback

**Purpose:** Handles OAuth callback, exchanges code for token

**Query Parameters:**
- `code: string` - Authorization code from Google
- `state: string` - CSRF token for validation

**Response:**
```javascript
{
  success: boolean,
  sessionId: string,    // Temporary session for tracking analysis
  message: string
}
```

**Process:**
1. Validate state token
2. Exchange authorization code for access token
3. Store access token securely (encrypted, in-memory)
4. Trigger email retrieval and analysis
5. Return session ID for progress tracking

#### GET /api/gmail/analysis-status/:sessionId

**Purpose:** Returns real-time progress of email analysis

**Response:**
```javascript
{
  status: 'retrieving' | 'cleansing' | 'analyzing' | 'complete' | 'error',
  progress: {
    currentStep: number,
    totalSteps: number,
    message: string
  },
  stats: {
    emailsRetrieved: number,
    emailsFiltered: number,
    emailsAnalyzed: number,
    patternsExtracted: number
  },
  error?: string
}
```

#### POST /api/gmail/disconnect

**Purpose:** Revokes Gmail access and clears stored tokens

**Request Body:**
```javascript
{
  sessionId: string
}
```

**Response:**
```javascript
{
  success: boolean,
  message: string
}
```

### 3. Backend Services

#### GmailAuthService

**Location:** `backend/services/GmailAuthService.js`

**Responsibilities:**
- OAuth 2.0 flow management
- Token storage and encryption
- Token refresh handling
- Access revocation

**Key Methods:**
```javascript
class GmailAuthService {
  generateAuthUrl(redirectUri)
  exchangeCodeForToken(code, state)
  refreshAccessToken(refreshToken)
  revokeAccess(token)
  encryptToken(token)
  decryptToken(encryptedToken)
}
```

**Configuration:**
- Client ID: Stored in `GOOGLE_CLIENT_ID` environment variable
- Client Secret: Stored in `GOOGLE_CLIENT_SECRET` environment variable
- Scopes: `https://www.googleapis.com/auth/gmail.readonly` (restricted to Sent)
- Token encryption: AES-256-GCM with key from `TOKEN_ENCRYPTION_KEY` env var

#### GmailRetrievalService

**Location:** `backend/services/GmailRetrievalService.js`

**Responsibilities:**
- Fetch emails from Sent folder
- Handle pagination
- Extract email metadata and content
- Error handling and retry logic

**Key Methods:**
```javascript
class GmailRetrievalService {
  async fetchSentEmails(accessToken, maxResults = 200)
  async getEmailContent(accessToken, messageId)
  parseEmailBody(payload)
  extractPlainText(parts)
}
```

**Gmail API Integration:**
- Uses `googleapis` npm package
- Queries: `in:sent` label filter
- Fields: `id, threadId, payload.headers, payload.body, payload.parts`
- Batch requests for efficiency (50 emails per batch)

#### EmailCleansingService

**Location:** `backend/services/EmailCleansingService.js`

**Responsibilities:**
- Filter automated emails by subject patterns
- Remove quoted reply text
- Remove email signatures
- Validate content quality

**Key Methods:**
```javascript
class EmailCleansingService {
  cleanseEmailBatch(emails)
  isAutomatedEmail(subject)
  removeQuotedText(body)
  removeSignature(body)
  validateContentQuality(cleanedBody)
  extractOriginalContent(email)
}
```

**Filtering Patterns:**

Subject line exclusions (case-insensitive regex):
```javascript
const AUTOMATED_PATTERNS = [
  /^(re|fwd?):/i,
  /accepted:/i,
  /out of office/i,
  /automatic reply/i,
  /delivery status notification/i,
  /undeliverable/i,
  /bounce/i
];
```

Quote removal patterns:
```javascript
const QUOTE_PATTERNS = [
  /^On .+ wrote:$/m,           // "On Mon, Jan 1, 2024, User wrote:"
  /^From:.+$/m,                 // Email headers
  /^Sent:.+$/m,
  /^To:.+$/m,
  /^Subject:.+$/m,
  /^>+.*/gm,                    // Lines starting with >
  /_{10,}/g,                    // Separator lines
];
```

Signature detection patterns:
```javascript
const SIGNATURE_PATTERNS = [
  /^--\s*$/m,                   // Standard signature delimiter
  /sent from my (iphone|ipad|android)/i,
  /^(best regards|sincerely|cheers|thanks|thank you),?\s*$/im,
  /^(confidential|this email)/i
];
```

Content quality validation:
- Minimum 20 words after cleansing
- Must contain at least one sentence (period, question mark, or exclamation)
- Cannot be only whitespace or punctuation

#### GmailStyleAnalyzer

**Location:** `backend/services/GmailStyleAnalyzer.js`

**Responsibilities:**
- Extract writing patterns from cleansed emails
- Generate style metrics
- Merge with existing style profile

**Key Methods:**
```javascript
class GmailStyleAnalyzer {
  async analyzeEmailContent(cleansedEmails)
  extractWritingPatterns(text)
  calculateFormality(text)
  detectTone(text)
  analyzeSentenceStructure(text)
  identifyVocabularyPatterns(text)
  mergeWithExistingProfile(newPatterns, existingProfile)
}
```

**Analysis Approach:**
- Uses Gemini API for pattern extraction (similar to existing StyleAnalyzer)
- Analyzes emails in batches of 20 for efficiency
- Extracts: formality level, tone, sentence length patterns, vocabulary preferences
- Confidence scoring based on sample size and consistency

**Integration with Existing StyleAnalyzer:**
```javascript
// Reuse existing buildStyleProfile function
import { buildStyleProfile } from './StyleAnalyzer';

const gmailAnalysisResult = {
  type: 'gmail',
  result: {
    success: true,
    patterns: extractedPatterns,
    metadata: {
      emailCount: cleansedEmails.length,
      wordCount: totalWords,
      avgEmailLength: avgWords
    }
  }
};

// Merge with other sources
const updatedProfile = await buildStyleProfile([
  ...existingAnalysisResults,
  gmailAnalysisResult
]);
```

## Data Models

### GmailConnection

**Storage:** In-memory Map (not persisted to database)

```javascript
{
  sessionId: string,           // UUID v4
  userId: string,              // Future: user identifier
  accessToken: string,         // Encrypted
  refreshToken: string,        // Encrypted
  expiresAt: Date,
  createdAt: Date,
  status: 'active' | 'expired' | 'revoked'
}
```

**Security Notes:**
- Tokens encrypted with AES-256-GCM
- Stored in memory only, cleared after analysis completes
- Automatic cleanup after 1 hour
- Never logged or exposed in responses

### AnalysisSession

**Storage:** In-memory Map with TTL

```javascript
{
  sessionId: string,
  status: 'retrieving' | 'cleansing' | 'analyzing' | 'complete' | 'error',
  progress: {
    currentStep: number,
    totalSteps: number,
    message: string
  },
  stats: {
    emailsRetrieved: number,
    emailsFiltered: number,
    emailsAnalyzed: number,
    patternsExtracted: number
  },
  error: string | null,
  createdAt: Date,
  updatedAt: Date
}
```

**TTL:** 1 hour (automatically cleaned up)

### CleanedEmail

**Temporary structure during processing (not persisted)**

```javascript
{
  id: string,                  // Gmail message ID
  subject: string,
  cleanedBody: string,         // After cleansing
  originalLength: number,      // Character count before cleansing
  cleanedLength: number,       // Character count after cleansing
  wordCount: number,
  sentenceCount: number,
  timestamp: Date,
  isValid: boolean             // Passed quality checks
}
```

### StyleProfile Enhancement

**Existing model location:** `src/models.js`

**New fields added to styleProfile:**

```javascript
{
  // ... existing fields ...
  sampleCount: {
    // ... existing counts ...
    emails: number,            // NEW: Count of analyzed emails
    emailWords: number         // NEW: Total words from emails
  },
  sources: [
    // ... existing sources ...
    {
      type: 'gmail',           // NEW source type
      connectedAt: Date,
      emailsAnalyzed: number,
      lastSync: Date
    }
  ]
}
```

## Error Handling

### OAuth Errors

**Scenarios:**
1. User denies permission
2. Invalid redirect URI
3. State token mismatch (CSRF attack)
4. Token exchange failure

**Handling:**
- Display user-friendly error messages
- Log detailed errors server-side (without sensitive data)
- Provide "Try Again" option
- Clear any partial session data

### Gmail API Errors

**Scenarios:**
1. Rate limiting (429)
2. Invalid token (401)
3. Insufficient permissions (403)
4. Network timeout

**Handling:**
- Implement exponential backoff for rate limits
- Automatic token refresh for 401 errors
- Clear error messages for permission issues
- Retry logic with max 3 attempts

### Cleansing Pipeline Errors

**Scenarios:**
1. Malformed email content
2. Unexpected HTML structure
3. Character encoding issues

**Handling:**
- Skip problematic emails, continue processing
- Log errors for debugging
- Track failed email count in stats
- Ensure at least 10 valid emails for analysis

### Analysis Errors

**Scenarios:**
1. Gemini API failure
2. Insufficient valid emails
3. Pattern extraction failure

**Handling:**
- Fallback to existing style profile
- Display partial success message
- Offer to retry with different settings
- Never corrupt existing profile data

## Testing Strategy

### Unit Tests

**Backend Services:**
- `GmailAuthService`: Mock OAuth flow, test token encryption/decryption
- `EmailCleansingService`: Test pattern matching, content extraction
- `GmailStyleAnalyzer`: Test pattern extraction with sample emails

**Test Files:**
- `backend/services/__tests__/GmailAuthService.test.js`
- `backend/services/__tests__/EmailCleansingService.test.js`
- `backend/services/__tests__/GmailStyleAnalyzer.test.js`

**Key Test Cases:**
```javascript
describe('EmailCleansingService', () => {
  test('filters automated emails by subject', () => {
    const email = { subject: 'Fwd: Meeting notes' };
    expect(service.isAutomatedEmail(email.subject)).toBe(true);
  });
  
  test('removes quoted reply text', () => {
    const body = 'My response\n\nOn Mon, Jan 1 wrote:\n> Previous message';
    const cleaned = service.removeQuotedText(body);
    expect(cleaned).toBe('My response');
  });
  
  test('validates minimum content quality', () => {
    const shortBody = 'ok thanks';
    expect(service.validateContentQuality(shortBody)).toBe(false);
  });
});
```

### Integration Tests

**OAuth Flow:**
- Test complete authorization flow with mock Google OAuth
- Verify state token validation
- Test token storage and retrieval

**Email Retrieval:**
- Mock Gmail API responses
- Test pagination handling
- Verify error recovery

**End-to-End Analysis:**
- Test complete flow from OAuth to profile update
- Verify style profile merging
- Test progress tracking

### Frontend Tests

**Component Tests:**
- `GmailConnectButton`: Test OAuth popup, status updates
- `SourceConnector`: Test Gmail source integration

**Test Files:**
- `src/components/__tests__/GmailConnectButton.test.js`

### Manual Testing Checklist

- [ ] OAuth flow completes successfully
- [ ] User can deny permission gracefully
- [ ] Progress updates display correctly
- [ ] Analysis completes with valid emails
- [ ] Style profile updates correctly
- [ ] Disconnect revokes access
- [ ] Error messages are user-friendly
- [ ] No sensitive data in browser console
- [ ] Works across different browsers

## Security Considerations

### OAuth Security

1. **State Token:** Cryptographically secure random string (32 bytes)
2. **CSRF Protection:** Validate state token on callback
3. **Redirect URI Validation:** Whitelist allowed URIs
4. **Token Storage:** Encrypt tokens at rest using AES-256-GCM
5. **Token Transmission:** HTTPS only, never in URL parameters

### Data Privacy

1. **Minimal Permissions:** Request only `gmail.readonly` scope
2. **Folder Restriction:** Query only `in:sent` label
3. **No Persistence:** Raw email content never stored permanently
4. **Automatic Cleanup:** Clear tokens and sessions after 1 hour
5. **User Control:** Easy disconnect/revoke option

### API Security

1. **Rate Limiting:** Implement per-user rate limits (10 requests/hour)
2. **Input Validation:** Sanitize all user inputs
3. **Error Messages:** Never expose sensitive data in errors
4. **Logging:** Log events without sensitive data (no tokens, email content)
5. **CORS:** Restrict to configured frontend URL

### Environment Variables

**New variables in `.env`:**
```bash
# Google OAuth Configuration
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3001/api/auth/gmail/callback

# Token Encryption
TOKEN_ENCRYPTION_KEY=your-32-byte-hex-key

# Gmail API Configuration
GMAIL_MAX_EMAILS=200
GMAIL_BATCH_SIZE=50
```

## Performance Considerations

### Email Retrieval

- **Batch Processing:** Fetch 50 emails per API call
- **Parallel Requests:** Use Promise.all for concurrent fetching
- **Timeout:** 60-second limit for entire retrieval process

### Cleansing Pipeline

- **Stream Processing:** Process emails as they arrive
- **Regex Optimization:** Compile patterns once, reuse
- **Early Exit:** Skip emails that fail subject filter immediately

### Style Analysis

- **Batch Analysis:** Analyze 20 emails per Gemini API call
- **Caching:** Cache analysis results during session
- **Incremental Updates:** Merge patterns progressively

### Memory Management

- **Streaming:** Don't load all 200 emails into memory at once
- **Cleanup:** Clear processed emails after analysis
- **Session TTL:** Automatic cleanup after 1 hour

## Implementation Phases

### Phase 1: OAuth Infrastructure
- Set up Google Cloud project and OAuth credentials
- Implement GmailAuthService
- Create OAuth endpoints
- Add environment variables

### Phase 2: Email Retrieval
- Implement GmailRetrievalService
- Test Gmail API integration
- Handle pagination and batching

### Phase 3: Cleansing Pipeline
- Implement EmailCleansingService
- Test filtering patterns
- Validate content quality checks

### Phase 4: Style Analysis Integration
- Implement GmailStyleAnalyzer
- Integrate with existing StyleAnalyzer
- Test profile merging

### Phase 5: Frontend Integration
- Create GmailConnectButton component
- Update SourceConnector
- Implement progress tracking UI

### Phase 6: Testing & Polish
- Write unit and integration tests
- Manual testing across browsers
- Security audit
- Performance optimization

## Dependencies

### New NPM Packages (Backend)

```json
{
  "googleapis": "^128.0.0",      // Gmail API client
  "crypto": "built-in"            // Token encryption (Node.js built-in)
}
```

### Existing Dependencies (Reused)

- `express`: API endpoints
- `cors`: CORS configuration
- `dotenv`: Environment variables
- `@google/generative-ai`: Style analysis (existing)

## Monitoring and Logging

### Metrics to Track

- OAuth success/failure rate
- Average emails retrieved per user
- Cleansing filter effectiveness (% filtered)
- Analysis completion time
- Error rates by type

### Log Events

```javascript
// Success events
logger.info('Gmail OAuth completed', { sessionId, emailCount });
logger.info('Email cleansing completed', { sessionId, filtered, analyzed });
logger.info('Style profile updated', { sessionId, patternsAdded });

// Error events (no sensitive data)
logger.error('Gmail API error', { sessionId, errorType, statusCode });
logger.error('Cleansing failed', { sessionId, reason });
logger.error('Analysis failed', { sessionId, errorMessage });
```

### Privacy in Logs

- Never log email content
- Never log access tokens
- Never log user email addresses
- Use session IDs for correlation
- Sanitize all error messages
