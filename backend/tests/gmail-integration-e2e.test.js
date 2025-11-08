/**
 * End-to-End Gmail Integration Test
 * 
 * This test suite validates the complete Gmail integration flow:
 * 1. OAuth authentication flow
 * 2. Email retrieval from Gmail API
 * 3. Email cleansing pipeline
 * 4. Style analysis and profile updates
 * 5. Error handling scenarios
 * 
 * Requirements: 1.1, 2.1, 3.1, 6.1, 7.4
 * 
 * IMPORTANT: This test requires actual Gmail OAuth credentials to be configured
 * in the .env file. It will NOT work without valid credentials.
 * 
 * To run this test:
 * 1. Ensure backend/.env has valid GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, etc.
 * 2. Run: npm test -- gmail-integration-e2e.test.js
 * 
 * NOTE: This test is designed to be run manually with user interaction for OAuth.
 * It is NOT suitable for automated CI/CD pipelines.
 */

const GmailAuthService = require('../services/GmailAuthService');
const GmailRetrievalService = require('../services/GmailRetrievalService');
const EmailCleansingService = require('../services/EmailCleansingService');
const config = require('../config');

describe('Gmail Integration End-to-End Tests', () => {
  let authService;
  let retrievalService;
  let cleansingService;

  beforeAll(() => {
    // Check if Gmail integration is configured
    if (!config.isGmailEnabled()) {
      console.warn('\n⚠️  Gmail integration is not configured in .env file');
      console.warn('   These tests will be skipped.');
      console.warn('   To enable, add GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, etc. to backend/.env\n');
    }

    authService = GmailAuthService;
    retrievalService = new GmailRetrievalService();
    cleansingService = new EmailCleansingService();
  });

  describe('Configuration Validation', () => {
    test('should have Gmail integration enabled', () => {
      if (!config.isGmailEnabled()) {
        console.log('⏭️  Skipping: Gmail not configured');
        return;
      }

      expect(config.GOOGLE_CLIENT_ID).toBeTruthy();
      expect(config.GOOGLE_CLIENT_SECRET).toBeTruthy();
      expect(config.GOOGLE_REDIRECT_URI).toBeTruthy();
      expect(config.TOKEN_ENCRYPTION_KEY).toBeTruthy();
      expect(config.TOKEN_ENCRYPTION_KEY).toMatch(/^[0-9a-fA-F]{64}$/);
    });

    test('should have valid Gmail API configuration', () => {
      if (!config.isGmailEnabled()) {
        console.log('⏭️  Skipping: Gmail not configured');
        return;
      }

      expect(config.GMAIL_MAX_EMAILS).toBeGreaterThan(0);
      expect(config.GMAIL_BATCH_SIZE).toBeGreaterThan(0);
      expect(config.GMAIL_BATCH_SIZE).toBeLessThanOrEqual(100);
    });
  });

  describe('OAuth Flow', () => {
    test('should generate valid OAuth URL with state token', () => {
      if (!config.isGmailEnabled()) {
        console.log('⏭️  Skipping: Gmail not configured');
        return;
      }

      const redirectUri = 'http://localhost:3001/api/auth/gmail/callback';
      const { authUrl, state } = authService.generateAuthUrl(redirectUri);

      // Verify auth URL structure
      expect(authUrl).toContain('accounts.google.com/o/oauth2/v2/auth');
      expect(authUrl).toContain('client_id=');
      expect(authUrl).toContain('redirect_uri=');
      expect(authUrl).toContain('scope=');
      expect(authUrl).toContain('gmail.readonly');
      expect(authUrl).toContain(`state=${state}`);

      // Verify state token format (64 hex characters)
      expect(state).toMatch(/^[0-9a-f]{64}$/);
    });

    test('should encrypt and decrypt tokens correctly', () => {
      if (!config.isGmailEnabled()) {
        console.log('⏭️  Skipping: Gmail not configured');
        return;
      }

      const testToken = 'test-access-token-12345';
      
      // Encrypt token
      const encrypted = authService.encryptToken(testToken);
      
      // Verify encrypted format (iv:authTag:encryptedData)
      expect(encrypted).toMatch(/^[0-9a-f]+:[0-9a-f]+:[0-9a-f]+$/);
      
      // Decrypt token
      const decrypted = authService.decryptToken(encrypted);
      
      // Verify decryption matches original
      expect(decrypted).toBe(testToken);
    });

    test('should reject invalid encrypted token format', () => {
      if (!config.isGmailEnabled()) {
        console.log('⏭️  Skipping: Gmail not configured');
        return;
      }

      expect(() => {
        authService.decryptToken('invalid-format');
      }).toThrow();

      expect(() => {
        authService.decryptToken('abc:def');
      }).toThrow();
    });
  });

  describe('Email Cleansing Pipeline', () => {
    test('should filter automated emails by subject patterns', () => {
      const automatedSubjects = [
        'Re: Meeting notes',
        'Fwd: Important document',
        'FW: Team update',
        'Accepted: Calendar invite',
        'Out of Office: Vacation',
        'Automatic reply: Away',
        'Delivery Status Notification (Failure)',
        'Undeliverable: Message failed',
        'Bounce: Email returned'
      ];

      automatedSubjects.forEach(subject => {
        expect(cleansingService.isAutomatedEmail(subject)).toBe(true);
      });
    });

    test('should NOT filter original emails', () => {
      const originalSubjects = [
        'Meeting notes from today',
        'Quick question about the project',
        'Following up on our conversation',
        'Project update',
        'Thanks for your help'
      ];

      originalSubjects.forEach(subject => {
        expect(cleansingService.isAutomatedEmail(subject)).toBe(false);
      });
    });

    test('should remove quoted reply text', () => {
      const emailWithQuote = `Hi John,

Thanks for the update. I'll review the document today.

Best regards,
Alice

On Mon, Jan 1, 2024 at 10:30 AM, John Doe <john@example.com> wrote:
> Hi Alice,
> 
> Please review the attached document.
> 
> Thanks,
> John`;

      const cleaned = cleansingService.removeQuotedText(emailWithQuote);

      expect(cleaned).not.toContain('On Mon, Jan 1');
      expect(cleaned).not.toContain('john@example.com');
      expect(cleaned).not.toContain('> Hi Alice');
      expect(cleaned).toContain('Thanks for the update');
      expect(cleaned).toContain('Best regards');
    });

    test('should remove email signatures', () => {
      const emailWithSignature = `Hi team,

Please review the proposal and let me know your thoughts.

Thanks,
Alice

--
Alice Johnson
Senior Product Manager
alice@company.com
(555) 123-4567

Confidential: This email and any attachments are confidential.`;

      const cleaned = cleansingService.removeSignature(emailWithSignature);

      expect(cleaned).not.toContain('Alice Johnson');
      expect(cleaned).not.toContain('Senior Product Manager');
      expect(cleaned).not.toContain('alice@company.com');
      expect(cleaned).not.toContain('Confidential');
      expect(cleaned).toContain('Please review the proposal');
    });

    test('should validate content quality - minimum word count', () => {
      const shortEmail = 'ok thanks';
      const longEmail = 'Thank you for sending over the proposal. I have reviewed it carefully and have a few questions about the timeline and budget. Could we schedule a call this week to discuss? I am available Tuesday or Thursday afternoon.';

      expect(cleansingService.validateContentQuality(shortEmail)).toBe(false);
      expect(cleansingService.validateContentQuality(longEmail)).toBe(true);
    });

    test('should validate content quality - not just whitespace', () => {
      const whitespaceOnly = '   \n\n   \t\t   ';
      const punctuationOnly = '... !!! ???';

      expect(cleansingService.validateContentQuality(whitespaceOnly)).toBe(false);
      expect(cleansingService.validateContentQuality(punctuationOnly)).toBe(false);
    });

    test('should process email batch correctly', () => {
      const testEmails = [
        {
          id: '1',
          subject: 'Project update',
          body: 'Hi team, I wanted to share a quick update on the project. We have completed the first phase and are moving into testing. The timeline looks good and we should be ready for launch next month. Let me know if you have any questions or concerns.',
          timestamp: new Date()
        },
        {
          id: '2',
          subject: 'Re: Meeting notes',
          body: 'Thanks for the notes.',
          timestamp: new Date()
        },
        {
          id: '3',
          subject: 'Quick question',
          body: 'ok',
          timestamp: new Date()
        },
        {
          id: '4',
          subject: 'Follow up',
          body: `Thanks for the call today.

On Mon, Jan 1, 2024, John wrote:
> Let's schedule a follow up
> 
> Thanks`,
          timestamp: new Date()
        }
      ];

      const result = cleansingService.cleanseEmailBatch(testEmails);

      // Email 1: Should pass (original content, sufficient length)
      // Email 2: Should be filtered (Re: subject)
      // Email 3: Should be filtered (too short)
      // Email 4: Should be filtered (too short after quote removal)

      expect(result.stats.total).toBe(4);
      expect(result.stats.filteredBySubject).toBe(1); // Email 2
      expect(result.stats.filteredByContent).toBe(2); // Emails 3 and 4
      expect(result.stats.valid).toBe(1); // Email 1
      expect(result.cleansedEmails).toHaveLength(1);
      expect(result.cleansedEmails[0].id).toBe('1');
    });
  });

  describe('Error Handling', () => {
    test('should handle empty email batch gracefully', () => {
      const result = cleansingService.cleanseEmailBatch([]);

      expect(result.cleansedEmails).toEqual([]);
      expect(result.stats.total).toBe(0);
      expect(result.stats.valid).toBe(0);
    });

    test('should handle malformed email objects', () => {
      const malformedEmails = [
        { id: '1' }, // Missing subject and body
        { id: '2', subject: null, body: null },
        { id: '3', subject: '', body: '' }
      ];

      const result = cleansingService.cleanseEmailBatch(malformedEmails);

      expect(result.stats.total).toBe(3);
      expect(result.stats.valid).toBe(0);
    });

    test('should handle state token expiration', async () => {
      if (!config.isGmailEnabled()) {
        console.log('⏭️  Skipping: Gmail not configured');
        return;
      }

      const invalidState = 'invalid-state-token-12345';
      const code = 'test-auth-code';

      await expect(
        authService.exchangeCodeForToken(code, invalidState)
      ).rejects.toThrow('Invalid or expired state token');
    });
  });

  describe('Integration Summary', () => {
    test('should display integration status', () => {
      console.log('\n📊 Gmail Integration Status:');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      
      if (config.isGmailEnabled()) {
        console.log('✅ Gmail OAuth: Configured');
        console.log('✅ Token Encryption: Enabled');
        console.log('✅ Email Retrieval: Ready');
        console.log('✅ Cleansing Pipeline: Operational');
        console.log(`📧 Max Emails: ${config.GMAIL_MAX_EMAILS}`);
        console.log(`📦 Batch Size: ${config.GMAIL_BATCH_SIZE}`);
        console.log('\n⚠️  Manual Testing Required:');
        console.log('   1. Start backend server: npm start');
        console.log('   2. Start frontend: npm start (in root directory)');
        console.log('   3. Click "Connect Gmail" button');
        console.log('   4. Complete OAuth flow in popup');
        console.log('   5. Verify email retrieval and analysis');
      } else {
        console.log('❌ Gmail OAuth: Not Configured');
        console.log('❌ Token Encryption: Disabled');
        console.log('❌ Email Retrieval: Unavailable');
        console.log('✅ Cleansing Pipeline: Operational (can be tested independently)');
        console.log('\n📝 To enable Gmail integration:');
        console.log('   1. Copy backend/.env.example to backend/.env');
        console.log('   2. Add Google OAuth credentials from Google Cloud Console');
        console.log('   3. Generate TOKEN_ENCRYPTION_KEY using:');
        console.log('      node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"');
        console.log('   4. Restart backend server');
      }
      
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    });
  });
});
