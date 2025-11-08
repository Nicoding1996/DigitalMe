# Gmail API Rate Limiting Strategy

This document describes the rate limiting implementation for the Gmail integration feature, including quota management, error handling, and best practices.

## Overview

The Gmail API has strict quota limits to prevent abuse and ensure fair usage across all applications. Our implementation includes multiple layers of rate limiting to stay within these quotas while providing a smooth user experience.

---

## Gmail API Quotas

### Official Quota Limits

Google provides the following default quotas for the Gmail API:

| Quota Type | Limit | Time Window |
|------------|-------|-------------|
| **Daily quota** | 1,000,000,000 quota units | Per day |
| **Per-user quota** | 250 quota units | Per 100 seconds |
| **Per-project quota** | 25,000 quota units | Per 100 seconds |

### Quota Unit Costs

Different API operations consume different amounts of quota:

| Operation | Method | Approximate Cost |
|-----------|--------|------------------|
| List messages | `users.messages.list` | 5 units |
| Get message | `users.messages.get` | 5 units |
| Batch request (50 messages) | `batch.users.messages.get` | ~250 units |
| Send message | `users.messages.send` | 100 units |
| Modify message | `users.messages.modify` | 5 units |

**Note**: We only use `list` and `get` operations for the Gmail integration.

---

## DigitalMe Usage Patterns

### Typical User Analysis

For a standard user connecting their Gmail account:

1. **Initial list request**: 1 × 5 units = **5 units**
2. **Fetch 200 emails in batches of 50**: 4 × 50 units = **200 units**
3. **Total per user analysis**: **~205 units**

### Capacity Calculations

**Per-user quota (250 units per 100 seconds):**
- 1 user analysis = 205 units
- Maximum: 1 analysis per 100 seconds per user
- Practical limit: 1 analysis per 2 minutes per user

**Per-project quota (25,000 units per 100 seconds):**
- 25,000 ÷ 205 = ~122 concurrent user analyses per 100 seconds
- Practical limit: ~70 analyses per minute (with safety margin)

**Daily quota (1 billion units per day):**
- 1,000,000,000 ÷ 205 = ~4.8 million user analyses per day
- Practical limit: ~4 million analyses per day (with safety margin)

---

## Implementation Strategy

### 1. Application-Level Rate Limiting

**Location**: `backend/middleware/rateLimiter.js`

**Per-User Limits:**
```javascript
{
  windowMs: 60 * 60 * 1000,  // 1 hour
  max: 10,                    // 10 requests per hour per user
  message: 'Too many Gmail analysis requests. Please try again later.'
}
```

**Rationale:**
- Prevents individual users from exhausting quotas
- Allows 10 analyses per hour (well within per-user quota)
- Protects against accidental or malicious repeated requests

**Per-IP Limits:**
```javascript
{
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 100,                   // 100 requests per 15 minutes per IP
  message: 'Too many requests from this IP. Please try again later.'
}
```

**Rationale:**
- Prevents DDoS attacks
- Allows multiple users from same network (e.g., office)
- Protects backend infrastructure

### 2. Gmail API Client Configuration

**Location**: `backend/services/GmailRetrievalService.js`

**Batch Processing:**
```javascript
const BATCH_SIZE = 50;  // Emails per batch request
const MAX_EMAILS = 200; // Total emails to retrieve
```

**Benefits:**
- Reduces total API calls from 200 to 4
- Minimizes quota consumption
- Faster retrieval (parallel processing)

**Pagination:**
```javascript
async fetchSentEmails(accessToken, maxResults = 200) {
  const messages = [];
  let pageToken = null;
  
  do {
    const response = await gmail.users.messages.list({
      userId: 'me',
      q: 'in:sent',
      maxResults: Math.min(50, maxResults - messages.length),
      pageToken: pageToken
    });
    
    messages.push(...response.data.messages);
    pageToken = response.data.nextPageToken;
    
  } while (pageToken && messages.length < maxResults);
  
  return messages;
}
```

**Benefits:**
- Handles large Sent folders efficiently
- Respects maxResults limit
- Gracefully handles pagination

### 3. Exponential Backoff

**Location**: `backend/services/GmailRetrievalService.js`

**Implementation:**
```javascript
async fetchWithRetry(operation, maxRetries = 3) {
  let lastError;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      
      // Check if error is rate limit (429)
      if (error.code === 429) {
        const delay = Math.pow(2, attempt) * 1000; // 1s, 2s, 4s
        console.log(`Rate limit hit. Retrying in ${delay}ms...`);
        await this._sleep(delay);
        continue;
      }
      
      // Check if error is quota exceeded (403)
      if (error.code === 403 && error.message.includes('quota')) {
        throw new Error('Gmail API quota exceeded. Please try again later.');
      }
      
      // For other errors, don't retry
      throw error;
    }
  }
  
  throw lastError;
}

_sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
```

**Retry Schedule:**
- Attempt 1: Immediate
- Attempt 2: Wait 1 second
- Attempt 3: Wait 2 seconds
- Attempt 4: Wait 4 seconds

**Benefits:**
- Automatically recovers from temporary rate limits
- Exponential delays prevent thundering herd
- Gives quota time to reset (100-second window)

### 4. Session Management

**Location**: `backend/services/GmailAuthService.js`

**Session Timeout:**
```javascript
const SESSION_TTL = 60 * 60 * 1000; // 1 hour

class AnalysisSession {
  constructor(sessionId) {
    this.sessionId = sessionId;
    this.createdAt = new Date();
    this.expiresAt = new Date(Date.now() + SESSION_TTL);
    // ... other properties
  }
  
  isExpired() {
    return Date.now() > this.expiresAt.getTime();
  }
}
```

**Automatic Cleanup:**
```javascript
// Clean up expired sessions every 10 minutes
setInterval(() => {
  for (const [sessionId, session] of analysisSessions.entries()) {
    if (session.isExpired()) {
      analysisSessions.delete(sessionId);
      console.log(`Cleaned up expired session: ${sessionId}`);
    }
  }
}, 10 * 60 * 1000);
```

**Benefits:**
- Prevents memory leaks
- Clears stale OAuth tokens
- Enforces analysis time limits

---

## Error Handling

### Rate Limit Errors (429)

**Scenario**: Too many requests in short time window

**Response:**
```json
{
  "error": "Rate limit exceeded",
  "message": "Too many Gmail API requests. Please try again in a few minutes.",
  "retryAfter": 120,
  "code": "RATE_LIMIT_EXCEEDED"
}
```

**User Experience:**
- Display friendly error message
- Show countdown timer for retry
- Automatically retry after delay (if user stays on page)

### Quota Exceeded Errors (403)

**Scenario**: Daily or per-user quota exhausted

**Response:**
```json
{
  "error": "Quota exceeded",
  "message": "Gmail API quota limit reached. Please try again tomorrow.",
  "code": "QUOTA_EXCEEDED"
}
```

**User Experience:**
- Display clear error message
- Suggest trying again later
- Provide alternative: manual text input

### Token Expiration (401)

**Scenario**: OAuth token expired or revoked

**Response:**
```json
{
  "error": "Authentication failed",
  "message": "Gmail access token expired. Please reconnect your account.",
  "code": "TOKEN_EXPIRED"
}
```

**User Experience:**
- Prompt user to reconnect Gmail
- Clear stored session
- Restart OAuth flow

---

## Monitoring and Alerts

### Metrics to Track

**Application Metrics:**
```javascript
{
  "gmail_analyses_total": 1234,           // Total analyses performed
  "gmail_analyses_success": 1200,         // Successful analyses
  "gmail_analyses_failed": 34,            // Failed analyses
  "gmail_rate_limit_hits": 5,             // Times rate limit was hit
  "gmail_quota_exceeded": 0,              // Times quota was exceeded
  "gmail_avg_emails_analyzed": 187,       // Average emails per analysis
  "gmail_avg_processing_time_ms": 45000   // Average processing time
}
```

**Gmail API Metrics:**
```javascript
{
  "gmail_api_calls_total": 4936,          // Total API calls
  "gmail_api_quota_used": 24680,          // Quota units consumed
  "gmail_api_quota_remaining": 975320,    // Quota units remaining
  "gmail_api_errors_429": 5,              // Rate limit errors
  "gmail_api_errors_403": 0,              // Quota exceeded errors
  "gmail_api_errors_401": 2               // Auth errors
}
```

### Logging

**Success Log:**
```javascript
logger.info('Gmail analysis completed', {
  sessionId: 'abc123',
  emailsRetrieved: 200,
  emailsAnalyzed: 187,
  quotaUsed: 205,
  processingTimeMs: 43500
});
```

**Rate Limit Log:**
```javascript
logger.warn('Gmail API rate limit hit', {
  sessionId: 'abc123',
  attempt: 2,
  retryAfterMs: 2000,
  quotaUsed: 205
});
```

**Quota Exceeded Log:**
```javascript
logger.error('Gmail API quota exceeded', {
  sessionId: 'abc123',
  quotaUsed: 25000,
  quotaLimit: 25000,
  timeWindow: '100 seconds'
});
```

### Alerts

**Set up alerts for:**

1. **High rate limit hit rate**
   - Threshold: >10 rate limit errors per hour
   - Action: Investigate usage patterns, consider increasing delays

2. **Quota approaching limit**
   - Threshold: >80% of daily quota used
   - Action: Notify admins, consider temporary restrictions

3. **High failure rate**
   - Threshold: >5% of analyses failing
   - Action: Check Gmail API status, review error logs

---

## Best Practices

### For Developers

1. **Always use batch requests** when fetching multiple emails
2. **Implement exponential backoff** for all Gmail API calls
3. **Cache results** when possible (within session)
4. **Monitor quota usage** regularly
5. **Test with rate limiting** enabled in development
6. **Handle all error codes** gracefully (401, 403, 429, 500)
7. **Never retry immediately** after rate limit error
8. **Log quota consumption** for each operation

### For Users

1. **Limit analyses** to once per day per account
2. **Use smaller email counts** if experiencing issues (e.g., 100 instead of 200)
3. **Avoid peak hours** if possible (business hours in US timezones)
4. **Wait between retries** if analysis fails
5. **Disconnect and reconnect** if experiencing persistent issues

### For Production

1. **Set up monitoring** for quota usage and error rates
2. **Configure alerts** for quota thresholds
3. **Implement circuit breakers** to prevent cascading failures
4. **Use separate credentials** for development and production
5. **Request quota increase** from Google if needed (for high-traffic apps)
6. **Implement graceful degradation** (e.g., analyze fewer emails if quota low)
7. **Cache analysis results** to avoid re-analyzing same emails

---

## Quota Increase Requests

If your application exceeds the default quotas, you can request an increase from Google.

### When to Request

- Consistently hitting daily quota limit
- Planning to scale to >1000 users
- Need to support enterprise customers with high usage

### How to Request

1. Navigate to [Google Cloud Console](https://console.cloud.google.com)
2. Go to **"IAM & Admin" > "Quotas"**
3. Filter for **"Gmail API"**
4. Select the quota you want to increase
5. Click **"Edit Quotas"**
6. Fill out the request form:
   - Explain your use case
   - Provide usage estimates
   - Describe your rate limiting strategy
   - Show how you handle errors
7. Submit and wait for Google's review (typically 2-5 business days)

### Typical Approval Criteria

- Clear business justification
- Demonstrated responsible API usage
- Proper error handling and rate limiting
- Compliance with Google's API Terms of Service
- No history of quota abuse

---

## Testing Rate Limiting

### Local Testing

**Simulate rate limit errors:**
```javascript
// In GmailRetrievalService.js (for testing only)
async fetchSentEmails(accessToken, maxResults = 200) {
  if (process.env.SIMULATE_RATE_LIMIT === 'true') {
    throw { code: 429, message: 'Rate limit exceeded' };
  }
  // ... normal implementation
}
```

**Test exponential backoff:**
```bash
# Set environment variable
export SIMULATE_RATE_LIMIT=true

# Run analysis
npm start

# Observe retry behavior in logs
```

### Load Testing

**Simulate multiple concurrent users:**
```javascript
// test/load/gmail-load-test.js
const axios = require('axios');

async function simulateUsers(count) {
  const promises = [];
  
  for (let i = 0; i < count; i++) {
    promises.push(
      axios.post('http://localhost:3001/api/auth/gmail/initiate', {
        redirectUri: 'http://localhost:3000/callback'
      })
    );
  }
  
  const results = await Promise.allSettled(promises);
  
  const successful = results.filter(r => r.status === 'fulfilled').length;
  const failed = results.filter(r => r.status === 'rejected').length;
  
  console.log(`Successful: ${successful}, Failed: ${failed}`);
}

// Test with 100 concurrent users
simulateUsers(100);
```

---

## Troubleshooting

### Issue: Frequent 429 Errors

**Possible Causes:**
- Too many concurrent analyses
- Batch size too large
- Insufficient delays between requests

**Solutions:**
- Reduce `GMAIL_BATCH_SIZE` (e.g., from 50 to 25)
- Increase delays in exponential backoff
- Implement queue system for concurrent requests
- Add jitter to retry delays

### Issue: Quota Exceeded Before End of Day

**Possible Causes:**
- High user volume
- Users running multiple analyses
- Other applications using same credentials

**Solutions:**
- Implement stricter per-user limits
- Reduce `GMAIL_MAX_EMAILS` (e.g., from 200 to 100)
- Request quota increase from Google
- Use separate credentials per environment

### Issue: Slow Analysis Performance

**Possible Causes:**
- Small batch sizes
- Sequential processing
- Network latency

**Solutions:**
- Increase `GMAIL_BATCH_SIZE` (up to 100)
- Implement parallel batch processing
- Use connection pooling
- Cache intermediate results

---

## Additional Resources

- [Gmail API Quotas Documentation](https://developers.google.com/gmail/api/reference/quota)
- [Google API Rate Limiting Best Practices](https://cloud.google.com/apis/design/design_patterns#rate_limiting)
- [OAuth 2.0 Token Management](https://developers.google.com/identity/protocols/oauth2)
- [Exponential Backoff Algorithm](https://cloud.google.com/iot/docs/how-tos/exponential-backoff)

---

## Summary

The Gmail integration implements a comprehensive rate limiting strategy that:

1. ✅ Respects Gmail API quota limits
2. ✅ Provides smooth user experience
3. ✅ Handles errors gracefully
4. ✅ Scales to support multiple concurrent users
5. ✅ Monitors and logs quota usage
6. ✅ Implements exponential backoff for retries
7. ✅ Protects against abuse and quota exhaustion

By following these guidelines, the application can reliably analyze user emails while staying well within Gmail API quotas.
