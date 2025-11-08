# Black Mirror Refactor - Implementation Roadmap

## ✅ Phase 1: Design System (COMPLETE)

### What We've Built:
1. **tailwind.config.js** - Complete Black Mirror theme configuration
2. **postcss.config.js** - PostCSS setup for Tailwind processing
3. **src/index.css** - Tailwind base with custom Black Mirror components
4. **BLACK_MIRROR_DESIGN_SYSTEM.md** - Comprehensive design documentation

### Installed Dependencies:
- tailwindcss@4.1.17
- postcss@8.5.6
- autoprefixer@10.4.21

---

## 🎯 Phase 2: Component Refactoring (NEXT)

We'll refactor each component in this order:

### 1. WelcomeScreen.jsx (NEXT)
**Priority:** HIGH - First impression sets the tone

**Current State:** Generic AI theme
**Target State:** Haunting, minimalist Black Mirror aesthetic

**Key Changes:**
- Remove colorful gradients → Pure blacks with subtle glows
- Simplify typography → Clean, clinical sans-serif
- Add subtle animations → Scanlines, flicker effects
- Minimal CTAs → Flat, precise buttons

---

### 2. MirrorInterface.jsx
**Priority:** HIGH - Core user experience

**Key Changes:**
- Split-screen with minimal divider glow
- Glass morphism panels
- Monospace for system messages
- Subtle status indicators

---

### 3. SourceConnector.jsx
**Priority:** MEDIUM - Data input flow

**Key Changes:**
- Clinical input fields
- System-style labels
- Minimal validation feedback
- Progress indicators with monospace

---

### 4. AnalysisProgress.jsx
**Priority:** MEDIUM - Processing feedback

**Key Changes:**
- Technical progress display
- Monospace status messages
- Minimal progress bars
- System-style completion states

---

### 5. Header.jsx
**Priority:** LOW - Navigation

**Key Changes:**
- Minimal top bar
- Ghost buttons
- System status indicator

---

### 6. SettingsPanel.jsx
**Priority:** LOW - Configuration

**Key Changes:**
- Glass panel overlay
- Organized sections
- Minimal toggles and inputs

---

### 7. ExportModal.jsx
**Priority:** LOW - Export functionality

**Key Changes:**
- Floating glass panel
- Dark backdrop
- Minimal export options

---

## 🎨 Design Tokens Quick Reference

### Most Used Colors:
```jsx
// Backgrounds
bg-void-deep          // Main background
bg-void-surface       // Input fields
bg-void-elevated      // Cards, panels

// Text
text-static-white     // Primary text
text-static-dim       // Secondary text
text-static-muted     // Tertiary text

// Accents
text-unsettling-blue  // Links, actions
text-glitch-red       // Errors
text-system-active    // Success

// Borders
border-static-whisper // Default
border-unsettling-blue // Focus
```

### Most Used Classes:
```jsx
glass-panel           // Glass morphism effect
system-text           // Monospace system style
btn-primary           // Primary button
btn-danger            // Danger button
input-field           // Input styling
divider-glow          // Glowing divider
```

---

## 🚀 Next Steps

**Ready to start?** Let's begin with WelcomeScreen.jsx.

I'll need to see the current component code, then I'll provide:
1. Complete refactored component using Tailwind classes
2. Explanation of design decisions
3. Any new custom animations or effects needed

**Command to proceed:**
"Show me WelcomeScreen.jsx - let's refactor it with the Black Mirror theme"
