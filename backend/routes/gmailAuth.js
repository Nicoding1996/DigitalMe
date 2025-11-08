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
      const errorInfo = GmailErrorHandler.handleError(
        new Error(oauthError === 'access_denied' ? 'access_denied' : 'OAuth authorization failed'),
        'oauth'
      );
      return res.status(400).json(errorInfo);
    }
    
    // Find session by state token
    let sessionId = null;
    for (const [id, session] of sessions.entries()) {
      if (session.state === state) {
        sessionId = id;
        break;
      }
    }
    
    if (!sessionId) {
      const errorInfo = GmailErrorHandler.handleError(
        new Error('Invalid or expired state token'),
        'oauth'
      );
      return res.status(400).json(errorInfo);
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
    
    // Return success response with session ID
    res.json({
      success: true,
      sessionId: sessionId,
      message: 'Gmail authentication successful'
    });
    
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
