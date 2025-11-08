const crypto = require('crypto');

/**
 * Analysis Session Service
 * 
 * Manages in-memory sessions for tracking Gmail analysis progress
 * 
 * Session lifecycle:
 * 1. Created when OAuth completes
 * 2. Updated during retrieval, cleansing, and analysis
 * 3. Automatically cleaned up after 1 hour or completion
 * 
 * SECURITY CONSIDERATIONS:
 * - Sessions stored in memory only (not persisted)
 * - Automatic TTL cleanup prevents memory leaks
 * - No sensitive data stored in sessions
 */

// In-memory storage for analysis sessions
// Map<sessionId, AnalysisSession>
const analysisSessions = new Map();

// Session TTL: 1 hour
const SESSION_TTL = 60 * 60 * 1000;

// Cleanup interval: 10 minutes
const CLEANUP_INTERVAL = 10 * 60 * 1000;

/**
 * AnalysisSession structure:
 * {
 *   sessionId: string,
 *   status: 'retrieving' | 'cleansing' | 'analyzing' | 'complete' | 'error',
 *   progress: {
 *     currentStep: number,
 *     totalSteps: number,
 *     message: string
 *   },
 *   stats: {
 *     emailsRetrieved: number,
 *     emailsFiltered: number,
 *     emailsAnalyzed: number,
 *     patternsExtracted: number
 *   },
 *   error: string | null,
 *   createdAt: Date,
 *   updatedAt: Date
 * }
 */

/**
 * Create a new analysis session
 * @param {string} sessionId - Unique session identifier
 * @returns {Object} Created session object
 */
function createSession(sessionId) {
  const session = {
    sessionId: sessionId,
    status: 'retrieving',
    progress: {
      currentStep: 1,
      totalSteps: 3,
      message: 'Retrieving sent emails from Gmail'
    },
    stats: {
      emailsRetrieved: 0,
      emailsFiltered: 0,
      emailsAnalyzed: 0,
      patternsExtracted: 0
    },
    error: null,
    createdAt: new Date(),
    updatedAt: new Date()
  };
  
  analysisSessions.set(sessionId, session);
  console.log(`Analysis session created: ${sessionId}`);
  
  return session;
}

/**
 * Get an existing analysis session
 * @param {string} sessionId - Session identifier
 * @returns {Object|null} Session object or null if not found
 */
function getSession(sessionId) {
  return analysisSessions.get(sessionId) || null;
}

/**
 * Update session progress
 * @param {string} sessionId - Session identifier
 * @param {Object} updates - Updates to apply
 * @param {string} updates.status - New status
 * @param {Object} updates.progress - Progress updates
 * @param {Object} updates.stats - Stats updates
 * @param {string} updates.error - Error message
 * @returns {Object|null} Updated session or null if not found
 */
function updateSession(sessionId, updates) {
  const session = analysisSessions.get(sessionId);
  
  if (!session) {
    console.error(`Session not found: ${sessionId}`);
    return null;
  }
  
  // Apply updates
  if (updates.status) {
    session.status = updates.status;
  }
  
  if (updates.progress) {
    session.progress = {
      ...session.progress,
      ...updates.progress
    };
  }
  
  if (updates.stats) {
    session.stats = {
      ...session.stats,
      ...updates.stats
    };
  }
  
  if (updates.error !== undefined) {
    session.error = updates.error;
  }
  
  session.updatedAt = new Date();
  
  console.log(`Session updated: ${sessionId} - Status: ${session.status}`);
  
  return session;
}

/**
 * Update session to retrieving status
 * @param {string} sessionId - Session identifier
 * @param {number} emailsRetrieved - Number of emails retrieved
 */
function updateRetrieving(sessionId, emailsRetrieved) {
  return updateSession(sessionId, {
    status: 'retrieving',
    progress: {
      currentStep: 1,
      totalSteps: 3,
      message: `Retrieving sent emails from Gmail (${emailsRetrieved} retrieved)`
    },
    stats: {
      emailsRetrieved: emailsRetrieved
    }
  });
}

/**
 * Update session to cleansing status
 * @param {string} sessionId - Session identifier
 * @param {number} emailsFiltered - Number of emails filtered out
 */
function updateCleansing(sessionId, emailsFiltered) {
  return updateSession(sessionId, {
    status: 'cleansing',
    progress: {
      currentStep: 2,
      totalSteps: 3,
      message: `Analyzing email content (${emailsFiltered} filtered)`
    },
    stats: {
      emailsFiltered: emailsFiltered
    }
  });
}

/**
 * Update session to analyzing status
 * @param {string} sessionId - Session identifier
 * @param {number} emailsAnalyzed - Number of emails being analyzed
 */
function updateAnalyzing(sessionId, emailsAnalyzed) {
  return updateSession(sessionId, {
    status: 'analyzing',
    progress: {
      currentStep: 3,
      totalSteps: 3,
      message: `Extracting writing patterns (${emailsAnalyzed} emails)`
    },
    stats: {
      emailsAnalyzed: emailsAnalyzed
    }
  });
}

/**
 * Update session to complete status
 * @param {string} sessionId - Session identifier
 * @param {number} patternsExtracted - Number of patterns extracted
 */
function updateComplete(sessionId, patternsExtracted) {
  return updateSession(sessionId, {
    status: 'complete',
    progress: {
      currentStep: 3,
      totalSteps: 3,
      message: 'Analysis complete'
    },
    stats: {
      patternsExtracted: patternsExtracted
    }
  });
}

/**
 * Update session to error status
 * @param {string} sessionId - Session identifier
 * @param {string} errorMessage - Error message
 */
function updateError(sessionId, errorMessage) {
  return updateSession(sessionId, {
    status: 'error',
    error: errorMessage
  });
}

/**
 * Delete a session
 * @param {string} sessionId - Session identifier
 * @returns {boolean} True if deleted, false if not found
 */
function deleteSession(sessionId) {
  const deleted = analysisSessions.delete(sessionId);
  
  if (deleted) {
    console.log(`Session deleted: ${sessionId}`);
  }
  
  return deleted;
}

/**
 * Clean up expired sessions
 * Removes sessions older than SESSION_TTL
 */
function cleanupExpiredSessions() {
  const now = Date.now();
  let cleanedCount = 0;
  
  for (const [sessionId, session] of analysisSessions.entries()) {
    const age = now - session.createdAt.getTime();
    
    if (age > SESSION_TTL) {
      analysisSessions.delete(sessionId);
      cleanedCount++;
    }
  }
  
  if (cleanedCount > 0) {
    console.log(`Cleaned up ${cleanedCount} expired analysis sessions`);
  }
}

/**
 * Get all active sessions (for debugging)
 * @returns {Array} Array of session objects
 */
function getAllSessions() {
  return Array.from(analysisSessions.values());
}

/**
 * Get session count (for monitoring)
 * @returns {number} Number of active sessions
 */
function getSessionCount() {
  return analysisSessions.size;
}

// Start automatic cleanup interval
const cleanupTimer = setInterval(cleanupExpiredSessions, CLEANUP_INTERVAL);

// Prevent cleanup timer from keeping process alive
cleanupTimer.unref();

console.log('Analysis Session Service initialized');

module.exports = {
  createSession,
  getSession,
  updateSession,
  updateRetrieving,
  updateCleansing,
  updateAnalyzing,
  updateComplete,
  updateError,
  deleteSession,
  cleanupExpiredSessions,
  getAllSessions,
  getSessionCount
};
