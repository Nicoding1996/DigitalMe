/**
 * ProfileRefinerClient Service
 * Handles communication with the backend profile refinement endpoint
 * Implements retry logic and response validation for robust profile updates
 */

// ============================================================================
// CONSTANTS
// ============================================================================

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:3001';
const REFINEMENT_ENDPOINT = `${BACKEND_URL}/api/profile/refine`;
const RETRY_DELAY_MS = 2000;
const MAX_RETRIES = 1;
const STORAGE_KEY = 'digitalme_profile'; // Match App.js storage key

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Delay execution for specified milliseconds
 * @param {number} ms - Milliseconds to delay
 * @returns {Promise<void>}
 */
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Validate response structure from refinement endpoint
 * @param {Object} response - Response object to validate
 * @returns {boolean} True if response is valid
 */
const validateResponseStructure = (response) => {
  if (!response || typeof response !== 'object') {
    console.error('Invalid response: not an object');
    return false;
  }

  if (!response.success) {
    console.error('Response indicates failure');
    return false;
  }

  if (!response.updatedProfile || typeof response.updatedProfile !== 'object') {
    console.error('Invalid response: missing or invalid updatedProfile');
    return false;
  }

  // Validate updatedProfile has required structure
  const profile = response.updatedProfile;
  
  if (!profile.writing || typeof profile.writing !== 'object') {
    console.error('Invalid profile: missing or invalid writing section');
    return false;
  }

  if (!profile.coding || typeof profile.coding !== 'object') {
    console.error('Invalid profile: missing or invalid coding section');
    return false;
  }

  // Validate deltaReport if present
  if (response.deltaReport) {
    if (!Array.isArray(response.deltaReport.changes)) {
      console.error('Invalid deltaReport: changes is not an array');
      return false;
    }
  }

  return true;
};

/**
 * Save updated profile to localStorage
 * Requirements: 10.5 - Persist updated styleProfile immediately after refinement
 * @param {Object} profile - Style profile to save
 * @returns {boolean} True if save was successful
 */
const saveProfileToLocalStorage = (profile) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
    console.log('Profile saved to localStorage');
    return true;
  } catch (error) {
    console.error('Failed to save profile to localStorage:', error);
    return false;
  }
};

// ============================================================================
// PROFILE REFINER CLIENT CLASS
// ============================================================================

/**
 * Client for communicating with the profile refinement API
 */
class ProfileRefinerClient {
  constructor(backendUrl = BACKEND_URL) {
    this.backendUrl = backendUrl;
    this.refinementEndpoint = `${backendUrl}/api/profile/refine`;
  }

  /**
   * Send refinement request to backend
   * @param {Object} currentProfile - Current style profile
   * @param {string[]} newMessages - Array of user messages to analyze
   * @returns {Promise<Object>} Refinement result
   */
  async refineProfile(currentProfile, newMessages) {
    if (!currentProfile || typeof currentProfile !== 'object') {
      return {
        success: false,
        error: 'Invalid currentProfile: must be an object'
      };
    }

    if (!Array.isArray(newMessages) || newMessages.length === 0) {
      return {
        success: false,
        error: 'Invalid newMessages: must be a non-empty array'
      };
    }

    // Attempt refinement with retry logic
    let lastError = null;
    
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        console.log(`Refinement attempt ${attempt + 1}/${MAX_RETRIES + 1}`);
        
        const result = await this._sendRefinementRequest(currentProfile, newMessages);
        
        if (result.success) {
          // Validate response before returning
          if (!validateResponseStructure(result)) {
            throw new Error('Invalid response structure from server');
          }

          // Save to localStorage on success
          saveProfileToLocalStorage(result.updatedProfile);

          return result;
        } else {
          // Server returned error response
          lastError = result.error || 'Unknown server error';
          console.error('Server returned error:', lastError);
          
          // Don't retry on validation errors (400)
          if (result.code === 'VALIDATION_ERROR') {
            break;
          }
        }
      } catch (error) {
        lastError = error.message;
        console.error(`Refinement attempt ${attempt + 1} failed:`, error);
        
        // If this isn't the last attempt, wait before retrying
        if (attempt < MAX_RETRIES) {
          console.log(`Retrying in ${RETRY_DELAY_MS}ms...`);
          await delay(RETRY_DELAY_MS);
        }
      }
    }

    // All attempts failed
    console.error('All refinement attempts failed');
    return {
      success: false,
      error: lastError || 'Failed to refine profile after retries'
    };
  }

  /**
   * Internal method to send HTTP request to refinement endpoint
   * @param {Object} currentProfile - Current style profile
   * @param {string[]} newMessages - Array of user messages
   * @returns {Promise<Object>} Response from server
   * @private
   */
  async _sendRefinementRequest(currentProfile, newMessages) {
    const requestBody = {
      currentProfile,
      newMessages
    };

    console.log('Sending refinement request:', {
      messageCount: newMessages.length,
      totalWords: newMessages.join(' ').split(/\s+/).length
    });

    const response = await fetch(this.refinementEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    return data;
  }

  /**
   * Validate response structure (public method for testing)
   * @param {Object} response - Response to validate
   * @returns {boolean} True if valid
   */
  validateResponse(response) {
    return validateResponseStructure(response);
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export default ProfileRefinerClient;

// Export singleton instance for convenience
export const profileRefinerClient = new ProfileRefinerClient();

// Export utility functions for testing
export { validateResponseStructure, saveProfileToLocalStorage };
