# DigitalMe - Your AI Doppelgänger

> **Kiroween Hackathon 2025 - Costume Contest Entry**  
> No more "clearly AI" moments. An AI that writes in YOUR voice.

![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)
![React](https://img.shields.io/badge/react-19.2.0-61dafb.svg)
![Node.js](https://img.shields.io/badge/node.js-express-green.svg)

## 🎭 What Is This?

DigitalMe analyzes your writing from Gmail, GitHub, blogs, and text samples to create an AI that talks like you. Not generic ChatGPT speak - YOUR actual voice, vocabulary, and style.

**The Problem:** AI writing sounds robotic and generic. Everyone can tell when you used AI.

**The Solution:** An AI doppelgänger that learns your unique communication style and generates content that sounds authentically human - YOUR human.

## ✨ Key Features

### 🔄 Multi-Source Intelligence
- **Gmail** (OAuth 2.0): Analyzes sent emails for natural, unedited writing
- **GitHub**: Extracts commit messages and README files
- **Blog**: Scrapes articles from Medium, Dev.to, WordPress, custom sites
- **Text Samples**: Direct input for quick analysis

### 🧠 Living Profile System
- Real-time learning from conversations
- Confidence-weighted updates (low-confidence attributes update more)
- Delta reports showing exactly what changed
- User-controlled toggle (enable/disable anytime)

### 💬 Conversation Intelligence
- Maintains context across messages
- Responds to refinement requests ("make it shorter", "more formal")
- Instruction priority overrides style profile when needed
- Natural conversation flow, not just prompt-response

### 🎨 Black Mirror Aesthetic
- Split-screen mirror interface (you ↔ AI twin)
- Particle background animations
- Glitch effects and system-style messaging
- Dark, futuristic design

## 🚀 Quick Start

### Prerequisites
- Node.js 16+
- Google Gemini API key
- (Optional) Gmail OAuth credentials for email analysis

### Installation

```bash
# Clone the repo
git clone https://github.com/Nicoding1996/DigitalMe.git
cd DigitalMe

# Install frontend dependencies
npm install

# Install backend dependencies
cd backend
npm install

# Configure environment
cp .env.example .env
# Edit .env and add your GEMINI_API_KEY
```

### Running Locally

```bash
# Terminal 1: Start backend (port 3001)
cd backend
npm start

# Terminal 2: Start frontend (port 3000)
npm start
```

Open [http://localhost:3000](http://localhost:3000) to use the app.

## 🏗️ Built With Kiro

This project was built entirely using [Kiro IDE](https://kiro.ai) and showcases multiple Kiro features:

### 📋 Spec-Driven Development
- **10 comprehensive specs** with requirements.md, design.md, and tasks.md
- Structured approach for complex features (OAuth, encryption, multi-source merging)
- Task checklists provided clear progress tracking (0/15 → 15/15)
- Iterative design before implementation

**Key Specs:**
- `gmail-integration`: OAuth flow and email analysis
- `living-profile`: Real-time learning system
- `multi-source-merging`: Quality-weighted data combination
- `advanced-style-analysis`: Pattern extraction algorithms

### 📚 Steering Documents
- **tech.md**: Technology stack, coding conventions, architecture patterns
- **structure.md**: File organization, naming conventions, project layout
- **product.md**: Product vision, user experience, feature requirements

Eliminated repetitive explanations - Kiro always knew the context.

### 🪝 Agent Hooks
- **"Analyze Code on Save"**: Triggers when JS/TS files are saved
- Automatically analyzes coding patterns (naming, comments, design patterns)
- Helps Kiro maintain consistency across the codebase
- Ensures new code matches established patterns

### 💬 Vibe Coding
- UI polish and visual design iterations
- Debugging and algorithm tuning
- Most impressive: Kiro generated the entire `EmailCleansingService` (300+ lines) in one shot

## 🎯 Architecture

### Frontend
- **React 19** with functional components and hooks
- **TailwindCSS** for Black Mirror design system
- **Create React App** for zero-config setup
- Real-time style profile updates with localStorage persistence

### Backend
- **Node.js/Express** proxy service
- **Google Gemini AI** for content generation
- **Gmail API** (OAuth 2.0) for email analysis
- **GitHub API** (@octokit/rest) for repository analysis
- **Cheerio + Axios** for blog scraping
- **AES-256-GCM** encryption for OAuth tokens

### Security
- Rate limiting (prevent abuse)
- Input validation (all endpoints)
- Token encryption (client-side storage)
- Error sanitization (no PII in logs)
- CORS configuration

## 📊 Project Stats

- **10 specs** with full requirements and design docs
- **50+ files** across frontend and backend
- **13 backend services** (style analysis, OAuth, scraping, etc.)
- **25+ React components** with Black Mirror styling
- **4 data sources** with quality-weighted merging
- **Production-ready** with OAuth, encryption, rate limiting

## 🎬 Demo

[Video Demo](https://youtu.be/mYrXn9NlBY4) | [Live Demo](https://digital-me-peach.vercel.app)

## 📝 Documentation

- [Project Status](PROJECT_STATUS.md) - Complete feature overview
- [Backend Setup](backend/README.md) - Backend architecture and API docs
- [Gmail Setup Guide](backend/GMAIL_SETUP_GUIDE.md) - OAuth configuration
- [Specs](.kiro/specs/) - All feature specifications
- [Steering Docs](.kiro/steering/) - Kiro context documents

## 🏆 Hackathon Categories

**Primary:** Costume Contest - Haunting UI with polished Black Mirror aesthetic

**Bonus:**
- Best Startup Project - Real market need with monetization potential
- Most Creative - Unique approach to AI personalization

## 🤝 Contributing

This is a hackathon project, but contributions are welcome! Check out the specs in `.kiro/specs/` to understand the architecture.

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details

## 🙏 Acknowledgments

Built with [Kiro IDE](https://kiro.ai) - AI-powered development environment that made this project possible through spec-driven development, steering documents, and agent hooks.

---

**Made for Kiroween Hackathon 2025** 🎃
