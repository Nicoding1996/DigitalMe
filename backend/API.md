# DigitalMe API Reference

Complete API documentation for the DigitalMe backend service.

**Base URL:** `http://localhost:3001` (development) or your deployed backend URL

---

## Table of Contents

- [Authentication](#authentication)
- [Health & Status](#health--status)
- [AI Generation](#ai-generation)
- [Style Analysis](#style-analysis)
- [Gmail Integration](#gmail-integration)
- [Profile Refinement](#profile-refinement)
- [Rate Limiting](#rate-limiting)
- [Error Handling](#error-handling)

---

## Authentication

The API uses different authentication methods depending on the endpoint:

- **Gmail OAuth**: OAuth 2.0 with session-based tokens
- **API Key**: Gemini API key (server-side only, never exposed)
- **No Auth**: Public endpoints (health check, analysis)

---

## Health & Status

### GET /api/health

Check backend service health and availability.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-01-15T10:30:00.000Z",
  "services": {
    "gemini": "available",
    "gmail": "available"
  }
}
```

**Status Codes:**
- `200 OK` - Service healthy
- `503 Service Unavailable` - Service degraded

---

## AI Generation

### POST /api/generate

Generate AI responses using the user's style profile.

**Request Body:**
```json
{
  "prompt": "Write a blog post about React hooks",
  "styleProfile": {
    "writing": {
      "tone": "conversational",
      "formality": "casual",
      "sentenceLength": "mixed",
      "vocabulary": ["basically", "honestly", "you know"],
      "avoidance": ["utilize", "leverage"]
    },
    "coding": {
      "language": "JavaScript",
      "framework": "React",
      "componentStyle": "functional",
      "namingConvention": "camelCase",
      "commentFrequency": "moderate"
    },
    "advanced": {
      "signaturePhrases": [
        { "phrase": "I think", "frequency": 15, "category": "thought_process" }
      ],
      "thoughtPatterns": ["analytical", "step-by-step"],
      "personalityMarkers": ["self-aware humor", "casual tone"]
    }
  },
  "conversationHistory": [
    { "role": "user", "content": "Previous message" },
    { "role": "assistant", "content": "Previous response" }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "response": "Generated text in user's style..."
}
```

**Validation:**
- `prompt`: Required, string, 1-10,000 characters (backend limit)
  - Frontend enforces 5,000 character limit for UX
- `styleProfile`: Required, object with writing/coding/advanced sections
- `conversationHistory`: Optional, array of message objects (no hard limit, but keep reasonable for context)

**Rate Limit:** No explicit rate limit on this endpoint (relies on Gemini API quotas)

**Status Codes:**
- `200 OK` - Success
- `400 Bad Request` - Invalid input
- `429 Too Many Requests` - Rate limit exceeded
- `500 Internal Server Error` - Generation failed

---

## Style Analysis

### POST /api/analyze-advanced

Perform advanced style analysis on text samples.

**Request Body:**
```json
{
  "text": "Sample text to analyze (minimum 100 words)...",
  "options": {
    "extractPhrases": true,
    "extractPatterns": true,
    "extractQuirks": true
  }
}
```

**Response:**
```json
{
  "success": true,
  "analysis": {
    "signaturePhrases": [
      { "phrase": "I think", "frequency": 15, "category": "thought_process" }
    ],
    "thoughtPatterns": ["analytical", "step-by-step"],
    "personalityMarkers": ["self-aware humor"],
    "contextualVariations": {
      "technical": { "formality": 0.7, "vocabulary": ["implement", "optimize"] },
      "casual": { "formality": 0.3, "vocabulary": ["basically", "honestly"] }
    }
  }
}
```

**Validation:**
- `text`: Required, string, 100-50,000 characters
- `options`: Optional, object with boolean flags

**Rate Limit:** No explicit rate limit on this endpoint

---

### POST /api/analyze-github

Analyze writing style from GitHub repositories.

**Request Body:**
```json
{
  "username": "github-username"
}
```

**Response:**
```json
{
  "success": true,
  "analysis": {
    "tone": "professional",
    "formality": "neutral",
    "sentenceLength": "short",
    "vocabulary": ["implement", "refactor", "optimize"],
    "patterns": ["imperative mood", "technical precision"]
  },
  "metadata": {
    "reposAnalyzed": 5,
    "commitsAnalyzed": 150,
    "wordsAnalyzed": 2500,
    "confidence": 0.75
  }
}
```

**Validation:**
- `username`: Required, string, valid GitHub username

**Rate Limit:** 10 requests per hour per IP

---

### POST /api/analyze-blog

Analyze writing style from blog URLs.

**Request Body:**
```json
{
  "urls": [
    "https://medium.com/@user/article-1",
    "https://dev.to/user/article-2"
  ]
}
```

**Response:**
```json
{
  "success": true,
  "analysis": {
    "tone": "conversational",
    "formality": "casual",
    "sentenceLength": "mixed",
    "vocabulary": ["basically", "honestly"],
    "patterns": ["storytelling", "examples-driven"]
  },
  "metadata": {
    "urlsAnalyzed": 2,
    "wordsAnalyzed": 5000,
    "confidence": 0.65
  }
}
```

**Validation:**
- `urls`: Required, array of strings (1-10 URLs)
- Each URL must be valid HTTP/HTTPS

**Rate Limit:** 10 requests per hour per IP

**Supported Platforms:**
- Medium
- Dev.to
- WordPress
- Custom blogs (best effort)

---

## Gmail Integration

Gmail integration requires OAuth 2.0 authentication. The flow involves multiple steps:

### POST /api/auth/gmail/initiate

Initiate Gmail OAuth flow.

**Request Body:**
```json
{
  "redirectUri": "http://localhost:3001/api/auth/gmail/callback"
}
```

**Response:**
```json
{
  "success": true,
  "authUrl": "https://accounts.google.com/o/oauth2/v2/auth?...",
  "sessionId": "uuid-v4-session-id"
}
```

**Rate Limit:** 10 requests per hour per IP

---

### GET /api/auth/gmail/callback

OAuth callback endpoint (handled by Google).

**Query Parameters:**
- `code`: Authorization code from Google
- `state`: CSRF protection token

**Response:** Redirects to `gmail-callback.html` with session ID

---

### GET /api/auth/gmail/session-status/:sessionId

Check OAuth session status.

**Response:**
```json
{
  "success": true,
  "status": "authenticated",
  "sessionId": "uuid-v4-session-id"
}
```

**Possible Statuses:**
- `pending` - OAuth flow not completed
- `authenticated` - User authenticated, ready for analysis
- `analyzing` - Analysis in progress
- `completed` - Analysis finished
- `error` - Authentication failed

---

### POST /api/gmail/start-analysis

Start Gmail email analysis.

**Request Body:**
```json
{
  "sessionId": "uuid-v4-session-id",
  "existingProfile": {
    "writing": { /* existing style profile */ }
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Gmail analysis started",
  "sessionId": "uuid-v4-session-id"
}
```

**Rate Limit:** 10 requests per hour per IP

---

### GET /api/gmail/analysis-status/:sessionId

Check Gmail analysis progress.

**Response:**
```json
{
  "success": true,
  "status": "analyzing",
  "progress": {
    "stage": "retrieving",
    "emailsProcessed": 50,
    "totalEmails": 200,
    "percentage": 25
  }
}
```

**Analysis Stages:**
1. `retrieving` - Fetching emails from Gmail API
2. `cleansing` - Removing signatures, quotes, automated content
3. `analyzing` - Extracting style patterns
4. `completed` - Analysis finished

**Completed Response:**
```json
{
  "success": true,
  "status": "completed",
  "result": {
    "styleProfile": { /* merged style profile */ },
    "metadata": {
      "emailsAnalyzed": 200,
      "wordsAnalyzed": 15000,
      "confidence": 0.92,
      "qualityWeight": 1.0
    }
  }
}
```

---

### POST /api/gmail/disconnect

Revoke Gmail access and delete tokens.

**Request Body:**
```json
{
  "sessionId": "uuid-v4-session-id"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Gmail access revoked successfully"
}
```

---

## Profile Refinement

### POST /api/profile/refine

Refine style profile with new conversation messages (Living Profile feature).

**Request Body:**
```json
{
  "currentProfile": {
    "writing": {
      "tone": "conversational",
      "formality": "casual",
      "sentenceLength": "mixed",
      "vocabulary": ["basically"],
      "avoidance": ["utilize"],
      "confidence": {
        "tone": 0.75,
        "formality": 0.60
      }
    }
  },
  "newMessages": [
    "First message from user...",
    "Second message from user...",
    "Third message from user..."
  ]
}
```

**Response:**
```json
{
  "success": true,
  "refinedProfile": {
    "writing": {
      "tone": "conversational",
      "formality": "casual",
      "sentenceLength": "mixed",
      "vocabulary": ["basically", "honestly"],
      "avoidance": ["utilize"],
      "confidence": {
        "tone": 0.78,
        "formality": 0.65
      }
    }
  },
  "changes": {
    "vocabulary": {
      "added": ["honestly"],
      "removed": []
    },
    "confidence": {
      "tone": { "old": 0.75, "new": 0.78 },
      "formality": { "old": 0.60, "new": 0.65 }
    }
  },
  "metadata": {
    "messagesAnalyzed": 3,
    "wordsAnalyzed": 150,
    "attributesUpdated": 2
  }
}
```

**Validation:**
- `currentProfile`: Required, valid style profile object with `writing` section
- `newMessages`: Required, array of strings (1-50 messages)
- Each message: max 5,000 characters
- Total batch: max 50,000 characters combined

**Rate Limit:** 30 requests per hour per IP

**Algorithm:**
- Low confidence attributes (< 50%) update more significantly
- High confidence attributes (> 80%) update minimally
- Diminishing returns prevent profile drift
- Only basic writing style updated (not advanced patterns)

---

## Rate Limiting

Rate limits protect the API from abuse and manage external API quotas.

### Limits by Endpoint:

| Endpoint | Limit | Window |
|----------|-------|--------|
| `/api/generate` | No limit | - |
| `/api/analyze-*` | No limit | - |
| `/api/analyze-github` | No limit | - |
| `/api/analyze-blog` | No limit | - |
| `/api/auth/gmail/*` | 50 requests | 15 minutes |
| `/api/gmail/*` | 100 requests | 1 hour |
| `/api/profile/refine` | No limit | - |

**Note:** Endpoints without explicit rate limits rely on Gemini API quotas and general server capacity.

### Rate Limit Headers:

```
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1642262400
```

### Rate Limit Response:

```json
{
  "success": false,
  "error": "Too many requests, please try again later",
  "retryAfter": 60
}
```

**Status Code:** `429 Too Many Requests`

---

## Error Handling

All errors follow a consistent format:

```json
{
  "success": false,
  "error": "Human-readable error message",
  "code": "ERROR_CODE"
}
```

### Common Error Codes:

| Code | Status | Description |
|------|--------|-------------|
| `VALIDATION_ERROR` | 400 | Invalid request parameters |
| `AUTHENTICATION_ERROR` | 401 | OAuth authentication failed |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |
| `GMAIL_API_ERROR` | 503 | Gmail API unavailable |
| `GEMINI_API_ERROR` | 503 | Gemini AI unavailable |
| `ANALYSIS_ERROR` | 500 | Style analysis failed |
| `GENERATION_ERROR` | 500 | AI generation failed |

### Error Response Examples:

**Validation Error:**
```json
{
  "success": false,
  "error": "Prompt must be between 1 and 10000 characters",
  "code": "VALIDATION_ERROR",
  "field": "prompt"
}
```

**Rate Limit Error:**
```json
{
  "success": false,
  "error": "Too many requests, please try again later",
  "code": "RATE_LIMIT_EXCEEDED",
  "retryAfter": 3600
}
```

**Gmail API Error:**
```json
{
  "success": false,
  "error": "Gmail API quota exceeded",
  "code": "GMAIL_API_ERROR",
  "retryAfter": 86400
}
```

---

## Security Considerations

### API Key Protection
- Gemini API key stored server-side only
- Never exposed in responses or logs
- Validated at startup

### OAuth Security
- State tokens prevent CSRF attacks
- Tokens encrypted with AES-256-GCM
- Automatic session cleanup (1 hour)
- Tokens never logged

### Input Validation
- All inputs validated and sanitized
- SQL injection prevention (no database)
- XSS prevention in error messages
- Path traversal prevention

### CORS Configuration
- Restricted to `FRONTEND_URL` origin
- Credentials allowed for OAuth
- Preflight requests handled

### Rate Limiting
- Per-IP rate limiting
- Prevents abuse and quota exhaustion
- Configurable limits per endpoint

---

## Development

### Running Locally

```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your API keys
npm start
```

Server runs on `http://localhost:3001`

### Testing Endpoints

```bash
# Health check
curl http://localhost:3001/api/health

# Generate AI response
curl -X POST http://localhost:3001/api/generate \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Write a hello world",
    "styleProfile": {
      "writing": {
        "tone": "casual",
        "formality": "informal"
      }
    }
  }'
```

### Environment Variables

See `backend/.env.example` for all configuration options.

**Required:**
- `GEMINI_API_KEY` - Google Gemini AI API key

**Optional (Gmail):**
- `GOOGLE_CLIENT_ID` - OAuth client ID
- `GOOGLE_CLIENT_SECRET` - OAuth client secret
- `GOOGLE_REDIRECT_URI` - OAuth callback URL
- `TOKEN_ENCRYPTION_KEY` - 32-byte hex key for token encryption

---

## Support

For issues or questions:
- GitHub Issues: [DigitalMe Repository](https://github.com/Nicoding1996/DigitalMe)
- Documentation: [Backend README](README.md)
- Gmail Setup: [GMAIL_SETUP_GUIDE.md](GMAIL_SETUP_GUIDE.md)
