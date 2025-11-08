# Gmail Integration Security Documentation

This document outlines the security measures implemented for the Gmail integration feature.

## Security Measures Overview

### 1. CSRF Protection

**Implementation:** State token validation in OAuth callback

- **Location:** `backend/services/GmailAuthService.js`
- **Mechanism:** 
  - Cryptographically secure state tokens (32 bytes, 64 hex characters)
  - State tokens stored with 10-minute expiration
  - One-time use tokens (deleted after validation)
  - Automatic cleanup of expired tokens every 5 minutes

**Validation:**
```javascript
// State token generated during OAuth initiation
const state = crypto.randomBytes(32).toString('hex');

// State token validated during callback
if (!stateData || tokenAge > TEN_MINUTES) {
  throw new Error('Invalid or expired state token');
}
```

### 2. Rate Limiting

**Implementation:** Request rate limiting for Gmail API endpoints

- **Location:** `backend/middleware/rateLimiter.js`
- **Limits:**
  - Gmail API endpoints: 10 requests per hour per session
  - OAuth endpoints: 5 requests per 15 minutes per IP
- **Mechanism:**
  - In-memory tracking with automatic cleanup
  - Rate limit headers in responses (X-RateLimit-*)
  - User-friendly error messages with retry timing

**Protected Endpoints:**
- `POST /api/auth/gmail/initiate` - 5 req/15min per IP
- `GET /api/auth/gmail/callback` - 5 req/15min per IP
- `POST /api/gmail/start-analysis` - 10 req/hour per session
- `GET /api/gmail/analysis-status/:sessionId` - 10 req/hour per session
- `POST /api/gmail/disconnect` - 10 req/hour per session

### 3. Input Validation and Sanitization

**Implementation:** Comprehensive input validation middleware

- **Location:** `backend/middleware/inputValidation.js`
- **Validations:**
  - Redirect URI validation against whitelist
  - Session ID format validation (UUID v4)
  - State token format validation (64 hex chars)
  - Authorization code sanitization
  - Style profile structure validation

**Security Features:**
- URL validation prevents open redirect vulnerabilities
- Session ID validation prevents enumeration attacks
- String sanitization removes control characters and null bytes
- Maximum length enforcement prevents buffer overflow attacks

### 4. Token Security

**Implementation:** Tokens are never logged or exposed

- **Encryption:** AES-256-GCM encryption for all tokens at rest
- **Storage:** In-memory only, never persisted to disk
- **Logging:** Error messages sanitized to never include tokens
- **Transmission:** HTTPS only, tokens never in URL parameters

**Token Lifecycle:**
```
1. Token received from Google OAuth
2. Immediately encrypted with AES-256-GCM
3. Stored in memory (encrypted)
4. Decrypted only when needed for API calls
5. Automatically deleted after 1 hour
6. Revoked on disconnect
```

**Audit Points:**
- `backend/services/GmailAuthService.js` - Token encryption/decryption
- `backend/routes/gmailAuth.js` - Token storage and cleanup
- `backend/utils/securityAudit.js` - Token redaction utilities

### 5. Automatic Token Cleanup

**Implementation:** Automatic cleanup after 1 hour

- **Location:** `backend/routes/gmailAuth.js`
- **Mechanism:**
  - Sessions tracked with creation timestamp
  - Cleanup runs every 10 minutes
  - Sessions older than 1 hour are deleted
  - Associated analysis sessions also cleaned up
  - Cleanup runs on server startup

**Cleanup Function:**
```javascript
function cleanupExpiredSessions() {
  const ONE_HOUR = 60 * 60 * 1000;
  for (const [sessionId, session] of sessions.entries()) {
    if (now - session.createdAt > ONE_HOUR) {
      sessions.delete(sessionId);
      analysisSessionService.deleteSession(sessionId);
    }
  }
}
```

## Security Best Practices

### For Developers

1. **Never log tokens:**
   ```javascript
   // ❌ WRONG
   console.log('Token:', accessToken);
   
   // ✅ CORRECT
   console.log('Token received successfully');
   ```

2. **Always use safe logging:**
   ```javascript
   const { safeLog, safeError } = require('./utils/securityAudit');
   
   safeLog('Session data:', sessionData); // Automatically redacts tokens
   safeError('Error occurred:', error); // Sanitizes error messages
   ```

3. **Validate all inputs:**
   ```javascript
   // Use validation middleware
   router.post('/endpoint', validateSessionIdMiddleware('sessionId', 'body'), handler);
   ```

4. **Check response safety:**
   ```javascript
   const { validateResponseSafety } = require('./utils/securityAudit');
   
   if (!validateResponseSafety(response)) {
     throw new Error('Response contains sensitive data');
   }
   ```

### For Deployment

1. **Environment Variables:**
   - Use strong encryption keys (32 bytes minimum)
   - Rotate keys periodically
   - Never commit keys to version control

2. **HTTPS Only:**
   - Always use HTTPS in production
   - Set secure cookie flags
   - Enable HSTS headers

3. **Monitoring:**
   - Monitor rate limit violations
   - Alert on authentication failures
   - Track token cleanup operations

4. **Logging:**
   - Use structured logging
   - Never log sensitive data
   - Implement log rotation

## Security Testing

### Manual Testing Checklist

- [ ] CSRF protection: Try replaying old state tokens
- [ ] Rate limiting: Exceed rate limits and verify 429 responses
- [ ] Input validation: Send malformed inputs to all endpoints
- [ ] Token exposure: Check all logs for token leakage
- [ ] Session cleanup: Verify sessions are deleted after 1 hour
- [ ] Token revocation: Verify tokens are revoked on disconnect

### Automated Testing

Run security tests:
```bash
npm test -- --grep "security"
```

### Security Audit

Use the security audit utility:
```javascript
const { validateResponseSafety, redactSensitiveData } = require('./utils/securityAudit');

// Validate response before sending
if (!validateResponseSafety(response)) {
  console.error('SECURITY VIOLATION: Response contains sensitive data');
}

// Redact data before logging
const safeData = redactSensitiveData(data);
console.log('Data:', safeData);
```

## Incident Response

### If Token Exposure Suspected

1. **Immediate Actions:**
   - Revoke all active tokens
   - Clear all sessions
   - Rotate encryption keys
   - Review logs for unauthorized access

2. **Investigation:**
   - Identify exposure vector
   - Determine scope of exposure
   - Check for unauthorized API usage

3. **Remediation:**
   - Fix vulnerability
   - Deploy patch
   - Notify affected users if necessary
   - Update security documentation

### Reporting Security Issues

If you discover a security vulnerability:

1. **Do NOT** create a public GitHub issue
2. Email security concerns to: [security contact]
3. Include detailed description and reproduction steps
4. Allow time for patch before public disclosure

## Compliance

### Data Protection

- **Minimal Permissions:** Only read-only access to Sent folder
- **Data Retention:** Raw email content never stored permanently
- **User Control:** Users can disconnect and revoke access anytime
- **Transparency:** Clear messaging about what data is accessed

### OAuth 2.0 Compliance

- Follows Google OAuth 2.0 best practices
- Implements PKCE flow where applicable
- Proper token refresh handling
- Secure token storage

## Security Audit Log

| Date | Auditor | Findings | Status |
|------|---------|----------|--------|
| 2024-01-XX | Initial Implementation | Security measures implemented | ✅ Complete |

## References

- [Google OAuth 2.0 Security Best Practices](https://developers.google.com/identity/protocols/oauth2/security-best-practices)
- [OWASP API Security Top 10](https://owasp.org/www-project-api-security/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
