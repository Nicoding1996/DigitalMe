# Black Mirror Design System
## DigitalMe.dev - Haunting Minimalist Theme

---

## 🎨 Color Palette

### Core Blacks & Voids
- `mirror-black` (#000000) - Pure black, for dramatic moments
- `void-deep` (#0a0a0a) - Primary background, the abyss
- `void-surface` (#0f0f0f) - Surface elements, slightly elevated
- `void-elevated` (#141414) - Elevated surfaces, cards, panels

### Static Grays (Cold & Clinical)
- `static-white` (#e8e8e8) - Primary text, clean and readable
- `static-dim` (#b0b0b0) - Secondary text, less emphasis
- `static-muted` (#6b6b6b) - Tertiary text, subtle information
- `static-ghost` (#3a3a3a) - Borders, dividers, barely visible
- `static-whisper` (#1f1f1f) - Subtle borders, ghost elements

### Accent Colors (Unsettling & Minimal)
- `glitch-red` (#ff0033) - Errors, warnings, danger states
- `glitch-red-dim` (#cc0029) - Hover state for red elements
- `unsettling-blue` (#0066ff) - Primary actions, focus states
- `unsettling-blue-dim` (#0052cc) - Hover state for blue elements
- `warning-amber` (#ffaa00) - Warnings, caution states
- `warning-amber-dim` (#cc8800) - Hover state for amber elements

### System Status
- `system-active` (#00ff88) - Active, online, success states
- `system-error` (#ff1744) - Critical errors
- `system-warning` (#ffc107) - Warning states
- `system-idle` (#546e7a) - Idle, inactive states

### Overlays (Glass Effects)
- `overlay-light` (rgba 3%) - Subtle glass effect
- `overlay-medium` (rgba 6%) - Standard glass panels
- `overlay-heavy` (rgba 10%) - Prominent glass surfaces
- `overlay-dark` (rgba 60%) - Modal backdrops
- `overlay-darker` (rgba 85%) - Heavy modal backdrops

---

## 📝 Typography

### Font Families

**Primary Sans-Serif (Inter)**
```jsx
className="font-sans"
```
Clean, minimal, slightly cold. Use for all body text and UI elements.

**Monospace (JetBrains Mono / Fira Code)**
```jsx
className="font-mono"
```
For system messages, technical data, status indicators, and code.

**Display (Space Grotesk)**
```jsx
className="font-display"
```
Optional. For dramatic headlines and key moments.

### Font Sizes (with optimized line-height and letter-spacing)
- `text-xs` - 12px - System text, labels
- `text-sm` - 14px - Secondary text
- `text-base` - 16px - Body text
- `text-lg` - 18px - Emphasized text
- `text-xl` - 20px - Small headings
- `text-2xl` - 24px - Section headings
- `text-3xl` - 30px - Page headings
- `text-4xl` - 36px - Hero text
- `text-5xl` - 48px - Dramatic moments

---

## 🎭 Design Principles

### 1. Minimalism
- Remove all unnecessary elements
- Every pixel serves a purpose
- Embrace negative space

### 2. Unsettling Precision
- Perfect alignment creates unease
- Clinical cleanliness feels artificial
- Symmetry that's too perfect

### 3. Subtle Motion
- Animations are slow and deliberate
- Nothing moves without purpose
- Glitches are intentional, not chaotic

### 4. Dark & Mysterious
- Deep blacks dominate
- Light is used sparingly
- Contrast creates drama

### 5. System Aesthetic
- Monospace for technical elements
- Status indicators everywhere
- Everything feels monitored

---

## 🎬 Animation & Effects

### Glitch Effect
```jsx
className="glitch-text"
```
Subtle position shifts, use sparingly for dramatic effect.

### Flicker
```jsx
className="flicker"
```
Screen flicker effect, creates unease.

### Scanline
```jsx
className="scanline"
```
CRT monitor effect, adds retro-futuristic feel.

### Glow Effects
```jsx
className="shadow-glow-blue"    // Blue glow
className="shadow-glow-red"     // Red glow
className="shadow-glow-green"   // Green glow
className="text-glow-blue"      // Text glow
```

### Transitions
- Use `duration-300` for most interactions
- Use `duration-500` for dramatic reveals
- Prefer `ease-out` for natural feel

---

## 🧩 Component Patterns

### Glass Panels
```jsx
<div className="glass-panel p-6">
  {/* Content */}
</div>
```

### System Text
```jsx
<span className="system-text">SYSTEM ONLINE</span>
```

### Primary Button
```jsx
<button className="btn-primary">
  INITIALIZE
</button>
```

### Danger Button
```jsx
<button className="btn-danger">
  TERMINATE
</button>
```

### Input Field
```jsx
<input 
  type="text" 
  className="input-field"
  placeholder="Enter data..."
/>
```

### Divider with Glow
```jsx
<div className="divider-glow" />
```

---

## 🎯 Usage Guidelines

### When to Use Each Color

**Backgrounds:**
- `bg-void-deep` - Main app background
- `bg-void-surface` - Input fields, text areas
- `bg-void-elevated` - Cards, modals, elevated panels

**Text:**
- `text-static-white` - Primary content
- `text-static-dim` - Secondary content
- `text-static-muted` - Tertiary content, hints
- `text-static-ghost` - Disabled states

**Accents:**
- `text-unsettling-blue` - Links, primary actions
- `text-glitch-red` - Errors, destructive actions
- `text-system-active` - Success states, active indicators

**Borders:**
- `border-static-whisper` - Default borders
- `border-static-ghost` - Subtle dividers
- `border-unsettling-blue` - Focus states
- `border-glitch-red` - Error states

---

## 💡 Pro Tips

1. **Less is More**: Remove elements until it feels too empty, then add one back.

2. **Embrace the Void**: Large areas of black create drama and focus attention.

3. **Subtle Glows**: Use glow effects sparingly - they're most effective when rare.

4. **Monospace for System**: Anything that feels "computer-generated" should use `font-mono`.

5. **Slow Animations**: Black Mirror tech feels deliberate, not snappy. Use longer durations.

6. **Perfect Alignment**: Everything should align to a grid. Precision creates unease.

7. **Status Indicators**: Add system status text everywhere - it creates the feeling of being monitored.

---

## 🚀 Next Steps

Now that you have the design system, we'll refactor each component:

1. **WelcomeScreen** - First impression, set the tone
2. **MirrorInterface** - Core experience, split-screen design
3. **SourceConnector** - Data input, clinical feel
4. **AnalysisProgress** - System processing, technical aesthetic
5. **SettingsPanel** - Control panel, precise and minimal
6. **All Modals** - Floating glass panels with backdrop

Each component will use these design tokens to create a cohesive, haunting experience.
