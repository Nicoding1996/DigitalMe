# Text Readability Improvements

## Problem
Certain text elements were hard to read due to:
- Low contrast between text and dark backgrounds
- Overly aggressive opacity values (40%)
- Semi-transparent backgrounds reducing text clarity

## Changes Made

### 1. Improved Color Contrast (tailwind.config.js & variables.css)

**Before:**
- `static-white`: #e8e8e8 → **After:** #f0f0f0 (brighter main text)
- `static-dim`: #a0a0a0 → **After:** #b8b8b8 (lighter secondary text)
- `static-muted`: #606060 → **After:** #808080 (more readable tertiary text)
- `static-ghost`: #2a2a2a → **After:** #4a4a4a (lighter labels/hints)

### 2. Reduced Opacity Harshness

**Changed opacity-40 to opacity-50/60:**
- ProfileSummary.js: Inactive content cards (repositories, articles, etc.)
- SourceConnector.js: Disabled export button
- SettingsPanel.js: Disabled reanalyze button
- variables.css: Default disabled opacity

### 3. Improved Background Opacity (App.css)

**Message Input:**
- Background: rgba(20, 20, 20, 0.8) → 0.95
- Focus state: rgba(25, 25, 25, 0.9) → 1.0

**Response Area:**
- Background: rgba(20, 20, 20, 0.6) → 0.95

## Result

✅ Text is now more readable across all components
✅ Dark, lowkey aesthetic is preserved
✅ Better contrast ratios for accessibility
✅ Disabled states are still visually distinct but readable

## Testing

View these components to see improvements:
- ProfileSummary: Metrics, writing style, source attribution
- InputArea: Terminal input and labels
- ResponseArea: AI responses and headers
- Any disabled/inactive UI elements
