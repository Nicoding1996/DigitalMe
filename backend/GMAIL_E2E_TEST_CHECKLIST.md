# Gmail Integration End-to-End Testing Checklist

This document provides a comprehensive manual testing checklist for the Gmail integration feature.

## Prerequisites

Before starting testing, ensure:

- [ ] Backend `.env` file has valid Gmail OAuth credentials
- [ ] `GOOGLE_CLIENT_ID` is set
- [ ] `GOOGLE_CLIENT_SECRET` is set  
- [ ] `GOOGLE_REDIRECT_URI` is set to `http://localhost:3001/api/auth/gmail/callback`
- [ ] `TOKEN_ENCRYPTION_KEY` is a 64-character hex string
- [ ] `GEMINI_API_KEY` is set for style analysis
- [ ] Backend server is running on port 3001
- [ ] Frontend is running on port 3000
- [ ] You have a Gmail account with sent emails to test

## Test Scenarios

### 1. OAuth Flow - Happy Path ✓

**Requirement: 1.1**

**Steps:**
1. Open frontend at `http://localhost:3000`
2. Navigate to source connection interface
3. Click "Connect Gmail" button
4. Verify OAuth popup window opens
5. Verify Google consent screen displays
6. Verify requested permissions show "Read-only access to Gmail"
7. Click "Allow" to grant permission
8. Verify popup closes automatically
9. Verify frontend shows "Retrieving sent emails" status

**Expected Results:**
- OAuth popup opens without being blocked
- Google consent screen shows correct app name and permissions
- Only "gmail.readonly" scope is requested
- Popup closes after successful authorization
- Frontend transitions to "retrieving" status

**Actual Results:**
- [ ] Pass
- [ ] Fail (describe issue): _______________

---

### 2. OAuth Flow - User Denies Permission

**Requirement: 1.4**

**Steps:**
1. Click "Connect Gmail" button
2. In OAuth popup, click "Deny" or "Cancel"
3. Verify error message displays

**Expected Results:**
- Error message: "Permission denied. Gmail access is required to analyze your writing style."
- "Retry" button is available
- No partial data is stored

**Actual Results:**
- [ ] Pass
- [ ] Fail (describe issue): _______________

---

### 3. Email Retrieval - Standard Account

**Requirement: 2.1, 2.2, 2.5**

**Steps:**
1. Complete OAuth flow successfully
2. Wait for email retrieval to complete
3. Check browser console for retrieval logs
4. Verify progress updates display

**Expected Results:**
- Retrieval completes within 60 seconds
- Up to 200 emails are retrieved
- Progress message shows "Retrieving sent emails"
- No timeout errors occur

**Actual Results:**
- [ ] Pass
- [ ] Fail (describe issue): _______________
- Emails retrieved: _______________
- Time taken: _______________

---

### 4. Email Retrieval - Account with < 200 Emails

**Requirement: 2.4**

**Steps:**
1. Use a Gmail account with fewer than 200 sent emails
2. Complete OAuth flow
3. Verify all available emails are retrieved

**Expected Results:**
- All available emails are retrieved
- No errors about insufficient emails
- Analysis proceeds with available emails

**Actual Results:**
- [ ] Pass
- [ ] Fail (describe issue): _______________
- Emails retrieved: _______________

---

### 5. Email Cleansing - Automated Email Filtering

**Requirement: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7**

**Steps:**
1. Ensure test Gmail account has sent emails with subjects:
   - "Re: Meeting notes"
   - "Fwd: Document"
   - "Out of Office: Vacation"
   - "Accepted: Calendar invite"
2. Complete OAuth and retrieval
3. Check analysis stats for filtered count

**Expected Results:**
- Emails with automated subjects are filtered out
- Stats show number of filtered emails
- Only original emails are analyzed

**Actual Results:**
- [ ] Pass
- [ ] Fail (describe issue): _______________
- Filtered count: _______________

---

### 6. Email Cleansing - Quote and Signature Removal

**Requirement: 4.1, 4.2, 4.3, 4.4, 4.5**

**Steps:**
1. Ensure test account has emails with:
   - Quoted reply text ("> Previous message")
   - Email signatures ("Sent from my iPhone")
   - Closing phrases ("Best regards,")
2. Complete analysis
3. Verify only original content is analyzed

**Expected Results:**
- Quoted text is removed
- Signatures are removed
- Only user-authored content remains
- Word count reflects cleaned content

**Actual Results:**
- [ ] Pass
- [ ] Fail (describe issue): _______________

---

### 7. Content Quality Validation

**Requirement: 5.1, 5.2, 5.3, 5.4**

**Steps:**
1. Ensure test account has emails with:
   - Very short responses ("ok", "thanks")
   - Emails with only quoted content
   - Emails with substantial original content (20+ words)
2. Complete analysis
3. Check filtered vs analyzed counts

**Expected Results:**
- Emails with < 20 words are filtered
- Emails with only quotes/signatures are filtered
- Emails with substantial content are analyzed
- Stats accurately reflect filtering

**Actual Results:**
- [ ] Pass
- [ ] Fail (describe issue): _______________
- Analyzed count: _______________
- Filtered by content: _______________

---

### 8. Style Analysis Integration

**Requirement: 6.1, 6.2, 6.3**

**Steps:**
1. Complete full analysis flow
2. Verify style profile is updated
3. Check that Gmail source is added to profile
4. Verify pattern extraction completed

**Expected Results:**
- Style profile includes Gmail source
- Email count and word count are recorded
- Writing patterns are extracted
- Existing profile data is preserved

**Actual Results:**
- [ ] Pass
- [ ] Fail (describe issue): _______________
- Patterns extracted: _______________

---

### 9. Progress Tracking

**Requirement: 7.1, 7.2, 7.3, 7.4**

**Steps:**
1. Start OAuth flow
2. Monitor status messages throughout process
3. Verify each stage displays correct message

**Expected Results:**
- "Connecting to Gmail" during OAuth
- "Retrieving sent emails" during fetch
- "Analyzing email content" during analysis
- Success message with statistics on completion
- Progress updates every 2 seconds

**Actual Results:**
- [ ] Pass
- [ ] Fail (describe issue): _______________

---

### 10. Disconnect Functionality

**Requirement: 8.1, 8.2, 8.3, 8.4**

**Steps:**
1. Complete successful Gmail connection
2. Click "Disconnect Gmail" button
3. Verify token is revoked
4. Verify UI returns to initial state
5. Verify style profile data is retained

**Expected Results:**
- Disconnect completes successfully
- "Connect Gmail" button reappears
- OAuth tokens are revoked
- Previously analyzed data remains in profile
- No errors occur

**Actual Results:**
- [ ] Pass
- [ ] Fail (describe issue): _______________

---

### 11. Error Handling - Network Timeout

**Requirement: 2.5, 7.5**

**Steps:**
1. Simulate slow network (browser dev tools)
2. Start OAuth flow
3. Wait for timeout (60 seconds)

**Expected Results:**
- Timeout error displays after 60 seconds
- Error message: "Email retrieval timed out. Please check your connection and try again."
- Retry option is available
- No partial data is stored

**Actual Results:**
- [ ] Pass
- [ ] Fail (describe issue): _______________

---

### 12. Error Handling - Token Expiration

**Requirement: 1.4**

**Steps:**
1. Complete OAuth flow
2. Wait for token to expire (or manually revoke in Google account settings)
3. Attempt to retrieve emails

**Expected Results:**
- Error message indicates token expired
- User is prompted to reconnect
- No sensitive data in error message

**Actual Results:**
- [ ] Pass
- [ ] Fail (describe issue): _______________

---

### 13. Error Handling - Insufficient Permissions

**Requirement: 1.4**

**Steps:**
1. Modify OAuth scope to request different permissions
2. Attempt to retrieve emails

**Expected Results:**
- Error message indicates insufficient permissions
- User is prompted to grant correct permissions
- No system errors occur

**Actual Results:**
- [ ] Pass
- [ ] Fail (describe issue): _______________

---

### 14. Security - Token Encryption

**Requirement: 1.3**

**Steps:**
1. Complete OAuth flow
2. Check browser console and network tab
3. Verify tokens are never exposed

**Expected Results:**
- Access tokens never appear in console logs
- Tokens never appear in network responses
- Tokens are encrypted in backend memory
- No tokens in error messages

**Actual Results:**
- [ ] Pass
- [ ] Fail (describe issue): _______________

---

### 15. Security - CSRF Protection

**Requirement: 1.3, 1.4**

**Steps:**
1. Inspect OAuth URL
2. Verify state token is present
3. Attempt to replay callback with invalid state

**Expected Results:**
- State token is included in OAuth URL
- State token is validated on callback
- Invalid state tokens are rejected
- Error message for invalid state

**Actual Results:**
- [ ] Pass
- [ ] Fail (describe issue): _______________

---

### 16. Rate Limiting

**Requirement: 1.4**

**Steps:**
1. Attempt multiple OAuth initiations rapidly
2. Verify rate limiting kicks in

**Expected Results:**
- Rate limit: 5 requests per 15 minutes
- Error message when limit exceeded
- Rate limit resets after time window

**Actual Results:**
- [ ] Pass
- [ ] Fail (describe issue): _______________

---

### 17. Partial Success Handling

**Requirement: 7.5**

**Steps:**
1. Use account with mix of valid and invalid emails
2. Complete analysis
3. Verify partial success message

**Expected Results:**
- Analysis completes with valid emails
- Message indicates some emails were filtered
- Statistics show filtered vs analyzed counts
- User can see what was processed

**Actual Results:**
- [ ] Pass
- [ ] Fail (describe issue): _______________

---

### 18. Browser Compatibility

**Steps:**
1. Test OAuth flow in Chrome
2. Test OAuth flow in Firefox
3. Test OAuth flow in Safari
4. Test OAuth flow in Edge

**Expected Results:**
- OAuth popup works in all browsers
- No popup blocking issues
- Consistent behavior across browsers

**Actual Results:**
- Chrome: [ ] Pass [ ] Fail
- Firefox: [ ] Pass [ ] Fail
- Safari: [ ] Pass [ ] Fail
- Edge: [ ] Pass [ ] Fail

---

### 19. Popup Blocker Handling

**Steps:**
1. Enable popup blocker in browser
2. Click "Connect Gmail"
3. Verify error handling

**Expected Results:**
- Error message: "Popup blocked. Please allow popups for this site."
- Instructions to enable popups
- Retry option available

**Actual Results:**
- [ ] Pass
- [ ] Fail (describe issue): _______________

---

### 20. Session Cleanup

**Steps:**
1. Complete OAuth flow
2. Wait 1 hour
3. Verify session is cleaned up

**Expected Results:**
- Session expires after 1 hour
- Tokens are removed from memory
- Analysis session is deleted
- No memory leaks

**Actual Results:**
- [ ] Pass
- [ ] Fail (describe issue): _______________

---

## Test Summary

**Total Tests:** 20  
**Passed:** _______________  
**Failed:** _______________  
**Skipped:** _______________

**Critical Issues Found:**
1. _______________
2. _______________
3. _______________

**Non-Critical Issues Found:**
1. _______________
2. _______________
3. _______________

**Recommendations:**
1. _______________
2. _______________
3. _______________

**Tested By:** _______________  
**Date:** _______________  
**Environment:** Development / Staging / Production  
**Backend Version:** _______________  
**Frontend Version:** _______________

---

## Automated Test Results

Run automated tests with:
```bash
cd backend
npm test -- gmail-integration-e2e.test.js
```

**Test Output:**
```
[Paste test output here]
```

---

## Notes

Add any additional observations, edge cases discovered, or recommendations for improvement:

_______________
_______________
_______________
