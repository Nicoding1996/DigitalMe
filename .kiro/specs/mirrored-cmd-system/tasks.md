# Mirrored CMD System - Implementation Tasks

## Phase 1: Core CMD Infrastructure (Essential)

### Task 1.1: CMD State Management
**Priority:** P0 (Critical)
**Estimated Time:** 2 hours

**Subtasks:**
- [ ] Add `currentCmd` state to App.js (default: 1)
- [ ] Add `cmdHistory` state to App.js (array of CMD objects)
- [ ] Create `startNewCmd()` function in App.js
- [ ] Create `jumpToCmd(cmdId)` function in App.js
- [ ] Implement localStorage persistence for CMD state
- [ ] Add localStorage keys: `digitalme_current_cmd`, `digitalme_cmd_history`
- [ ] Handle localStorage corruption/reset gracefully

**Acceptance Criteria:**
- CMD state persists across page reloads
- Starting new CMD increments counter correctly
- Jumping to previous CMD loads correct messages
- No console errors on fresh install

---

### Task 1.2: CMD Number Display (Mirrored)
**Priority:** P0 (Critical)
**Estimated Time:** 1 hour

**Subtasks:**
- [ ] Add CMD number display to left side (Human) in MirrorInterface.js
- [ ] Add CMD number display to right side (Doppelgänger) in MirrorInterface.js
- [ ] Style with TailwindCSS (monospace, green, subtle)
- [ ] Format as `[##]` with zero-padding (e.g., `[01]`, `[03]`)
- [ ] Position: top-left and top-right corners
- [ ] Add hover effect (opacity increase)
- [ ] Make clickable (cursor-pointer)

**Acceptance Criteria:**
- CMD numbers visible on both sides
- Numbers match on both sides
- Hover effect works smoothly
- Clicking number triggers startNewCmd()

---

### Task 1.3: CMD Transition Animation
**Priority:** P0 (Critical)
**Estimated Time:** 2 hours

**Subtasks:**
- [ ] Create `CmdTransition.js` component
- [ ] Implement flash animation for CMD numbers (200ms white flash)
- [ ] Create horizontal divider line component
- [ ] Add fade-in/fade-out animation for divider (2s duration)
- [ ] Dim previous CMD messages to 60% opacity
- [ ] Add CSS animations to index.css or utilities.css
- [ ] Trigger animation on CMD change
- [ ] Ensure both sides animate simultaneously

**Acceptance Criteria:**
- Smooth flash animation on CMD numbers
- Horizontal line appears and fades correctly
- Previous messages dim appropriately
- No animation jank or delays
- Works on both manual and auto CMD changes

---

### Task 1.4: Message Grouping by CMD
**Priority:** P0 (Critical)
**Estimated Time:** 2 hours

**Subtasks:**
- [ ] Update message data structure to include `cmdId`
- [ ] Modify MessageHistory.js to group messages by CMD
- [ ] Add CMD transition dividers between groups
- [ ] Apply opacity dimming to non-current CMD messages
- [ ] Ensure current CMD messages at 100% opacity
- [ ] Update message storage in localStorage
- [ ] Handle migration from old message format

**Acceptance Criteria:**
- Messages correctly grouped by CMD
- Visual separation between CMDs
- Current CMD messages fully visible
- Previous CMDs dimmed but readable
- No data loss during migration

---

## Phase 2: Navigation & History (Enhanced)

### Task 2.1: CMD History Overlay Component
**Priority:** P1 (High)
**Estimated Time:** 3 hours

**Subtasks:**
- [ ] Create `CmdHistory.js` component
- [ ] Design centered overlay layout (on divider)
- [ ] Implement mirrored column design (Human | Doppelgänger)
- [ ] Add CMD list with numbers
- [ ] Highlight current CMD with arrows (→ 03 ←)
- [ ] Add click handlers for CMD selection
- [ ] Implement scroll for 10+ CMDs
- [ ] Add close button and click-outside-to-close
- [ ] Style with TailwindCSS (dark theme, green accents)

**Acceptance Criteria:**
- Overlay appears centered on divider
- Perfect symmetry between columns
- Current CMD clearly highlighted
- Clicking CMD navigates correctly
- Smooth open/close animations
- Accessible (keyboard navigation)

---

### Task 2.2: CMD History Trigger
**Priority:** P1 (High)
**Estimated Time:** 1 hour

**Subtasks:**
- [ ] Add `⋮` icon to top-right corner (near settings)
- [ ] Add click handler to open CmdHistory overlay
- [ ] Implement keyboard shortcut: `Ctrl+H` (or `Cmd+H`)
- [ ] Add keyboard shortcut listener to App.js
- [ ] Style icon with hover effect
- [ ] Ensure icon doesn't interfere with settings

**Acceptance Criteria:**
- Icon visible and clickable
- Keyboard shortcut works
- Overlay opens smoothly
- No conflicts with other UI elements

---

### Task 2.3: CMD Navigation Logic
**Priority:** P1 (High)
**Estimated Time:** 2 hours

**Subtasks:**
- [ ] Implement `jumpToCmd(cmdId)` function
- [ ] Load selected CMD's messages from cmdHistory
- [ ] Update currentCmd state
- [ ] Update CMD numbers on both sides
- [ ] Smooth transition animation (fade)
- [ ] Scroll to top of selected CMD
- [ ] Close CMD history overlay after selection
- [ ] Handle edge cases (invalid CMD ID, empty CMD)

**Acceptance Criteria:**
- Jumping to CMD loads correct messages
- Smooth visual transition
- No console errors
- Works for all CMDs in history
- Handles edge cases gracefully

---

## Phase 3: Smart Features (Polish)

### Task 3.1: Topic Shift Detection (Backend)
**Priority:** P2 (Medium)
**Estimated Time:** 3 hours

**Subtasks:**
- [ ] Create `/api/detect-topic-shift` endpoint in server.js
- [ ] Implement semantic similarity analysis using Gemini AI
- [ ] Accept request: `{ currentMessage, recentMessages, currentCmd }`
- [ ] Return response: `{ topicShiftDetected: boolean, confidence: number }`
- [ ] Add rate limiting (1 request per 30 seconds per session)
- [ ] Add error handling and logging
- [ ] Test with various message combinations

**Acceptance Criteria:**
- Endpoint responds correctly
- Semantic analysis works accurately (>70%)
- Rate limiting prevents abuse
- Errors handled gracefully
- No impact on message sending performance

---

### Task 3.2: Topic Shift Detection (Frontend)
**Priority:** P2 (Medium)
**Estimated Time:** 2 hours

**Subtasks:**
- [ ] Add `topicShiftSuggested` state to App.js
- [ ] Call `/api/detect-topic-shift` after user sends message
- [ ] Debounce API calls (30s minimum between calls)
- [ ] Trigger CMD number pulse animation on detection
- [ ] Add pulse CSS animation (500ms, white glow)
- [ ] Apply pulse to both CMD numbers simultaneously
- [ ] Reset pulse state after animation completes
- [ ] Handle API errors silently (no user interruption)

**Acceptance Criteria:**
- Topic shift detected accurately
- CMD numbers pulse on detection
- No excessive API calls
- Smooth animation
- No blocking or interruption to user

---

### Task 3.3: Auto CMD Suggestions
**Priority:** P2 (Medium)
**Estimated Time:** 1 hour

**Subtasks:**
- [ ] Track exchange count per CMD
- [ ] Track time since last message
- [ ] Trigger pulse after 15+ exchanges
- [ ] Trigger pulse after 3+ minutes idle
- [ ] Combine with topic shift detection
- [ ] Add logic to prevent duplicate pulses
- [ ] Test various scenarios

**Acceptance Criteria:**
- Pulse triggers at correct thresholds
- No duplicate pulses
- User can ignore suggestions
- Doesn't interfere with manual CMD changes

---

### Task 3.4: First-Time User Hint
**Priority:** P2 (Medium)
**Estimated Time:** 1 hour

**Subtasks:**
- [ ] Check localStorage for `digitalme_cmd_hint_shown` flag
- [ ] Create hint component (bottom center, above input)
- [ ] Add fade-in animation (2s delay)
- [ ] Display hint text: "Each number is a conversation thread. Click to start fresh."
- [ ] Add fade-out animation (5s duration)
- [ ] Set localStorage flag after showing
- [ ] Style with TailwindCSS (subtle, low opacity)

**Acceptance Criteria:**
- Hint shows only on first visit
- Timing is correct (2s delay, 5s visible)
- Smooth animations
- Never shows again after first time
- Non-intrusive placement

---

## Phase 4: Keyboard & Accessibility

### Task 4.1: Keyboard Shortcuts
**Priority:** P1 (High)
**Estimated Time:** 2 hours

**Subtasks:**
- [ ] Implement `Ctrl+N` / `Cmd+N` for new CMD
- [ ] Implement `Ctrl+H` / `Cmd+H` for CMD history
- [ ] Implement `Esc` to close CMD history
- [ ] Implement `Arrow Up/Down` for CMD history navigation
- [ ] Implement `Enter` to select CMD from history
- [ ] Add keyboard event listeners to App.js
- [ ] Prevent conflicts with browser shortcuts
- [ ] Add visual feedback for keyboard actions

**Acceptance Criteria:**
- All shortcuts work correctly
- No browser conflicts
- Works on Windows, Mac, Linux
- Visual feedback provided
- Documented in UI (optional tooltip)

---

### Task 4.2: Accessibility Improvements
**Priority:** P1 (High)
**Estimated Time:** 2 hours

**Subtasks:**
- [ ] Add `aria-label` to CMD numbers
- [ ] Add `role="dialog"` to CMD history overlay
- [ ] Implement focus trap in CMD history
- [ ] Add `aria-hidden="true"` to decorative elements
- [ ] Ensure keyboard navigation works throughout
- [ ] Test with screen reader (NVDA or JAWS)
- [ ] Add focus indicators (visible outlines)
- [ ] Ensure color contrast meets WCAG AA standards

**Acceptance Criteria:**
- Screen reader announces CMD changes
- Focus management works correctly
- Keyboard-only navigation possible
- WCAG AA compliant
- No accessibility errors in browser tools

---

## Phase 5: Performance & Optimization

### Task 5.1: localStorage Optimization
**Priority:** P2 (Medium)
**Estimated Time:** 2 hours

**Subtasks:**
- [ ] Implement auto-pruning (keep last 50 CMDs)
- [ ] Add compression for large message content (optional)
- [ ] Lazy load CMD history (don't load all on mount)
- [ ] Optimize data structure for faster reads
- [ ] Add error handling for quota exceeded
- [ ] Test with large datasets (100+ CMDs)

**Acceptance Criteria:**
- localStorage never exceeds quota
- Old CMDs pruned automatically
- Fast load times even with many CMDs
- No data corruption
- Graceful handling of storage errors

---

### Task 5.2: Animation Performance
**Priority:** P2 (Medium)
**Estimated Time:** 1 hour

**Subtasks:**
- [ ] Use CSS transforms for animations (GPU-accelerated)
- [ ] Implement `requestAnimationFrame` for smooth transitions
- [ ] Debounce scroll events
- [ ] Optimize re-renders (React.memo where needed)
- [ ] Test on low-end devices
- [ ] Profile with Chrome DevTools

**Acceptance Criteria:**
- Animations run at 60fps
- No jank or stuttering
- Low CPU usage
- Works smoothly on mobile devices

---

## Testing & Quality Assurance

### Task 6.1: Unit Tests
**Priority:** P2 (Medium)
**Estimated Time:** 3 hours

**Subtasks:**
- [ ] Test `startNewCmd()` function
- [ ] Test `jumpToCmd()` function
- [ ] Test localStorage persistence
- [ ] Test message grouping by CMD
- [ ] Test CMD history navigation
- [ ] Test keyboard shortcuts
- [ ] Test edge cases (empty CMDs, invalid IDs)

**Acceptance Criteria:**
- All tests pass
- >80% code coverage
- Edge cases handled
- No console errors

---

### Task 6.2: Integration Tests
**Priority:** P2 (Medium)
**Estimated Time:** 2 hours

**Subtasks:**
- [ ] Test full CMD lifecycle (create, navigate, transition)
- [ ] Test topic shift detection end-to-end
- [ ] Test localStorage migration from old format
- [ ] Test keyboard navigation flow
- [ ] Test accessibility with screen reader
- [ ] Test on multiple browsers (Chrome, Firefox, Safari)

**Acceptance Criteria:**
- All flows work end-to-end
- No breaking bugs
- Cross-browser compatibility
- Accessible to all users

---

### Task 6.3: User Testing
**Priority:** P2 (Medium)
**Estimated Time:** 2 hours

**Subtasks:**
- [ ] Test with 3-5 users (first-time and returning)
- [ ] Observe CMD system usage
- [ ] Collect feedback on intuitiveness
- [ ] Identify pain points
- [ ] Iterate based on feedback

**Acceptance Criteria:**
- >80% of users understand CMD system without tutorial
- Users find CMD navigation intuitive
- No major usability issues
- Positive feedback on aesthetics

---

## Documentation

### Task 7.1: Update Test Results Format
**Priority:** P1 (High)
**Estimated Time:** 30 minutes

**Subtasks:**
- [ ] Update `GMAIL_INTEGRATION_TEST_RESULTS.md` with new log format
- [ ] Use mirrored split-screen layout
- [ ] Group messages by CMD
- [ ] Add CMD transition dividers
- [ ] Remove redundant labels

**Acceptance Criteria:**
- Log format matches new design
- Easy to read and understand
- Maintains mirror aesthetic

---

### Task 7.2: Developer Documentation
**Priority:** P2 (Medium)
**Estimated Time:** 1 hour

**Subtasks:**
- [ ] Document CMD state structure
- [ ] Document localStorage schema
- [ ] Document API endpoints (topic shift)
- [ ] Add code comments to key functions
- [ ] Create architecture diagram (optional)

**Acceptance Criteria:**
- Clear documentation for future developers
- Easy to understand and maintain
- Up-to-date with implementation

---

## Implementation Order

**Week 1: Core Infrastructure**
1. Task 1.1: CMD State Management
2. Task 1.2: CMD Number Display
3. Task 1.3: CMD Transition Animation
4. Task 1.4: Message Grouping by CMD

**Week 2: Navigation & Polish**
5. Task 2.1: CMD History Overlay
6. Task 2.2: CMD History Trigger
7. Task 2.3: CMD Navigation Logic
8. Task 4.1: Keyboard Shortcuts

**Week 3: Smart Features**
9. Task 3.1: Topic Shift Detection (Backend)
10. Task 3.2: Topic Shift Detection (Frontend)
11. Task 3.3: Auto CMD Suggestions
12. Task 3.4: First-Time User Hint

**Week 4: Quality & Optimization**
13. Task 4.2: Accessibility Improvements
14. Task 5.1: localStorage Optimization
15. Task 5.2: Animation Performance
16. Task 6.1-6.3: Testing
17. Task 7.1-7.2: Documentation

---

## Success Criteria

**Functional:**
- [ ] CMD system works end-to-end
- [ ] All keyboard shortcuts functional
- [ ] Topic shift detection accurate (>70%)
- [ ] No data loss or corruption

**Visual:**
- [ ] Maintains Black Mirror aesthetic
- [ ] Perfect mirror symmetry
- [ ] Smooth animations (60fps)
- [ ] Minimal, non-intrusive UI

**User Experience:**
- [ ] Intuitive without tutorial (>80% users)
- [ ] Fast and responsive (<100ms transitions)
- [ ] Accessible (WCAG AA compliant)
- [ ] No information overload

**Technical:**
- [ ] No console errors
- [ ] localStorage optimized
- [ ] Cross-browser compatible
- [ ] Mobile-friendly
