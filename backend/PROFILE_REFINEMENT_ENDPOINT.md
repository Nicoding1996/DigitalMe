# Profile Refinement API Endpoint

## Overview

The Profile Refinement endpoint enables the Living Profile feature by allowing the frontend to send batches of user messages for incremental style profile updates.

## Endpoint Details

**URL:** `POST /api/profile/refine`

**Middleware:**
- Rate Limiting: Max 10 requests per hour per user
- Request Validation: Validates request structure and size limits
- Error Handling: Comprehensive error responses with proper status codes

## Request Format

```json
{
  "currentProfile": {
    "writing": {
      "tone": "conversational",
      "formality": "casual",
      "sentenceLength": "medium",
      "vocabulary": ["clear", "direct"],
      "avoidance": ["jargon"]
    },
    "coding": { ... },
    "confidence": 0.7,
    "sampleCount": {
      "textWords": 1000,
      "conversationWords": 0
    }
  },
  "newMessages": [
    "User message 1 with at least ten words...",
    "User message 2 with sufficient content..."
  ]
}
```

## Response Format

### Success Response (200)

```json
{
  "success": true,
  "updatedProfile": {
    "writing": { ... },
    "coding": { ... },
    "confidence": 0.72,
    "sampleCount": {
      "textWords": 1000,
      "conversationWords": 247
    },
    "attributeConfidence": {
      "tone": 0.85,
      "formality": 0.78,
      "sentenceLength": 0.82,
      "vocabulary": 0.75,
      "avoidance": 0.70
    },
    "learningMetadata": {
      "enabled": true,
      "lastRefinement": 1699564800000,
      "totalRefinements": 5,
      "wordsFromConversations": 247
    }
  },
  "deltaReport": {
    "changes": [
      {
        "attribute": "formality",
        "oldValue": "casual",
        "newValue": "balanced",
        "changePercent": 100
      }
    ],
    "wordsAnalyzed": 247,
    "confidenceChange": 0.02,
    "timestamp": 1699564800000
  }
}
```

### Error Responses

#### Validation Error (400)

```json
{
  "error": "validation_error",
  "message": "Missing required field: currentProfile"
}
```

#### Rate Limit Exceeded (429)

```json
{
  "code": "rate_limit_exceeded",
  "message": "Profile refinement rate limit exceeded. Maximum 10 refinements per hour.",
  "canRetry": true,
  "retryAfter": 3456,
  "userAction": "Please wait 3456 seconds before trying again"
}
```

#### Analysis Error (500)

```json
{
  "success": false,
  "error": "analysis_error",
  "message": "Failed to analyze messages and refine profile",
  "code": "ANALYSIS_ERROR"
}
```

#### Internal Error (500)

```json
{
  "success": false,
  "error": "internal_error",
  "message": "An unexpected error occurred during profile refinement",
  "code": "INTERNAL_ERROR"
}
```

## Validation Rules

### Request Body Validation

- `currentProfile` (required): Must be an object with a `writing` property
- `newMessages` (required): Must be a non-empty array of strings
- Maximum 50 messages per batch
- Maximum 5,000 characters per message
- Maximum 50,000 total characters across all messages

### Rate Limiting

- Maximum 10 refinement requests per hour per user
- Rate limit key: `currentProfile.userId` or client IP address
- Returns 429 status when limit exceeded

## Implementation Details

### Files Created/Modified

1. **backend/routes/profileRefine.js** (NEW)
   - Main route handler
   - Integrates ProfileRefinerService
   - Implements error handling and response validation

2. **backend/validation.js** (MODIFIED)
   - Added `validateProfileRefineRequest()` function
   - Added `validateProfileRefineMiddleware()` middleware
   - Comprehensive validation for all request fields

3. **backend/server.js** (MODIFIED)
   - Registered `/api/profile` route with profileRefine router
   - Endpoint available at `POST /api/profile/refine`

### Requirements Coverage

**Requirement 4.1:** ✅ POST endpoint at `/api/profile/refine` exposed  
**Requirement 4.2:** ✅ Request validation for `currentProfile` and `newMessages`  
**Requirement 4.3:** ✅ Returns 400 status on validation failure  
**Requirement 4.4:** ✅ Integrates ProfileRefinerService for analysis  
**Requirement 4.5:** ✅ Returns JSON with updatedProfile and deltaReport  
**Requirement 7.5:** ✅ Validates response structure before returning  

**Optional Subtask 2.1:** ✅ Rate limiting implemented (10 requests/hour)

## Testing

A test script is available at `backend/test-refine-endpoint.js` that validates:
- Valid request handling
- Missing field detection
- Empty array rejection
- Message count limits (max 50)
- Message length limits (max 5,000 per message)
- Total length limits (max 50,000 total)
- Invalid data type detection
- Profile structure validation

Run tests with:
```bash
node backend/test-refine-endpoint.js
```

## Security Considerations

- API keys never logged or exposed in responses
- Error messages sanitized to prevent information leakage
- Rate limiting prevents abuse
- Input validation prevents injection attacks
- Size limits prevent DoS attacks
- Tokens and sensitive data never included in logs

## Integration with Frontend

The frontend should:
1. Collect user messages in batches (10 messages or 5 minutes)
2. Send POST request to `/api/profile/refine`
3. Handle success: Update localStorage with `updatedProfile`
4. Handle errors: Retain current profile, show error notification
5. Implement retry logic for network failures (once after 2 seconds)
6. Display delta report to show user what changed

## Next Steps

Frontend implementation tasks:
- Task 3: Create Message Collector Service
- Task 4: Create Profile Refiner Client
- Task 5: Integrate into Mirror Interface
- Task 6: Add Learning Toggle to Settings
- Tasks 7-9: UI enhancements for feedback
