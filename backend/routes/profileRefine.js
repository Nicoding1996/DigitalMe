/**
 * Profile Refinement Routes
 * 
 * Handles profile refinement requests from the Living Profile feature.
 * Processes batches of user messages and updates style profiles incrementally.
 * 
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 7.5
 */

const express = require('express');
const router = express.Router();
const ProfileRefinerService = require('../services/ProfileRefinerService');
const { validateProfileRefineMiddleware } = require('../validation');
const { rateLimiter } = require('../middleware/rateLimiter');

// Initialize refiner service
const refinerService = new ProfileRefinerService();

// Create rate limiter for profile refinement (max 10 refinements per hour)
// Requirement 4.1 (optional subtask 2.1)
const profileRefineLimiter = rateLimiter.createLimiter({
  maxRequests: 10,
  windowMs: 60 * 60 * 1000, // 1 hour
  message: 'Profile refinement rate limit exceeded. Maximum 10 refinements per hour.',
  keyGenerator: (req) => {
    // Use user ID from profile if available, otherwise fall back to IP
    return req.body?.currentProfile?.userId || req.ip;
  }
});

/**
 * POST /api/profile/refine
 * 
 * Refines an existing style profile based on new conversation messages.
 * Uses confidence-weighted pattern merging to incrementally improve the profile.
 * 
 * Request Body:
 * - currentProfile: Object - Current style profile
 * - newMessages: string[] - Array of user messages (1-50 messages)
 * 
 * Response:
 * - success: boolean - Whether refinement succeeded
 * - updatedProfile: Object - Updated style profile (on success)
 * - deltaReport: Object - Summary of changes (on success)
 * - error: string - Error message (on failure)
 * - code: string - Error code (on failure)
 * 
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 7.5
 */
router.post('/refine', profileRefineLimiter, validateProfileRefineMiddleware, async (req, res) => {
  try {
    const { currentProfile, newMessages } = req.body;
    
    console.log(`[Profile Refiner] Processing ${newMessages.length} messages`);
    
    // Perform refinement using ProfileRefinerService (Requirement 4.4)
    const result = await refinerService.refineProfile(currentProfile, newMessages);
    
    // Check if refinement succeeded
    if (!result.success) {
      console.error('[Profile Refiner] Refinement failed:', result.error);
      
      // Return analysis error (Requirement 4.5)
      return res.status(500).json({
        success: false,
        error: 'analysis_error',
        message: 'Failed to analyze messages and refine profile',
        code: 'ANALYSIS_ERROR'
      });
    }
    
    // Validate response structure before returning (Requirement 7.5)
    if (!result.updatedProfile || !result.deltaReport) {
      console.error('[Profile Refiner] Invalid refinement result structure');
      
      return res.status(500).json({
        success: false,
        error: 'internal_error',
        message: 'Refinement completed but response structure is invalid',
        code: 'INTERNAL_ERROR'
      });
    }
    
    console.log(`[Profile Refiner] Success: ${result.deltaReport.changes.length} changes, confidence: ${result.updatedProfile.confidence}`);
    
    // Return success response with updated profile and delta report (Requirement 4.5)
    res.json({
      success: true,
      updatedProfile: result.updatedProfile,
      deltaReport: result.deltaReport
    });
    
  } catch (error) {
    // SECURITY: Log errors without exposing sensitive information
    console.error('[Profile Refiner] Unexpected error:', error.message);
    console.error('[Profile Refiner] Error stack:', error.stack);
    
    // Return internal error response (Requirement 4.5)
    res.status(500).json({
      success: false,
      error: 'internal_error',
      message: 'An unexpected error occurred during profile refinement',
      code: 'INTERNAL_ERROR'
    });
  }
});

module.exports = router;
