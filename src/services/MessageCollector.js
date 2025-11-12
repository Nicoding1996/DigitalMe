/**
 * MessageCollector Service
 * 
 * Accumulates user messages in memory for batch processing and profile refinement.
 * Implements quality filtering and batch triggers based on message count or inactivity.
 */

class MessageCollector {
  constructor(learningEnabled = true) {
    this.learningEnabled = learningEnabled;
    this.messages = [];
    this.lastMessageTime = null;
    this.inactivityTimer = null;
    this.inactivityThreshold = 5 * 60 * 1000; // 5 minutes in milliseconds
    this.batchSizeThreshold = 10; // 10 messages trigger batch send
  }

  /**
   * Quality filter: Determines if a message should be included in the batch
   * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5
   */
  passesQualityFilter(messageText) {
    // Remove whitespace
    const trimmed = messageText.trim();
    
    // Reject empty messages (Requirement 6.3)
    if (trimmed.length === 0) {
      return false;
    }
    
    // Accept if contains code block (regardless of word count) (Requirement 6.5)
    if (trimmed.includes('```') || /`[^`]+`/.test(trimmed)) {
      return true;
    }
    
    // Count words (contractions = 1 word) (Requirement 6.4)
    const words = trimmed.split(/\s+/).filter(word => word.length > 0);
    const wordCount = words.length;
    
    // Accept if >= 10 words (Requirement 6.1)
    if (wordCount >= 10) {
      return true;
    }
    
    // Reject otherwise (Requirement 6.2)
    return false;
  }

  /**
   * Add a message to the batch
   * Requirements: 1.1, 1.2
   */
  addMessage(messageText) {
    // Only collect if learning is enabled (Requirement 1.2)
    if (!this.learningEnabled) {
      return;
    }

    // Apply quality filter
    if (!this.passesQualityFilter(messageText)) {
      return;
    }

    // Store message in memory (Requirement 1.1)
    this.messages.push(messageText);
    this.lastMessageTime = Date.now();

    // Reset inactivity timer
    this.resetInactivityTimer();
  }

  /**
   * Reset the inactivity timer
   * Starts a new timer that will trigger batch send after 5 minutes of inactivity
   */
  resetInactivityTimer() {
    // Clear existing timer
    if (this.inactivityTimer) {
      clearTimeout(this.inactivityTimer);
    }

    // Only set timer if we have messages and learning is enabled
    if (this.messages.length > 0 && this.learningEnabled) {
      this.inactivityTimer = setTimeout(() => {
        // Timer callback will be checked by shouldSendBatch()
        // The actual sending is handled by the caller
      }, this.inactivityThreshold);
    }
  }

  /**
   * Check if batch should be sent
   * Requirements: 1.3, 1.4
   */
  shouldSendBatch() {
    // No messages to send
    if (this.messages.length === 0) {
      return false;
    }

    // Trigger 1: 10 or more messages (Requirement 1.3)
    if (this.messages.length >= this.batchSizeThreshold) {
      return true;
    }

    // Trigger 2: 5 minutes of inactivity AND at least 1 message (Requirement 1.4)
    if (this.lastMessageTime) {
      const timeSinceLastMessage = Date.now() - this.lastMessageTime;
      if (timeSinceLastMessage >= this.inactivityThreshold) {
        return true;
      }
    }

    return false;
  }

  /**
   * Get current batch and clear it
   * Returns the accumulated messages and resets the collector
   */
  getBatch() {
    const batch = [...this.messages];
    this.clearBatch();
    return batch;
  }

  /**
   * Clear batch without sending
   * Requirements: 2.3
   */
  clearBatch() {
    this.messages = [];
    this.lastMessageTime = null;
    
    // Clear inactivity timer
    if (this.inactivityTimer) {
      clearTimeout(this.inactivityTimer);
      this.inactivityTimer = null;
    }
  }

  /**
   * Enable or disable learning
   * Requirements: 2.2, 2.3, 2.4
   */
  setLearningEnabled(enabled) {
    this.learningEnabled = enabled;
    
    // If disabling, clear pending batch (Requirement 2.3)
    if (!enabled) {
      this.clearBatch();
    } else {
      // If enabling, reset timer if we have messages (Requirement 2.4)
      if (this.messages.length > 0) {
        this.resetInactivityTimer();
      }
    }
  }

  /**
   * Get batch statistics
   */
  getStats() {
    const wordCount = this.messages.reduce((total, message) => {
      const words = message.trim().split(/\s+/).filter(word => word.length > 0);
      return total + words.length;
    }, 0);

    return {
      messageCount: this.messages.length,
      wordCount: wordCount
    };
  }

  /**
   * Check if learning is enabled
   */
  isLearningEnabled() {
    return this.learningEnabled;
  }

  /**
   * Get time since last message (in milliseconds)
   */
  getTimeSinceLastMessage() {
    if (!this.lastMessageTime) {
      return null;
    }
    return Date.now() - this.lastMessageTime;
  }
}

export default MessageCollector;
