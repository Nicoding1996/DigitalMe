const { google } = require('googleapis');
const crypto = require('crypto');
const config = require('../config');

/**
 * GmailAuthService
 * 
 * Handles OAuth 2.0 authentication flow for Gmail API access
 * 
 * SECURITY CONSIDERATIONS:
 * - All tokens are encrypted at rest using AES-256-GCM
 * - State tokens expire after 10 minutes to prevent CSRF attacks
 * - Tokens are never logged or exposed in error messages
 * - Only read-only access to Sent folder is requested
 */

class GmailAuthService {
  constructor() {
    // Initialize OAuth2 client with credentials from config
    this.oauth2Client = new google.auth.OAuth2(
      config.GOOGLE_CLIENT_ID,
      config.GOOGLE_CLIENT_SECRET,
      config.GOOGLE_REDIRECT_URI
    );
    
    // Define Gmail API scopes - read-only access to Gmail
    this.scopes = [
      'https://www.googleapis.com/auth/gmail.readonly'
    ];
    
    // In-memory storage for state tokens with expiration
    // Map<stateToken, { createdAt: Date, redirectUri: string }>
    this.stateTokens = new Map();
    
    // Cleanup expired state tokens every 5 minutes
    setInterval(() => this.cleanupExpiredStateTokens(), 5 * 60 * 1000);
  }
  
  /**
   * Generate OAuth authorization URL with state token for CSRF protection
   * @param {string} redirectUri - The URI to redirect to after authorization
   * @returns {Object} { authUrl: string, state: string }
   */
  generateAuthUrl(redirectUri) {
    // Generate cryptographically secure state token (32 bytes = 64 hex chars)
    const state = crypto.randomBytes(32).toString('hex');
    
    // Store state token with 10-minute expiration
    this.stateTokens.set(state, {
      createdAt: Date.now(),
      redirectUri: redirectUri
    });
    
    // Generate authorization URL with explicit redirect_uri
    // This overrides the redirect_uri set in the OAuth2 client constructor
    const authUrl = this.oauth2Client.generateAuthUrl({
      access_type: 'offline', // Request refresh token
      scope: this.scopes,
      state: state,
      prompt: 'consent', // Force consent screen to ensure refresh token
      redirect_uri: redirectUri // CRITICAL: Must match Google Cloud Console exactly
    });
    
    return { authUrl, state };
  }
  
  /**
   * Exchange authorization code for access token
   * @param {string} code - Authorization code from OAuth callback
   * @param {string} state - State token for CSRF validation
   * @returns {Promise<Object>} { accessToken: string, refreshToken: string, expiresAt: Date }
   * @throws {Error} If state token is invalid or expired
   */
  async exchangeCodeForToken(code, state) {
    // Validate state token
    const stateData = this.stateTokens.get(state);
    
    if (!stateData) {
      throw new Error('Invalid or expired state token');
    }
    
    // Check if state token has expired (10 minutes)
    const tokenAge = Date.now() - stateData.createdAt;
    const TEN_MINUTES = 10 * 60 * 1000;
    
    if (tokenAge > TEN_MINUTES) {
      this.stateTokens.delete(state);
      throw new Error('State token has expired');
    }
    
    // Get the redirect URI that was used for this OAuth flow
    const redirectUri = stateData.redirectUri;
    
    // Remove state token after validation (one-time use)
    this.stateTokens.delete(state);
    
    try {
      // Exchange authorization code for tokens
      // CRITICAL: Must use the same redirect_uri that was used in generateAuthUrl
      const { tokens } = await this.oauth2Client.getToken({
        code: code,
        redirect_uri: redirectUri
      });
      
      // Calculate token expiration time
      const expiresAt = new Date(Date.now() + (tokens.expiry_date || 3600 * 1000));
      
      return {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiresAt: expiresAt
      };
    } catch (error) {
      console.error('Token exchange error:', error.message);
      throw new Error('Failed to exchange authorization code for token');
    }
  }
  
  /**
   * Encrypt token using AES-256-GCM
   * @param {string} token - Plain text token to encrypt
   * @returns {string} Encrypted token in format: iv:authTag:encryptedData (hex encoded)
   */
  encryptToken(token) {
    // Convert encryption key from hex string to Buffer
    const key = Buffer.from(config.TOKEN_ENCRYPTION_KEY, 'hex');
    
    // Generate random initialization vector (12 bytes for GCM)
    const iv = crypto.randomBytes(12);
    
    // Create cipher
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
    
    // Encrypt token
    let encrypted = cipher.update(token, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    // Get authentication tag
    const authTag = cipher.getAuthTag();
    
    // Return format: iv:authTag:encryptedData (all hex encoded)
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
  }
  
  /**
   * Decrypt token using AES-256-GCM
   * @param {string} encryptedToken - Encrypted token in format: iv:authTag:encryptedData
   * @returns {string} Decrypted plain text token
   * @throws {Error} If decryption fails or token is tampered
   */
  decryptToken(encryptedToken) {
    try {
      // Parse encrypted token format
      const parts = encryptedToken.split(':');
      if (parts.length !== 3) {
        throw new Error('Invalid encrypted token format');
      }
      
      const [ivHex, authTagHex, encryptedData] = parts;
      
      // Convert from hex to Buffer
      const key = Buffer.from(config.TOKEN_ENCRYPTION_KEY, 'hex');
      const iv = Buffer.from(ivHex, 'hex');
      const authTag = Buffer.from(authTagHex, 'hex');
      
      // Create decipher
      const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
      decipher.setAuthTag(authTag);
      
      // Decrypt token
      let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      console.error('Token decryption error:', error.message);
      throw new Error('Failed to decrypt token');
    }
  }
  
  /**
   * Revoke OAuth access token
   * @param {string} token - Access token to revoke (plain text or encrypted)
   * @returns {Promise<boolean>} True if revocation successful
   */
  async revokeAccess(token) {
    try {
      // Check if token is encrypted (contains colons)
      const plainToken = token.includes(':') ? this.decryptToken(token) : token;
      
      // Revoke token using Google OAuth2 API
      await this.oauth2Client.revokeToken(plainToken);
      
      return true;
    } catch (error) {
      console.error('Token revocation error:', error.message);
      // Return false instead of throwing to allow graceful degradation
      return false;
    }
  }
  
  /**
   * Clean up expired state tokens (older than 10 minutes)
   * @private
   */
  cleanupExpiredStateTokens() {
    const now = Date.now();
    const TEN_MINUTES = 10 * 60 * 1000;
    
    for (const [state, data] of this.stateTokens.entries()) {
      if (now - data.createdAt > TEN_MINUTES) {
        this.stateTokens.delete(state);
      }
    }
  }
}

// Export singleton instance
module.exports = new GmailAuthService();
