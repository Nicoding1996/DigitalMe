# Blog & GitHub Integration - Requirements

## Overview
Implement Blog and GitHub source analysis to extract writing style and communication patterns. Focus on **how users communicate**, not just technical content.

## Goals
1. Enable users to analyze blog posts for writing style patterns
2. Enable users to analyze GitHub activity for communication style
3. Extract natural language patterns from both sources
4. Maintain consistency with existing Gmail and Text analysis

## Source Priority
Based on quality weighting system:
- **Gmail**: 1.0 (gold standard - natural, unedited)
- **Text**: 0.85 (user-provided - authentic)
- **GitHub**: 0.7 (technical but authentic)
- **Blog**: 0.65 (polished, edited)

---

## Blog Analysis Requirements

### 1. Input
- **Format**: One or more blog post URLs
- **Validation**: Valid HTTP/HTTPS URLs
- **Sources**: Any public blog platform (Medium, personal blogs, LinkedIn articles, etc.)

### 2. Content Extraction
**What to Extract:**
- Article title
- Article body text (main content)
- Author byline (if available)
- Publication date

**What to Ignore:**
- Navigation menus
- Sidebars
- Comments section
- Advertisements
- Footer content

### 3. Style Analysis Focus
**Extract these patterns:**
- Tone and voice (casual, professional, conversational)
- Sentence structure and rhythm
- Vocabulary choices and recurring phrases
- How they explain concepts
- Storytelling patterns
- Paragraph flow and transitions

**NOT focused on:**
- SEO keywords
- Marketing language (unless it's their natural style)
- Technical accuracy of content

### 4. Quality Indicators
- Minimum 300 words per article
- At least 1 article required
- Recommend 3+ articles for better accuracy

### 5. Error Handling
- Invalid URL format
- URL not accessible (404, 403, etc.)
- Paywall/login required
- Content too short (< 300 words)
- Unable to extract text (JavaScript-heavy sites)

---

## GitHub Analysis Requirements

### 1. Input
- **Format**: GitHub username
- **Validation**: Valid GitHub username format (alphanumeric, hyphens, 1-39 chars)
- **Access**: Public repositories only

### 2. Content Extraction
**What to Extract (in priority order):**

**High Priority (Natural Communication):**
1. **Commit messages** - How they describe changes
2. **Pull request descriptions** - How they explain work
3. **Issue descriptions** - How they report problems
4. **Code review comments** - How they give feedback
5. **README files** - How they document projects

**Medium Priority (Technical Writing):**
6. **Code comments** - Explanation style
7. **Documentation files** (CONTRIBUTING.md, etc.)

**Low Priority (Skip for MVP):**
8. Actual code syntax (not relevant for writing style)

### 3. Style Analysis Focus
**Extract these patterns:**
- Commit message style (length, tone, emoji usage)
- How they explain technical concepts
- Problem-solving communication style
- Formality level in technical writing
- Use of humor or personality in commits
- Documentation clarity and approach

**Examples of what we're looking for:**
- "fix bug" vs "Fixed critical authentication issue affecting mobile users"
- "update readme" vs "📝 Improved setup instructions with troubleshooting section"
- Consistent use of present tense vs past tense
- Use of "I", "we", or impersonal voice

### 4. Quality Indicators
- Minimum 10 commits analyzed
- At least 1 repository with README
- Recommend 3+ active repositories
- Minimum 500 words total extracted text

### 5. Error Handling
- Invalid username format
- Username not found
- No public repositories
- All repositories empty/archived
- Insufficient commit history
- API rate limiting

---

## Technical Requirements

### Backend API Endpoints

#### Blog Analysis
```
POST /api/analyze-blog
Body: {
  urls: string[]  // Array of blog URLs
}
Response: {
  success: boolean,
  profile: {
    writing: WritingStyle,
    metadata: {
      wordCount: number,
      articlesAnalyzed: number,
      avgWordsPerArticle: number
    }
  },
  error?: string
}
```

#### GitHub Analysis
```
POST /api/analyze-github
Body: {
  username: string
}
Response: {
  success: boolean,
  profile: {
    writing: WritingStyle,
    metadata: {
      wordCount: number,
      commitsAnalyzed: number,
      repositoriesAnalyzed: number
    }
  },
  error?: string
}
```

### External Dependencies

**Blog Scraping:**
- Consider: `cheerio` (HTML parsing), `axios` (HTTP requests)
- Handle: Different blog platforms, dynamic content, paywalls

**GitHub API:**
- Use: GitHub REST API v3 or Octokit
- Authentication: Optional (higher rate limits with token)
- Rate Limits: 60 requests/hour (unauthenticated), 5000/hour (authenticated)

### Security Considerations
1. **Input Validation**: Sanitize URLs and usernames
2. **Rate Limiting**: Prevent abuse of scraping/API calls
3. **Timeout Handling**: Don't hang on slow/unresponsive sites
4. **Content Size Limits**: Cap maximum content per source
5. **Error Exposure**: Don't leak internal errors to frontend

---

## User Experience

### Progress Indicators
Both sources should show progress during analysis:
- "Fetching content..."
- "Analyzing writing patterns..."
- "Extracting style profile..."

### Error Messages
User-friendly error messages:
- ❌ "Unable to access blog post. Please check the URL."
- ❌ "GitHub user not found. Please verify the username."
- ⚠️ "Limited data available. Add more sources for better accuracy."

### Success Feedback
- ✅ "Analyzed 3 blog posts (2,450 words)"
- ✅ "Analyzed 47 commits from 5 repositories (1,820 words)"

---

## Integration with Existing System

### 1. Frontend (Already Ready)
- UI components exist in `SourceConnector.js`
- Validation functions exist in `StyleAnalyzer.js`
- Just need to connect to real backend APIs

### 2. Style Merging
- Blog and GitHub results merge with existing sources
- Use quality weights: GitHub (0.7), Blog (0.65)
- Follow same `WritingStyle` schema as Gmail/Text

### 3. Confidence Calculation
- Word count from blog/GitHub contributes to total
- Quality checks apply (spam detection, diversity)
- Multiple sources bonus applies

---

## Success Criteria

### Blog Analysis
- ✅ Can extract text from at least 3 major blog platforms (Medium, WordPress, custom)
- ✅ Accurately identifies tone, formality, vocabulary
- ✅ Handles errors gracefully (404s, paywalls)
- ✅ Processes 3 articles in < 10 seconds

### GitHub Analysis
- ✅ Can fetch commit messages and README content
- ✅ Extracts communication style from technical writing
- ✅ Handles users with varying activity levels
- ✅ Respects GitHub API rate limits
- ✅ Processes typical user profile in < 15 seconds

### Overall Integration
- ✅ Blog + GitHub sources merge correctly with Gmail/Text
- ✅ Confidence calculation includes blog/GitHub word counts
- ✅ Quality weights applied correctly (0.7 for GitHub, 0.65 for Blog)
- ✅ User can add blog/GitHub to existing profile
- ✅ Clear error messages for all failure cases
