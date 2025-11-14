# Mirrored CMD System

## Overview

A minimalist command tracking system that reinforces the mirror duality between Human and Doppelgänger. Each conversation thread (CMD) is visually represented on both sides of the interface, maintaining perfect symmetry while providing subtle navigation and context awareness.

## Core Concept

**Mirror Duality**: Every element has a counterpart across the center divider. CMD numbers, transitions, and interactions happen simultaneously on both sides, reinforcing that Human and Doppelgänger are two perspectives of the same conversation.

---

## Visual Design

### 1. CMD Indicators (Mirrored)

**Location:**
- Left side: Top-left corner below "Human" label
- Right side: Top-right corner below "Doppelgänger" label

**Appearance:**
```
Human                                    Doppelgänger
[03]                                              [03]
```

**States:**
- **Active**: Solid `#00ff41` (Matrix green)
- **Pulsing**: Brief white flash when topic shift detected
- **Transitioning**: Synchronized flash on both sides when CMD changes

**Styling:**
- Minimal bracket notation: `[##]`
- Font: Monospace, 14px
- Opacity: 0.7 normally, 1.0 on hover/pulse
- No labels, no explanations

### 2. Center Divider

**Visual:**
- Thin vertical line (1px)
- Color: `rgba(0, 255, 65, 0.2)` (subtle green glow)
- Extends full height of conversation area
- Represents the "mirror" between Human and Doppelgänger

**Behavior:**
- Always visible
- Subtle glow effect on CMD transitions
- Anchor point for centered overlays (history, settings)

### 3. CMD Transitions

**Visual Break:**
When CMD changes, a horizontal line appears across the center divider:

```
[Previous CMD messages...]

─────────────────────────────┼─────────────────────────────

[New CMD messages...]
```

**Animation:**
1. Both CMD numbers flash white simultaneously (200ms)
2. Horizontal line fades in across divider (300ms)
3. Previous messages dim to 60% opacity
4. New messages appear at 100% opacity
5. Horizontal line fades out after 2 seconds

**Purpose:**
- Creates visual separation between conversation threads
- "Reflection reset" effect
- No text labels needed

---

## User Interactions

### 1. Starting a New CMD

**Trigger Methods:**

**Manual:**
- Click either CMD number → Starts new CMD immediately
- Keyboard shortcut: `Ctrl+N` (or `Cmd+N` on Mac)
- No confirmation dialog, instant transition

**Auto-Suggested:**
- After 15+ exchanges in current CMD
- After 3+ minutes of inactivity
- When AI detects topic shift
- Behavior: CMD numbers pulse once (subtle hint)
- User can ignore (continues current CMD) or click (starts new)

**Transition:**
- Increment CMD number on both sides
- Play transition animation
- Clear "pending message" state
- Maintain conversation history in memory

### 2. Command History Navigation

**Trigger:**
- Click `⋮` icon (top-right, near settings)
- Keyboard shortcut: `Ctrl+H`

**Overlay Appearance:**
```
          Human  │  Doppelgänger
          ───────┼───────
            01   │   01
            02   │   02
          → 03   │   03  ←
            04   │   04
```

**Features:**
- Centered on divider (perfect symmetry)
- Current CMD highlighted with `→` arrows
- Click any number to jump to that CMD
- Scroll if more than 10 CMDs
- Click outside or press `Esc` to close

**Behavior:**
- Loads selected CMD's conversation history
- Updates CMD numbers on both sides
- Smooth fade transition (no jarring jumps)
- Preserves all CMD data in localStorage

### 3. Topic Shift Detection

**AI Analysis:**
- Backend analyzes user message for topic changes
- Compares against last 3 messages in current CMD
- Triggers if semantic similarity < 40%

**Visual Feedback:**
- Both CMD numbers pulse white once (500ms)
- No text notification
- No interruption to typing

**User Response:**
- Ignore pulse → Continue current CMD
- Click CMD number → Start new CMD
- System learns from user behavior (future enhancement)

---

## Technical Implementation

### Frontend State Management

**CMD State Object:**
```javascript
{
  currentCmd: 3,
  cmdHistory: [
    {
      cmdId: 1,
      messages: [...],
      startTime: "01:50:54",
      endTime: "01:58:32",
      exchangeCount: 13
    },
    {
      cmdId: 2,
      messages: [...],
      startTime: "02:01:10",
      endTime: "02:05:47",
      exchangeCount: 8
    },
    {
      cmdId: 3,
      messages: [...],
      startTime: "02:08:15",
      endTime: null, // Current CMD
      exchangeCount: 5
    }
  ],
  topicShiftSuggested: false
}
```

**localStorage Keys:**
- `digitalme_current_cmd`: Current CMD number
- `digitalme_cmd_history`: Array of CMD objects
- `digitalme_cmd_metadata`: Timestamps, exchange counts

### Component Changes

**App.js:**
- Add `currentCmd` state
- Add `cmdHistory` state
- Add `startNewCmd()` function
- Add `jumpToCmd(cmdId)` function
- Pass CMD state to MirrorInterface

**MirrorInterface.js:**
- Display CMD numbers in corners
- Handle CMD number click events
- Render CMD transition animations
- Dim previous CMD messages

**New Component: CmdHistory.js:**
- Overlay component for CMD navigation
- Centered on divider
- Keyboard navigation support
- Click-outside-to-close behavior

**MessageHistory.js:**
- Group messages by CMD
- Apply opacity dimming to non-current CMDs
- Render CMD transition dividers

### Backend Integration

**Topic Shift Detection:**
- Add endpoint: `POST /api/detect-topic-shift`
- Request: `{ currentMessage, recentMessages, currentCmd }`
- Response: `{ topicShiftDetected: boolean, confidence: 0.0-1.0 }`
- Uses Gemini AI for semantic analysis

**Rate Limiting:**
- Max 1 topic shift check per 30 seconds
- Prevents excessive API calls
- Client-side debouncing

---

## Styling (TailwindCSS)

### CMD Number Component

```jsx
<div className="absolute top-4 left-4 font-mono text-sm text-static-white/70 
                hover:text-static-white transition-opacity cursor-pointer
                select-none">
  [{String(currentCmd).padStart(2, '0')}]
</div>
```

### Center Divider

```jsx
<div className="absolute left-1/2 top-0 bottom-0 w-px 
                bg-gradient-to-b from-transparent via-neon-green/20 to-transparent
                shadow-[0_0_10px_rgba(0,255,65,0.3)]" />
```

### CMD Transition Line

```jsx
<div className="w-full h-px bg-neon-green/30 my-8 
                animate-fade-in-out relative">
  <div className="absolute left-1/2 top-0 w-2 h-2 -translate-x-1/2 -translate-y-1/2
                  bg-neon-green rounded-full shadow-[0_0_10px_rgba(0,255,65,0.8)]" />
</div>
```

### CMD History Overlay

```jsx
<div className="fixed inset-0 bg-void-deep/90 backdrop-blur-sm z-50 
                flex items-center justify-center animate-fade-in">
  <div className="bg-void-surface border border-neon-green/30 rounded-lg p-6
                  shadow-[0_0_30px_rgba(0,255,65,0.2)] min-w-[300px]">
    {/* CMD list */}
  </div>
</div>
```

---

## Animations

### CMD Flash (Transition)

```css
@keyframes cmd-flash {
  0%, 100% { opacity: 0.7; color: #00ff41; }
  50% { opacity: 1; color: #ffffff; }
}

.cmd-flash {
  animation: cmd-flash 200ms ease-in-out;
}
```

### CMD Pulse (Topic Shift)

```css
@keyframes cmd-pulse {
  0%, 100% { opacity: 0.7; transform: scale(1); }
  50% { opacity: 1; transform: scale(1.1); }
}

.cmd-pulse {
  animation: cmd-pulse 500ms ease-in-out;
}
```

### Transition Line Fade

```css
@keyframes fade-in-out {
  0% { opacity: 0; }
  20% { opacity: 1; }
  80% { opacity: 1; }
  100% { opacity: 0; }
}

.animate-fade-in-out {
  animation: fade-in-out 2s ease-in-out forwards;
}
```

---

## First-Time User Experience

### Onboarding Hint

**Trigger:** First time user loads app (check localStorage)

**Visual:**
```
[Tip: Each number is a conversation thread. Click to start fresh.]
```

**Behavior:**
- Appears at bottom center, above input area
- Fades in after 2 seconds (gives user time to see interface)
- Stays visible for 5 seconds
- Fades out
- Never shows again (localStorage flag: `digitalme_cmd_hint_shown`)

**Styling:**
- Small text (12px)
- Low opacity (0.5)
- Subtle green glow
- Non-intrusive

---

## Edge Cases & Error Handling

### CMD Limit
- Maximum 99 CMDs per session (display as `[99]`)
- After 99, suggest clearing history or exporting
- Prevent overflow with validation

### CMD History Corruption
- If localStorage data is corrupted, reset to CMD 01
- Show brief system message: `[SYSTEM: CMD_HISTORY_RESET]`
- Log error to console for debugging

### Rapid CMD Switching
- Debounce CMD number clicks (500ms)
- Prevent accidental double-clicks
- Queue CMD changes if user clicks rapidly

### Topic Shift API Failure
- Silently fail (no pulse if API error)
- Log error to console
- Don't block user interaction

---

## Accessibility

### Keyboard Navigation
- `Ctrl+N`: Start new CMD
- `Ctrl+H`: Open CMD history
- `Esc`: Close CMD history overlay
- `Arrow Up/Down`: Navigate CMD history list
- `Enter`: Select CMD from history

### Screen Readers
- CMD numbers have `aria-label`: "Command 3, click to start new command"
- CMD history has `role="dialog"` and `aria-label="Command history"`
- Transition lines have `aria-hidden="true"` (decorative)

### Focus Management
- CMD history overlay traps focus
- First item focused on open
- Focus returns to trigger element on close

---

## Performance Considerations

### localStorage Optimization
- Store only last 50 CMDs (auto-prune older ones)
- Compress message content if needed
- Lazy load CMD history (don't load all on mount)

### Animation Performance
- Use CSS transforms (GPU-accelerated)
- Debounce scroll events
- RequestAnimationFrame for smooth transitions

### Topic Shift Throttling
- Max 1 API call per 30 seconds
- Client-side caching of recent results
- Exponential backoff on API errors

---

## Future Enhancements (Phase 2+)

### CMD Metadata
- Auto-generate CMD titles based on content
- Tag CMDs with topics (AI-generated)
- Search CMDs by keyword

### CMD Analytics
- Track average exchanges per CMD
- Identify most common topics
- Suggest optimal CMD length

### CMD Export
- Export individual CMD as JSON/PDF
- Share CMD with others
- Import CMD from file

### Smart CMD Suggestions
- Learn from user behavior (when they start new CMDs)
- Predict optimal CMD boundaries
- Adaptive topic shift sensitivity

---

## Success Metrics

### User Experience
- Users understand CMD system without tutorial (>80%)
- Average CMD length: 8-12 exchanges (optimal)
- CMD navigation used regularly (>30% of sessions)

### Technical
- CMD transitions < 100ms
- No localStorage corruption errors
- Topic shift detection accuracy > 70%

### Aesthetic
- Maintains Black Mirror minimalism
- Reinforces mirror duality concept
- No visual clutter or information overload
