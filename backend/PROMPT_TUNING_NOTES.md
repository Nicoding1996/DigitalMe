# Advanced Prompt Integration - Tuning Notes

## Issue Identified
The advanced prompt integration was being **too aggressive** with signature phrases and contextual vocabulary, causing the AI to force patterns into responses where they didn't fit naturally.

### Symptoms
- AI responses included signature phrases like "my luvins", "beboo", "huhuhu" in every response
- Technical vocabulary like "no electricity", "build cache" appeared in personal conversations
- Responses felt forced and unnatural despite matching the user's style profile

### Example Problem
**User prompt:** "ask Bianca where would she like to eat for lunch later?"

**Bad response:** Used "my luvins", "beboo", "huhuhu", "no electricity", "build cache" all in one lunch question - completely unnatural.

## Changes Made

### 1. Signature Phrases Formatter (`formatSignaturePhrases`)
**Before:**
- Included top 7 phrases
- Instructions: "Use these recurring phrases naturally and frequently"
- Frequency labels: "very frequent - use often", "frequent - use regularly"

**After:**
- Filters out incomplete technical fragments (phrases ending with "and", "or", "the", "to")
- Reduced to top 5 phrases to avoid overwhelming
- Simplified frequency labels: "common", "occasional", "rare"
- New instructions: "Use them ONLY when they fit naturally" and "Don't force these into every response"

### 2. Contextual Vocabulary Formatter (`formatContextualVocabulary`)
**Before:**
- Listed all vocabulary for each context
- Instructions: "Select vocabulary that matches the context"

**After:**
- Limited to top 5 words per context to reduce noise
- Clearer context labels: "When discussing technical/work topics", "When discussing personal/relationship topics"
- Stronger warning: "IMPORTANT: Only use vocabulary that matches the CURRENT topic. Don't mix technical terms into personal conversations"

### 3. Meta-Prompt Critical Rules
**Added new rules:**
- Rule 1 emphasizes: "Answer the user's request directly and helpfully - this is the PRIMARY goal"
- Rule 2 adds: "keep it NATURAL and APPROPRIATE to the context"
- Rule 4: "DO NOT force signature phrases or vocabulary into responses where they don't fit naturally"
- Rule 5: "DO NOT try to use every pattern in every response - be selective and contextual"

## Expected Behavior After Changes

### Simple Personal Question
**Prompt:** "ask Bianca where would she like to eat for lunch later?"

**Expected response:**
- Should be SHORT and DIRECT
- May include 1-2 personal terms like "beboo" or "my luvins" IF appropriate
- Should NOT include technical vocabulary
- Should NOT try to use every signature phrase

**Good example:** "Beboo, where do you want to eat for lunch later?"

**Bad example:** "Bianca, I think we need to make a solid plan for lunch. Where would my luvins like to go later? (I am already starving, feels like I've been running on empty since breakfast)..."

### Technical Question
**Prompt:** "explain how the Gmail integration works"

**Expected response:**
- Should use technical vocabulary when appropriate
- Should NOT force personal terms of endearment
- Should maintain casual tone but be informative

## Testing Recommendations

1. **Test with simple personal questions** - responses should be brief and natural
2. **Test with technical questions** - should use appropriate technical vocabulary
3. **Test with creative questions** - should use creative vocabulary when relevant
4. **Verify signature phrases appear occasionally** - not in every response
5. **Check context switching** - technical terms shouldn't bleed into personal conversations

## Rollback Instructions

If these changes cause issues, the previous version had:
- `formatSignaturePhrases`: "Use these recurring phrases naturally and frequently"
- `formatContextualVocabulary`: Listed all vocabulary without limits
- Meta-prompt: Fewer explicit warnings about forcing patterns

## Next Steps

1. Restart the backend server to apply changes
2. Test with the same prompts that were problematic
3. Monitor for natural vs. forced pattern usage
4. May need further tuning based on results
