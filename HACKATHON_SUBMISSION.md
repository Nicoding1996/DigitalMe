# DigitalMe - Kiroween Hackathon Submission

## Project Name
DigitalMe - Your AI Doppelgänger

## Elevator Pitch
No more "clearly AI" moments. DigitalMe learns from your emails, GitHub, blogs, and text samples to create an AI that writes in your authentic voice. Built entirely in Kiro.

## Category
**Costume Contest** - Haunting UI with polished Black Mirror aesthetic

## Bonus Categories
- Best Startup Project
- Most Creative

---

## About the Project

### Inspiration

Ever notice how AI always sounds like... AI? That corporate "I'd be happy to help!" tone that screams ChatGPT from a mile away? I got tired of using AI tools that made my writing sound generic and robotic. I wanted an AI that could actually write like ME - with my quirks, my vocabulary, my sentence structure.

The idea hit me: what if AI could learn your voice from the stuff you've already written? Your emails, your code commits, your blog posts, essays. Not just mimic "professional" or "casual" - but actually clone YOUR specific style. A digital doppelgänger that knows how you think and communicate.

### What it does

DigitalMe creates your AI twin in three steps:

1. **Data Collection**: Connect your Gmail, GitHub repos, blog URLs, or paste text samples. The app analyzes thousands of words across multiple sources to understand your unique voice.

2. **Style Profiling**: Advanced pattern extraction identifies your tone, formality, sentence structure, vocabulary preferences, signature phrases, and even what words you avoid. Each source gets quality-weighted (Gmail = highest quality since it's unedited, blogs = lower since they're polished).

3. **Personalized AI**: Chat with an AI that responds in YOUR voice. Not generic ChatGPT speak - your actual communication style.

4. **Living Profile System**: The AI learns in real-time from your conversations. Every 10 messages or 5 minutes of chat, it analyzes your writing and refines the style profile. Low-confidence attributes update more, high-confidence ones stay stable. You get notifications showing exactly what changed ("Formality: 0.7 → 0.65"). Toggle it on/off anytime.

5. **Conversation Intelligence**: The AI maintains context and responds to refinement requests. Say "make it shorter" and it actually shortens the previous response instead of generating something new. Say "make it more formal" and it overrides your casual style temporarily. It's a real conversation, not just prompt-response.

The split-screen "mirror" interface emphasizes the duality: you on the left, your AI twin on the right. Dark, glitchy, futuristic aesthetic inspired by Black Mirror.

### How we built it

**Built entirely in Kiro using multiple features:**

**Spec-Driven Development**: I structured the entire project using Kiro specs. Created detailed requirements and design docs for each major feature:
- `gmail-integration` spec: OAuth flow, email retrieval, cleansing logic
- `advanced-style-analysis` spec: Pattern extraction algorithms, quality scoring
- `multi-source-merging` spec: Quality-weighted averaging across data sources
- `living-profile` spec: Real-time learning system

Kiro implemented each spec systematically, breaking down complex features into manageable tasks. This was WAY more organized than vibe coding - I could track progress, iterate on requirements, and maintain consistency across the codebase.

**Steering Documents**: Created three steering docs that guided Kiro throughout development:
- `tech.md`: Technology stack, coding conventions, architecture patterns
- `structure.md`: File organization, naming conventions, project layout
- `product.md`: Product vision, user experience, feature requirements

These docs ensured Kiro always understood the project context and made consistent decisions. When building new features, Kiro automatically referenced these docs without me having to repeat myself.

**Vibe Coding**: Used conversational development for rapid prototyping and UI refinement. Kiro helped me:
- Design the particle background animation system
- Implement the glitch effects and visual polish
- Debug OAuth callback flows
- Optimize the style analysis algorithms

The back-and-forth with Kiro felt like pair programming with someone who actually understood the vision.

**Tech Stack**:
- Frontend: React 19 + TailwindCSS (Black Mirror design system)
- Backend: Node.js/Express proxy service
- AI: Google Gemini 2.0 with dynamic meta-prompts
- Integrations: Gmail API (OAuth 2.0), GitHub API (@octokit/rest), web scraping (axios + cheerio)

### Challenges we ran into

**Gmail OAuth Security**: Implementing secure OAuth was tricky. I needed to store access tokens client-side (localStorage) but couldn't expose them. Solution: Backend encrypts tokens with AES-256-GCM before sending to frontend. Kiro helped me architect this flow and debug the encryption/decryption logic.

**Email Cleansing**: Raw Gmail data is MESSY - signatures, quoted replies, automated messages, HTML formatting. I built an EmailCleansingService that strips all that noise. Kiro helped me identify edge cases and refine the regex patterns.

**Quality-Weighted Merging**: How do you combine writing samples from different sources with different quality levels? I implemented a weighted averaging system where Gmail (unedited) counts more than blogs (polished). Kiro helped me design the algorithm and tune the quality weights.

**Real-Time Learning Without Drift**: The living profile system needed to learn from conversations without "drifting" away from the original style. Solution: Confidence-weighted updates where low-confidence attributes update more, high-confidence attributes stay stable. Kiro helped me implement the diminishing returns curve.

**Conversation Context Management**: Making the AI understand refinement requests like "make it shorter" required passing conversation history and detecting instruction patterns. The AI needed to know when to revise vs create new content. Kiro helped me build the refinement detection logic and instruction priority system.

**Streaming Responses**: Getting Gemini's streaming API to work with the split-screen UI was challenging. Needed to handle partial responses, maintain conversation context, and update the UI smoothly. Kiro helped debug the async flow.

### Accomplishments that we're proud of

**Multi-Source Intelligence**: The app doesn't just analyze one data source - it intelligently merges Gmail, GitHub, blogs, and text samples with quality weighting. This gives a much richer, more accurate style profile than single-source tools.

**Living Profile System**: Real-time learning that continuously refines your profile as you chat. Collects messages in batches (10 messages or 5 minutes), analyzes them, and updates the profile with confidence-weighted merging. Shows delta reports of what changed. User-controlled toggle. It's not static - your AI twin gets better at mimicking you over time.

**Conversation Intelligence**: The AI maintains context across messages and responds intelligently to refinement requests. "Make it shorter" actually shortens the previous response. "Make it formal" temporarily overrides your casual style. It's a real conversation partner, not just a prompt-response bot.

**OAuth Security**: Implemented production-grade security with token encryption, rate limiting, input validation, and error sanitization. No API keys exposed, no PII logged.

**Black Mirror Aesthetic**: The UI isn't just functional - it's an experience. Particle animations, glitch effects, split-screen mirror design. It FEELS like you're talking to your digital reflection.

**Spec-Driven Architecture**: The codebase is clean, organized, and maintainable thanks to Kiro's spec system. Each feature has clear requirements, design docs, and implementation tasks.

### What we learned

**Kiro's Spec System is Powerful**: For complex projects, specs beat pure vibe coding. The structure helped me think through requirements before implementation, track progress, and maintain consistency. I could iterate on design docs without touching code.

**Steering Docs Save Time**: Instead of repeating context in every conversation, steering docs gave Kiro persistent memory. It always knew the tech stack, file structure, and product vision.

**AI Style Analysis is Hard**: Extracting meaningful patterns from text is surprisingly complex. Vocabulary diversity, sentence structure, tone detection - lots of edge cases. Kiro helped me refine the algorithms through multiple iterations.

**OAuth is Worth the Effort**: Gmail integration was the hardest part but provides the highest quality data. Unedited emails reveal authentic voice better than polished blog posts.

**Real-Time Learning Needs Guardrails**: Without confidence-weighted updates, the profile would drift too much. The diminishing returns curve keeps it stable while still improving.

### What's next for DigitalMe

**More Data Sources**: Slack messages, Twitter/X posts, Discord chat history, LinkedIn articles. The more sources, the better the profile.

**Team Profiles**: Analyze entire team communication styles to help new members match the team's voice.

**Writing Assistant Mode**: Real-time suggestions as you type to help match a specific style (your own or someone else's).

**API Access**: Let other apps use DigitalMe's style analysis and generation capabilities.

**Fine-Tuned Models**: Instead of meta-prompts, actually fine-tune a model on your writing for even better results.

---

## How Kiro Was Used

### Spec-Driven Development (Primary Approach)

I built DigitalMe primarily using Kiro's spec system. Here's how:

**Spec Structure**: Created 10 comprehensive specs, each with requirements.md, design.md, and tasks.md:
- `digitalme-dev`: Core application architecture
- `backend-proxy-service`: Express server and API endpoints
- `gmail-integration`: OAuth flow and email analysis
- `blog-github-integration`: Blog scraping and GitHub API integration
- `advanced-style-analysis`: Pattern extraction algorithms
- `advanced-prompt-integration`: Dynamic meta-prompt system
- `multi-source-merging`: Quality-weighted data combination
- `living-profile`: Real-time learning system
- `mirrored-cmd-system`: Conversation context management
- `codebase-analysis`: Code style analysis

**Development Workflow**:
1. Write requirements.md with acceptance criteria
2. Kiro helps design the solution in design.md
3. Break down into implementation tasks
4. Kiro implements each task systematically
5. Iterate on requirements as needed

**Why Specs Beat Vibe Coding for This Project**:
- Complex features needed upfront design (OAuth flow, encryption, multi-source merging)
- Specs provided clear progress tracking (X/Y tasks complete)
- Requirements docs served as documentation
- Could iterate on design before writing code
- Maintained consistency across 50+ files

**The Task List Game-Changer**: Each spec's `tasks.md` file became my roadmap. Kiro broke down complex features into bite-sized checkboxes - like a step-by-step guide I could follow. As I completed tasks, I'd check them off. If I thought of something new mid-development, I'd just add another task to the list. It kept me organized and gave me that satisfying progress feeling every time I checked a box.

**Example**: The `gmail-integration` spec had 15 tasks covering OAuth setup, token encryption, email retrieval, cleansing logic, error handling, and testing. Kiro implemented them in order, referencing the design doc for architectural decisions. Watching that checklist go from 0/15 to 15/15 was incredibly motivating.

### Steering Documents (Context Management)

Created 3 steering docs that guided ALL Kiro interactions:

**tech.md**: Technology stack, coding conventions, architecture patterns
- Ensured consistent use of React hooks, async/await, TailwindCSS
- Defined service layer architecture (GmailAuthService, StyleAnalyzer, etc.)
- Specified error handling patterns

**structure.md**: File organization, directory layout, naming conventions
- Kept components in `src/components/`, services in `backend/services/`
- Maintained consistent file naming
- Documented the monorepo structure

**product.md**: Product vision, user experience, feature requirements
- Defined the "digital doppelgänger" concept
- Explained multi-source data acquisition
- Documented the living profile system

**Impact**: These docs eliminated repetitive explanations. Kiro always knew the project context, tech stack, and product vision without me restating it in every conversation.

### Agent Hooks (Workflow Automation)

Created a custom agent hook to automate style analysis:

**Hook: "Analyze Code on Save"**
- Triggers when any JS/TS file is saved
- Automatically analyzes coding patterns in the file
- Updates the coding style model in real-time
- Helps maintain consistency across the codebase

**Why This Matters**: As I write code, the hook continuously learns my coding style (naming conventions, comment frequency, patterns). This feeds into the style profile that DigitalMe uses to generate code that matches MY coding style, not generic examples.

**Implementation**: Created `.kiro/hooks/analyze-code-on-save.kiro.hook` with file edit triggers for `**/*.js`, `**/*.ts`, `**/*.jsx`, `**/*.tsx` patterns.

This was a game-changer for maintaining style consistency - the AI learns from my actual code as I write it.

### MCP (Model Context Protocol)

While I didn't create a custom MCP server for this project, I explored using MCP to extend Kiro's capabilities for future enhancements:

**Potential MCP Use Cases**:
- Custom Gmail MCP server for deeper email analysis beyond the API
- Writing style database MCP server to store and query style patterns
- Multi-user MCP server for team style profiles

**Why I Didn't Use MCP Yet**: The Gmail API and GitHub API were sufficient for the MVP. MCP would be valuable for the next phase when adding more complex data sources or building a shared style database.

### Vibe Coding (Rapid Prototyping)

Used conversational development for:

**UI Polish**: 
- "Make the particle background more subtle"
- "Add glitch effects to the header"
- "Improve the split-screen transition animation"

Kiro iterated quickly on visual design without needing formal specs.

**Debugging**:
- "The OAuth callback isn't working - help me debug"
- "Why is the email cleansing removing too much content?"

Kiro analyzed code, identified issues, and suggested fixes conversationally.

**Algorithm Tuning**:
- "The confidence calculation feels off - let's adjust the curve"
- "How should we weight Gmail vs blog data?"

Kiro helped me experiment with different approaches and tune parameters.

**Most Impressive Code Generation**: Kiro built the entire `EmailCleansingService` in one shot - 300+ lines handling signature removal, quoted text detection, HTML stripping, and automated message filtering. It just worked.

### Comparison: Specs vs Vibe Coding

**When I Used Specs**:
- Complex features with multiple components (Gmail integration, multi-source merging)
- Features requiring upfront design (OAuth security, encryption)
- Features needing clear progress tracking
- Features that would be hard to explain conversationally

**When I Used Vibe Coding**:
- UI tweaks and visual polish
- Quick bug fixes
- Algorithm experimentation
- Prototyping new ideas

**Verdict**: Specs provided structure and consistency for the core architecture. Vibe coding enabled rapid iteration on details. The combination was powerful - specs for the foundation, vibe coding for the finishing touches.

### Key Takeaway

Kiro's spec system transformed how I build complex projects. Instead of jumping straight into code, I could think through requirements, design solutions, and track progress systematically. The steering docs gave Kiro persistent context, eliminating repetitive explanations. And vibe coding remained available for quick iterations and experimentation.

This project wouldn't have been possible without Kiro's combination of structured specs and conversational flexibility.

---

## Repository & Demo

**GitHub**: [Your repo URL here]
**Live Demo**: [Your deployed URL here]
**Video Demo**: [YouTube/Vimeo URL here]

**Login Credentials** (if needed):
- Email: demo@digitalme.app
- Password: [if applicable]

---

## Technical Details

**Frontend**: React 19.2.0, TailwindCSS 3.4.1, Create React App
**Backend**: Node.js, Express 5.1.0
**AI**: Google Gemini 2.0 Flash Exp
**APIs**: Gmail API (OAuth 2.0), GitHub API (@octokit/rest)
**Security**: AES-256-GCM encryption, rate limiting, input validation

**Key Files**:
- `.kiro/specs/` - All spec documents (10 specs total)
- `.kiro/steering/` - Steering documents (tech, structure, product)
- `.kiro/hooks/` - Agent hook for code analysis on save
- `src/components/MirrorInterface.js` - Split-screen UI with conversation context
- `src/components/RefinementNotification.js` - Living profile update notifications
- `src/components/DeltaReportModal.js` - Shows profile changes
- `backend/services/ProfileRefinerService.js` - Real-time learning logic
- `backend/services/GmailStyleAnalyzer.js` - Email analysis
- `backend/services/AdvancedStyleAnalyzer.js` - Pattern extraction
- `backend/server.js` - Refinement detection and instruction priority

---

## License

MIT License (or your chosen OSI-approved license)
