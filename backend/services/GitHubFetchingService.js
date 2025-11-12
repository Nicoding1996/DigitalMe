/**
 * GitHubFetchingService
 * Fetches commit messages, README files, and other text content from GitHub
 */

const { Octokit } = require('@octokit/rest');

class GitHubFetchingService {
  constructor() {
    // Initialize Octokit (GitHub API client)
    // No auth token = 60 requests/hour
    // With auth token = 5000 requests/hour
    this.octokit = new Octokit({
      userAgent: 'DigitalMe-StyleAnalyzer/1.0',
      // Optional: Add auth token from env for higher rate limits
      auth: process.env.GITHUB_TOKEN || undefined
    });
    
    this.maxRepos = 10; // Analyze up to 10 repositories
    this.maxCommitsPerRepo = 30; // Get last 30 commits per repo
  }

  /**
   * Fetch all relevant data from a GitHub user
   * @param {string} username - GitHub username
   * @returns {Promise<Object>} Aggregated GitHub data
   */
  async fetchUserData(username) {
    console.log(`[GitHub Fetcher] Fetching data for user: ${username}`);

    try {
      // 1. Verify user exists
      await this.octokit.users.getByUsername({ username });

      // 2. Get user's repositories (sorted by recent activity)
      const repos = await this.fetchRepositories(username);
      
      if (repos.length === 0) {
        throw new Error('No public repositories found');
      }

      console.log(`[GitHub Fetcher] Found ${repos.length} repositories`);

      // 3. Fetch commit messages and READMEs from repositories
      const repoData = await Promise.all(
        repos.slice(0, this.maxRepos).map(repo => 
          this.fetchRepositoryData(username, repo.name)
        )
      );

      // 4. Aggregate all text content
      const commits = repoData.flatMap(r => r.commits);
      const readmes = repoData.filter(r => r.readme).map(r => r.readme);

      // 5. Combine into text for analysis
      const commitText = commits.join('\n');
      const readmeText = readmes.join('\n\n---\n\n');
      const combinedText = `${commitText}\n\n${readmeText}`;

      const wordCount = this.countWords(combinedText);

      console.log(`[GitHub Fetcher] Complete: ${commits.length} commits, ${readmes.length} READMEs, ${wordCount} words`);

      return {
        success: true,
        username,
        commits,
        readmes,
        combinedText,
        wordCount,
        metadata: {
          repositoriesAnalyzed: repoData.length,
          commitsAnalyzed: commits.length,
          readmesAnalyzed: readmes.length
        }
      };

    } catch (error) {
      console.error(`[GitHub Fetcher] Error:`, error.message);
      throw this.categorizeError(error);
    }
  }

  /**
   * Fetch user's repositories
   * @param {string} username - GitHub username
   * @returns {Promise<Array>} List of repositories
   */
  async fetchRepositories(username) {
    try {
      const { data } = await this.octokit.repos.listForUser({
        username,
        type: 'owner', // Only repos owned by user
        sort: 'updated', // Most recently updated first
        per_page: this.maxRepos
      });

      // Filter out forks and empty repos
      return data.filter(repo => !repo.fork && !repo.archived);

    } catch (error) {
      if (error.status === 404) {
        throw new Error('GitHub user not found');
      }
      throw error;
    }
  }

  /**
   * Fetch commit messages and README from a repository
   * @param {string} username - GitHub username
   * @param {string} repoName - Repository name
   * @returns {Promise<Object>} Repository data
   */
  async fetchRepositoryData(username, repoName) {
    console.log(`[GitHub Fetcher] Fetching ${username}/${repoName}...`);

    try {
      // Fetch commits and README in parallel
      const [commits, readme] = await Promise.all([
        this.fetchCommitMessages(username, repoName),
        this.fetchReadme(username, repoName)
      ]);

      return {
        repo: repoName,
        commits,
        readme
      };

    } catch (error) {
      console.warn(`[GitHub Fetcher] Error fetching ${repoName}:`, error.message);
      return {
        repo: repoName,
        commits: [],
        readme: null
      };
    }
  }

  /**
   * Fetch commit messages from a repository
   * @param {string} username - GitHub username
   * @param {string} repoName - Repository name
   * @returns {Promise<Array<string>>} Commit messages
   */
  async fetchCommitMessages(username, repoName) {
    try {
      const { data } = await this.octokit.repos.listCommits({
        owner: username,
        repo: repoName,
        per_page: this.maxCommitsPerRepo
      });

      // Extract commit messages (filter out merge commits)
      return data
        .filter(commit => !commit.commit.message.startsWith('Merge '))
        .map(commit => commit.commit.message.split('\n')[0]) // Get first line only
        .filter(msg => msg.length > 5); // Filter out very short messages

    } catch (error) {
      console.warn(`[GitHub Fetcher] No commits in ${repoName}`);
      return [];
    }
  }

  /**
   * Fetch README content from a repository
   * @param {string} username - GitHub username
   * @param {string} repoName - Repository name
   * @returns {Promise<string|null>} README content
   */
  async fetchReadme(username, repoName) {
    try {
      const { data } = await this.octokit.repos.getReadme({
        owner: username,
        repo: repoName
      });

      // Decode base64 content
      const content = Buffer.from(data.content, 'base64').toString('utf-8');
      
      // Remove markdown formatting for cleaner text
      const cleanContent = this.cleanMarkdown(content);
      
      // Only return if substantial content (> 100 words)
      const wordCount = this.countWords(cleanContent);
      return wordCount > 100 ? cleanContent : null;

    } catch (error) {
      // README not found is common, don't log as error
      return null;
    }
  }

  /**
   * Clean markdown formatting from text
   * @param {string} markdown - Markdown text
   * @returns {string} Clean text
   */
  cleanMarkdown(markdown) {
    let text = markdown;
    
    // Remove code blocks
    text = text.replace(/```[\s\S]*?```/g, '');
    
    // Remove inline code
    text = text.replace(/`[^`]+`/g, '');
    
    // Remove links but keep text
    text = text.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
    
    // Remove images
    text = text.replace(/!\[([^\]]*)\]\([^)]+\)/g, '');
    
    // Remove headers
    text = text.replace(/^#{1,6}\s+/gm, '');
    
    // Remove bold/italic
    text = text.replace(/[*_]{1,2}([^*_]+)[*_]{1,2}/g, '$1');
    
    // Remove horizontal rules
    text = text.replace(/^[-*_]{3,}$/gm, '');
    
    // Clean up whitespace
    text = text.replace(/\n{3,}/g, '\n\n');
    text = text.trim();
    
    return text;
  }

  /**
   * Count words in text
   * @param {string} text - Text to count
   * @returns {number} Word count
   */
  countWords(text) {
    return text.trim().split(/\s+/).filter(w => w.length > 0).length;
  }

  /**
   * Categorize error for user-friendly messages
   * @param {Error} error - Error object
   * @returns {Error} Categorized error
   */
  categorizeError(error) {
    if (error.message === 'GitHub user not found') {
      return new Error('GitHub user not found. Please verify the username.');
    }
    if (error.message === 'No public repositories found') {
      return new Error('No public repositories found for this user.');
    }
    if (error.status === 403) {
      return new Error('GitHub API rate limit exceeded. Please try again later.');
    }
    if (error.status === 401) {
      return new Error('GitHub authentication failed.');
    }
    return new Error('Unable to fetch GitHub data: ' + error.message);
  }
}

module.exports = GitHubFetchingService;
