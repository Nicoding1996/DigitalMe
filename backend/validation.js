/**
 * Request validation module
 * Provides validation functions for API request payloads
 * 
 * SECURITY CONSIDERATIONS:
 * - All validation errors return generic messages without exposing system internals
 * - User input is validated before processing to prevent injection attacks
 * - Error messages do not reveal implementation details or sensitive information
 * - Maximum length limits prevent potential DoS attacks
 */

const MAX_PROMPT_LENGTH = 10000;

/**
 * Validates the request payload for the /api/generate endpoint
 * @param {Object} body - The request body to validate
 * @returns {Object} - { valid: boolean, error?: { error: string, message: string } }
 */
function validateGenerateRequest(body) {
  // Check if body exists
  if (!body || typeof body !== 'object') {
    return {
      valid: false,
      error: {
        error: 'validation_error',
        message: 'Request body must be a valid JSON object'
      }
    };
  }

  // Check for presence of prompt field
  if (!('prompt' in body)) {
    return {
      valid: false,
      error: {
        error: 'validation_error',
        message: 'Missing required field: prompt'
      }
    };
  }

  // Ensure prompt is a string
  if (typeof body.prompt !== 'string') {
    return {
      valid: false,
      error: {
        error: 'validation_error',
        message: 'Field "prompt" must be a string'
      }
    };
  }

  // Ensure prompt is non-empty
  if (body.prompt.trim().length === 0) {
    return {
      valid: false,
      error: {
        error: 'validation_error',
        message: 'Field "prompt" cannot be empty'
      }
    };
  }

  // Validate maximum prompt length
  if (body.prompt.length > MAX_PROMPT_LENGTH) {
    return {
      valid: false,
      error: {
        error: 'validation_error',
        message: `Field "prompt" exceeds maximum length of ${MAX_PROMPT_LENGTH} characters`
      }
    };
  }

  // Check for presence of styleProfile field
  if (!('styleProfile' in body)) {
    return {
      valid: false,
      error: {
        error: 'validation_error',
        message: 'Missing required field: styleProfile'
      }
    };
  }

  // Ensure styleProfile is an object
  if (typeof body.styleProfile !== 'object' || body.styleProfile === null) {
    return {
      valid: false,
      error: {
        error: 'validation_error',
        message: 'Field "styleProfile" must be an object'
      }
    };
  }

  // conversationHistory is optional, but if present must be an array
  if ('conversationHistory' in body) {
    if (!Array.isArray(body.conversationHistory)) {
      return {
        valid: false,
        error: {
          error: 'validation_error',
          message: 'Field "conversationHistory" must be an array'
        }
      };
    }

    // Validate each message in history
    for (let i = 0; i < body.conversationHistory.length; i++) {
      const msg = body.conversationHistory[i];
      
      if (!msg || typeof msg !== 'object') {
        return {
          valid: false,
          error: {
            error: 'validation_error',
            message: `Message at index ${i} must be an object`
          }
        };
      }

      if (!msg.role || (msg.role !== 'user' && msg.role !== 'model')) {
        return {
          valid: false,
          error: {
            error: 'validation_error',
            message: `Message at index ${i} must have role "user" or "model"`
          }
        };
      }

      if (!msg.content || typeof msg.content !== 'string') {
        return {
          valid: false,
          error: {
            error: 'validation_error',
            message: `Message at index ${i} must have string content`
          }
        };
      }
    }
  }

  return { valid: true };
}

/**
 * Express middleware for validating /api/generate requests
 * Returns 400 status with error details if validation fails
 */
function validateGenerateMiddleware(req, res, next) {
  const validation = validateGenerateRequest(req.body);
  
  if (!validation.valid) {
    return res.status(400).json(validation.error);
  }
  
  next();
}

/**
 * Validates the request payload for the /api/analyze-advanced endpoint
 * @param {Object} body - The request body to validate
 * @returns {Object} - { valid: boolean, error?: { error: string, message: string } }
 */
function validateAnalyzeAdvancedRequest(body) {
  // Check if body exists
  if (!body || typeof body !== 'object') {
    return {
      valid: false,
      error: {
        error: 'validation_error',
        message: 'Request body must be a valid JSON object'
      }
    };
  }

  // Check for presence of text field
  if (!('text' in body)) {
    return {
      valid: false,
      error: {
        error: 'validation_error',
        message: 'Missing required field: text'
      }
    };
  }

  // Ensure text is a string
  if (typeof body.text !== 'string') {
    return {
      valid: false,
      error: {
        error: 'validation_error',
        message: 'Field "text" must be a string'
      }
    };
  }

  // Ensure text is non-empty
  if (body.text.trim().length === 0) {
    return {
      valid: false,
      error: {
        error: 'validation_error',
        message: 'Field "text" cannot be empty'
      }
    };
  }

  // Validate maximum text length (50000 characters for analysis)
  if (body.text.length > 50000) {
    return {
      valid: false,
      error: {
        error: 'validation_error',
        message: 'Field "text" exceeds maximum length of 50000 characters'
      }
    };
  }

  // Options field is optional, but if present must be an object
  if ('options' in body && (typeof body.options !== 'object' || body.options === null)) {
    return {
      valid: false,
      error: {
        error: 'validation_error',
        message: 'Field "options" must be an object'
      }
    };
  }

  return { valid: true };
}

/**
 * Express middleware for validating /api/analyze-advanced requests
 * Returns 400 status with error details if validation fails
 */
function validateAnalyzeAdvancedMiddleware(req, res, next) {
  const validation = validateAnalyzeAdvancedRequest(req.body);
  
  if (!validation.valid) {
    return res.status(400).json(validation.error);
  }
  
  next();
}

/**
 * Validates the request payload for the /api/analyze-blog endpoint
 * @param {Object} body - The request body to validate
 * @returns {Object} - { valid: boolean, error?: { error: string, message: string } }
 */
function validateAnalyzeBlogRequest(body) {
  // Check if body exists
  if (!body || typeof body !== 'object') {
    return {
      valid: false,
      error: {
        error: 'validation_error',
        message: 'Request body must be a valid JSON object'
      }
    };
  }

  // Check for presence of urls field
  if (!('urls' in body)) {
    return {
      valid: false,
      error: {
        error: 'validation_error',
        message: 'Missing required field: urls'
      }
    };
  }

  // Ensure urls is an array
  if (!Array.isArray(body.urls)) {
    return {
      valid: false,
      error: {
        error: 'validation_error',
        message: 'Field "urls" must be an array'
      }
    };
  }

  // Ensure at least one URL
  if (body.urls.length === 0) {
    return {
      valid: false,
      error: {
        error: 'validation_error',
        message: 'At least one URL is required'
      }
    };
  }

  // Limit maximum URLs
  if (body.urls.length > 10) {
    return {
      valid: false,
      error: {
        error: 'validation_error',
        message: 'Maximum 10 URLs allowed'
      }
    };
  }

  // Validate each URL
  for (let i = 0; i < body.urls.length; i++) {
    const url = body.urls[i];
    
    if (typeof url !== 'string') {
      return {
        valid: false,
        error: {
          error: 'validation_error',
          message: `URL at index ${i} must be a string`
        }
      };
    }

    // Basic URL validation
    try {
      const urlObj = new URL(url);
      if (urlObj.protocol !== 'http:' && urlObj.protocol !== 'https:') {
        return {
          valid: false,
          error: {
            error: 'validation_error',
            message: `URL at index ${i} must use HTTP or HTTPS protocol`
          }
        };
      }
    } catch (error) {
      return {
        valid: false,
        error: {
          error: 'validation_error',
          message: `Invalid URL format at index ${i}`
        }
      };
    }
  }

  return { valid: true };
}

/**
 * Express middleware for validating /api/analyze-blog requests
 * Returns 400 status with error details if validation fails
 */
function validateAnalyzeBlogMiddleware(req, res, next) {
  const validation = validateAnalyzeBlogRequest(req.body);
  
  if (!validation.valid) {
    return res.status(400).json(validation.error);
  }
  
  next();
}

/**
 * Validates the request payload for the /api/analyze-github endpoint
 * @param {Object} body - The request body to validate
 * @returns {Object} - { valid: boolean, error?: { error: string, message: string } }
 */
function validateAnalyzeGitHubRequest(body) {
  // Check if body exists
  if (!body || typeof body !== 'object') {
    return {
      valid: false,
      error: {
        error: 'validation_error',
        message: 'Request body must be a valid JSON object'
      }
    };
  }

  // Check for presence of username field
  if (!('username' in body)) {
    return {
      valid: false,
      error: {
        error: 'validation_error',
        message: 'Missing required field: username'
      }
    };
  }

  // Ensure username is a string
  if (typeof body.username !== 'string') {
    return {
      valid: false,
      error: {
        error: 'validation_error',
        message: 'Field "username" must be a string'
      }
    };
  }

  // Ensure username is non-empty
  if (body.username.trim().length === 0) {
    return {
      valid: false,
      error: {
        error: 'validation_error',
        message: 'Field "username" cannot be empty'
      }
    };
  }

  // Validate GitHub username format
  // GitHub usernames: alphanumeric and hyphens, 1-39 characters, cannot start/end with hyphen
  const usernameRegex = /^[a-zA-Z0-9](?:[a-zA-Z0-9]|-(?=[a-zA-Z0-9])){0,38}$/;
  if (!usernameRegex.test(body.username.trim())) {
    return {
      valid: false,
      error: {
        error: 'validation_error',
        message: 'Invalid GitHub username format'
      }
    };
  }

  return { valid: true };
}

/**
 * Express middleware for validating /api/analyze-github requests
 * Returns 400 status with error details if validation fails
 */
function validateAnalyzeGitHubMiddleware(req, res, next) {
  const validation = validateAnalyzeGitHubRequest(req.body);
  
  if (!validation.valid) {
    return res.status(400).json(validation.error);
  }
  
  next();
}

/**
 * Validates the request payload for the /api/profile/refine endpoint
 * @param {Object} body - The request body to validate
 * @returns {Object} - { valid: boolean, error?: { error: string, message: string } }
 */
function validateProfileRefineRequest(body) {
  // Check if body exists
  if (!body || typeof body !== 'object') {
    return {
      valid: false,
      error: {
        error: 'validation_error',
        message: 'Request body must be a valid JSON object'
      }
    };
  }

  // Check for presence of currentProfile field
  if (!('currentProfile' in body)) {
    return {
      valid: false,
      error: {
        error: 'validation_error',
        message: 'Missing required field: currentProfile'
      }
    };
  }

  // Ensure currentProfile is an object
  if (typeof body.currentProfile !== 'object' || body.currentProfile === null) {
    return {
      valid: false,
      error: {
        error: 'validation_error',
        message: 'Field "currentProfile" must be an object'
      }
    };
  }

  // Validate currentProfile structure (must have writing section)
  if (!body.currentProfile.writing || typeof body.currentProfile.writing !== 'object') {
    return {
      valid: false,
      error: {
        error: 'validation_error',
        message: 'Field "currentProfile.writing" is required and must be an object'
      }
    };
  }

  // Check for presence of newMessages field
  if (!('newMessages' in body)) {
    return {
      valid: false,
      error: {
        error: 'validation_error',
        message: 'Missing required field: newMessages'
      }
    };
  }

  // Ensure newMessages is an array
  if (!Array.isArray(body.newMessages)) {
    return {
      valid: false,
      error: {
        error: 'validation_error',
        message: 'Field "newMessages" must be an array'
      }
    };
  }

  // Ensure at least one message
  if (body.newMessages.length === 0) {
    return {
      valid: false,
      error: {
        error: 'validation_error',
        message: 'Field "newMessages" must contain at least one message'
      }
    };
  }

  // Limit maximum messages per batch
  if (body.newMessages.length > 50) {
    return {
      valid: false,
      error: {
        error: 'validation_error',
        message: 'Maximum 50 messages allowed per refinement batch'
      }
    };
  }

  // Validate each message
  let totalLength = 0;
  for (let i = 0; i < body.newMessages.length; i++) {
    const message = body.newMessages[i];
    
    if (typeof message !== 'string') {
      return {
        valid: false,
        error: {
          error: 'validation_error',
          message: `Message at index ${i} must be a string`
        }
      };
    }

    // Validate individual message length
    if (message.length > 5000) {
      return {
        valid: false,
        error: {
          error: 'validation_error',
          message: `Message at index ${i} exceeds maximum length of 5000 characters`
        }
      };
    }

    totalLength += message.length;
  }

  // Validate total text length (prevent abuse)
  if (totalLength > 50000) {
    return {
      valid: false,
      error: {
        error: 'validation_error',
        message: 'Total message length exceeds maximum of 50000 characters'
      }
    };
  }

  return { valid: true };
}

/**
 * Express middleware for validating /api/profile/refine requests
 * Returns 400 status with error details if validation fails
 */
function validateProfileRefineMiddleware(req, res, next) {
  const validation = validateProfileRefineRequest(req.body);
  
  if (!validation.valid) {
    return res.status(400).json(validation.error);
  }
  
  next();
}

module.exports = {
  validateGenerateRequest,
  validateGenerateMiddleware,
  validateAnalyzeAdvancedRequest,
  validateAnalyzeAdvancedMiddleware,
  validateAnalyzeBlogRequest,
  validateAnalyzeBlogMiddleware,
  validateAnalyzeGitHubRequest,
  validateAnalyzeGitHubMiddleware,
  validateProfileRefineRequest,
  validateProfileRefineMiddleware,
  MAX_PROMPT_LENGTH
};
