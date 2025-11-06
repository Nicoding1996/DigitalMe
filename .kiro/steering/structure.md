# Project Structure

## Directory Organization

```
digitalme/
├── public/              # Static assets and HTML template
│   └── index.html      # Main HTML file with root div
├── src/                # Source code
│   ├── App.js          # Main application component
│   ├── App.css         # Application styles
│   └── index.js        # React entry point and root rendering
├── node_modules/       # Dependencies (not committed)
├── package.json        # Project metadata and dependencies
└── .gitignore         # Git ignore rules
```

## Architecture Patterns

- **Single Page Application (SPA)**: All rendering happens client-side
- **Component-based**: UI built from React components
- **State management**: Local component state using useState hook
- **Entry point**: index.js renders App component into root div

## File Conventions

- Component files use `.js` extension (not `.jsx`)
- CSS files are named to match their component (e.g., `App.css` for `App.js`)
- Main component is `App.js` in the src directory
- Public assets go in the `public/` folder

## Key Files

- **src/index.js**: Application entry point, renders App into DOM
- **src/App.js**: Main application component with UI logic
- **public/index.html**: HTML template with root mounting point
