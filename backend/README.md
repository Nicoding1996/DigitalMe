# DigitalMe Backend

Backend proxy service for the DigitalMe application, handling Gemini AI integration and Gmail OAuth.

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Configuration

Copy `.env.example` to `.env` and configure your credentials:

```bash
cp .env.example .env
```

### 3. Required Configuration

Edit `backend/.env` with your actual credentials:

#### Gemini API (Required)
```env
GEMINI_API_KEY=AIza-your-actual-key-here
```

Get your API key from: https://aistudio.google.com/app/apikey

#### Gmail Integration (Optional)

To enable Gmail integration, add these variables to `backend/.env`:

```env
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3001/api/auth/gmail/callback
TOKEN_ENCRYPTION_KEY=your-64-character-hex-key
GMAIL_MAX_EMAILS=200
GMAIL_BATCH_SIZE=50
```

**📖 For detailed setup instructions, see [GMAIL_SETUP_GUIDE.md](./GMAIL_SETUP_GUIDE.md)**

**Quick Setup:**

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select an existing one
3. Enable the Gmail API
4. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client ID"
5. Choose "Web application" as the application type
6. Add authorized redirect URI: `http://localhost:3001/api/auth/gmail/callback`
7. Copy the Client ID and Client Secret to your `.env` file

**Generate encryption key:**

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copy the output to `TOKEN_ENCRYPTION_KEY` in your `.env` file.

## Running the Server

```bash
npm start
```

Server runs on `http://localhost:3001`

## API Endpoints

### Gemini AI
- `POST /api/chat` - Send messages to Gemini AI

### Gmail OAuth (when enabled)
- `GET /api/auth/gmail` - Initiate OAuth flow
- `GET /api/auth/gmail/callback` - OAuth callback handler
- `GET /api/gmail/emails` - Fetch user's emails
- `POST /api/auth/gmail/revoke` - Revoke access

## Documentation

### Gmail Integration
- **[GMAIL_SETUP_GUIDE.md](./GMAIL_SETUP_GUIDE.md)** - Complete setup guide for Google OAuth credentials
- **[GMAIL_RATE_LIMITING.md](./GMAIL_RATE_LIMITING.md)** - Rate limiting strategy and quota management

### Security
- **[SECURITY.md](./SECURITY.md)** - Security implementation details
- **[ERROR_HANDLING.md](./ERROR_HANDLING.md)** - Error handling patterns

## Security Notes

- Never commit `.env` file (it's in `.gitignore`)
- API keys and secrets are never logged or exposed
- OAuth tokens are encrypted at rest using AES-256-GCM with `TOKEN_ENCRYPTION_KEY`
- All sensitive configuration is validated on startup
- Gmail API access is restricted to read-only Sent folder only
- Tokens automatically expire after 1 hour
- Rate limiting prevents quota exhaustion (10 analyses per hour per user)
