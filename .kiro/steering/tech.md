# Technology Stack

## Framework & Libraries

- **React 19.2.0**: Core UI framework using functional components and hooks
- **React DOM 19.2.0**: DOM rendering
- **React Scripts 5.0.1**: Build tooling and development server (Create React App)

## Build System

This project uses **Create React App** (CRA) with react-scripts for zero-config setup.

## Common Commands

```bash
# Start development server (runs on http://localhost:3000)
npm start

# Create production build
npm build

# Run tests
npm test

# Eject from CRA (irreversible - not recommended)
npm run eject
```

## Code Style

- Use **functional components** with hooks (useState, useEffect, etc.)
- Prefer **arrow functions** for component definitions
- Use **ES6+ syntax** (const/let, destructuring, template literals)
- Import React at the top of component files
- CSS is co-located with components (e.g., App.css with App.js)

## Browser Support

- Production: Modern browsers (>0.2% usage, not dead, not Opera Mini)
- Development: Latest Chrome, Firefox, and Safari versions
