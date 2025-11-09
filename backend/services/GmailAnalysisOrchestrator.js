/**
 * Gmail Analysis Orchestrator
 * 
 * Coordinates the complete Gmail analysis flow:
 * 1. OAuth authentication
 * 2. Email retrieval from Gmail
 * 3. Content cleansing and filtering
 * 4. Style pattern extraction
 * 5. Style profile update
 * 
 * Implements progress tracking, error handling, and rollback for failed analyses.
 * 
 * Requirements: 2.5, 6.1, 6.4, 6.5, 7.4, 7.5
 */

const GmailRetrievalService = require('./GmailRetrievalService');
const EmailCleansingService = require('./EmailCleansingService');
const GmailStyleAnalyzer = require('./GmailStyleAnalyzer');
const analysisSessionService = require('./AnalysisSessionService');
const GmailErrorHandler = require('../utils/GmailErrorHandler');

class GmailAnalysisOrchestrator {
  constructor() {
    this.retrievalService = new GmailRetrievalService();
    this.cleansingService = new EmailCleansingService();
    this.styleAnalyzer = new GmailStyleAnalyzer();
  }

  /**
   * Execute complete Gmail analysis flow
   * 
   * Orchestrates all steps of the analysis process with progress tracking
   * and error handling. Only updates style profile on successful completion.
   * 
   * @param {string} sessionId - Session identifier for tracking
   * @param {string} accessToken - Decrypted Gmail access token
   * @param {Object} existingProfile - Current style profile (optional)
   * @returns {Promise<Object>} Analysis result with updated profile
   * 
   * Requirements: 2.5, 6.1, 6.4, 6.5, 7.4, 7.5
   */
  async executeAnalysis(sessionId, accessToken, existingProfile = null) {
    try {
      // Create analysis session
      analysisSessionService.createSession(sessionId);
      
      // Step 1: Retrieve emails from Gmail
      // Requirements: 2.5, 7.4
      console.log(`[${sessionId}] Starting email retrieval`);
      analysisSessionService.updateRetrieving(sessionId, 0);
      
      const emails = await this.retrievalService.fetchSentEmails(accessToken);
      
      if (!emails || emails.length === 0) {
        throw new Error('No emails retrieved from Gmail');
      }
      
      console.log(`[${sessionId}] Retrieved ${emails.length} emails`);
      analysisSessionService.updateRetrieving(sessionId, emails.length);
      
      // Step 2: Cleanse email content
      // Requirements: 6.4, 7.4
      console.log(`[${sessionId}] Starting email cleansing`);
      analysisSessionService.updateCleansing(sessionId, 0);
      
      const cleansingResult = this.cleansingService.cleanseEmailBatch(emails);
      const { cleansedEmails, stats } = cleansingResult;
      
      if (!cleansedEmails || cleansedEmails.length === 0) {
        throw new Error('ANALYSIS_INSUFFICIENT_EMAILS: No valid emails after cleansing. All emails were filtered out.');
      }
      
      // Require at least 5 valid emails for meaningful analysis
      if (cleansedEmails.length < 5) {
        throw new Error(`ANALYSIS_INSUFFICIENT_EMAILS: Found ${cleansedEmails.length} valid emails, need at least 5.`);
      }
      
      console.log(`[${sessionId}] Cleansed ${cleansedEmails.length} emails (filtered ${stats.filteredBySubject + stats.filteredByContent})`);
      
      // Create partial success message if many emails were filtered
      const partialSuccessInfo = GmailErrorHandler.createPartialSuccessMessage(
        emails.length,
        cleansedEmails.length,
        stats.filteredBySubject + stats.filteredByContent
      );
      
      // Update session with cleansing stats and partial success message if applicable
      analysisSessionService.updateCleansing(sessionId, stats.filteredBySubject + stats.filteredByContent);
      
      if (partialSuccessInfo.severity === 'warning') {
        console.warn(`[${sessionId}] ${partialSuccessInfo.message}`);
      }
      
      // Step 3: Analyze writing patterns
      // Requirements: 6.1, 6.4, 7.4
      console.log(`[${sessionId}] Starting style analysis`);
      analysisSessionService.updateAnalyzing(sessionId, cleansedEmails.length);
      
      const analysisResult = await this.styleAnalyzer.analyzeEmailContent(cleansedEmails);
      
      if (!analysisResult.success) {
        throw new Error(`Style analysis failed: ${analysisResult.error}`);
      }
      
      console.log(`[${sessionId}] Analysis complete - extracted patterns from ${analysisResult.metadata.emailCount} emails`);
      
      // Step 4: Merge with existing profile
      // Requirements: 6.5
      const updatedProfile = this.styleAnalyzer.mergeWithExistingProfile(
        analysisResult.patterns,
        existingProfile
      );
      
      // Add metadata to patterns for profile update
      updatedProfile.metadata = analysisResult.metadata;
      
      // Step 5: Mark analysis as complete
      // Requirements: 7.4, 7.5
      const patternsCount = Object.keys(analysisResult.patterns).length;
      analysisSessionService.updateComplete(sessionId, patternsCount, updatedProfile);
      
      console.log(`[${sessionId}] Gmail analysis completed successfully`);
      
      return {
        success: true,
        profile: updatedProfile,
        stats: {
          emailsRetrieved: emails.length,
          emailsFiltered: stats.filteredBySubject + stats.filteredByContent,
          emailsAnalyzed: cleansedEmails.length,
          patternsExtracted: patternsCount,
          totalWords: analysisResult.metadata.wordCount,
          confidence: analysisResult.metadata.confidence
        }
      };
      
    } catch (error) {
      // Error handling and rollback
      // Requirements: 6.5, 7.5
      console.error(`[${sessionId}] Analysis failed:`, error.message);
      
      // Classify error and get user-friendly message
      const context = this._determineErrorContext(error.message);
      const errorInfo = GmailErrorHandler.handleError(error, context);
      
      // Update session with user-friendly error message
      analysisSessionService.updateError(sessionId, errorInfo.message);
      
      // Return error result without modifying existing profile
      return {
        success: false,
        error: errorInfo.message,
        errorCode: errorInfo.code,
        canRetry: errorInfo.canRetry,
        userAction: errorInfo.userAction,
        profile: existingProfile, // Return unchanged profile
        stats: null
      };
    }
  }

  /**
   * Determine error context from error message
   * 
   * @param {string} errorMessage - Error message
   * @returns {string} Error context
   * @private
   */
  _determineErrorContext(errorMessage) {
    if (errorMessage.includes('GMAIL_')) {
      return 'gmail_api';
    } else if (errorMessage.includes('retriev') || errorMessage.includes('fetch')) {
      return 'retrieval';
    } else if (errorMessage.includes('cleans') || errorMessage.includes('filter')) {
      return 'cleansing';
    } else if (errorMessage.includes('ANALYSIS_') || errorMessage.includes('analyz')) {
      return 'analysis';
    } else {
      return 'unknown';
    }
  }

  /**
   * Get analysis progress for a session
   * 
   * Retrieves current progress and statistics for an ongoing analysis.
   * 
   * @param {string} sessionId - Session identifier
   * @returns {Object|null} Session progress or null if not found
   * 
   * Requirements: 7.1, 7.2, 7.3, 7.4
   */
  getAnalysisProgress(sessionId) {
    return analysisSessionService.getSession(sessionId);
  }

  /**
   * Cancel an ongoing analysis
   * 
   * Stops the analysis and cleans up the session.
   * Note: Cannot stop in-flight API calls, but prevents further processing.
   * 
   * @param {string} sessionId - Session identifier
   * @returns {boolean} True if cancelled, false if not found
   */
  cancelAnalysis(sessionId) {
    const session = analysisSessionService.getSession(sessionId);
    
    if (!session) {
      return false;
    }
    
    // Mark as error to stop any pending operations
    analysisSessionService.updateError(sessionId, 'Analysis cancelled by user');
    
    // Delete session after a short delay to allow status check
    setTimeout(() => {
      analysisSessionService.deleteSession(sessionId);
    }, 5000);
    
    return true;
  }

  /**
   * Validate prerequisites for analysis
   * 
   * Checks that all required services and configuration are available.
   * 
   * @returns {Object} Validation result
   */
  validatePrerequisites() {
    const errors = [];
    
    if (!this.retrievalService) {
      errors.push('Gmail Retrieval Service not initialized');
    }
    
    if (!this.cleansingService) {
      errors.push('Email Cleansing Service not initialized');
    }
    
    if (!this.styleAnalyzer) {
      errors.push('Gmail Style Analyzer not initialized');
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }
}

module.exports = GmailAnalysisOrchestrator;
