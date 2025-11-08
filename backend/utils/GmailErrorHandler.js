/**
 * Gmail Error Handler Utility
 * 
 * Provides centralized error handling for Gmail integration
 * Ensures user-friendly error messages without exposing sensitive data
 * 
 * Requirements: 1.4, 7.5
 */

class GmailErrorHandler {
  /**
   * Error types and their user-friendly messages
   */
  static ERROR_TYPES = {
    // OAuth errors
    OAUTH_PERMISSION_DENIED: {
      code: 'oauth_permission_denied',
      message: 'Gmail access was denied. Please grant permission to analyze your sent emails.',
      userAction: 'Try connecting again and approve the permissions.'
    },
    OAUTH_INVALID_REDIRECT: {
      code: 'oauth_invalid_redirect',
      message: 'Invalid redirect configuration. Please contact support.',
      userAction: null
    },
    OAUTH_STATE_MISMATCH: {
      code: 'oauth_state_mismatch',
      message: 'Security validation failed. This may be due to an expired session.',
      userAction: 'Please try connecting again.'
    },
    OAUTH_EXPIRED_STATE: {
      code: 'oauth_expired_state',
      message: 'Your connection request has expired.',
      userAction: 'Please start the connection process again.'
    },
    OAUTH_TOKEN_EXCHANGE_FAILED: {
      code: 'oauth_token_exchange_failed',
      message: 'Failed to complete Gmail authentication.',
      userAction: 'Please try connecting again.'
    },
    
    // Gmail API errors
    GMAIL_RATE_LIMIT: {
      code: 'gmail_rate_limit',
      message: 'Gmail API rate limit reached. Please try again in a few minutes.',
      userAction: 'Wait a few minutes and try again.'
    },
    GMAIL_TOKEN_EXPIRED: {
      code: 'gmail_token_expired',
      message: 'Your Gmail connection has expired.',
      userAction: 'Please reconnect your Gmail account.'
    },
    GMAIL_INSUFFICIENT_PERMISSIONS: {
      code: 'gmail_insufficient_permissions',
      message: 'Insufficient permissions to access Gmail.',
      userAction: 'Please reconnect and grant the required permissions.'
    },
    GMAIL_NETWORK_TIMEOUT: {
      code: 'gmail_network_timeout',
      message: 'Connection to Gmail timed out.',
      userAction: 'Check your internet connection and try again.'
    },
    GMAIL_API_ERROR: {
      code: 'gmail_api_error',
      message: 'Failed to retrieve emails from Gmail.',
      userAction: 'Please try again later.'
    },
    
    // Analysis errors
    ANALYSIS_INSUFFICIENT_EMAILS: {
      code: 'analysis_insufficient_emails',
      message: 'Not enough valid emails found for analysis. At least 10 emails with substantial content are required.',
      userAction: 'Ensure you have sent emails with meaningful content.'
    },
    ANALYSIS_CLEANSING_FAILED: {
      code: 'analysis_cleansing_failed',
      message: 'Failed to process email content.',
      userAction: 'Please try again.'
    },
    ANALYSIS_STYLE_EXTRACTION_FAILED: {
      code: 'analysis_style_extraction_failed',
      message: 'Failed to analyze writing patterns.',
      userAction: 'Please try again later.'
    },
    ANALYSIS_TIMEOUT: {
      code: 'analysis_timeout',
      message: 'Email analysis took too long and was cancelled.',
      userAction: 'Please try again with a stable internet connection.'
    },
    
    // Configuration errors
    CONFIG_GMAIL_NOT_ENABLED: {
      code: 'config_gmail_not_enabled',
      message: 'Gmail integration is not configured on this server.',
      userAction: 'Please contact the administrator.'
    },
    CONFIG_INVALID_CREDENTIALS: {
      code: 'config_invalid_credentials',
      message: 'Gmail integration is misconfigured.',
      userAction: 'Please contact the administrator.'
    },
    
    // Generic errors
    UNKNOWN_ERROR: {
      code: 'unknown_error',
      message: 'An unexpected error occurred.',
      userAction: 'Please try again later.'
    }
  };

  /**
   * Classify error and return user-friendly error object
   * 
   * @param {Error|string} error - Error object or message
   * @param {string} context - Context where error occurred (e.g., 'oauth', 'retrieval', 'analysis')
   * @returns {Object} { code, message, userAction, canRetry }
   */
  static handleError(error, context = 'unknown') {
    const errorMessage = typeof error === 'string' ? error : error.message || '';
    const errorCode = error.code || null;
    
    // Log error for debugging (without sensitive data)
    console.error(`[Gmail Error - ${context}]:`, {
      message: errorMessage,
      code: errorCode,
      context
    });

    // Classify error based on message and code
    let errorType = this.ERROR_TYPES.UNKNOWN_ERROR;

    // OAuth errors
    if (context === 'oauth' || errorMessage.includes('OAuth') || errorMessage.includes('authorization')) {
      if (errorMessage.includes('access_denied') || errorMessage.includes('denied')) {
        errorType = this.ERROR_TYPES.OAUTH_PERMISSION_DENIED;
      } else if (errorMessage.includes('redirect')) {
        errorType = this.ERROR_TYPES.OAUTH_INVALID_REDIRECT;
      } else if (errorMessage.includes('state') && errorMessage.includes('expired')) {
        errorType = this.ERROR_TYPES.OAUTH_EXPIRED_STATE;
      } else if (errorMessage.includes('state')) {
        errorType = this.ERROR_TYPES.OAUTH_STATE_MISMATCH;
      } else if (errorMessage.includes('token')) {
        errorType = this.ERROR_TYPES.OAUTH_TOKEN_EXCHANGE_FAILED;
      }
    }
    
    // Gmail API errors
    else if (context === 'gmail_api' || context === 'retrieval') {
      if (errorCode === 429 || errorMessage.includes('rate limit') || errorMessage.includes('quota')) {
        errorType = this.ERROR_TYPES.GMAIL_RATE_LIMIT;
      } else if (errorCode === 401 || errorMessage.includes('unauthorized') || errorMessage.includes('token')) {
        errorType = this.ERROR_TYPES.GMAIL_TOKEN_EXPIRED;
      } else if (errorCode === 403 || errorMessage.includes('permission') || errorMessage.includes('forbidden')) {
        errorType = this.ERROR_TYPES.GMAIL_INSUFFICIENT_PERMISSIONS;
      } else if (errorMessage.includes('timeout') || errorCode === 'ETIMEDOUT') {
        errorType = this.ERROR_TYPES.GMAIL_NETWORK_TIMEOUT;
      } else {
        errorType = this.ERROR_TYPES.GMAIL_API_ERROR;
      }
    }
    
    // Analysis errors
    else if (context === 'analysis' || context === 'cleansing') {
      if (errorMessage.includes('insufficient') || errorMessage.includes('not enough')) {
        errorType = this.ERROR_TYPES.ANALYSIS_INSUFFICIENT_EMAILS;
      } else if (errorMessage.includes('timeout')) {
        errorType = this.ERROR_TYPES.ANALYSIS_TIMEOUT;
      } else if (context === 'cleansing') {
        errorType = this.ERROR_TYPES.ANALYSIS_CLEANSING_FAILED;
      } else {
        errorType = this.ERROR_TYPES.ANALYSIS_STYLE_EXTRACTION_FAILED;
      }
    }
    
    // Configuration errors
    else if (context === 'config') {
      if (errorMessage.includes('not configured') || errorMessage.includes('not enabled')) {
        errorType = this.ERROR_TYPES.CONFIG_GMAIL_NOT_ENABLED;
      } else {
        errorType = this.ERROR_TYPES.CONFIG_INVALID_CREDENTIALS;
      }
    }

    // Determine if error is retryable
    const canRetry = this._isRetryable(errorType);

    return {
      code: errorType.code,
      message: errorType.message,
      userAction: errorType.userAction,
      canRetry,
      context
    };
  }

  /**
   * Determine if an error is retryable
   * 
   * @param {Object} errorType - Error type object
   * @returns {boolean} True if error is retryable
   * @private
   */
  static _isRetryable(errorType) {
    const nonRetryableErrors = [
      this.ERROR_TYPES.OAUTH_PERMISSION_DENIED,
      this.ERROR_TYPES.OAUTH_INVALID_REDIRECT,
      this.ERROR_TYPES.CONFIG_GMAIL_NOT_ENABLED,
      this.ERROR_TYPES.CONFIG_INVALID_CREDENTIALS,
      this.ERROR_TYPES.ANALYSIS_INSUFFICIENT_EMAILS
    ];

    return !nonRetryableErrors.includes(errorType);
  }

  /**
   * Create partial success message for cleansing
   * 
   * @param {number} total - Total emails retrieved
   * @param {number} successful - Successfully cleansed emails
   * @param {number} failed - Failed emails
   * @returns {Object} Partial success message object
   */
  static createPartialSuccessMessage(total, successful, failed) {
    const failureRate = (failed / total) * 100;
    
    let severity = 'info';
    let message = '';
    
    if (failureRate < 10) {
      severity = 'success';
      message = `Successfully analyzed ${successful} of ${total} emails. ${failed} emails were filtered out due to quality checks.`;
    } else if (failureRate < 30) {
      severity = 'warning';
      message = `Analyzed ${successful} of ${total} emails. ${failed} emails could not be processed, but analysis completed successfully.`;
    } else {
      severity = 'warning';
      message = `Only ${successful} of ${total} emails could be analyzed. Many emails were filtered due to automated content or insufficient original text.`;
    }

    return {
      severity,
      message,
      stats: {
        total,
        successful,
        failed,
        failureRate: Math.round(failureRate)
      }
    };
  }

  /**
   * Sanitize error for logging (remove sensitive data)
   * 
   * @param {Error|Object} error - Error to sanitize
   * @returns {Object} Sanitized error object
   */
  static sanitizeError(error) {
    const sanitized = {
      message: error.message || 'Unknown error',
      code: error.code || null,
      name: error.name || 'Error'
    };

    // Remove any potential sensitive data patterns
    sanitized.message = sanitized.message
      .replace(/token[=:]\s*[\w-]+/gi, 'token=***')
      .replace(/key[=:]\s*[\w-]+/gi, 'key=***')
      .replace(/secret[=:]\s*[\w-]+/gi, 'secret=***')
      .replace(/password[=:]\s*[\w-]+/gi, 'password=***')
      .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '***@***.***');

    return sanitized;
  }
}

module.exports = GmailErrorHandler;
