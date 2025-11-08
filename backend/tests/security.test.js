/**
 * Security Tests for Gmail Integration
 * 
 * Tests security measures including:
 * - Rate limiting
 * - Input validation
 * - Token sanitization
 * - CSRF protection
 */

const { RateLimiter } = require('../middleware/rateLimiter');
const {
  sanitizeString,
  validateUrl,
  validateSessionId,
  validateStateToken
} = require('../middleware/inputValidation');
const {
  redactSensitiveData,
  sanitizeErrorMessage,
  validateResponseSafety
} = require('../utils/securityAudit');

describe('Security Measures', () => {
  describe('Rate Limiting', () => {
    test('should limit requests when threshold exceeded', () => {
      const limiter = new RateLimiter();
      const testLimiter = limiter.createLimiter({
        maxRequests: 3,
        windowMs: 60000
      });
      
      const req = { ip: '127.0.0.1' };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
        setHeader: jest.fn()
      };
      const next = jest.fn();
      
      // First 3 requests should pass
      testLimiter(req, res, next);
      testLimiter(req, res, next);
      testLimiter(req, res, next);
      expect(next).toHaveBeenCalledTimes(3);
      
      // 4th request should be rate limited
      testLimiter(req, res, next);
      expect(res.status).toHaveBeenCalledWith(429);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 'rate_limit_exceeded'
        })
      );
    });
    
    test('should reset rate limit after window expires', () => {
      const limiter = new RateLimiter();
      const identifier = 'test-user';
      
      // Manually set a record
      limiter.requests.set(identifier, {
        count: 5,
        resetAt: Date.now() - 1000 // Expired 1 second ago
      });
      
      // Cleanup should remove it
      limiter.cleanup();
      
      expect(limiter.requests.has(identifier)).toBe(false);
    });
  });
  
  describe('Input Validation', () => {
    test('should sanitize malicious strings', () => {
      const malicious = 'Hello\x00World\x1F<script>alert("xss")</script>';
      const sanitized = sanitizeString(malicious);
      
      expect(sanitized).not.toContain('\x00');
      expect(sanitized).not.toContain('\x1F');
    });
    
    test('should validate URLs against whitelist', () => {
      const allowedOrigins = ['http://localhost:3000'];
      
      // Valid URL
      const valid = validateUrl('http://localhost:3000/callback', allowedOrigins);
      expect(valid.valid).toBe(true);
      
      // Invalid URL (different origin)
      const invalid = validateUrl('http://evil.com/callback', allowedOrigins);
      expect(invalid.valid).toBe(false);
    });
    
    test('should reject non-HTTP protocols', () => {
      const result = validateUrl('javascript:alert("xss")');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('HTTP');
    });
    
    test('should validate session ID format', () => {
      // Valid UUID v4
      const validUuid = '550e8400-e29b-41d4-a716-446655440000';
      const valid = validateSessionId(validUuid);
      expect(valid.valid).toBe(true);
      
      // Invalid format
      const invalid = validateSessionId('not-a-uuid');
      expect(invalid.valid).toBe(false);
    });
    
    test('should validate state token format', () => {
      // Valid state token (64 hex chars)
      const validState = 'a'.repeat(64);
      const valid = validateStateToken(validState);
      expect(valid.valid).toBe(true);
      
      // Invalid format (too short)
      const invalid = validateStateToken('abc123');
      expect(invalid.valid).toBe(false);
    });
  });
  
  describe('Token Security', () => {
    test('should redact sensitive fields from objects', () => {
      const data = {
        sessionId: '123',
        accessToken: 'secret-token-123',
        refreshToken: 'secret-refresh-456',
        email: 'user@example.com'
      };
      
      const redacted = redactSensitiveData(data);
      
      expect(redacted.sessionId).toBe('123');
      expect(redacted.accessToken).toBe('[REDACTED]');
      expect(redacted.refreshToken).toBe('[REDACTED]');
      expect(redacted.email).toBe('user@example.com');
    });
    
    test('should sanitize error messages containing tokens', () => {
      const error = 'Token abc123def456ghi789jkl012mno345pqr678stu901vwx234yz567 is invalid';
      const sanitized = sanitizeErrorMessage(error);
      
      expect(sanitized).not.toContain('abc123def456');
      expect(sanitized).toContain('[REDACTED_TOKEN]');
    });
    
    test('should sanitize API keys in error messages', () => {
      const error = 'API key AIzaSyDxxxxxxxxxxxxxxxxxxxxxxxxxxx is invalid';
      const sanitized = sanitizeErrorMessage(error);
      
      expect(sanitized).not.toContain('AIzaSyD');
      expect(sanitized).toContain('[REDACTED_API_KEY]');
    });
    
    test('should detect sensitive data in responses', () => {
      // Safe response
      const safeResponse = {
        success: true,
        sessionId: '123',
        message: 'Analysis complete'
      };
      expect(validateResponseSafety(safeResponse)).toBe(true);
      
      // Unsafe response (contains token)
      const unsafeResponse = {
        success: true,
        accessToken: 'secret-token-123'
      };
      expect(validateResponseSafety(unsafeResponse)).toBe(false);
    });
  });
  
  describe('CSRF Protection', () => {
    test('should generate unique state tokens', () => {
      const crypto = require('crypto');
      
      const state1 = crypto.randomBytes(32).toString('hex');
      const state2 = crypto.randomBytes(32).toString('hex');
      
      expect(state1).not.toBe(state2);
      expect(state1.length).toBe(64);
      expect(state2.length).toBe(64);
    });
  });
});
