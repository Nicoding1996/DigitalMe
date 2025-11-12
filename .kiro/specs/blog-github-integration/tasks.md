# Blog & GitHub Integration - Implementation Tasks

## Phase 1: Blog Analysis Backend

### Task 1.1: Blog Scraping Service
**File**: `backend/services/BlogScrapingService.js`

**Implementation:**
```javascript
class BlogScrapingService {
  async scrapeUrl(url) {
    // Fetch HTML content
    // Parse with cheerio
    // Extract main article content
    // Return { title, content, wordCount }
  }
  
  async scrapeMultipleUrls(urls) {
    // Scrape all URLs in parallel
    // Handle failures gracefully
    // Return array of results
  }
}
```

**Dependencies:**
- `axios` - HTTP requests
- `cheerio` - HTML parsing
- `he` - HTML entity decoding

**Error Handling:**
- Timeout after 10 seconds per URL
- Handle 404, 403, 500 errors
- Detect paywalls/login walls
- Validate minimum content length

**Acceptance Criteria:**
- [ ] Can scrape Medium articles
- [ ] Can scrape WordPress blogs
- [ ] Can scrape custom blog sites
- [ ] Handles errors without crashing
- [ ] Returns clean text (no HTML tags)

---

### Task 1.2: Blog Analysis Endpoint
**File**: `backend/server.js` (add endpoint)

**Implementation:**
```javascript
app.post('/api/analyze-blog', 
  inputValidation.validateBlogUrls,
  rateLimiter.blogAnalysis,
  async (req, res) => {
    // 1. Scrape blog URLs
    // 2. Combine text from all articles
    // 3. Analyze with Gemini AI
    // 4. Return writing style profile
  }
);
```

**Validation** (`backend/validation.js`):
```javascript
validateBlogUrls: [
  body('urls').isArray().withMessage('URLs must be an array'),
  body('urls.*').isURL().withMessage('Invalid URL format'),
  body('urls').custom((urls) => {
    if (urls.length > 10) throw new Error('Maximum 10 URLs allowed');
    return true;
  })
]
```

**Rate Limiting** (`backend/middleware/rateLimiter.js`):
```javascript
blogAnalysis: rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per window
  message: 'Too many blog analysis requests'
})
```

**Acceptance Criteria:**
- [ ] Endpoint validates input correctly
- [ ] Rate limiting prevents abuse
- [ ] Returns consistent WritingStyle schema
- [ ] Handles partial failures (some URLs fail)
- [ ] Returns word count metadata

---

### Task 1.3: Blog Style Analysis
**File**: `backend/services/BlogStyleAnalyzer.js`

**Implementation:**
```javascript
class BlogStyleAnalyzer {
  async analyzeArticles(articles) {
    // Combine all article text
    // Send to Gemini AI for style analysis
    // Extract: tone, formality, vocabulary, etc.
    // Return WritingStyle object
  }
  
  buildPrompt(text) {
    // Create analysis prompt for Gemini
    // Focus on writing style, not content
  }
}
```

**Prompt Template:**
```
Analyze the writing style of these blog articles:

[ARTICLE TEXT]

Extract:
1. Tone (conversational/professional/neutral)
2. Formality (casual/balanced/formal)
3. Sentence length preference (short/medium/long)
4. Common vocabulary and phrases
5. Words/phrases to avoid

Focus on HOW they write, not WHAT they write about.
```

**Acceptance Criteria:**
- [ ] Accurately detects tone from blog content
- [ ] Identifies vocabulary patterns
- [ ] Returns consistent WritingStyle schema
- [ ] Handles long articles (chunking if needed)

---

## Phase 2: GitHub Analysis Backend

### Task 2.1: GitHub Data Fetching Service
**File**: `backend/services/GitHubFetchingService.js`

**Implementation:**
```javascript
class GitHubFetchingService {
  async fetchUserData(username) {
    // Fetch user's public repositories
    // For each repo:
    //   - Fetch commit messages (last 50)
    //   - Fetch README content
    //   - Fetch PR descriptions (if any)
    // Return aggregated data
  }
  
  async fetchCommitMessages(username, repo, limit = 50) {
    // Use GitHub API: GET /repos/{owner}/{repo}/commits
    // Extract commit messages
  }
  
  async fetchReadme(username, repo) {
    // Use GitHub API: GET /repos/{owner}/{repo}/readme
    // Decode base64 content
  }
}
```

**Dependencies:**
- `@octokit/rest` - GitHub API client
- OR `axios` with manual API calls

**API Endpoints Used:**
- `GET /users/{username}/repos` - List repositories
- `GET /repos/{owner}/{repo}/commits` - Get commits
- `GET /repos/{owner}/{repo}/readme` - Get README

**Rate Limiting:**
- Unauthenticated: 60 requests/hour
- Authenticated: 5000 requests/hour
- Implement exponential backoff on rate limit errors

**Acceptance Criteria:**
- [ ] Fetches user's public repositories
- [ ] Extracts commit messages (last 50 per repo)
- [ ] Fetches README files
- [ ] Handles rate limiting gracefully
- [ ] Returns structured data

---

### Task 2.2: GitHub Analysis Endpoint
**File**: `backend/server.js` (add endpoint)

**Implementation:**
```javascript
app.post('/api/analyze-github',
  inputValidation.validateGitHubUsername,
  rateLimiter.githubAnalysis,
  async (req, res) => {
    // 1. Fetch GitHub data
    // 2. Extract text from commits + READMEs
    // 3. Analyze with Gemini AI
    // 4. Return writing style profile
  }
);
```

**Validation** (`backend/validation.js`):
```javascript
validateGitHubUsername: [
  body('username')
    .isString()
    .matches(/^[a-zA-Z0-9](?:[a-zA-Z0-9]|-(?=[a-zA-Z0-9])){0,38}$/)
    .withMessage('Invalid GitHub username format')
]
```

**Rate Limiting**:
```javascript
githubAnalysis: rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 3, // 3 requests per window (GitHub API is expensive)
  message: 'Too many GitHub analysis requests'
})
```

**Acceptance Criteria:**
- [ ] Endpoint validates username format
- [ ] Rate limiting prevents abuse
- [ ] Returns consistent WritingStyle schema
- [ ] Handles users with no repos gracefully
- [ ] Returns metadata (commits analyzed, repos, word count)

---

### Task 2.3: GitHub Style Analysis
**File**: `backend/services/GitHubStyleAnalyzer.js`

**Implementation:**
```javascript
class GitHubStyleAnalyzer {
  async analyzeGitHubContent(commits, readmes) {
    // Combine commit messages and README text
    // Send to Gemini AI for style analysis
    // Focus on communication style, not code
    // Return WritingStyle object
  }
  
  buildPrompt(commits, readmes) {
    // Create analysis prompt for Gemini
    // Emphasize commit message style
  }
}
```

**Prompt Template:**
```
Analyze the communication style from these GitHub activities:

COMMIT MESSAGES:
[COMMIT MESSAGES]

README CONTENT:
[README TEXT]

Extract:
1. Tone (conversational/professional/neutral)
2. Formality (casual/balanced/formal)
3. Sentence length in commits (short/medium/long)
4. Common phrases and vocabulary
5. Technical writing style

Focus on HOW they communicate, not the technical content.
```

**Acceptance Criteria:**
- [ ] Analyzes commit message style
- [ ] Extracts communication patterns
- [ ] Returns consistent WritingStyle schema
- [ ] Handles users with minimal activity

---

## Phase 3: Frontend Integration

### Task 3.1: Connect Blog Analysis
**File**: `src/services/StyleAnalyzer.js`

**Update `analyzeBlog()` function:**
```javascript
export const analyzeBlog = async (urls, onProgress = null) => {
  const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:3001';
  
  onProgress?.({ message: 'Fetching blog content...' });
  
  const response = await fetch(`${backendUrl}/api/analyze-blog`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ urls })
  });
  
  const data = await response.json();
  
  if (!response.ok) {
    return {
      success: false,
      error: { message: data.message || 'Blog analysis failed' }
    };
  }
  
  return {
    success: true,
    writingStyle: data.profile.writing,
    text: data.text, // For advanced analysis
    metrics: data.metadata
  };
};
```

**Acceptance Criteria:**
- [ ] Calls backend API correctly
- [ ] Shows progress updates
- [ ] Handles errors gracefully
- [ ] Returns data in expected format

---

### Task 3.2: Connect GitHub Analysis
**File**: `src/services/StyleAnalyzer.js`

**Update `analyzeGitHub()` function:**
```javascript
export const analyzeGitHub = async (username, onProgress = null) => {
  const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:3001';
  
  onProgress?.({ message: 'Fetching GitHub data...' });
  
  const response = await fetch(`${backendUrl}/api/analyze-github`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username })
  });
  
  const data = await response.json();
  
  if (!response.ok) {
    return {
      success: false,
      error: { message: data.message || 'GitHub analysis failed' }
    };
  }
  
  return {
    success: true,
    writingStyle: data.profile.writing,
    text: data.text, // For advanced analysis
    metrics: data.metadata
  };
};
```

**Acceptance Criteria:**
- [ ] Calls backend API correctly
- [ ] Shows progress updates
- [ ] Handles errors gracefully
- [ ] Returns data in expected format

---

## Phase 4: Testing & Validation

### Task 4.1: Backend Testing
**Test Cases:**

**Blog Analysis:**
- [ ] Test with Medium article
- [ ] Test with WordPress blog
- [ ] Test with custom blog
- [ ] Test with invalid URL
- [ ] Test with 404 page
- [ ] Test with paywall article
- [ ] Test with multiple URLs (success + failure mix)

**GitHub Analysis:**
- [ ] Test with active user (100+ commits)
- [ ] Test with minimal user (< 10 commits)
- [ ] Test with user with no repos
- [ ] Test with invalid username
- [ ] Test with non-existent username
- [ ] Test rate limiting behavior

### Task 4.2: Integration Testing
- [ ] Blog + Gmail merge correctly
- [ ] GitHub + Text merge correctly
- [ ] Blog + GitHub + Gmail merge correctly
- [ ] Confidence calculation includes blog/GitHub word counts
- [ ] Quality weights applied correctly (0.7 for GitHub, 0.65 for Blog)
- [ ] Spam detection works on blog content
- [ ] Vocabulary diversity check works

### Task 4.3: Error Handling Testing
- [ ] Network timeout handling
- [ ] API rate limit handling
- [ ] Partial failure handling (some URLs fail)
- [ ] Empty content handling
- [ ] Malformed response handling

---

## Phase 5: Documentation

### Task 5.1: API Documentation
**File**: `backend/API_DOCUMENTATION.md`

Document:
- Blog analysis endpoint
- GitHub analysis endpoint
- Request/response formats
- Error codes
- Rate limits

### Task 5.2: User Guide
**File**: `BLOG_GITHUB_GUIDE.md`

Document:
- How to add blog sources
- How to add GitHub source
- What content is analyzed
- Privacy considerations
- Troubleshooting common issues

---

## Implementation Order

**Week 1: Blog Analysis**
1. Task 1.1: Blog scraping service
2. Task 1.2: Blog analysis endpoint
3. Task 1.3: Blog style analysis
4. Task 3.1: Frontend integration
5. Task 4.1: Blog testing

**Week 2: GitHub Analysis**
1. Task 2.1: GitHub fetching service
2. Task 2.2: GitHub analysis endpoint
3. Task 2.3: GitHub style analysis
4. Task 3.2: Frontend integration
5. Task 4.1: GitHub testing

**Week 3: Integration & Polish**
1. Task 4.2: Integration testing
2. Task 4.3: Error handling testing
3. Task 5.1: API documentation
4. Task 5.2: User guide

---

## Success Metrics

- [ ] Blog analysis works for 3+ major platforms
- [ ] GitHub analysis extracts meaningful patterns
- [ ] Both sources merge correctly with existing sources
- [ ] Error rate < 5% for valid inputs
- [ ] Average analysis time < 15 seconds
- [ ] User satisfaction with accuracy
