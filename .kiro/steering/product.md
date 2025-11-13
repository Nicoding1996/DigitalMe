# Product Overview

**DigitalMe** (Doppelgänger) is an interactive web application that creates a conversational interface between a human user and their AI reflection. The app features a split-screen design where users input messages on the left side and receive AI-generated responses on the right side, creating a "mirror" effect.

## Core Concept

The application explores the concept of digital identity and AI interaction through a visually striking interface that emphasizes the duality between human input and AI response. The aesthetic is dark and futuristic, with glitch effects and system-style messaging.

---

## Dynamic Persona Protocol

**Core Identity:** You are a digital doppelgänger - an AI that dynamically adapts its entire persona to match the user's unique communication style.

**Adaptive Behavior:**
The AI's personality is **not fixed**. Instead, it receives a `styleProfile` object with each request that defines the user's writing and coding preferences. The AI must dynamically transform its entire response style to perfectly mirror these preferences.

**Style Profile Structure:**
Each request includes a `styleProfile` object with two main sections:

### Writing Style
- **tone**: The emotional quality (e.g., conversational, professional, analytical)
- **formality**: The level of formality (e.g., casual, neutral, formal)
- **sentenceLength**: Preferred sentence structure (e.g., short, mixed, long)
- **vocabulary**: Preferred word choices and phrases
- **avoidance**: Words and phrases to never use

### Coding Style
- **language**: Primary programming language
- **framework**: Preferred framework or library
- **componentStyle**: Component architecture preference
- **namingConvention**: Variable and function naming style
- **commentFrequency**: How often to include code comments
- **patterns**: Preferred design patterns and practices

**Implementation:**
The backend's `buildMetaPrompt()` function constructs a dynamic meta-prompt that combines the user's request with their complete style profile. This ensures every AI response is personalized to match the user's unique voice and preferences.

**Behavioral Rules:**
- When generating code, adhere to the conventions defined in `tech.md` and `structure.md`
- When writing text, strictly follow the `styleProfile.writing` parameters
- When writing code, strictly follow the `styleProfile.coding` parameters
- The response should feel like a reflection of the user's own thought process
- If the style is casual, avoid formal business language
- If the style is conversational, sound like a real person, not an AI assistant

---

## Multi-Source Data Acquisition

**DigitalMe** analyzes writing style from four different data sources, each with quality-weighted contributions to the final profile.

### Supported Sources

**1. Text Samples** (Quality Weight: 0.85)
- Direct text input (100+ words minimum)
- Real-time analysis
- Ideal for quick profile creation

**2. Gmail Integration** (Quality Weight: 1.0 - Highest)
- OAuth 2.0 secure authentication
- Analyzes sent emails (up to 200)
- Automatic email cleansing (removes signatures, quoted text, automated messages)
- Natural, unedited writing samples provide highest quality data

**3. Blog Analysis** (Quality Weight: 0.65)
- Web scraping from public blog URLs
- Supports Medium, Dev.to, WordPress, and custom blogs
- Intelligent content extraction (removes navigation, ads, sidebars)
- Polished content weighted lower due to editing

**4. GitHub Integration** (Quality Weight: 0.7)
- Public repository analysis via GitHub API
- Commit message style analysis
- README documentation extraction
- Focuses on communication style, not code syntax

### Multi-Source Intelligence

**Quality-Weighted Merging:**
- Each source contributes based on quality weight × word count
- Higher quality sources (Gmail) have more influence than polished content (blogs)
- Confidence increases with total word count across all sources
- Source attribution tracks which sources influenced each style attribute

**Word-Count-Based Confidence:**
- 500-1,499 words: 35-55% (minimum viable)
- 1,500-2,999 words: 55-70% (good)
- 3,000-4,999 words: 70-80% (strong)
- 5,000-9,999 words: 80-88% (excellent)
- 10,000+ words: 88-92% (optimal)
- Maximum: 95% (perfect replication is impossible)

**Quality Detection:**
- Spam detection (duplicate sentences within source)
- Vocabulary diversity validation
- Pattern consistency across sources
- Natural repetition vs copy-paste distinction

---

## Living Profile System

**DigitalMe** features real-time learning that continuously refines your style profile as you interact with your AI doppelgänger.

### How It Works

**Automatic Message Collection:**
- Collects your messages from conversations (10+ words, quality filtered)
- Ignores code blocks and low-quality messages
- Batch triggers: 10 messages OR 5 minutes of inactivity

**Confidence-Weighted Updates:**
- Low confidence attributes (< 50%) update more significantly
- High confidence attributes (> 80%) update minimally
- Diminishing returns prevent profile drift
- Incremental refinement preserves existing patterns

**What Gets Updated:**
- Basic writing style (tone, formality, sentence length)
- Vocabulary and avoidance patterns
- Confidence scores per attribute
- Word counts and learning metadata

**What Stays Manual:**
- Advanced patterns (signature phrases, thought patterns, personality markers)
- Source attribution (conversations not tracked as separate source)

### User Control

**Learning Toggle:**
- Enable/disable real-time learning in Settings
- Clear pending batch when disabled
- Session persistence across page reloads

**Transparency:**
- Delta reports show exactly what changed
- "View Changes" button displays old → new values
- Auto-dismiss notifications (8 seconds)
- Profile completeness score and words analyzed counter

---

## Conversational Intelligence

The AI maintains conversation context and responds intelligently to refinement requests, making it a true interactive mirror rather than a static style copier.

**Conversation History:**
- The system passes recent conversation history (last 10 messages) to provide context
- Enables natural follow-up questions and iterative refinement
- Maintains conversational continuity across multiple exchanges

**Refinement Detection:**
- Automatically detects when users ask to refine previous responses
- Examples: "make it shorter", "more formal", "add examples", "simplify this"
- Treats refinement requests as edits to previous responses, not new questions

**Instruction Priority:**
- Explicit refinement instructions temporarily override style profile defaults
- If you say "make it shorter", the AI will reduce length even if your style profile says "long sentences"
- If you say "make it formal", the AI will use formal language even if your style is casual
- After the refinement, the AI returns to your default style for new questions

**Supported Refinement Instructions:**

*Length/Complexity:*
- "make it shorter" / "make it longer"
- "more detail" / "simplify this"
- "make it more concise"

*Tone/Style:*
- "make it more fun" / "make it formal"
- "make it casual" / "be more serious"
- "lighten it up"

*Structure:*
- "use bullet points" / "write as paragraphs"
- "give me steps" / "explain like I'm 5"

*Content:*
- "add examples" / "remove jargon"
- "focus on [specific topic]"

---

## Export & Data Management

**Profile Export:**
- Export complete style profile as JSON
- Download conversation history
- Backup and restore profiles
- Share profiles across devices

**Privacy & Security:**
- OAuth tokens encrypted with AES-256-GCM
- No data stored on servers (localStorage only)
- Read-only access to Gmail Sent folder
- Revoke access anytime from Settings
