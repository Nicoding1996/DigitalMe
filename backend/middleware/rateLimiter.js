/**
 * Rate Limiting Middleware
 * 
 * Implements rate limiting for Gmail API endpoints to prevent abuse
 * and comply with Google API quota limits.
 * 
 * SECURITY CONSIDERATIONS:
 * - Limits requests per user/IP to prevent abuse
 * - Tracks requests in-memory (suitable for single-instance deployments)
 * - For production with multiple instances, use Redis or similar
 * - Rate limit windows reset automatically
 */

class RateLimiter {
  constructor() {
    // Map<identifier, { count: number, resetAt: Date }>
    this.requests = new Map();
    
    // Cleanup expired entries every 5 minutes
    setInterval(() => this.cleanup(), 5 * 60 * 1000);
  }
  
  /**
   * Create rate limiting middleware
   * @param {Object} options - Rate limiting options
   * @param {number} options.maxRequests - Maximum requests allowed in window
   * @param {number} options.windowMs - Time window in milliseconds
   * @param {string} options.message - Error message when limit exceeded
   * @param {Function} options.keyGenerator - Function to generate unique key (default: IP address)
   * @returns {Function} Express middleware function
   */
  createLimiter(options = {}) {
    const {
      maxRequests = 10,
      windowMs = 60 * 60 * 1000, // 1 hour default
      message = 'Too many requests, please try again later',
      keyGenerator = (req) => req.ip || req.connection.remoteAddress
    } = options;
    
    return (req, res, next) => {
      try {
        // Generate unique identifier for this client
        const identifier = keyGenerator(req);
        
        if (!identifier) {
          // If we can't identify the client, allow the request but log warning
          console.warn('Rate limiter: Unable to identify client');
          return next();
        }
        
        const now = Date.now();
        const record = this.requests.get(identifier);
        
        // Check if record exists and is still valid
        if (record && now < record.resetAt) {
          // Increment request count
          record.count++;
          
          // Check if limit exceeded
          if (record.count > maxRequests) {
            const retryAfter = Math.ceil((record.resetAt - now) / 1000);
            
            return res.status(429).json({
              code: 'rate_limit_exceeded',
              message: message,
              canRetry: true,
              retryAfter: retryAfter,
              userAction: `Please wait ${retryAfter} seconds before trying again`
            });
          }
        } else {
          // Create new record or reset expired one
          this.requests.set(identifier, {
            count: 1,
            resetAt: now + windowMs
          });
        }
        
        // Add rate limit headers to response
        const currentRecord = this.requests.get(identifier);
        res.setHeader('X-RateLimit-Limit', maxRequests);
        res.setHeader('X-RateLimit-Remaining', Math.max(0, maxRequests - currentRecord.count));
        res.setHeader('X-RateLimit-Reset', new Date(currentRecord.resetAt).toISOString());
        
        next();
      } catch (error) {
        // Don't block requests if rate limiter fails
        console.error('Rate limiter error:', error.message);
        next();
      }
    };
  }
  
  /**
   * Clean up expired rate limit records
   * @private
   */
  cleanup() {
    const now = Date.now();
    let cleaned = 0;
    
    for (const [identifier, record] of this.requests.entries()) {
      if (now >= record.resetAt) {
        this.requests.delete(identifier);
        cleaned++;
      }
    }
    
    if (cleaned > 0) {
      console.log(`Rate limiter: Cleaned up ${cleaned} expired records`);
    }
  }
  
  /**
   * Get current rate limit status for an identifier
   * @param {string} identifier - Client identifier
   * @returns {Object|null} Rate limit status or null if no record
   */
  getStatus(identifier) {
    const record = this.requests.get(identifier);
    if (!record) {
      return null;
    }
    
    return {
      count: record.count,
      resetAt: record.resetAt,
      remaining: Math.max(0, 10 - record.count)
    };
  }
  
  /**
   * Reset rate limit for an identifier (useful for testing)
   * @param {string} identifier - Client identifier
   */
  reset(identifier) {
    this.requests.delete(identifier);
  }
  
  /**
   * Clear all rate limit records (useful for testing)
   */
  resetAll() {
    this.requests.clear();
  }
}

// Export singleton instance
const rateLimiter = new RateLimiter();

// Pre-configured limiters for different use cases
const gmailApiLimiter = rateLimiter.createLimiter({
  maxRequests: 100,
  windowMs: 60 * 60 * 1000, // 100 requests per hour (increased for development)
  message: 'Gmail API rate limit exceeded. Please try again in an hour.',
  keyGenerator: (req) => {
    // Use session ID if available, otherwise fall back to IP
    return req.body?.sessionId || req.params?.sessionId || req.ip;
  }
});

const gmailAuthLimiter = rateLimiter.createLimiter({
  maxRequests: 50,
  windowMs: 15 * 60 * 1000, // 50 requests per 15 minutes (increased for development)
  message: 'Too many authentication attempts. Please try again later.',
  keyGenerator: (req) => req.ip || req.connection.remoteAddress
});

module.exports = {
  RateLimiter,
  rateLimiter,
  gmailApiLimiter,
  gmailAuthLimiter
};
