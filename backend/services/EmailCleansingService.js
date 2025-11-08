/**
 * Email Cleansing Service
 * 
 * Filters and cleanses email content to extract only original, user-authored text.
 * Removes automated emails, quoted replies, signatures, and validates content quality.
 * 
 * Requirements: 3.1-3.7, 4.1-4.5, 5.1-5.5
 */
class EmailCleansingService {
  constructor() {
    /**
     * AUTOMATED EMAIL SUBJECT PATTERNS
     * 
     * These patterns identify system-generated or automated emails that should be excluded
     * from style analysis. All patterns are case-insensitive (i flag).
     * 
     * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7
     */
    this.AUTOMATED_PATTERNS = [
      // Pattern: /^(re|fwd?):/i
      // Matches: "Re: Meeting notes", "Fwd: Important", "FW: Document"
      // Explanation: ^ anchors to start, (re|fwd?) matches "re", "fwd", or "fw", : requires colon
      // Excludes: Reply and forwarded emails (not original content)
      /^(re|fwd?):/i,
      
      // Pattern: /accepted:/i
      // Matches: "Accepted: Team Meeting", "accepted: Calendar Invite"
      // Explanation: Simple substring match for calendar acceptance notifications
      // Excludes: Automated calendar responses
      /accepted:/i,
      
      // Pattern: /out of office/i
      // Matches: "Out of Office: Vacation", "AUTO: Out of office reply"
      // Explanation: Substring match for out-of-office auto-replies
      // Excludes: Automated vacation/absence responses
      /out of office/i,
      
      // Pattern: /automatic reply/i
      // Matches: "Automatic reply: Away", "Auto-reply: Not available"
      // Explanation: Substring match for automatic reply indicators
      // Excludes: Any automated response systems
      /automatic reply/i,
      
      // Pattern: /delivery status notification/i
      // Matches: "Delivery Status Notification (Failure)", "Mail Delivery Status"
      // Explanation: Substring match for email delivery system notifications
      // Excludes: Bounce messages and delivery failures
      /delivery status notification/i,
      
      // Pattern: /undeliverable/i
      // Matches: "Undeliverable: Message failed", "Mail Undeliverable"
      // Explanation: Substring match for undeliverable message notifications
      // Excludes: Failed delivery notifications
      /undeliverable/i,
      
      // Pattern: /bounce/i
      // Matches: "Bounce: Email returned", "Bounced message"
      // Explanation: Substring match for bounce notifications
      // Excludes: Email bounce-back messages
      /bounce/i
    ];

    /**
     * QUOTED TEXT REMOVAL PATTERNS
     * 
     * These patterns identify and remove previously written content that appears in
     * email threads (replies and forwards). The goal is to extract only the user's
     * original writing in the current message.
     * 
     * Requirements: 4.1, 4.2, 4.3
     */
    this.QUOTE_PATTERNS = [
      // Pattern: /^On .+ wrote:$/m
      // Matches: "On Mon, Jan 1, 2024 at 10:30 AM, John Doe <john@example.com> wrote:"
      // Explanation: ^ anchors to line start (m flag), .+ matches any characters, $ anchors to line end
      // Purpose: Identifies the start of quoted reply blocks in Gmail/Outlook format
      // Note: Everything after this line is typically quoted content and should be removed
      /^On .+ wrote:$/m,
      
      // Pattern: /^From:.+$/m
      // Matches: "From: John Doe <john@example.com>"
      // Explanation: ^ anchors to line start, .+ matches rest of line, $ anchors to line end
      // Purpose: Removes email header lines that appear in forwarded messages
      /^From:.+$/m,
      
      // Pattern: /^Sent:.+$/m
      // Matches: "Sent: Monday, January 1, 2024 10:30 AM"
      // Purpose: Removes timestamp header from forwarded messages
      /^Sent:.+$/m,
      
      // Pattern: /^To:.+$/m
      // Matches: "To: recipient@example.com"
      // Purpose: Removes recipient header from forwarded messages
      /^To:.+$/m,
      
      // Pattern: /^Subject:.+$/m
      // Matches: "Subject: Meeting notes"
      // Purpose: Removes subject line header from forwarded messages
      /^Subject:.+$/m,
      
      // Pattern: /^Date:.+$/m
      // Matches: "Date: Mon, 1 Jan 2024 10:30:00 -0800"
      // Purpose: Removes date header from forwarded messages
      /^Date:.+$/m,
      
      // Pattern: /^>+.*/gm
      // Matches: "> This is a quoted line", ">> Nested quote", "> "
      // Explanation: ^ anchors to line start, >+ matches one or more >, .* matches rest of line
      // Purpose: Removes lines prefixed with > (standard email quote marker)
      // Note: g flag for global (all occurrences), m flag for multiline
      /^>+.*/gm,
      
      // Pattern: /_{10,}/g
      // Matches: "__________" (10 or more underscores)
      // Explanation: _{10,} matches 10 or more consecutive underscores
      // Purpose: Removes visual separator lines often used between original and quoted content
      /_{10,}/g,
      
      // Pattern: /-{10,}/g
      // Matches: "----------" (10 or more dashes)
      // Purpose: Removes dash separator lines
      /-{10,}/g,
      
      // Pattern: /={10,}/g
      // Matches: "==========" (10 or more equals signs)
      // Purpose: Removes equals separator lines
      /={10,}/g
    ];

    /**
     * SIGNATURE DETECTION PATTERNS
     * 
     * These patterns identify email signatures and footer content that should be removed
     * to extract only the main message body. Signatures are typically at the end of emails
     * and contain contact info, legal disclaimers, or closing phrases.
     * 
     * Requirements: 4.4, 4.5
     */
    this.SIGNATURE_PATTERNS = [
      // Pattern: /^--\s*$/m
      // Matches: "-- " or "--" on its own line
      // Explanation: ^ anchors to line start, -- matches two dashes, \s* matches optional whitespace, $ anchors to line end
      // Purpose: Standard RFC-compliant signature delimiter (everything after this is signature)
      // Note: This is the most reliable signature indicator
      /^--\s*$/m,
      
      // Pattern: /sent from my (iphone|ipad|android|mobile device)/i
      // Matches: "Sent from my iPhone", "Sent from my Android", "sent from my iPad"
      // Explanation: (iphone|ipad|android|mobile device) matches any of these device types
      // Purpose: Removes mobile device signatures automatically added by email clients
      // Note: Case-insensitive (i flag) to catch various capitalizations
      /sent from my (iphone|ipad|android|mobile device)/i,
      
      // Pattern: /^(best regards|sincerely|cheers|thanks|thank you|regards|best),?\s*$/im
      // Matches: "Best regards,", "Thanks", "Sincerely," (on their own line)
      // Explanation: ^ anchors to line start, (options) matches any closing phrase, ,? matches optional comma
      // Purpose: Identifies common email closing phrases that precede signatures
      // Note: i flag for case-insensitive, m flag for multiline matching
      // Strategy: When found in last 30% of email, treat as signature start
      /^(best regards|sincerely|cheers|thanks|thank you|regards|best),?\s*$/im,
      
      // Pattern: /^(confidential|this email)/i
      // Matches: "Confidential: This message...", "This email and any attachments..."
      // Explanation: Matches lines starting with confidentiality notices
      // Purpose: Removes legal disclaimers and confidentiality notices from email footers
      // Note: These are typically auto-appended by corporate email systems
      /^(confidential|this email)/i,
      
      // Pattern: /^(kind regards|warm regards|yours truly|respectfully),?\s*$/im
      // Matches: "Kind regards,", "Yours truly", "Respectfully,"
      // Explanation: Similar to first closing pattern but with more formal variations
      // Purpose: Catches additional formal closing phrases
      // Strategy: When found in last 30% of email, treat as signature start
      /^(kind regards|warm regards|yours truly|respectfully),?\s*$/im
    ];

    /**
     * CONTENT QUALITY THRESHOLDS
     * 
     * Minimum requirements for email content to be included in style analysis.
     * After cleansing (removing quotes, signatures, etc.), the remaining content
     * must meet these criteria to ensure meaningful analysis.
     * 
     * Requirements: 5.1, 5.2, 5.3, 5.4
     */
    
    // Minimum word count after cleansing
    // Rationale: Emails with fewer than 20 words lack sufficient content for
    // meaningful style analysis. Short responses like "ok thanks" or "sounds good"
    // don't provide enough writing patterns to analyze.
    this.MIN_WORD_COUNT = 20;
  }

  /**
   * Cleanse a batch of emails
   * 
   * Processes multiple emails efficiently, filtering automated messages,
   * removing quoted text and signatures, and validating content quality.
   * 
   * @param {Array<Object>} emails - Array of email objects with id, subject, body, timestamp
   * @returns {Object} Result object with cleansed emails and statistics
   * 
   * Requirements: 3.1-3.7, 4.1-4.5, 5.1-5.5
   */
  cleanseEmailBatch(emails) {
    if (!Array.isArray(emails) || emails.length === 0) {
      return {
        cleansedEmails: [],
        stats: {
          total: 0,
          filteredBySubject: 0,
          filteredByContent: 0,
          valid: 0
        }
      };
    }

    const stats = {
      total: emails.length,
      filteredBySubject: 0,
      filteredByContent: 0,
      valid: 0
    };

    const cleansedEmails = [];

    for (const email of emails) {
      // Skip emails with automated subjects
      // Requirements: 3.1-3.7
      if (this.isAutomatedEmail(email.subject)) {
        stats.filteredBySubject++;
        continue;
      }

      // Extract original content
      let cleanedBody = email.body || '';
      
      // Remove quoted text
      // Requirements: 4.1, 4.2, 4.3
      cleanedBody = this.removeQuotedText(cleanedBody);
      
      // Remove signature
      // Requirements: 4.4, 4.5
      cleanedBody = this.removeSignature(cleanedBody);
      
      // Validate content quality
      // Requirements: 5.1, 5.2, 5.3, 5.4
      if (!this.validateContentQuality(cleanedBody)) {
        stats.filteredByContent++;
        continue;
      }

      // Count words for statistics
      const wordCount = this._countWords(cleanedBody);
      const sentenceCount = this._countSentences(cleanedBody);

      cleansedEmails.push({
        id: email.id,
        subject: email.subject,
        cleanedBody: cleanedBody.trim(),
        originalLength: email.originalLength || email.body.length,
        cleanedLength: cleanedBody.length,
        wordCount,
        sentenceCount,
        timestamp: email.timestamp,
        isValid: true
      });

      stats.valid++;
    }

    return {
      cleansedEmails,
      stats
    };
  }

  /**
   * Check if email is automated based on subject line
   * 
   * Filters out system-generated emails by matching subject patterns.
   * 
   * @param {string} subject - Email subject line
   * @returns {boolean} True if email is automated
   * 
   * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7
   */
  isAutomatedEmail(subject) {
    if (!subject || typeof subject !== 'string') {
      return false;
    }

    // Check against all automated patterns
    return this.AUTOMATED_PATTERNS.some(pattern => pattern.test(subject));
  }

  /**
   * Remove quoted reply text from email body
   * 
   * Identifies and removes previously written content included in email threads.
   * Preserves original content while removing quotes.
   * 
   * @param {string} body - Email body text
   * @returns {string} Body with quoted text removed
   * 
   * Requirements: 4.1, 4.2, 4.3
   */
  removeQuotedText(body) {
    if (!body || typeof body !== 'string') {
      return '';
    }

    let cleaned = body;

    // Remove lines starting with > (quoted text)
    cleaned = cleaned.replace(/^>+.*$/gm, '');

    // Remove "On ... wrote:" blocks and everything after
    const onWroteMatch = cleaned.match(/^On .+ wrote:$/m);
    if (onWroteMatch) {
      const index = cleaned.indexOf(onWroteMatch[0]);
      cleaned = cleaned.substring(0, index);
    }

    // Remove email header blocks (From:, Sent:, To:, Subject:)
    cleaned = cleaned.replace(/^(From|Sent|To|Subject|Date):.+$/gm, '');

    // Remove separator lines
    cleaned = cleaned.replace(/_{10,}/g, '');
    cleaned = cleaned.replace(/-{10,}/g, '');
    cleaned = cleaned.replace(/={10,}/g, '');

    // Clean up excessive whitespace
    cleaned = cleaned.replace(/\n{3,}/g, '\n\n');
    cleaned = cleaned.trim();

    return cleaned;
  }

  /**
   * Remove email signature from body
   * 
   * Detects and removes signature blocks using common patterns.
   * 
   * @param {string} body - Email body text
   * @returns {string} Body with signature removed
   * 
   * Requirements: 4.4, 4.5
   */
  removeSignature(body) {
    if (!body || typeof body !== 'string') {
      return '';
    }

    let cleaned = body;

    // Find standard signature delimiter (-- )
    const delimiterMatch = cleaned.match(/^--\s*$/m);
    if (delimiterMatch) {
      const index = cleaned.indexOf(delimiterMatch[0]);
      cleaned = cleaned.substring(0, index);
    }

    // Remove "Sent from my..." signatures
    cleaned = cleaned.replace(/sent from my (iphone|ipad|android|mobile device).*/gi, '');

    // Find common closing phrases and remove everything after
    const closingPhrases = [
      /^(best regards|sincerely|cheers|thanks|thank you|regards|best),?\s*$/im,
      /^(kind regards|warm regards|yours truly|respectfully),?\s*$/im
    ];

    for (const pattern of closingPhrases) {
      const match = cleaned.match(pattern);
      if (match) {
        const index = cleaned.indexOf(match[0]);
        // Only remove if it's in the last 30% of the email (likely a signature)
        if (index > cleaned.length * 0.7) {
          cleaned = cleaned.substring(0, index);
        }
      }
    }

    // Remove confidentiality notices
    cleaned = cleaned.replace(/^(confidential|this email).*/gim, '');

    // Clean up excessive whitespace
    cleaned = cleaned.replace(/\n{3,}/g, '\n\n');
    cleaned = cleaned.trim();

    return cleaned;
  }

  /**
   * Validate content quality
   * 
   * Ensures email has sufficient original content for meaningful analysis.
   * 
   * @param {string} cleanedBody - Cleansed email body
   * @returns {boolean} True if content meets quality standards
   * 
   * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5
   */
  validateContentQuality(cleanedBody) {
    if (!cleanedBody || typeof cleanedBody !== 'string') {
      return false;
    }

    const trimmed = cleanedBody.trim();

    // Check if empty or only whitespace
    // Requirement: 5.3
    if (trimmed.length === 0) {
      return false;
    }

    // Check if only punctuation
    // Requirement: 5.3
    const withoutPunctuation = trimmed.replace(/[^\w\s]/g, '').trim();
    if (withoutPunctuation.length === 0) {
      return false;
    }

    // Count words
    // Requirements: 5.1, 5.2, 5.4
    const wordCount = this._countWords(trimmed);
    if (wordCount < this.MIN_WORD_COUNT) {
      return false;
    }

    return true;
  }

  /**
   * Count words in text
   * 
   * @param {string} text - Text to count words in
   * @returns {number} Word count
   * @private
   */
  _countWords(text) {
    if (!text || typeof text !== 'string') {
      return 0;
    }

    // Split by whitespace and filter out empty strings
    const words = text.trim().split(/\s+/).filter(word => word.length > 0);
    return words.length;
  }

  /**
   * Count sentences in text
   * 
   * @param {string} text - Text to count sentences in
   * @returns {number} Sentence count
   * @private
   */
  _countSentences(text) {
    if (!text || typeof text !== 'string') {
      return 0;
    }

    // Count sentence-ending punctuation
    const sentences = text.match(/[.!?]+/g);
    return sentences ? sentences.length : 0;
  }
}

module.exports = EmailCleansingService;
