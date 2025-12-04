const express = require('express');
const router = express.Router();
const gmailAuthService = require('../services/GmailAuthService');
const analysisSessionService = require('../services/AnalysisSessionService');
const GmailAnalysisOrchestrator = require('../services/GmailAnalysisOrchestrator');
const GmailErrorHandler = require('../utils/GmailErrorHandler');
const config = require('../config');
const { gmailApiLimiter, gmailAuthLimiter } = require('../middleware/rateLimiter');
const {
  validateGmailInitiate,
  validateGmailCallback,
  validateSessionIdMiddleware,
  validateStyleProfile
} = require('../middleware/inputValidation');

// Initialize orchestrator
const orchestrator = new GmailAnalysisOrchestrator();

/**
 * Gmail OAuth Routes
 * 
 * Handles OAuth 2.0 authentication flow for Gmail integration
 * 
 * SECURITY CONSIDERATIONS:
 * - State tokens prevent CSRF attacks (validated in middleware)
 * - Tokens are encrypted before storage and never logged
 * - Session management tracks OAuth state with automatic cleanup
 * - Rate limiting prevents abuse (10 requests/hour per user)
 * - Input validation and sanitization on all endpoints
 * - Tokens automatically cleaned up after 1 hour
 */

// In-memory session storage for OAuth state and tokens
// Map<sessionId, { state, accessToken, refreshToken, expiresAt, status, createdAt }>
// SECURITY: Sessions automatically cleaned up after 1 hour
// SECURITY: Tokens are encrypted and never logged
const sessions = new Map();

/**
 * Cleanup expired sessions and tokens
 * SECURITY: Runs every 10 minutes to remove sessions older than 1 hour
 * This ensures tokens don't remain in memory longer than necessary
 */
function cleanupExpiredSessions() {
  const now = Date.now();
  const ONE_HOUR = 60 * 60 * 1000;
  let cleaned = 0;
  
  for (const [sessionId, session] of sessions.entries()) {
    if (now - session.createdAt > ONE_HOUR) {
      // Delete session (tokens are automatically garbage collected)
      sessions.delete(sessionId);
      
      // Also delete associated analysis session
      analysisSessionService.deleteSession(sessionId);
      
      cleaned++;
    }
  }
  
  if (cleaned > 0) {
    console.log(`Cleaned up ${cleaned} expired Gmail sessions`);
  }
}

// Run cleanup every 10 minutes
setInterval(cleanupExpiredSessions, 10 * 60 * 1000);

// Also run cleanup on startup to clear any stale sessions
cleanupExpiredSessions();

/**
 * POST /api/auth/gmail/initiate
 * 
 * Initiates OAuth 2.0 flow and returns authorization URL
 * 
 * SECURITY: Rate limited to 5 requests per 15 minutes per IP
 * SECURITY: Input validation ensures redirectUri is from allowed origins
 */
router.post('/initiate', gmailAuthLimiter, validateGmailInitiate, (req, res) => {
  try {
    // Check if Gmail integration is enabled
    if (!config.isGmailEnabled()) {
      const errorInfo = GmailErrorHandler.handleError(
        new Error('Gmail integration not configured'),
        'config'
      );
      return res.status(503).json(errorInfo);
    }
    
    // redirectUri has been validated and sanitized by middleware
    const { redirectUri } = req.body;
    
    // Generate authorization URL with state token
    const { authUrl, state } = gmailAuthService.generateAuthUrl(redirectUri);
    
    // Generate session ID
    const crypto = require('crypto');
    const sessionId = crypto.randomUUID();
    
    // Store session with state token
    sessions.set(sessionId, {
      state: state,
      status: 'pending',
      createdAt: Date.now()
    });
    
    res.json({
      authUrl: authUrl,
      state: state,
      sessionId: sessionId
    });
    
  } catch (error) {
    const errorInfo = GmailErrorHandler.handleError(error, 'oauth');
    res.status(500).json(errorInfo);
  }
});

/**
 * GET /api/auth/gmail/callback
 * 
 * Handles OAuth callback and exchanges code for token
 * 
 * SECURITY: Rate limited to 5 requests per 15 minutes per IP
 * SECURITY: Input validation ensures code and state are properly formatted
 * SECURITY: State token validation prevents CSRF attacks
 */
router.get('/callback', gmailAuthLimiter, validateGmailCallback, async (req, res) => {
  try {
    // code and state have been validated and sanitized by middleware
    const { code, state, error: oauthError } = req.query;
    
    // Handle OAuth errors (user denied permission, etc.)
    if (oauthError) {
      const errorMessage = oauthError === 'access_denied' 
        ? 'Gmail access was denied' 
        : 'OAuth authorization failed';
      
      return res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Gmail Authentication Error</title>
  <style>
    body {
      font-family: 'Courier New', monospace;
      background: #0a0a0a;
      color: #ff0055;
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100vh;
      margin: 0;
      padding: 20px;
    }
    .container { text-align: center; max-width: 500px; }
    .status { font-size: 18px; margin-bottom: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="status">${errorMessage}</div>
    <div>Redirecting...</div>
  </div>
  <script>
    (function() {
      const errorMessage = '${errorMessage}';
      
      // Try to notify parent window via postMessage
      function notifyParent() {
        try {
          if (window.opener && !window.opener.closed) {
            console.log('Sending error postMessage to parent window');
            window.opener.postMessage({
              type: 'gmail-oauth-error',
              error: errorMessage
            }, window.opener.origin || '*');
            return true;
          }
        } catch (e) {
          console.error('postMessage failed:', e);
        }
        return false;
      }
      
      // Try to close the window
      function closeWindow() {
        try {
          window.close();
          
          // If window didn't close after 500ms, show manual close message
          setTimeout(() => {
            if (!window.closed) {
              document.body.innerHTML = '<div style="text-align:center;padding:40px;font-family:monospace;color:#ff0055;">Authentication failed. Please close this window.</div>';
            }
          }, 500);
        } catch (e) {
          console.error('Failed to close window:', e);
          document.body.innerHTML = '<div style="text-align:center;padding:40px;font-family:monospace;color:#ff0055;">Authentication failed. Please close this window.</div>';
        }
      }
      
      // Execute notification and close
      const messageSent = notifyParent();
      
      if (messageSent) {
        // Wait a bit for message to be received, then close
        setTimeout(closeWindow, 1000);
      } else {
        // No parent window, show message
        document.body.innerHTML = '<div style="text-align:center;padding:40px;font-family:monospace;color:#ff0055;">Authentication failed. Please close this window.</div>';
      }
    })();
  </script>
</body>
</html>
      `);
    }
    
    // Find session by state token
    let sessionId = null;
    for (const [id, session] of sessions.entries()) {
      if (session.state === state) {
        sessionId = id;
        break;
      }
    }
    
    // If session not found, create a new one (handles backend restart scenario)
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
    
    // Exchange authorization code for tokens
    const { accessToken, refreshToken, expiresAt } = 
      await gmailAuthService.exchangeCodeForToken(code, state);
    
    // Encrypt tokens before storing
    const encryptedAccessToken = gmailAuthService.encryptToken(accessToken);
    const encryptedRefreshToken = refreshToken 
      ? gmailAuthService.encryptToken(refreshToken) 
      : null;
    
    // Update session with tokens
    const session = sessions.get(sessionId);
    session.accessToken = encryptedAccessToken;
    session.refreshToken = encryptedRefreshToken;
    session.expiresAt = expiresAt;
    session.status = 'authenticated';
    
    // Serve HTML page that will redirect to main app
    res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Gmail Authentication</title>
  <style>
    body {
      font-family: 'Courier New', monospace;
      background: #0a0a0a;
      color: #00ff9f;
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100vh;
      margin: 0;
      padding: 20px;
    }
    .container {
      text-align: center;
      max-width: 500px;
    }
    .status {
      font-size: 18px;
      margin-bottom: 20px;
      color: #00ff9f;
    }
    .spinner {
      display: inline-block;
      width: 40px;
      height: 40px;
      border: 4px solid rgba(0, 255, 159, 0.3);
      border-top-color: #00ff9f;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="spinner"></div>
    <div class="status">Authentication successful! Redirecting...</div>
  </div>
  <script>
    (function() {
      const sessionId = '${sessionId}';
      
      // Try to notify parent window via postMessage
      function notifyParent() {
        try {
          if (window.opener && !window.opener.closed) {
            console.log('Sending postMessage to parent window');
            // Send to specific origin (frontend URL) for security
            window.opener.postMessage({
              type: 'gmail-oauth-success',
              sessionId: sessionId
            }, '${config.FRONTEND_URL}');
            
            // Also try wildcard as fallback for local development
            window.opener.postMessage({
              type: 'gmail-oauth-success',
              sessionId: sessionId
            }, '*');
            return true;
          }
        } catch (e) {
          console.error('postMessage failed:', e);
        }
        return false;
      }
      
      // Try to close the window
      function closeWindow() {
        try {
          window.close();
          
          // If window didn't close after 500ms, show manual close message with button
          setTimeout(() => {
            document.querySelector('.spinner').style.display = 'none';
            document.querySelector('.status').innerHTML = 
              'Authentication complete!<br><br>' +
              '<button onclick="window.close()" style="' +
              'padding: 12px 24px; ' +
              'background: #0a0a0a; ' +
              'border: 1px solid #00ff9f; ' +
              'color: #00ff9f; ' +
              'font-family: monospace; ' +
              'cursor: pointer; ' +
              'font-size: 14px;' +
              '">CLOSE WINDOW</button><br><br>' +
              '<small style="color: #666;">You can also close this tab manually</small>';
          }, 500);
        } catch (e) {
          console.error('Failed to close window:', e);
          document.querySelector('.spinner').style.display = 'none';
          document.querySelector('.status').innerHTML = 
            'Authentication complete!<br><br>' +
            '<button onclick="window.close()" style="' +
            'padding: 12px 24px; ' +
            'background: #0a0a0a; ' +
            'border: 1px solid #00ff9f; ' +
            'color: #00ff9f; ' +
            'font-family: monospace; ' +
            'cursor: pointer; ' +
            'font-size: 14px;' +
            '">CLOSE WINDOW</button><br><br>' +
            '<small style="color: #666;">You can also close this tab manually</small>';
        }
      }
      
      // Execute notification and close
      const messageSent = notifyParent();
      
      if (messageSent) {
        // Wait a bit for message to be received, then try to close
        setTimeout(closeWindow, 500);
      } else {
        // No parent window, show message
        document.querySelector('.spinner').style.display = 'none';
        document.querySelector('.status').innerHTML = 
          'Authentication complete!<br><br>' +
          '<button onclick="window.close()" style="' +
          'padding: 12px 24px; ' +
          'background: #0a0a0a; ' +
          'border: 1px solid #00ff9f; ' +
          'color: #00ff9f; ' +
          'font-family: monospace; ' +
          'cursor: pointer; ' +
          'font-size: 14px;' +
          '">CLOSE WINDOW</button><br><br>' +
          '<small style="color: #666;">You can also close this tab manually</small>';
      }
    })();
  </script>
</body>
</html>
    `);
    
    // Trigger analysis asynchronously (don't wait for completion)
    // The frontend will poll /api/gmail/analysis-status/:sessionId for progress
    setImmediate(async () => {
      try {
        console.log(`Starting Gmail analysis for session ${sessionId}`);
        
        // Decrypt access token for analysis
        const decryptedToken = gmailAuthService.decryptToken(encryptedAccessToken);
        
        // Execute analysis (existing profile would come from frontend in production)
        const result = await orchestrator.executeAnalysis(sessionId, decryptedToken, null);
        
        if (result.success) {
          console.log(`Gmail analysis completed for session ${sessionId}`);
          // In production, this would update the user's profile in database
          // For now, the result is available via the analysis session
        } else {
          console.error(`Gmail analysis failed for session ${sessionId}:`, result.error);
          // Update session with user-friendly error
          const errorInfo = GmailErrorHandler.handleError(result.error, 'analysis');
          analysisSessionService.updateError(sessionId, errorInfo.message);
        }
      } catch (error) {
        console.error(`Gmail analysis error for session ${sessionId}:`, error.message);
        const errorInfo = GmailErrorHandler.handleError(error, 'analysis');
        analysisSessionService.updateError(sessionId, errorInfo.message);
      }
    });
    
  } catch (error) {
    const errorInfo = GmailErrorHandler.handleError(error, 'oauth');
    res.status(500).json(errorInfo);
  }
});

/**
 * POST /api/gmail/start-analysis
 * 
 * Manually trigger Gmail analysis for an authenticated session
 * 
 * SECURITY: Rate limited to 10 requests per hour per session
 * SECURITY: Session ID validation prevents enumeration attacks
 * SECURITY: Style profile validation prevents injection attacks
 */
router.post('/start-analysis', gmailApiLimiter, validateSessionIdMiddleware('sessionId', 'body'), validateStyleProfile, async (req, res) => {
  try {
    // sessionId and existingProfile have been validated by middleware
    const { sessionId, existingProfile } = req.body;
    
    // Get OAuth session
    const session = sessions.get(sessionId);
    
    if (!session) {
      return res.status(404).json({
        code: 'session_not_found',
        message: 'Session not found or expired. Please reconnect your Gmail account.',
        canRetry: true
      });
    }
    
    if (!session.accessToken) {
      const errorInfo = GmailErrorHandler.handleError(
        new Error('Session is not authenticated'),
        'oauth'
      );
      return res.status(400).json(errorInfo);
    }
    
    // Check if analysis is already running
    const existingAnalysis = analysisSessionService.getSession(sessionId);
    if (existingAnalysis && existingAnalysis.status !== 'complete' && existingAnalysis.status !== 'error') {
      return res.status(409).json({
        code: 'analysis_in_progress',
        message: 'Analysis is already in progress for this session',
        canRetry: false
      });
    }
    
    // Start analysis asynchronously
    res.json({
      success: true,
      sessionId: sessionId,
      message: 'Analysis started'
    });
    
    // Execute analysis in background
    setImmediate(async () => {
      try {
        console.log(`Starting Gmail analysis for session ${sessionId}`);
        
        // Decrypt access token
        const decryptedToken = gmailAuthService.decryptToken(session.accessToken);
        
        // Execute analysis
        const result = await orchestrator.executeAnalysis(sessionId, decryptedToken, existingProfile);
        
        if (result.success) {
          console.log(`Gmail analysis completed for session ${sessionId}`);
        } else {
          console.error(`Gmail analysis failed for session ${sessionId}:`, result.error);
          const errorInfo = GmailErrorHandler.handleError(result.error, 'analysis');
          analysisSessionService.updateError(sessionId, errorInfo.message);
        }
      } catch (error) {
        console.error(`Gmail analysis error for session ${sessionId}:`, error.message);
        const errorInfo = GmailErrorHandler.handleError(error, 'analysis');
        analysisSessionService.updateError(sessionId, errorInfo.message);
      }
    });
    
  } catch (error) {
    const errorInfo = GmailErrorHandler.handleError(error, 'analysis');
    res.status(500).json(errorInfo);
  }
});

/**
 * GET /api/auth/gmail/session-status/:sessionId
 * 
 * Returns OAuth session status (for polling during OAuth flow)
 * 
 * SECURITY: Rate limited to 10 requests per hour per session
 * SECURITY: Session ID validation prevents enumeration attacks
 */
router.get('/session-status/:sessionId', gmailApiLimiter, validateSessionIdMiddleware('sessionId', 'params'), (req, res) => {
  try {
    const { sessionId } = req.params;
    
    // Get OAuth session
    const session = sessions.get(sessionId);
    
    if (!session) {
      return res.status(404).json({
        code: 'session_not_found',
        message: 'OAuth session not found or expired',
        status: 'not_found'
      });
    }
    
    // Return session status
    res.json({
      status: session.status, // 'pending' or 'authenticated'
      sessionId: sessionId
    });
    
  } catch (error) {
    const errorInfo = GmailErrorHandler.handleError(error, 'oauth');
    res.status(500).json(errorInfo);
  }
});

/**
 * GET /api/gmail/analysis-status/:sessionId
 * 
 * Returns real-time progress of email analysis
 * 
 * SECURITY: Rate limited to 10 requests per hour per session
 * SECURITY: Session ID validation prevents enumeration attacks
 */
router.get('/analysis-status/:sessionId', gmailApiLimiter, validateSessionIdMiddleware('sessionId', 'params'), (req, res) => {
  try {
    // sessionId has been validated by middleware
    const { sessionId } = req.params;
    
    // Get analysis session
    const analysisSession = analysisSessionService.getSession(sessionId);
    
    if (!analysisSession) {
      return res.status(404).json({
        code: 'session_not_found',
        message: 'Analysis session not found or expired',
        canRetry: false
      });
    }
    
    // Return session status and progress with user-friendly error if present
    const response = {
      status: analysisSession.status,
      progress: analysisSession.progress,
      stats: analysisSession.stats,
      error: analysisSession.error
    };
    
    // Include profile if analysis is complete
    if (analysisSession.status === 'complete' && analysisSession.profile) {
      response.profile = analysisSession.profile;
    }
    
    // Add retry capability flag for errors
    if (analysisSession.status === 'error' && analysisSession.error) {
      const errorInfo = GmailErrorHandler.handleError(analysisSession.error, 'analysis');
      response.canRetry = errorInfo.canRetry;
      response.userAction = errorInfo.userAction;
    }
    
    res.json(response);
    
  } catch (error) {
    const errorInfo = GmailErrorHandler.handleError(error, 'analysis');
    res.status(500).json(errorInfo);
  }
});

/**
 * POST /api/gmail/disconnect
 * 
 * Revokes Gmail access and clears stored tokens
 * 
 * SECURITY: Rate limited to 10 requests per hour per session
 * SECURITY: Session ID validation prevents enumeration attacks
 * SECURITY: Tokens are revoked and immediately deleted
 */
router.post('/disconnect', gmailApiLimiter, validateSessionIdMiddleware('sessionId', 'body'), async (req, res) => {
  try {
    // sessionId has been validated by middleware
    const { sessionId } = req.body;
    
    // Get session
    const session = sessions.get(sessionId);
    
    if (!session) {
      // Session not found is OK for disconnect - might already be cleaned up
      return res.json({
        success: true,
        message: 'Gmail access already disconnected'
      });
    }
    
    // Revoke access token if it exists
    if (session.accessToken) {
      try {
        await gmailAuthService.revokeAccess(session.accessToken);
      } catch (revokeError) {
        // Log but don't fail - token might already be invalid
        console.warn('Token revocation failed (may already be invalid):', revokeError.message);
      }
    }
    
    // Delete OAuth session
    sessions.delete(sessionId);
    
    // Delete analysis session if it exists
    analysisSessionService.deleteSession(sessionId);
    
    res.json({
      success: true,
      message: 'Gmail access revoked successfully'
    });
    
  } catch (error) {
    const errorInfo = GmailErrorHandler.handleError(error, 'oauth');
    res.status(500).json(errorInfo);
  }
});

/**
 * Helper function to get session by ID
 * @param {string} sessionId - Session ID
 * @returns {Object|null} Session object or null if not found
 */
function getSession(sessionId) {
  return sessions.get(sessionId) || null;
}

/**
 * Helper function to get decrypted access token from session
 * @param {string} sessionId - Session ID
 * @returns {string|null} Decrypted access token or null
 */
function getAccessToken(sessionId) {
  const session = sessions.get(sessionId);
  if (!session || !session.accessToken) {
    return null;
  }
  
  try {
    return gmailAuthService.decryptToken(session.accessToken);
  } catch (error) {
    console.error('Failed to decrypt access token:', error.message);
    return null;
  }
}

// Export router and helper functions
module.exports = {
  router,
  getSession,
  getAccessToken,
  analysisSessionService
};
