/**
 * Input Validation and Sanitization Middleware
 * 
 * Provides validation and sanitization for Gmail-related endpoints
 * to prevent injection attacks and ensure data integrity.
 * 
 * SECURITY CONSIDERATIONS:
 * - All user inputs are validated before processing
 * - String inputs are sanitized to prevent XSS and injection attacks
 * - URL validation prevents open redirect vulnerabilities
 * - Session IDs are validated to prevent enumeration attacks
 */

const crypto = require('crypto');

/**
 * Sanitize string input by removing potentially dangerous characters
 * @param {string} input - Input string to sanitize
 * @param {Object} options - Sanitization options
 * @returns {string} Sanitized string
 */
function sanitizeString(input, options = {}) {
  const {
    maxLength = 1000,
    allowedChars = /^[a-zA-Z0-9\s\-_.,!?@#$%&*()\[\]{}:;'"\/\\+=<>|~`]+$/,
    trim = true
  } = options;
  
  if (typeof input !== 'string') {
    return '';
  }
  
  let sanitized = input;
  
  // Trim whitespace if requested
  if (trim) {
    sanitized = sanitized.trim();
  }
  
  // Enforce maximum length
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }
  
  // Remove null bytes and control characters
  sanitized = sanitized.replace(/\0/g, '').replace(/[\x00-\x1F\x7F]/g, '');
  
  // Check against allowed characters pattern
  if (!allowedChars.test(sanitized)) {
    // Remove any characters not in the allowed set
    sanitized = sanitized.replace(/[^\w\s\-_.,!?@#$%&*()\[\]{}:;'"\/\\+=<>|~`]/g, '');
  }
  
  return sanitized;
}

/**
 * Validate and sanitize URL
 * @param {string} url - URL to validate
 * @param {Array<string>} allowedOrigins - List of allowed origin URLs
 * @returns {Object} { valid: boolean, sanitized: string, error: string }
 */
function validateUrl(url, allowedOrigins = []) {
  try {
    if (typeof url !== 'string' || !url) {
      return { valid: false, sanitized: '', error: 'URL must be a non-empty string' };
    }
    
    // Parse URL
    const parsedUrl = new URL(url);
    
    // Check protocol (only allow http and https)
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      return { valid: false, sanitized: '', error: 'Only HTTP and HTTPS protocols are allowed' };
    }
    
    // Check against allowed origins if provided
    if (allowedOrigins.length > 0) {
      const origin = `${parsedUrl.protocol}//${parsedUrl.host}`;
      const isAllowed = allowedOrigins.some(allowed => {
        // Exact match or subdomain match
        return origin === allowed || origin.endsWith('.' + allowed.replace(/^https?:\/\//, ''));
      });
      
      if (!isAllowed) {
        return { valid: false, sanitized: '', error: 'URL origin not in allowed list' };
      }
    }
    
    // Return sanitized URL (reconstructed from parsed components)
    return { 
      valid: true, 
      sanitized: parsedUrl.toString(),
      error: null 
    };
  } catch (error) {
    return { valid: false, sanitized: '', error: 'Invalid URL format' };
  }
}

/**
 * Validate session ID format
 * @param {string} sessionId - Session ID to validate
 * @returns {Object} { valid: boolean, error: string }
 */
function validateSessionId(sessionId) {
  if (typeof sessionId !== 'string' || !sessionId) {
    return { valid: false, error: 'Session ID must be a non-empty string' };
  }
  
  // Session IDs can be either:
  // 1. UUIDs (36 characters with hyphens) - legacy format
  // 2. 64-character hex strings - OAuth state token format (current)
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const hexTokenRegex = /^[0-9a-f]{64}$/i;
  
  if (!uuidRegex.test(sessionId) && !hexTokenRegex.test(sessionId)) {
    return { valid: false, error: 'Invalid session ID format' };
  }
  
  return { valid: true, error: null };
}

/**
 * Validate state token format
 * @param {string} state - State token to validate
 * @returns {Object} { valid: boolean, error: string }
 */
function validateStateToken(state) {
  if (typeof state !== 'string' || !state) {
    return { valid: false, error: 'State token must be a non-empty string' };
  }
  
  // State tokens should be 64 hex characters (32 bytes)
  const stateRegex = /^[0-9a-f]{64}$/i;
  
  if (!stateRegex.test(state)) {
    return { valid: false, error: 'Invalid state token format' };
  }
  
  return { valid: true, error: null };
}

/**
 * Middleware to validate Gmail initiate request
 */
function validateGmailInitiate(req, res, next) {
  const { redirectUri } = req.body;
  
  // Validate redirect URI
  if (!redirectUri) {
    return res.status(400).json({
      code: 'invalid_request',
      message: 'redirectUri is required',
      canRetry: false
    });
  }
  
  const config = require('../config');
  
  // Build list of allowed origins for redirect URI
  // The redirect URI must point to THIS backend server, not the frontend
  const allowedOrigins = [
    `http://localhost:${config.PORT}`,
    `https://localhost:${config.PORT}`
  ];
  
  // Add the configured redirect URI's origin if it exists
  if (config.GOOGLE_REDIRECT_URI) {
    try {
      const configuredUrl = new URL(config.GOOGLE_REDIRECT_URI);
      const configuredOrigin = `${configuredUrl.protocol}//${configuredUrl.host}`;
      if (!allowedOrigins.includes(configuredOrigin)) {
        allowedOrigins.push(configuredOrigin);
      }
    } catch (e) {
      // Ignore invalid configured URL
    }
  }
  
  const urlValidation = validateUrl(redirectUri, allowedOrigins);
  
  if (!urlValidation.valid) {
    return res.status(400).json({
      code: 'invalid_redirect_uri',
      message: urlValidation.error,
      canRetry: false
    });
  }
  
  // Replace with sanitized URL
  req.body.redirectUri = urlValidation.sanitized;
  
  next();
}

/**
 * Middleware to validate Gmail callback request
 */
function validateGmailCallback(req, res, next) {
  const { code, state } = req.query;
  
  // Validate authorization code
  if (!code || typeof code !== 'string') {
    return res.status(400).json({
      code: 'invalid_request',
      message: 'Authorization code is required',
      canRetry: true
    });
  }
  
  // Sanitize authorization code (should be alphanumeric with some special chars)
  const sanitizedCode = sanitizeString(code, {
    maxLength: 500,
    allowedChars: /^[a-zA-Z0-9\-_./=]+$/
  });
  
  if (!sanitizedCode || sanitizedCode.length < 10) {
    return res.status(400).json({
      code: 'invalid_authorization_code',
      message: 'Invalid authorization code format',
      canRetry: true
    });
  }
  
  // Validate state token
  const stateValidation = validateStateToken(state);
  if (!stateValidation.valid) {
    return res.status(400).json({
      code: 'invalid_state_token',
      message: stateValidation.error,
      canRetry: false
    });
  }
  
  // Replace with sanitized values
  req.query.code = sanitizedCode;
  
  next();
}

/**
 * Middleware to validate session ID in request
 */
function validateSessionIdMiddleware(paramName = 'sessionId', location = 'body') {
  return (req, res, next) => {
    const sessionId = location === 'params' 
      ? req.params[paramName]
      : req.body[paramName];
    
    if (!sessionId) {
      return res.status(400).json({
        code: 'invalid_request',
        message: `${paramName} is required`,
        canRetry: false
      });
    }
    
    const validation = validateSessionId(sessionId);
    if (!validation.valid) {
      return res.status(400).json({
        code: 'invalid_session_id',
        message: validation.error,
        canRetry: false
      });
    }
    
    next();
  };
}

/**
 * Middleware to sanitize style profile input
 */
function validateStyleProfile(req, res, next) {
  const { existingProfile } = req.body;
  
  // Style profile is optional
  if (!existingProfile) {
    return next();
  }
  
  // Validate it's an object
  if (typeof existingProfile !== 'object' || Array.isArray(existingProfile)) {
    return res.status(400).json({
      code: 'invalid_profile',
      message: 'existingProfile must be an object',
      canRetry: false
    });
  }
  
  // Basic structure validation (don't need to validate every field)
  const hasWriting = existingProfile.writing && typeof existingProfile.writing === 'object';
  const hasCoding = existingProfile.coding && typeof existingProfile.coding === 'object';
  
  if (!hasWriting || !hasCoding) {
    return res.status(400).json({
      code: 'invalid_profile',
      message: 'existingProfile must contain writing and coding objects',
      canRetry: false
    });
  }
  
  next();
}

module.exports = {
  sanitizeString,
  validateUrl,
  validateSessionId,
  validateStateToken,
  validateGmailInitiate,
  validateGmailCallback,
  validateSessionIdMiddleware,
  validateStyleProfile
};
