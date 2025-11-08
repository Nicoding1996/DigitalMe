const { google } = require('googleapis');
const config = require('../config');

/**
 * Gmail Retrieval Service
 * 
 * Handles fetching emails from Gmail's Sent folder using the Gmail API.
 * Implements pagination, error handling, and exponential backoff for rate limiting.
 * 
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5
 */
class GmailRetrievalService {
  constructor() {
    this.maxRetries = 3;
    this.baseDelay = 1000; // 1 second base delay for exponential backoff
  }

  /**
   * Fetch sent emails from Gmail
   * 
   * Retrieves emails from the Sent folder in reverse chronological order.
   * Implements batch processing with pagination.
   * 
   * @param {string} accessToken - OAuth access token
   * @param {number} maxResults - Maximum number of emails to retrieve (default: 200)
   * @returns {Promise<Array>} Array of email objects with id, subject, body, timestamp
   * @throws {Error} If retrieval fails or times out
   * 
   * Requirements: 2.1, 2.2, 2.5
   */
  async fetchSentEmails(accessToken, maxResults = config.GMAIL_MAX_EMAILS) {
    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: accessToken });

    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
    const batchSize = config.GMAIL_BATCH_SIZE;
    const allEmails = [];
    
    try {
      // Start timeout timer (60 seconds as per requirements)
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Email retrieval timeout after 60 seconds')), 60000);
      });

      const retrievalPromise = (async () => {
        let pageToken = null;
        let remainingToFetch = maxResults;

        do {
          const currentBatchSize = Math.min(batchSize, remainingToFetch);
          
          // List messages from Sent folder
          const listResponse = await this._retryWithBackoff(async () => {
            return await gmail.users.messages.list({
              userId: 'me',
              labelIds: ['SENT'],
              maxResults: currentBatchSize,
              pageToken: pageToken
            });
          });

          const messages = listResponse.data.messages || [];
          
          if (messages.length === 0) {
            break; // No more messages
          }

          // Fetch full content for each message in parallel
          const emailPromises = messages.map(msg => 
            this.getEmailContent(accessToken, msg.id)
          );
          
          const emails = await Promise.all(emailPromises);
          allEmails.push(...emails.filter(email => email !== null));

          remainingToFetch -= messages.length;
          pageToken = listResponse.data.nextPageToken;

        } while (pageToken && remainingToFetch > 0);

        return allEmails;
      })();

      // Race between retrieval and timeout
      return await Promise.race([retrievalPromise, timeoutPromise]);

    } catch (error) {
      // Classify error for better user feedback
      if (error.message.includes('timeout')) {
        throw new Error('GMAIL_NETWORK_TIMEOUT');
      }
      
      // Check for specific Gmail API errors
      if (error.code === 401 || (error.response && error.response.status === 401)) {
        throw new Error('GMAIL_TOKEN_EXPIRED');
      }
      
      if (error.code === 403 || (error.response && error.response.status === 403)) {
        throw new Error('GMAIL_INSUFFICIENT_PERMISSIONS');
      }
      
      if (error.code === 429 || (error.response && error.response.status === 429)) {
        throw new Error('GMAIL_RATE_LIMIT');
      }
      
      // Generic Gmail API error
      throw new Error(`GMAIL_API_ERROR: ${error.message}`);
    }
  }

  /**
   * Get full content of a specific email
   * 
   * Fetches individual email details including headers and body content.
   * 
   * @param {string} accessToken - OAuth access token
   * @param {string} messageId - Gmail message ID
   * @returns {Promise<Object|null>} Email object or null if parsing fails
   * 
   * Requirements: 2.3, 2.4
   */
  async getEmailContent(accessToken, messageId) {
    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: accessToken });

    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

    try {
      const response = await this._retryWithBackoff(async () => {
        return await gmail.users.messages.get({
          userId: 'me',
          id: messageId,
          format: 'full'
        });
      });

      const message = response.data;
      
      // Extract headers
      const headers = message.payload.headers;
      const subject = headers.find(h => h.name.toLowerCase() === 'subject')?.value || '';
      const dateHeader = headers.find(h => h.name.toLowerCase() === 'date')?.value || '';
      
      // Parse timestamp
      const timestamp = dateHeader ? new Date(dateHeader) : new Date(parseInt(message.internalDate));

      // Extract body content
      const body = this.parseEmailBody(message.payload);

      return {
        id: messageId,
        subject,
        body,
        timestamp,
        originalLength: body.length
      };

    } catch (error) {
      console.error(`Failed to fetch email ${messageId}:`, error.message);
      return null; // Skip problematic emails
    }
  }

  /**
   * Parse email body from payload
   * 
   * Extracts plain text content from email payload, handling both
   * simple and multipart message structures.
   * 
   * @param {Object} payload - Gmail message payload
   * @returns {string} Plain text body content
   * 
   * Requirements: 2.4
   */
  parseEmailBody(payload) {
    if (!payload) {
      return '';
    }

    // Check if body data is directly available
    if (payload.body && payload.body.data) {
      return this._decodeBase64(payload.body.data);
    }

    // Handle multipart messages
    if (payload.parts) {
      return this.extractPlainText(payload.parts);
    }

    return '';
  }

  /**
   * Extract plain text from multipart email structures
   * 
   * Recursively processes email parts to find and extract plain text content.
   * Prioritizes text/plain over text/html.
   * 
   * @param {Array} parts - Array of message parts
   * @returns {string} Extracted plain text
   * 
   * Requirements: 2.4
   */
  extractPlainText(parts) {
    if (!parts || !Array.isArray(parts)) {
      return '';
    }

    let plainText = '';
    let htmlText = '';

    for (const part of parts) {
      const mimeType = part.mimeType;

      // Handle nested parts (multipart/alternative, multipart/mixed)
      if (part.parts) {
        const nestedText = this.extractPlainText(part.parts);
        if (nestedText) {
          plainText += nestedText + '\n';
        }
        continue;
      }

      // Extract text/plain
      if (mimeType === 'text/plain' && part.body && part.body.data) {
        plainText += this._decodeBase64(part.body.data) + '\n';
      }

      // Extract text/html as fallback
      if (mimeType === 'text/html' && part.body && part.body.data) {
        htmlText += this._decodeBase64(part.body.data) + '\n';
      }
    }

    // Prefer plain text, fall back to HTML (stripped of tags)
    if (plainText.trim()) {
      return plainText.trim();
    }

    if (htmlText.trim()) {
      return this._stripHtmlTags(htmlText);
    }

    return '';
  }

  /**
   * Retry operation with exponential backoff
   * 
   * Implements retry logic for handling rate limiting and transient errors.
   * Uses exponential backoff strategy.
   * 
   * @param {Function} operation - Async operation to retry
   * @returns {Promise<any>} Result of the operation
   * @throws {Error} If all retries are exhausted
   * 
   * Requirements: 2.5
   */
  async _retryWithBackoff(operation) {
    let lastError;

    for (let attempt = 0; attempt < this.maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;

        // Check if error is retryable
        const isRateLimitError = error.code === 429 || 
                                 (error.response && error.response.status === 429);
        const isTransientError = error.code === 'ECONNRESET' || 
                                 error.code === 'ETIMEDOUT' ||
                                 (error.response && error.response.status >= 500);

        if (!isRateLimitError && !isTransientError) {
          // Non-retryable error, throw immediately
          throw error;
        }

        // Don't wait after the last attempt
        if (attempt < this.maxRetries - 1) {
          const delay = this.baseDelay * Math.pow(2, attempt);
          console.log(`Retry attempt ${attempt + 1}/${this.maxRetries} after ${delay}ms`);
          await this._sleep(delay);
        }
      }
    }

    throw new Error(`Operation failed after ${this.maxRetries} retries: ${lastError.message}`);
  }

  /**
   * Decode base64url encoded string
   * 
   * Gmail API returns body data in base64url encoding.
   * 
   * @param {string} data - Base64url encoded string
   * @returns {string} Decoded string
   * @private
   */
  _decodeBase64(data) {
    if (!data) {
      return '';
    }

    try {
      // Convert base64url to base64
      const base64 = data.replace(/-/g, '+').replace(/_/g, '/');
      // Decode from base64
      return Buffer.from(base64, 'base64').toString('utf-8');
    } catch (error) {
      console.error('Failed to decode base64 data:', error.message);
      return '';
    }
  }

  /**
   * Strip HTML tags from text
   * 
   * Simple HTML tag removal for extracting text from HTML content.
   * 
   * @param {string} html - HTML string
   * @returns {string} Plain text
   * @private
   */
  _stripHtmlTags(html) {
    if (!html) {
      return '';
    }

    return html
      .replace(/<style[^>]*>.*?<\/style>/gis, '') // Remove style tags
      .replace(/<script[^>]*>.*?<\/script>/gis, '') // Remove script tags
      .replace(/<[^>]+>/g, ' ') // Remove HTML tags
      .replace(/&nbsp;/g, ' ') // Replace &nbsp;
      .replace(/&amp;/g, '&') // Replace &amp;
      .replace(/&lt;/g, '<') // Replace &lt;
      .replace(/&gt;/g, '>') // Replace &gt;
      .replace(/&quot;/g, '"') // Replace &quot;
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
  }

  /**
   * Sleep utility for delays
   * 
   * @param {number} ms - Milliseconds to sleep
   * @returns {Promise<void>}
   * @private
   */
  _sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = GmailRetrievalService;
