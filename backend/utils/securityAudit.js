/**
 * Security Audit Utilities
 * 
 * Provides utilities to ensure sensitive data is never logged or exposed
 * in error messages, responses, or logs.
 * 
 * SECURITY CONSIDERATIONS:
 * - Sanitizes error messages before logging
 * - Redacts sensitive data from objects
 * - Validates that tokens are never exposed
 */

/**
 * List of sensitive field names that should never be logged
 */
const SENSITIVE_FIELDS = [
  'accessToken',
  'access_token',
  'refreshToken',
  'refresh_token',
  'token',
  'password',
  'secret',
  'apiKey',
  'api_key',
  'clientSecret',
  'client_secret',
  'encryptedToken',
  'encrypted_token',
  'authorization',
  'cookie',
  'session'
];

/**
 * Redact sensitive fields from an object
 * @param {Object} obj - Object to redact
 * @param {Array<string>} additionalFields - Additional field names to redact
 * @returns {Object} Redacted copy of the object
 */
function redactSensitiveData(obj, additionalFields = []) {
  if (!obj || typeof obj !== 'object') {
    return obj;
  }
  
  const sensitiveFields = [...SENSITIVE_FIELDS, ...additionalFields];
  const redacted = Array.isArray(obj) ? [] : {};
  
  for (const [key, value] of Object.entries(obj)) {
    // Check if field name is sensitive (case-insensitive)
    const isSensitive = sensitiveFields.some(
      field => key.toLowerCase().includes(field.toLowerCase())
    );
    
    if (isSensitive) {
      redacted[key] = '[REDACTED]';
    } else if (value && typeof value === 'object') {
      // Recursively redact nested objects
      redacted[key] = redactSensitiveData(value, additionalFields);
    } else {
      redacted[key] = value;
    }
  }
  
  return redacted;
}

/**
 * Sanitize error message to remove sensitive data
 * @param {Error|string} error - Error object or message
 * @returns {string} Sanitized error message
 */
function sanitizeErrorMessage(error) {
  let message = error instanceof Error ? error.message : String(error);
  
  // Remove anything that looks like a token (long alphanumeric strings)
  message = message.replace(/[a-zA-Z0-9_-]{32,}/g, '[REDACTED_TOKEN]');
  
  // Remove anything that looks like an API key
  message = message.replace(/AIza[a-zA-Z0-9_-]{35}/g, '[REDACTED_API_KEY]');
  
  // Remove email addresses
  message = message.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[REDACTED_EMAIL]');
  
  // Remove URLs with credentials
  message = message.replace(/https?:\/\/[^:]+:[^@]+@/g, 'https://[REDACTED]@');
  
  return message;
}

/**
 * Safe console.log that redacts sensitive data
 * @param {string} message - Log message
 * @param {Object} data - Optional data object to log
 */
function safeLog(message, data = null) {
  if (data) {
    const redacted = redactSensitiveData(data);
    console.log(message, redacted);
  } else {
    console.log(message);
  }
}

/**
 * Safe console.error that redacts sensitive data
 * @param {string} message - Error message
 * @param {Error|Object} error - Error object or data
 */
function safeError(message, error = null) {
  if (error instanceof Error) {
    const sanitized = sanitizeErrorMessage(error.message);
    console.error(message, sanitized);
  } else if (error) {
    const redacted = redactSensitiveData(error);
    console.error(message, redacted);
  } else {
    console.error(message);
  }
}

/**
 * Validate that a response object doesn't contain sensitive data
 * @param {Object} response - Response object to validate
 * @returns {boolean} True if response is safe, false if it contains sensitive data
 */
function validateResponseSafety(response) {
  if (!response || typeof response !== 'object') {
    return true;
  }
  
  const responseStr = JSON.stringify(response).toLowerCase();
  
  // Check for sensitive field names
  for (const field of SENSITIVE_FIELDS) {
    if (responseStr.includes(field.toLowerCase())) {
      console.error(`SECURITY WARNING: Response contains sensitive field: ${field}`);
      return false;
    }
  }
  
  // Check for patterns that look like tokens
  if (/[a-zA-Z0-9_-]{64,}/.test(responseStr)) {
    console.error('SECURITY WARNING: Response may contain token-like data');
    return false;
  }
  
  return true;
}

/**
 * Create a safe error response that never exposes sensitive data
 * @param {Error} error - Original error
 * @param {string} userMessage - User-friendly message
 * @param {string} code - Error code
 * @returns {Object} Safe error response
 */
function createSafeErrorResponse(error, userMessage, code = 'error') {
  // Never include the original error message in the response
  // Only log it server-side with sanitization
  safeError('Error occurred:', error);
  
  return {
    code: code,
    message: userMessage,
    canRetry: true
  };
}

module.exports = {
  redactSensitiveData,
  sanitizeErrorMessage,
  safeLog,
  safeError,
  validateResponseSafety,
  createSafeErrorResponse,
  SENSITIVE_FIELDS
};
