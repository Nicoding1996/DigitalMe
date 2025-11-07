# Migration from Anthropic to Google Gemini API

## Completed Changes

### 1. Dependencies Updated
- ✅ Removed: `@anthropic-ai/sdk`
- ✅ Added: `@google/generative-ai` (v0.21.0)

### 2. Environment Variables
- Changed `ANTHROPIC_API_KEY` → `GEMINI_API_KEY`
- Changed `CLAUDE_MODEL` → `GEMINI_MODEL`
- Default model: `gemini-2.0-flash-exp`

### 3. Configuration Files Modified
- `backend/config.js` - Updated to validate Gemini API keys (starts with "AIza")
- `backend/.env.example` - Updated with new variable names
- `backend/package.json` - Updated dependencies

### 4. Server Implementation
- `backend/server.js` - Refactored to use Google Generative AI SDK
- Streaming implementation adapted for Gemini's API format

## Next Steps

### 1. Get Your Gemini API Key
Visit: https://aistudio.google.com/app/apikey
- Sign in with your Google account
- Click "Get API Key" or "Create API Key"
- Copy the key (starts with `AIza...`)

### 2. Create Your .env File
```bash
# In the backend directory, create a .env file:
cp .env.example .env
```

Then edit `backend/.env` and add your actual API key:
```
GEMINI_API_KEY=AIza-your-actual-key-here
PORT=3001
FRONTEND_URL=http://localhost:3000
GEMINI_MODEL=gemini-2.0-flash-exp
```

### 3. Start the Backend Server
```bash
cd backend
npm start
```

## API Differences

### Anthropic (Old)
```javascript
const anthropic = new Anthropic({ apiKey: config.ANTHROPIC_API_KEY });
const stream = await anthropic.messages.create({
  model: config.CLAUDE_MODEL,
  max_tokens: 1024,
  messages: [{ role: 'user', content: prompt }],
  stream: true
});
```

### Gemini (New)
```javascript
const genAI = new GoogleGenerativeAI(config.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: config.GEMINI_MODEL });
const result = await model.generateContentStream(prompt);
```

## Free Tier Limits (Gemini)
- 15 requests per minute
- 1 million tokens per minute
- 1,500 requests per day

## Available Gemini Models
- `gemini-2.0-flash-exp` (recommended, experimental)
- `gemini-1.5-flash` (stable)
- `gemini-1.5-pro` (more capable, slower)
