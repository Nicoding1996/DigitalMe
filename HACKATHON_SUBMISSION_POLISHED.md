# DigitalMe: Your AI Doppelgänger

## About the Project

### Inspiration

Ever notice how AI always sounds like... AI? 

That corporate "I'd be happy to help!" tone that screams AI generated from a mile away? I got tired of using AI tools that made my writing sound generic and robotic. I wanted an AI that could actually write like ME - my quirks, my pacing, my vocabulary, my natural flow, and even my small writing imperfections.

**The idea hit me:** What if AI could build a writing model of you using the things you already write every day — emails, commits, blogs, chats? Not just mimic "professional" or "casual" - but actually clone YOUR specific style.

Something that understands how you think and communicate.
A digital doppelgänger.

---

### What it does

DigitalMe creates your AI twin through intelligent multi-source analysis:

**1. Data Collection**
Connect your Gmail, GitHub repos, blog URLs, or paste text samples. The app analyzes thousands of words across multiple sources to understand your unique voice.

**2. Advanced Style Profiling**
Goes beyond basic tone detection:
- **Signature Phrases**: Detects your verbal fingerprint ("I think", "you know", "so i am")
- **Thought Flow**: Analyzes how you structure and connect ideas
- **Personality Quirks**: Extracts self-aware humor, casual tone, personal context
- **Contextual Variations**: Learns how you adapt to different situations

Each source gets quality-weighted:
- Gmail: 1.0 (highest - unedited, authentic writing)
- Text samples: 0.85 (user-provided, authentic)
- GitHub: 0.7 (technical but real)
- Blogs: 0.65 (polished, edited)

**3. Personalized AI Generation**
Chat with an AI that responds in YOUR voice. Not generic AI speak - your actual communication style. The split-screen "mirror" interface emphasizes the duality: you on the left, your AI twin on the right.

**4. Living Profile System**
The AI learns in real-time from your conversations:
- Collects messages in batches (10 messages or 5 minutes)
- Analyzes your writing and refines the style profile
- Low-confidence attributes update more, high-confidence ones stay stable
- Shows delta reports: "Formality: 0.7 → 0.65"
- User-controlled toggle (on/off anytime)

Your AI twin gets better at mimicking you over time.

**5. Conversation Intelligence**
The AI maintains context and responds to refinement requests:
- Say "make it shorter" → actually shortens the previous response
- Say "make it more formal" → temporarily overrides your casual style
- Understands follow-up questions and iterative refinement

It's a real conversation partner, not just a prompt-response bot.

---

### How we built it

**Built entirely with Kiro** - leveraging multiple features to create a production-ready app.

#### Spec-Driven Development (Primary Approach)

I structured the entire project using Kiro's spec system. Created 10 major specs, each with `requirements.md`, `design.md`, and `tasks.md`:

- `digitalme-dev`: Core application architecture
- `backend-proxy-service`: Express server and API endpoints
- `gmail-integration`: OAuth flow and email analysis
- `blog-github-integration`: Blog scraping and GitHub API
- `advanced-style-analysis`: Pattern extraction algorithms
- `advanced-prompt-integration`: Dynamic meta-prompt system
- `multi-source-merging`: Quality-weighted data combination
- `living-profile`: Real-time learning system
- `mirrored-cmd-system`: Conversation context management
- `ux-polish-improvements`: UI refinement and accessibility

**The Task List Game-Changer:**
Each spec's `tasks.md` became my roadmap. Kiro broke down complex features into bite-sized checkboxes. As I completed tasks, I'd check them off. If I thought of something new, I'd add another task.

Example: The `gmail-integration` spec had 15 tasks covering OAuth setup, token encryption, email retrieval, cleansing logic, error handling, and testing. Watching that checklist go from 0/15 to 15/15 was incredibly motivating.

**Why Specs Beat Vibe Coding for This Project:**
- Complex features needed upfront design (OAuth, encryption, multi-source merging)
- Clear progress tracking (X/Y tasks complete)
- Requirements docs served as documentation
- Could iterate on design before writing code
- Maintained consistency across 50+ files

#### Steering Documents (Context Management)

Created 3 steering docs that guided ALL Kiro interactions:

**`tech.md`**: Technology stack, coding conventions, architecture patterns
- Ensured consistent use of React hooks, async/await, TailwindCSS
- Defined service layer architecture (GmailAuthService, StyleAnalyzer, etc.)
- Specified error handling patterns

**`structure.md`**: File organization, directory layout, naming conventions
- Kept components in `src/components/`, services in `backend/services/`
- Maintained consistent file naming
- Documented the monorepo structure

**`product.md`**: Product vision, user experience, feature requirements
- Defined the "digital doppelgänger" concept
- Explained multi-source data acquisition
- Documented the living profile system

**Impact:** These docs eliminated repetitive explanations. Kiro always knew the project context without me restating it in every conversation.

#### Vibe Coding (Rapid Prototyping)

Used conversational development for:

**UI Polish:**
- "Make the particle background more subtle"
- "Add glitch effects to the header"
- "Improve the split-screen transition animation"

Kiro iterated quickly on visual design without needing formal specs.

**Debugging:**
- "The OAuth callback isn't working - help me debug"
- "Why is the email cleansing removing too much content?"

Kiro analyzed code, identified issues, and suggested fixes conversationally.

**Most Impressive Code Generation:** 
Kiro built the entire `EmailCleansingService` in one shot - 300+ lines handling signature removal, quoted text detection, HTML stripping, and automated message filtering. It just worked.

#### Tech Stack

- **Frontend**: React 19 + TailwindCSS (Black Mirror design system)
- **Backend**: Node.js/Express proxy service
- **AI**: Google Gemini 2.0 with dynamic meta-prompts
- **Integrations**: Gmail API (OAuth 2.0), GitHub API (@octokit/rest), web scraping (axios + cheerio)
- **Development**: Built entirely with Kiro using specs, steering docs, and vibe coding

---

### Challenges we ran into

**Gmail OAuth Security**
Implementing secure OAuth was tricky. I needed to store access tokens client-side (localStorage) but couldn't expose them. 

**Solution:** Backend encrypts tokens with AES-256-GCM before sending to frontend. Kiro helped me architect this flow and debug the encryption/decryption logic.

**Email Cleansing**
Raw Gmail data is MESSY - signatures, quoted replies, automated messages, HTML formatting. 

**Solution:** Built an EmailCleansingService that strips all that noise. Kiro helped me identify edge cases and refine the regex patterns.

**Quality-Weighted Merging**
How do you combine writing samples from different sources with different quality levels? 

**Solution:** Implemented a weighted averaging system where Gmail (unedited) counts more than blogs (polished). Kiro helped me design the algorithm and tune the quality weights.

**Real-Time Learning Without Drift**
The living profile system needed to learn from conversations without "drifting" away from the original style. 

**Solution:** Confidence-weighted updates where low-confidence attributes update more, high-confidence attributes stay stable. Kiro helped me implement the diminishing returns curve.

**Conversation Context Management**
Making the AI understand refinement requests like "make it shorter" required passing conversation history and detecting instruction patterns. 

**Solution:** Built refinement detection logic and instruction priority system. Kiro helped me handle the edge cases.

**Streaming Responses**
Getting Gemini's streaming API to work with the split-screen UI was challenging. 

**Solution:** Kiro helped debug the async flow and maintain conversation context during partial responses.

---

### Accomplishments that we're proud of

🏆 **Multi-Source Intelligence**
The app doesn't just analyze one data source - it intelligently merges Gmail, GitHub, blogs, and text samples with quality weighting. This gives a much richer, more accurate style profile than single-source tools.

🏆 **Living Profile System**
Real-time learning that continuously refines your profile as you chat. It's not static - your AI twin gets better at mimicking you over time. Shows delta reports of what changed. User-controlled toggle.

🏆 **Conversation Intelligence**
The AI maintains context across messages and responds intelligently to refinement requests. "Make it shorter" actually shortens the previous response. It's a real conversation partner.

🏆 **Advanced Pattern Extraction**
Goes beyond basic tone/formality to extract signature phrases, thought flow, personality quirks, and contextual variations. This is what makes it a true "doppelgänger" vs just a style copier.

🏆 **OAuth Security**
Implemented production-grade security with token encryption, rate limiting, input validation, and error sanitization. No API keys exposed, no PII logged.

🏆 **Black Mirror Aesthetic**
The UI isn't just functional - it's an experience. Particle animations, glitch effects, split-screen mirror design. It FEELS like you're talking to your digital reflection.

🏆 **Spec-Driven Architecture**
The codebase is clean, organized, and maintainable thanks to Kiro's spec system. Each feature has clear requirements, design docs, and implementation tasks.

---

### What we learned

**Kiro's Spec System is Powerful**
For complex projects, specs beat pure vibe coding. The structure helped me think through requirements before implementation, track progress, and maintain consistency. I could iterate on design docs without touching code.

**Steering Docs Save Time**
Instead of repeating context in every conversation, steering docs gave Kiro persistent memory. It always knew the tech stack, file structure, and product vision.

**AI Style Analysis is Hard**
Extracting meaningful patterns from text is surprisingly complex. Vocabulary diversity, sentence structure, tone detection - lots of edge cases. Kiro helped me refine the algorithms through multiple iterations.

**OAuth is Worth the Effort**
Gmail integration was the hardest part but provides the highest quality data. Unedited emails reveal authentic voice better than polished blog posts.

**Real-Time Learning Needs Guardrails**
Without confidence-weighted updates, the profile would drift too much. The diminishing returns curve keeps it stable while still improving.

---

### What's next for DigitalMe

**More Data Sources**
Slack messages, Twitter/X posts, Discord chat history, LinkedIn articles. The more sources, the better the profile.

**Team Profiles**
Analyze entire team communication styles to help new members match the team's voice.

**Writing Assistant Mode**
Real-time suggestions as you type to help match a specific style (your own or someone else's).

**API Access**
Let other apps use DigitalMe's style analysis and generation capabilities.

**Fine-Tuned Models**
Instead of meta-prompts, actually fine-tune a model on your writing for even better results.

---

*Built entirely with Kiro for the Kiroween Hackathon 2025*
