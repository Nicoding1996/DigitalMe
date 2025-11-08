# Gmail Integration Error Handling

This document describes the comprehensive error handling and user feedback system implemented for the Gmail integration feature.

## Overview

The Gmail integration implements multi-layered error handling to ensure:
- User-friendly error messages without exposing sensitive data
- Clear guidance on how to resolve issues
- Retry functionality for recoverable errors
- Partial success messages when some emails fail processing
- Graceful degradation when services are unavailable

## Error Categories

### 1. OAuth Errors

**Permission Denied**
- **Trigger**: User denies Gmail access during OAuth flow
- **User Message**: "Gmail access was denied. Please grant permission to analyze your sent emails."
- **Action**: "Try connecting again and approve the permissions."
- **Retryable**: Yes

**Invalid Redirect**
- **Trigger**: Redirect URI configuration mismatch
- **User Message**: "Invalid redirect configuration. Please contact support."
- **Action**: None (requires admin intervention)
- **Retryable**: No

**State Token Mismatch**
- **Trigger**: CSRF token validation fails
- **User Message**: "Security validation failed. This may be due to an expired session."
- **Action**: "Please try connecting again."
- **Retryable**: Yes

**Expired State Token**
- **Trigger**: OAuth flow takes longer than 10 minutes
- **User Message**: "Your connection request has expired."
- **Action**: "Please start the connection process again."
- **Retryable**: Yes

**Token Exchange Failed**
- **Trigger**: Failed to exchange authorization code for access token
- **User Message**: "Failed to complete Gmail authentication."
- **Action**: "Please try connecting again."
- **Retryable**: Yes

### 2. Gmail API Errors

**Rate Limit (429)**
- **Trigger**: Gmail API quota exceeded
- **User Message**: "Gmail API rate limit reached. Please try again in a few minutes."
- **Action**: "Wait a few minutes and try again."
- **Retryable**: Yes (with backoff)
- **Backend Behavior**: Automatic exponential backoff (3 retries)

**Token Expired (401)**
- **Trigger**: Access token has expired
- **User Message**: "Your Gmail connection has expired."
- **Action**: "Please reconnect your Gmail account."
- **Retryable**: Yes (requires re-authentication)

**Insufficient Permissions (403)**
- **Trigger**: Token lacks required permissions
- **User Message**: "Insufficient permissions to access Gmail."
- **Action**: "Please reconnect and grant the required permissions."
- **Retryable**: Yes (requires re-authentication)

**Network Timeout**
- **Trigger**: Request to Gmail API times out (60 seconds)
- **User Message**: "Connection to Gmail timed out."
- **Action**: "Check your internet connection and try again."
- **Retryable**: Yes

**Generic API Error**
- **Trigger**: Other Gmail API errors
- **User Message**: "Failed to retrieve emails from Gmail."
- **Action**: "Please try again later."
- **Retryable**: Yes

### 3. Analysis Errors

**Insufficient Emails**
- **Trigger**: Fewer than 10 valid emails after cleansing
- **User Message**: "Not enough valid emails found for analysis. At least 10 emails with substantial content are required."
- **Action**: "Ensure you have sent emails with meaningful content."
- **Retryable**: No (requires more sent emails)

**Cleansing Failed**
- **Trigger**: Error during email content processing
- **User Message**: "Failed to process email content."
- **Action**: "Please try again."
- **Retryable**: Yes

**Style Extraction Failed**
- **Trigger**: Gemini API fails during pattern extraction
- **User Message**: "Failed to analyze writing patterns."
- **Action**: "Please try again later."
- **Retryable**: Yes

**Analysis Timeout**
- **Trigger**: Analysis takes longer than expected
- **User Message**: "Email analysis took too long and was cancelled."
- **Action**: "Please try again with a stable internet connection."
- **Retryable**: Yes

### 4. Configuration Errors

**Gmail Not Enabled**
- **Trigger**: Missing Gmail OAuth credentials in server config
- **User Message**: "Gmail integration is not configured on this server."
- **Action**: "Please contact the administrator."
- **Retryable**: No

**Invalid Credentials**
- **Trigger**: Malformed or invalid OAuth credentials
- **User Message**: "Gmail integration is misconfigured."
- **Action**: "Please contact the administrator."
- **Retryable**: No

## Partial Success Handling

When some emails fail cleansing but enough remain for analysis, the system provides contextual feedback:

### Success with Minor Filtering (< 10% filtered)
- **Message**: "Successfully analyzed X of Y emails. Z emails were filtered out due to quality checks."
- **UI**: Green success indicator

### Success with Moderate Filtering (10-30% filtered)
- **Message**: "Analyzed X of Y emails. Z emails could not be processed, but analysis completed successfully."
- **UI**: Cyan warning indicator

### Success with Heavy Filtering (> 30% filtered)
- **Message**: "Only X of Y emails could be analyzed. Many emails were filtered due to automated content or insufficient original text."
- **UI**: Cyan warning indicator

## Error Response Format

All error responses follow a consistent format:

```json
{
  "code": "error_code",
  "message": "User-friendly error message",
  "userAction": "Suggested action to resolve the issue",
  "canRetry": true,
  "context": "oauth|gmail_api|analysis|config"
}
```

## Frontend Error Display

The `GmailConnectButton` component displays errors with:
- Clear error message in red
- Suggested user action in muted text
- Retry button (if retryable)
- Dismiss button (if not retryable)

Example:
```
[CONNECTION_ERROR]
Gmail access was denied. Please grant permission to analyze your sent emails.
> Try connecting again and approve the permissions.
[> RETRY_CONNECTION]
```

## Security Considerations

### What is NEVER Exposed

- Access tokens or refresh tokens
- API keys or secrets
- Email content or subjects
- User email addresses
- Internal error stack traces
- System paths or configuration details

### What is Logged (Server-Side Only)

- Error type and context
- Session IDs (for correlation)
- Error codes and messages (sanitized)
- Timestamps

### Sanitization

The `GmailErrorHandler.sanitizeError()` method removes:
- Tokens (access_token, refresh_token)
- API keys
- Secrets
- Passwords
- Email addresses

## Retry Logic

### Automatic Retries (Backend)

Gmail API calls automatically retry with exponential backoff:
- **Max Retries**: 3
- **Base Delay**: 1 second
- **Backoff**: Exponential (1s, 2s, 4s)
- **Retryable Errors**: 429 (rate limit), 5xx (server errors), network timeouts

### Manual Retries (Frontend)

Users can manually retry:
- OAuth flow (after permission denial or timeout)
- Email retrieval (after network errors)
- Analysis (after transient failures)

Non-retryable errors:
- Permission denied (requires user to grant access)
- Configuration errors (requires admin intervention)
- Insufficient emails (requires more sent emails)

## Testing Error Scenarios

### OAuth Errors
```bash
# Test permission denial
# 1. Start OAuth flow
# 2. Click "Deny" on Google consent screen
# Expected: User-friendly error with retry option

# Test expired state token
# 1. Start OAuth flow
# 2. Wait 11 minutes before completing
# Expected: "Connection request has expired" error
```

### Gmail API Errors
```bash
# Test rate limiting
# 1. Make multiple rapid requests
# Expected: Automatic retry with backoff, then user-friendly error

# Test token expiration
# 1. Wait for token to expire (1 hour)
# 2. Try to use expired token
# Expected: "Gmail connection has expired" error
```

### Analysis Errors
```bash
# Test insufficient emails
# 1. Connect Gmail account with < 10 sent emails
# Expected: "Not enough valid emails" error

# Test heavy filtering
# 1. Connect Gmail with mostly automated emails
# Expected: Partial success message with warning
```

## Monitoring and Debugging

### Log Format

```
[Gmail Error - context]: {
  message: "sanitized error message",
  code: "error_code",
  context: "oauth|gmail_api|analysis|config"
}
```

### Key Metrics to Track

- OAuth success/failure rate
- Error types and frequency
- Retry success rate
- Average emails filtered per analysis
- Analysis completion time

## Future Enhancements

1. **Rate Limit Prediction**: Warn users before hitting rate limits
2. **Batch Retry**: Allow retrying specific failed emails
3. **Error Analytics**: Track error patterns for proactive fixes
4. **User Notifications**: Email users when analysis completes or fails
5. **Detailed Logs**: Optional verbose logging for debugging (admin only)
