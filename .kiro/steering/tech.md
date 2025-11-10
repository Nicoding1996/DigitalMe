# Technology Stack

## Architecture

**DigitalMe** is a full-stack monorepo application with a React frontend and Node.js/Express backend proxy service.

## Frontend Stack

### Framework & Libraries
- **React 19.2.0**: Core UI framework using functional components and hooks
- **React DOM 19.2.0**: DOM rendering
- **React Scripts 5.0.1**: Build tooling and development server (Create React App)

### Styling
- **TailwindCSS 3.4.1**: Utility-first CSS framework (primary styling approach)
- **PostCSS 8.5.6**: CSS processing with Autoprefixer
- **Custom CSS**: Component-specific styles and global design system variables

### Build System
This project uses **Create React App** (CRA) with react-scripts for zero-config setup.

## Backend Stack

### Runtime & Framework
- **Node.js**: JavaScript runtime environment
- **Express 5.1.0**: Web application framework for API endpoints

### AI & External Services
- **@google/generative-ai 0.22.0**: Google Gemini AI SDK for content generation
- **googleapis 165.0.0**: Google APIs client library (Gmail integration)

### Middleware & Utilities
- **cors 2.8.5**: Cross-Origin Resource Sharing middleware
- **dotenv 17.2.3**: Environment variable management

## Common Commands

### Frontend
```bash
# Start React development server (http://localhost:3000)
npm start

# Create production build
npm run build

# Run tests
npm test
```

### Backend
```bash
# Start backend proxy service (http://localhost:3001)
cd backend
npm start

# Development mode
npm run dev
```

## Code Style

### React Components
- Use **functional components** with hooks (useState, useEffect, etc.)
- Prefer **arrow functions** for component definitions
- Use **ES6+ syntax** (const/let, destructuring, template literals)
- Import React at the top of component files

### Styling Approach
- **TailwindCSS-first**: Use Tailwind utility classes as the primary styling method
- Custom CSS only for complex animations, global styles, or when Tailwind utilities are insufficient
- Follow the Black Mirror design system defined in tailwind.config.js
- Use semantic color tokens (e.g., `bg-void-deep`, `text-static-white`) instead of raw values

### Backend Code
- Use **async/await** for asynchronous operations
- Implement proper error handling with try/catch blocks
- Follow security best practices (never log API keys, sanitize errors)
- Use middleware for cross-cutting concerns (validation, rate limiting)

## Browser Support

- Production: Modern browsers (>0.2% usage, not dead, not Opera Mini)
- Development: Latest Chrome, Firefox, and Safari versions
