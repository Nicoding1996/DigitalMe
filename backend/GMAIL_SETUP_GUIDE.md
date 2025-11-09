# Gmail Integration Setup Guide

**Status: ✅ FULLY FUNCTIONAL**

This guide walks you through setting up Google OAuth 2.0 credentials for the Gmail integration feature in DigitalMe.

## Overview

The Gmail integration allows users to securely connect their Gmail account to analyze their sent emails for writing style patterns. This feature uses OAuth 2.0 for authentication and requests read-only access exclusively to the user's Sent folder.

### What Works:
- ✅ OAuth 2.0 authentication flow
- ✅ Email retrieval from Sent folder
- ✅ Email content cleansing and filtering
- ✅ Writing style analysis using Gemini AI
- ✅ Profile generation and storage
- ✅ Integration with main application flow

## Prerequisites

- A Google account
- Access to [Google Cloud Console](https://console.cloud.google.com)
- Node.js installed (for generating encryption keys)

---

## Step 1: Create a Google Cloud Project

1. Navigate to [Google Cloud Console](https://console.cloud.google.com)
2. Click the project dropdown at the top of the page
3. Click **"New Project"**
4. Enter a project name (e.g., "DigitalMe Gmail Integration")
5. Click **"Create"**
6. Wait for the project to be created and select it from the project dropdown

---

## Step 2: Enable Gmail API

1. In your Google Cloud project, navigate to **"APIs & Services" > "Library"**
2. Search for **"Gmail API"**
3. Click on **"Gmail API"** in the results
4. Click the **"Enable"** button
5. Wait for the API to be enabled (this may take a few seconds)

---

## Step 3: Configure OAuth Consent Screen

Before creating credentials, you must configure the OAuth consent screen.

### 3.1 Basic Configuration

1. Navigate to **"APIs & Services" > "OAuth consent screen"**
2. Select **"External"** user type (unless you have a Google Workspace account)
3. Click **"Create"**

### 3.2 App Information

Fill in the required fields:

- **App name**: `DigitalMe` (or your application name)
- **User support email**: Your email address
- **App logo**: (Optional) Upload your app logo
- **Application home page**: `http://localhost:3000` (development) or your production URL
- **Application privacy policy link**: (Optional) Link to your privacy policy
- **Application terms of service link**: (Optional) Link to your terms of service
- **Authorized domains**: Add `localhost` for development
- **Developer contact information**: Your email address

Click **"Save and Continue"**

### 3.3 Scopes

1. Click **"Add or Remove Scopes"**
2. Search for **"Gmail API"**
3. Select the following scope:
   - `https://www.googleapis.com/auth/gmail.readonly` - Read all resources and their metadata
4. Click **"Update"**
5. Click **"Save and Continue"**

**Important**: The application will further restrict access to only the Sent folder using the `in:sent` query parameter.

### 3.4 Test Users (Development Only)

For development and testing:

1. Click **"Add Users"**
2. Add email addresses of users who will test the integration
3. Click **"Add"**
4. Click **"Save and Continue"**

**Note**: In testing mode, only added test users can authenticate. To make the app available to all users, you'll need to submit for verification (see Step 6).

### 3.5 Summary

Review your configuration and click **"Back to Dashboard"**

---

## Step 4: Create OAuth 2.0 Credentials

1. Navigate to **"APIs & Services" > "Credentials"**
2. Click **"Create Credentials"** at the top
3. Select **"OAuth client ID"**
4. Choose **"Web application"** as the application type

### 4.1 Configure OAuth Client

Fill in the following:

- **Name**: `DigitalMe Web Client` (or any descriptive name)

### 4.2 Authorized JavaScript Origins

Add the following origins:

**Development:**
```
http://localhost:3000
http://localhost:3001
```

**Production:**
```
https://yourdomain.com
```

### 4.3 Authorized Redirect URIs

Add the following redirect URIs:

**Development:**
```
http://localhost:3001/api/auth/gmail/callback
```

**Production:**
```
https://yourdomain.com/api/auth/gmail/callback
```

**Important**: The redirect URI must match exactly with the `GOOGLE_REDIRECT_URI` in your `.env` file.

### 4.4 Create and Download Credentials

1. Click **"Create"**
2. A dialog will appear with your **Client ID** and **Client Secret**
3. Copy these values - you'll need them for your `.env` file
4. Click **"OK"**

---

## Step 5: Configure Environment Variables

1. Navigate to your backend directory
2. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

3. Open `.env` and update the Gmail configuration:

```bash
# Google OAuth Configuration
GOOGLE_CLIENT_ID=your-actual-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-actual-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3001/api/auth/gmail/callback

# Token Encryption Key
TOKEN_ENCRYPTION_KEY=your-generated-64-character-hex-key

# Gmail API Configuration (optional - defaults are fine)
GMAIL_MAX_EMAILS=200
GMAIL_BATCH_SIZE=50
```

### 5.1 Generate Token Encryption Key

Generate a secure encryption key using Node.js:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copy the output and paste it as the value for `TOKEN_ENCRYPTION_KEY`.

**Example output:**
```
a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2
```

---

## Step 6: Testing the Integration

### 6.1 Start the Backend Server

```bash
cd backend
npm install
npm start
```

The server should start on `http://localhost:3001`

### 6.2 Start the Frontend

```bash
cd ..
npm start
```

The frontend should open at `http://localhost:3000`

### 6.3 Test OAuth Flow

1. Navigate to the source connection page in the app
2. Click **"Connect Gmail Account"**
3. You should be redirected to Google's OAuth consent screen
4. Sign in with a test user account (if in testing mode)
5. Review the permissions (read-only access to Gmail)
6. Click **"Allow"**
7. You should be redirected back to the app
8. The app will begin retrieving and analyzing your sent emails

### 6.4 Verify Success

Check for:
- ✅ OAuth popup opens successfully
- ✅ Google consent screen displays correctly
- ✅ Redirect back to app after authorization
- ✅ Progress messages display during analysis
- ✅ Success message with email count
- ✅ Style profile updated with Gmail source

---

## Step 7: Production Deployment (Optional)

### 7.1 App Verification

To make your app available to all users (not just test users), you need to submit for verification:

1. Navigate to **"OAuth consent screen"** in Google Cloud Console
2. Click **"Publish App"**
3. Click **"Prepare for Verification"**
4. Follow Google's verification process (may take several weeks)

**Requirements for verification:**
- Privacy policy URL
- Terms of service URL
- App homepage
- Justification for requested scopes
- Video demonstration of the app

### 7.2 Update Production Credentials

1. Create separate OAuth credentials for production
2. Update authorized origins and redirect URIs with production URLs
3. Update production `.env` file with new credentials
4. Ensure `GOOGLE_REDIRECT_URI` matches the production callback URL

---

## Gmail API Quota Limits

### Default Quotas

Google provides the following default quotas for Gmail API:

| Resource | Quota |
|----------|-------|
| Queries per day | 1,000,000,000 units |
| Queries per 100 seconds per user | 250 units |
| Queries per 100 seconds | 25,000 units |

### Quota Costs

Different API operations consume different amounts of quota:

| Operation | Approximate Cost |
|-----------|------------------|
| `users.messages.list` | 5 units |
| `users.messages.get` | 5 units |
| Batch request (50 messages) | ~250 units |

### DigitalMe Usage Estimate

For a typical user analysis (200 emails):

1. **List sent emails**: 1 request × 5 units = 5 units
2. **Fetch email content**: 4 batch requests × 50 units = 200 units
3. **Total per user**: ~205 units

**Daily capacity**: 1,000,000,000 ÷ 205 = ~4.8 million user analyses per day

### Rate Limiting Strategy

The backend implements the following rate limiting:

1. **Per-user limit**: 10 Gmail analyses per hour
2. **Exponential backoff**: Automatic retry with increasing delays on rate limit errors
3. **Batch processing**: Fetches 50 emails per request to minimize API calls
4. **Session timeout**: Analysis sessions expire after 1 hour

### Monitoring Quota Usage

1. Navigate to **"APIs & Services" > "Dashboard"** in Google Cloud Console
2. Click on **"Gmail API"**
3. View quota usage graphs and metrics
4. Set up quota alerts if needed

---

## Troubleshooting

### Error: "redirect_uri_mismatch"

**Cause**: The redirect URI in your request doesn't match the authorized redirect URIs in Google Cloud Console.

**Solution**:
1. Check your `GOOGLE_REDIRECT_URI` in `.env`
2. Verify it matches exactly with the authorized redirect URI in Google Cloud Console
3. Ensure there are no trailing slashes or typos
4. Restart your backend server after changing `.env`

### Error: "access_denied"

**Cause**: User denied permission or app is not verified.

**Solution**:
- If in testing mode, ensure the user is added as a test user
- Check that Gmail API is enabled
- Verify OAuth consent screen is configured correctly

### Error: "invalid_client"

**Cause**: Invalid client ID or client secret.

**Solution**:
1. Verify `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in `.env`
2. Ensure credentials are copied correctly from Google Cloud Console
3. Check for extra spaces or line breaks in the values

### Error: "insufficient_permissions"

**Cause**: App doesn't have the required Gmail API scope.

**Solution**:
1. Check OAuth consent screen scopes
2. Ensure `gmail.readonly` scope is added
3. User may need to re-authenticate to grant new permissions

### Error: "Rate limit exceeded"

**Cause**: Too many API requests in a short time.

**Solution**:
- Wait for the rate limit window to reset (100 seconds)
- The backend automatically implements exponential backoff
- Check quota usage in Google Cloud Console

### Emails Not Being Retrieved

**Possible causes**:
1. User has no sent emails
2. Network timeout
3. Gmail API quota exceeded
4. Invalid access token

**Solution**:
1. Check backend logs for detailed error messages
2. Verify Gmail API is enabled
3. Test with a Gmail account that has sent emails
4. Check quota usage in Google Cloud Console

---

## Security Best Practices

### 1. Credential Management

- ✅ Never commit `.env` file to version control
- ✅ Use different credentials for development and production
- ✅ Rotate credentials regularly (every 90 days recommended)
- ✅ Store production credentials in secure environment variable management (e.g., AWS Secrets Manager, Azure Key Vault)

### 2. Token Security

- ✅ Tokens are encrypted at rest using AES-256-GCM
- ✅ Tokens are stored in memory only (not persisted to database)
- ✅ Tokens automatically expire after 1 hour
- ✅ Tokens are never logged or exposed in error messages

### 3. Scope Minimization

- ✅ Request only `gmail.readonly` scope (not full Gmail access)
- ✅ Further restrict to Sent folder using `in:sent` query
- ✅ Never request unnecessary permissions

### 4. User Privacy

- ✅ Raw email content is never stored permanently
- ✅ Only extracted writing patterns are saved
- ✅ Users can disconnect and revoke access at any time
- ✅ Clear privacy policy explaining data usage

### 5. Rate Limiting

- ✅ Implement per-user rate limits (10 analyses per hour)
- ✅ Prevent abuse and quota exhaustion
- ✅ Monitor API usage regularly

---

## Additional Resources

- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Gmail API Documentation](https://developers.google.com/gmail/api)
- [Gmail API Quotas](https://developers.google.com/gmail/api/reference/quota)
- [OAuth 2.0 Security Best Practices](https://datatracker.ietf.org/doc/html/draft-ietf-oauth-security-topics)

---

## Support

If you encounter issues not covered in this guide:

1. Check backend logs for detailed error messages
2. Review Google Cloud Console audit logs
3. Verify all environment variables are set correctly
4. Ensure Gmail API is enabled and credentials are valid
5. Check quota usage and rate limits

For additional help, consult the project documentation or contact the development team.
