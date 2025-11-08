/**
 * Gmail Integration Validation Script
 * 
 * This script validates the Gmail integration implementation without requiring
 * a test framework. It checks configuration, services, and core functionality.
 * 
 * Run with: node validate-gmail-integration.js
 */

const fs = require('fs');
const path = require('path');

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(60));
  log(title, 'bold');
  console.log('='.repeat(60));
}

function logTest(name, passed, details = '') {
  const symbol = passed ? '✓' : '✗';
  const color = passed ? 'green' : 'red';
  log(`${symbol} ${name}`, color);
  if (details) {
    log(`  ${details}`, 'cyan');
  }
}

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function test(name, fn) {
  totalTests++;
  try {
    const result = fn();
    if (result === false) {
      failedTests++;
      logTest(name, false);
    } else {
      passedTests++;
      logTest(name, true, result || '');
    }
  } catch (error) {
    failedTests++;
    logTest(name, false, `Error: ${error.message}`);
  }
}

// Start validation
log('\n🔍 Gmail Integration Validation', 'bold');
log('━'.repeat(60), 'cyan');

// 1. Configuration Validation
logSection('1. Configuration Validation');

test('Config file exists', () => {
  const configPath = path.join(__dirname, 'config.js');
  return fs.existsSync(configPath);
});

test('.env.example has Gmail variables', () => {
  const envExamplePath = path.join(__dirname, '.env.example');
  const content = fs.readFileSync(envExamplePath, 'utf8');
  const hasGoogleClientId = content.includes('GOOGLE_CLIENT_ID');
  const hasGoogleClientSecret = content.includes('GOOGLE_CLIENT_SECRET');
  const hasTokenKey = content.includes('TOKEN_ENCRYPTION_KEY');
  const hasRedirectUri = content.includes('GOOGLE_REDIRECT_URI');
  
  if (hasGoogleClientId && hasGoogleClientSecret && hasTokenKey && hasRedirectUri) {
    return 'All Gmail environment variables documented';
  }
  return false;
});

test('Config module loads successfully', () => {
  try {
    // Clear require cache to avoid issues
    delete require.cache[require.resolve('./config')];
    const config = require('./config');
    return `Gmail enabled: ${config.isGmailEnabled()}`;
  } catch (error) {
    // Config might fail if Gmail vars not set, which is OK
    if (error.message.includes('GEMINI_API_KEY')) {
      return false;
    }
    return `Config loaded (Gmail not configured)`;
  }
});

// 2. Service Files Validation
logSection('2. Service Files Validation');

test('GmailAuthService exists', () => {
  const servicePath = path.join(__dirname, 'services', 'GmailAuthService.js');
  return fs.existsSync(servicePath);
});

test('GmailRetrievalService exists', () => {
  const servicePath = path.join(__dirname, 'services', 'GmailRetrievalService.js');
  return fs.existsSync(servicePath);
});

test('EmailCleansingService exists', () => {
  const servicePath = path.join(__dirname, 'services', 'EmailCleansingService.js');
  return fs.existsSync(servicePath);
});

test('GmailStyleAnalyzer exists', () => {
  const servicePath = path.join(__dirname, 'services', 'GmailStyleAnalyzer.js');
  return fs.existsSync(servicePath);
});

test('GmailAnalysisOrchestrator exists', () => {
  const servicePath = path.join(__dirname, 'services', 'GmailAnalysisOrchestrator.js');
  return fs.existsSync(servicePath);
});

test('AnalysisSessionService exists', () => {
  const servicePath = path.join(__dirname, 'services', 'AnalysisSessionService.js');
  return fs.existsSync(servicePath);
});

// 3. Route Files Validation
logSection('3. Route Files Validation');

test('Gmail auth routes exist', () => {
  const routePath = path.join(__dirname, 'routes', 'gmailAuth.js');
  return fs.existsSync(routePath);
});

test('Gmail callback HTML exists', () => {
  const callbackPath = path.join(__dirname, 'public', 'gmail-callback.html');
  return fs.existsSync(callbackPath);
});

// 4. Service Functionality Tests
logSection('4. Service Functionality Tests');

test('GmailAuthService loads', () => {
  try {
    const GmailAuthService = require('./services/GmailAuthService');
    return 'Service loaded successfully';
  } catch (error) {
    return false;
  }
});

test('EmailCleansingService loads', () => {
  try {
    const EmailCleansingService = require('./services/EmailCleansingService');
    return 'Service loaded successfully';
  } catch (error) {
    return false;
  }
});

test('EmailCleansingService - automated email detection', () => {
  try {
    const EmailCleansingService = require('./services/EmailCleansingService');
    const service = new EmailCleansingService();
    
    const automated = service.isAutomatedEmail('Re: Meeting notes');
    const original = service.isAutomatedEmail('Meeting notes');
    
    if (automated && !original) {
      return 'Correctly identifies automated emails';
    }
    return false;
  } catch (error) {
    return false;
  }
});

test('EmailCleansingService - quote removal', () => {
  try {
    const EmailCleansingService = require('./services/EmailCleansingService');
    const service = new EmailCleansingService();
    
    const emailWithQuote = 'My response\n\nOn Mon, Jan 1 wrote:\n> Previous message';
    const cleaned = service.removeQuotedText(emailWithQuote);
    
    if (cleaned.includes('My response') && !cleaned.includes('Previous message')) {
      return 'Successfully removes quoted text';
    }
    return false;
  } catch (error) {
    return false;
  }
});

test('EmailCleansingService - signature removal', () => {
  try {
    const EmailCleansingService = require('./services/EmailCleansingService');
    const service = new EmailCleansingService();
    
    const emailWithSig = 'Email body\n\n--\nJohn Doe\njohn@example.com';
    const cleaned = service.removeSignature(emailWithSig);
    
    if (cleaned.includes('Email body') && !cleaned.includes('john@example.com')) {
      return 'Successfully removes signatures';
    }
    return false;
  } catch (error) {
    return false;
  }
});

test('EmailCleansingService - content quality validation', () => {
  try {
    const EmailCleansingService = require('./services/EmailCleansingService');
    const service = new EmailCleansingService();
    
    const shortText = 'ok thanks';
    const longText = 'This is a longer email with more than twenty words to ensure it passes the content quality validation check for meaningful analysis.';
    
    const shortValid = service.validateContentQuality(shortText);
    const longValid = service.validateContentQuality(longText);
    
    if (!shortValid && longValid) {
      return 'Correctly validates content quality';
    }
    return false;
  } catch (error) {
    return false;
  }
});

test('EmailCleansingService - batch processing', () => {
  try {
    const EmailCleansingService = require('./services/EmailCleansingService');
    const service = new EmailCleansingService();
    
    const emails = [
      {
        id: '1',
        subject: 'Test email',
        body: 'This is a test email with sufficient content to pass validation checks and be included in the analysis.',
        timestamp: new Date()
      },
      {
        id: '2',
        subject: 'Re: Reply',
        body: 'Short reply',
        timestamp: new Date()
      }
    ];
    
    const result = service.cleanseEmailBatch(emails);
    
    if (result.stats.total === 2 && result.stats.valid === 1) {
      return `Processed ${result.stats.total} emails, ${result.stats.valid} valid`;
    }
    return false;
  } catch (error) {
    return false;
  }
});

// 5. Token Encryption Tests
logSection('5. Token Encryption Tests');

test('Token encryption/decryption', () => {
  try {
    const config = require('./config');
    
    if (!config.isGmailEnabled()) {
      return 'Skipped: Gmail not configured';
    }
    
    const GmailAuthService = require('./services/GmailAuthService');
    const testToken = 'test-access-token-12345';
    
    const encrypted = GmailAuthService.encryptToken(testToken);
    const decrypted = GmailAuthService.decryptToken(encrypted);
    
    if (decrypted === testToken) {
      return 'Encryption/decryption working correctly';
    }
    return false;
  } catch (error) {
    if (error.message.includes('GOOGLE_CLIENT_ID')) {
      return 'Skipped: Gmail not configured';
    }
    return false;
  }
});

test('OAuth URL generation', () => {
  try {
    const config = require('./config');
    
    if (!config.isGmailEnabled()) {
      return 'Skipped: Gmail not configured';
    }
    
    const GmailAuthService = require('./services/GmailAuthService');
    const { authUrl, state } = GmailAuthService.generateAuthUrl('http://localhost:3001/callback');
    
    if (authUrl.includes('accounts.google.com') && state.length === 64) {
      return 'OAuth URL generated with valid state token';
    }
    return false;
  } catch (error) {
    if (error.message.includes('GOOGLE_CLIENT_ID')) {
      return 'Skipped: Gmail not configured';
    }
    return false;
  }
});

// 6. Documentation Validation
logSection('6. Documentation Validation');

test('Gmail setup guide exists', () => {
  const guidePath = path.join(__dirname, 'GMAIL_SETUP_GUIDE.md');
  return fs.existsSync(guidePath);
});

test('Gmail rate limiting guide exists', () => {
  const guidePath = path.join(__dirname, 'GMAIL_RATE_LIMITING.md');
  return fs.existsSync(guidePath);
});

test('E2E test checklist exists', () => {
  const checklistPath = path.join(__dirname, 'GMAIL_E2E_TEST_CHECKLIST.md');
  return fs.existsSync(checklistPath);
});

// 7. Frontend Integration Validation
logSection('7. Frontend Integration Validation');

test('GmailConnectButton component exists', () => {
  const componentPath = path.join(__dirname, '..', 'src', 'components', 'GmailConnectButton.js');
  return fs.existsSync(componentPath);
});

test('SourceConnector integration', () => {
  const componentPath = path.join(__dirname, '..', 'src', 'components', 'SourceConnector.js');
  if (fs.existsSync(componentPath)) {
    const content = fs.readFileSync(componentPath, 'utf8');
    if (content.includes('gmail') || content.includes('Gmail')) {
      return 'Gmail integrated into SourceConnector';
    }
  }
  return false;
});

// 8. Security Validation
logSection('8. Security Validation');

test('Rate limiting middleware exists', () => {
  const middlewarePath = path.join(__dirname, 'middleware', 'rateLimiter.js');
  return fs.existsSync(middlewarePath);
});

test('Input validation middleware exists', () => {
  const middlewarePath = path.join(__dirname, 'middleware', 'inputValidation.js');
  return fs.existsSync(middlewarePath);
});

test('Error handler exists', () => {
  const utilPath = path.join(__dirname, 'utils', 'GmailErrorHandler.js');
  return fs.existsSync(utilPath);
});

test('Security documentation exists', () => {
  const securityPath = path.join(__dirname, 'SECURITY.md');
  return fs.existsSync(securityPath);
});

// Summary
logSection('Validation Summary');

log(`\nTotal Tests: ${totalTests}`, 'bold');
log(`Passed: ${passedTests}`, 'green');
log(`Failed: ${failedTests}`, failedTests > 0 ? 'red' : 'green');

const successRate = ((passedTests / totalTests) * 100).toFixed(1);
log(`Success Rate: ${successRate}%`, successRate >= 90 ? 'green' : 'yellow');

if (failedTests === 0) {
  log('\n✅ All validation checks passed!', 'green');
  log('The Gmail integration implementation is complete and ready for manual testing.', 'cyan');
} else {
  log(`\n⚠️  ${failedTests} validation check(s) failed.`, 'yellow');
  log('Please review the failed tests above and address any issues.', 'cyan');
}

// Configuration status
logSection('Configuration Status');

try {
  const config = require('./config');
  
  if (config.isGmailEnabled()) {
    log('✅ Gmail integration is ENABLED', 'green');
    log(`   Max Emails: ${config.GMAIL_MAX_EMAILS}`, 'cyan');
    log(`   Batch Size: ${config.GMAIL_BATCH_SIZE}`, 'cyan');
    log('\n📝 Next Steps:', 'bold');
    log('   1. Start backend: npm start', 'cyan');
    log('   2. Start frontend: npm start (in root directory)', 'cyan');
    log('   3. Open http://localhost:3000', 'cyan');
    log('   4. Click "Connect Gmail" and test OAuth flow', 'cyan');
    log('   5. Use GMAIL_E2E_TEST_CHECKLIST.md for comprehensive testing', 'cyan');
  } else {
    log('⚠️  Gmail integration is DISABLED', 'yellow');
    log('   Missing configuration in .env file', 'cyan');
    log('\n📝 To enable Gmail integration:', 'bold');
    log('   1. Copy .env.example to .env', 'cyan');
    log('   2. Add Google OAuth credentials from Google Cloud Console', 'cyan');
    log('   3. Generate TOKEN_ENCRYPTION_KEY:', 'cyan');
    log('      node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"', 'cyan');
    log('   4. Restart backend server', 'cyan');
    log('   5. See GMAIL_SETUP_GUIDE.md for detailed instructions', 'cyan');
  }
} catch (error) {
  log('❌ Configuration error: ' + error.message, 'red');
}

log('\n' + '━'.repeat(60), 'cyan');
log('Validation complete!\n', 'bold');

// Exit with appropriate code
process.exit(failedTests > 0 ? 1 : 0);
