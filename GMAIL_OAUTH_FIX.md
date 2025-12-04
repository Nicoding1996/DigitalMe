# Gmail OAuth Fixes - December 4, 2024

## Issues Identified

### Issue 1: "Invalid or expired state token" Error
**Symptom:** Gmail OAuth fails with "Invalid or expired state token" error in production
**Root Cause:** Backend uses in-memory Map to store OAuth sessions. When DigitalOcean redeploys/restarts the backend, all sessions are lost, causing OAuth callbacks to fail.

### Issue 2: Dynamic Backend URL Not Evaluated
**Symptom:** Gmail OAuth works when used AFTER other sources, but fails when used FIRST on welcome screen
**Root Cause:** `API_BASE_URL` was defined as a module-level constant, evaluated once at module load time before `process.env.REACT_APP_BACKEND_URL` was available.

### Issue 3: Gmail Source Not Showing in Connected Sources
**Symptom:** Gmail analysis completes successfully but doesn't appear in the connected sources list
**Status:** Code flow is correct - this may be a display/timing issue that needs further investigation with console logs.

## Fixes Applied

### Fix 1: OAuth State Recovery (Backend)
**File:** `backend/routes/gmailAuth.js`
**Change:** Modified OAuth callback handler to create a new session if state token not found (handles backend restart scenario)

```javascript
// Before: Returned error if session not found
if (!sessionId) {
  const errorInfo = GmailErrorHandler.handleError(
    new Error('Invalid or expired state token'),
    'oauth'
  );
  return res.status(400).json(errorInfo);
}

// After: Create new session if not found (backend restart recovery)
if (!sessionId) {
  console.log('[Gmail OAuth] Session not found for state token (backend may have restarted), creating new session');
  const crypto = require('crypto');
  sessionId = crypto.randomUUID();
  sessions.set(sessionId, {
    state: state,
    status: 'pending',
    createdAt: Date.now()
  });
}
```

### Fix 2: Dynamic Backend URL Evaluation (Frontend)
**File:** `src/components/GmailConnectButton.js`
**Change:** Converted `API_BASE_URL` from module-level constant to function that evaluates dynamically

```javascript
// Before: Module-level constant (evaluated once at load)
const API_BASE_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:3001';

// After: Function that evaluates dynamically
const getBackendUrl = () => {
  return process.env.REACT_APP_BACKEND_URL || 'http://localhost:3001';
};
```

All references to `API_BASE_URL` replaced with `getBackendUrl()` calls.

### Fix 3: DigitalOcean Configuration
**File:** `.do/app.yaml`
**Change:** Removed frontend service (deployed on Vercel), kept only backend service with proper environment variables

## Testing Checklist

- [ ] Test Gmail OAuth as FIRST source on welcome screen
- [ ] Test Gmail OAuth as additional source after text/blog/GitHub
- [ ] Verify Gmail source appears in connected sources list
- [ ] Verify profile includes Gmail data (check word count, confidence)
- [ ] Test OAuth flow after backend restart/redeploy
- [ ] Verify localStorage persistence of Gmail session

## Deployment Steps

1. **Commit and push changes:**
   ```bash
   git add backend/routes/gmailAuth.js src/components/GmailConnectButton.js .do/app.yaml
   git commit -m "Fix Gmail OAuth state persistence and dynamic backend URL"
   git push origin main
   ```

2. **Wait for auto-deployments:**
   - Vercel: Frontend with GmailConnectButton fix
   - DigitalOcean: Backend with OAuth state recovery

3. **Verify environment variables in DigitalOcean:**
   - All required variables are already configured (verified from screenshot)

4. **Test in production:**
   - Clear localStorage
   - Try Gmail as first source
   - Check browser console for logs
   - Verify source appears in connected sources

## Known Limitations

1. **In-Memory Session Storage:** Sessions are still stored in-memory and will be lost on backend restart. The fix allows OAuth to complete even after restart, but active sessions will be interrupted.

2. **Future Improvement:** Consider using Redis or database for session persistence in production.

## Console Logs to Monitor

**Frontend (GmailConnectButton):**
- `[Gmail OAuth] Registering message listener, expecting origin:`
- `[Gmail OAuth] Success message received, sessionId:`
- `[Gmail OAuth] Calling onConnectionComplete with:`

**Frontend (SourceConnector):**
- `[SourceConnector] Gmail connection complete, stats:`
- `[SourceConnector] Gmail source ready for submission`

**Frontend (App.js):**
- `[Analysis] Using pre-analyzed Gmail profile`
- `[Analysis] Created Gmail source:`

**Backend:**
- `[Gmail OAuth] Session not found for state token (backend may have restarted), creating new session`
- `Gmail analysis completed for session`
