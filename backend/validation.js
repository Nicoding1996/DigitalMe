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

module.exports = {
  validateGenerateRequest,
  validateGenerateMiddleware,
  validateAnalyzeAdvancedRequest,
  validateAnalyzeAdvancedMiddleware,
  validateAnalyzeBlogRequest,
  validateAnalyzeBlogMiddleware,
  MAX_PROMPT_LENGTH
};
