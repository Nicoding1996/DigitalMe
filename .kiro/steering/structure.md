# Project Structure

## Directory Organization

```
digitalme/                          # Monorepo root
├── .kiro/                          # Kiro IDE configuration
│   ├── specs/                      # Feature specifications and tasks
│   └── steering/                   # AI steering documents
├── backend/                        # Node.js/Express backend service
│   ├── middleware/                 # Express middleware
│   │   ├── inputValidation.js     # Request validation middleware
│   │   └── rateLimiter.js         # Rate limiting middleware
│   ├── public/                     # Static files for OAuth callbacks
│   │   ├── gmail-callback.html    # Gmail OAuth callback page
│   │   └── oauth-callback.html    # Generic OAuth callback page
│   ├── routes/                     # API route handlers
│   │   └── gmailAuth.js           # Gmail authentication routes
│   ├── services/                   # Business logic services
│   │   ├── AnalysisSessionService.js      # Session management
│   │   ├── EmailCleansingService.js       # Email data cleaning
│   │   ├── GmailAnalysisOrchestrator.js   # Gmail analysis coordination
│   │   ├── GmailAuthService.js            # Gmail OAuth handling
│   │   ├── GmailRetrievalService.js       # Gmail API data fetching
│   │   └── GmailStyleAnalyzer.js          # Email style analysis
│   ├── tests/                      # Backend test suites
│   ├── utils/                      # Utility functions
│   │   ├── GmailErrorHandler.js   # Gmail-specific error handling
│   │   └── securityAudit.js       # Security validation utilities
│   ├── .env                        # Environment variables (not committed)
│   ├── .env.example                # Environment template
│   ├── config.js                   # Configuration management
│   ├── server.js                   # Express server entry point
│   ├── validation.js               # Request validation schemas
│   └── package.json                # Backend dependencies
├── public/                         # Frontend static assets
│   └── index.html                  # HTML template with root div
├── src/                            # React frontend source code
│   ├── components/                 # React components
│   │   ├── AnalysisProgress.js    # Gmail analysis progress UI
│   │   ├── ConnectionStatus.js    # Backend connection indicator
│   │   ├── CopyButton.js          # Copy to clipboard utility
│   │   ├── DownloadButton.js      # Download functionality
│   │   ├── ErrorBoundary.js       # Error boundary wrapper
│   │   ├── ExportModal.js         # Data export modal
│   │   ├── GlitchEffect.js        # Visual glitch effects
│   │   ├── GmailConnectButton.js  # Gmail OAuth trigger
│   │   ├── Header.js              # Application header
│   │   ├── InputArea.js           # User input interface
│   │   ├── LoadingIndicator.js    # Loading states
│   │   ├── MessageHistory.js      # Conversation history
│   │   ├── MirrorInterface.js     # Main split-screen interface
│   │   ├── Navigation.js          # Navigation component
│   │   ├── ProfileSummary.js      # Style profile display
│   │   ├── ResponseArea.js        # AI response display
│   │   ├── SettingsPanel.js       # Settings UI
│   │   ├── SourceConnector.js     # Data source connection UI
│   │   ├── SourceManager.js       # Data source management
│   │   ├── StyleControls.js       # Style profile controls
│   │   └── WelcomeScreen.js       # Initial welcome screen
│   ├── services/                   # Frontend services
│   │   ├── ContentGenerator.js    # AI content generation client
│   │   └── StyleAnalyzer.js       # Style analysis utilities
│   ├── App.js                      # Main application component
│   ├── App.css                     # Application-specific styles
│   ├── index.js                    # React entry point
│   ├── index.css                   # Tailwind imports and base styles
│   ├── global.css                  # Global CSS variables and resets
│   ├── utilities.css               # Utility CSS classes
│   ├── variables.css               # CSS custom properties
│   └── models.js                   # Data models and types
├── build/                          # Production build output (generated)
├── node_modules/                   # Frontend dependencies (not committed)
├── package.json                    # Frontend dependencies and scripts
├── tailwind.config.js              # TailwindCSS configuration
├── postcss.config.js               # PostCSS configuration
└── .gitignore                      # Git ignore rules
```

## Architecture Patterns

### Frontend Architecture
- **Single Page Application (SPA)**: Client-side rendering with React
- **Component-based**: Modular UI components with clear responsibilities
- **State management**: Local component state using useState/useEffect hooks
- **Service layer**: Separate services for API communication and business logic
- **Design system**: TailwindCSS-based Black Mirror aesthetic

### Backend Architecture
- **Proxy service**: Backend acts as a secure proxy to Google AI APIs
- **Layered architecture**: Routes → Services → External APIs
- **Middleware pipeline**: Validation, CORS, rate limiting, error handling
- **OAuth flow**: Secure Gmail authentication with token encryption
- **Service-oriented**: Business logic encapsulated in service classes

### Communication Flow
1. Frontend (React) → Backend API (Express) → Google AI/Gmail APIs
2. Backend handles API keys, authentication, and rate limiting
3. Frontend receives streaming responses for real-time AI generation

## File Conventions

### Frontend
- Component files use `.js` extension (not `.jsx`)
- Component-specific CSS files match component names (e.g., `ConnectionStatus.css`)
- TailwindCSS utility classes are preferred over custom CSS
- Services are in `src/services/` directory

### Backend
- Route handlers in `routes/` directory
- Business logic in `services/` directory
- Middleware in `middleware/` directory
- Configuration centralized in `config.js`
- Environment variables in `.env` (never committed)

## Key Files

### Frontend
- **src/index.js**: React entry point, renders App into DOM
- **src/App.js**: Main application component with routing and state
- **src/models.js**: Data models and type definitions
- **tailwind.config.js**: Complete design system configuration
- **public/index.html**: HTML template with root mounting point

### Backend
- **backend/server.js**: Express server entry point and API endpoints
- **backend/config.js**: Environment configuration and validation
- **backend/validation.js**: Request validation schemas
- **backend/.env**: Environment variables (API keys, secrets)

## Environment Configuration

### Frontend (.env)
- `REACT_APP_BACKEND_URL`: Backend API URL (default: http://localhost:3001)

### Backend (backend/.env)
- `GEMINI_API_KEY`: Google Gemini AI API key (required)
- `PORT`: Backend server port (default: 3001)
- `FRONTEND_URL`: Frontend URL for CORS (default: http://localhost:3000)
- `GEMINI_MODEL`: Gemini model version (default: gemini-2.0-flash-exp)
- `GOOGLE_CLIENT_ID`: Gmail OAuth client ID (optional)
- `GOOGLE_CLIENT_SECRET`: Gmail OAuth client secret (optional)
- `GOOGLE_REDIRECT_URI`: Gmail OAuth redirect URI (optional)
- `TOKEN_ENCRYPTION_KEY`: Token encryption key for Gmail (optional)
