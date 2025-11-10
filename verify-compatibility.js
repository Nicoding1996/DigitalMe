/**
 * Compatibility Verification Runner
 * Run this script to verify backward compatibility manually
 * 
 * Usage: node verify-compatibility.js
 */

// Import the verification module
const verification = require('./src/services/BackwardCompatibilityVerification');

// Run all verifications
verification.runAllVerifications()
  .then(success => {
    if (success) {
      console.log('✅ Verification complete - All checks passed');
      process.exit(0);
    } else {
      console.log('❌ Verification failed - Some checks did not pass');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('❌ Verification error:', error);
    process.exit(1);
  });
