/**
 * BlogScrapingService
 * Scrapes blog content from URLs and extracts clean text for style analysis
 */

const axios = require('axios');
const cheerio = require('cheerio');
const he = require('he');

class BlogScrapingService {
  constructor() {
    this.timeout = 15000; // 15 second timeout per URL
    this.maxContentLength = 5 * 1024 * 1024; // Max 5MB per page (HTML can be large with embedded assets)
    this.userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36';
  }

  /**
   * Scrape a single blog URL
   * @param {string} url - Blog URL to scrape
   * @returns {Promise<Object>} Scraped content with metadata
   */
  async scrapeUrl(url) {
    try {
      console.log(`[Blog Scraper] Fetching: ${url}`);

      // Fetch HTML content
      const response = await axios.get(url, {
        timeout: this.timeout,
        maxContentLength: this.maxContentLength,
        headers: {
          'User-Agent': this.userAgent,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
        },
        validateStatus: (status) => status === 200
      });

      // Parse HTML with cheerio
      const $ = cheerio.load(response.data);

      // Extract title
      const title = this.extractTitle($);

      // Extract main content
      const content = this.extractContent($);

      // Clean and decode text
      const cleanText = this.cleanText(content);

      // Calculate word count
      const wordCount = this.countWords(cleanText);

      // Validate minimum content
      if (wordCount < 100) {
        throw new Error('Article too short (minimum 100 words required)');
      }

      console.log(`[Blog Scraper] Success: ${title} (${wordCount} words)`);

      return {
        success: true,
        url,
        title,
        content: cleanText,
        wordCount,
        scrapedAt: Date.now()
      };

    } catch (error) {
      console.error(`[Blog Scraper] Error scraping ${url}:`, error.message);

      return {
        success: false,
        url,
        error: this.categorizeError(error)
      };
    }
  }

  /**
   * Scrape multiple blog URLs in parallel
   * @param {string[]} urls - Array of blog URLs
   * @returns {Promise<Object>} Combined results
   */
  async scrapeMultipleUrls(urls) {
    console.log(`[Blog Scraper] Scraping ${urls.length} URL(s)...`);

    // Scrape all URLs in parallel
    const results = await Promise.all(
      urls.map(url => this.scrapeUrl(url))
    );

    // Separate successful and failed scrapes
    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);

    // Combine all successful content
    const combinedContent = successful
      .map(r => r.content)
      .join('\n\n');

    const totalWords = successful.reduce((sum, r) => sum + r.wordCount, 0);

    console.log(`[Blog Scraper] Complete: ${successful.length} success, ${failed.length} failed, ${totalWords} total words`);

    return {
      success: successful.length > 0,
      articles: successful,
      failed: failed,
      combinedContent,
      totalWords,
      articlesAnalyzed: successful.length
    };
  }

  /**
   * Extract title from HTML
   * @param {CheerioAPI} $ - Cheerio instance
   * @returns {string} Article title
   */
  extractTitle($) {
    // Try multiple selectors for title
    const titleSelectors = [
      'article h1',
      'h1.entry-title',
      'h1.post-title',
      'h1[class*="title"]',
      '.article-title',
      'h1',
      'title'
    ];

    for (const selector of titleSelectors) {
      const title = $(selector).first().text().trim();
      if (title && title.length > 0 && title.length < 200) {
        return title;
      }
    }

    return 'Untitled Article';
  }

  /**
   * Extract main content from HTML
   * @param {CheerioAPI} $ - Cheerio instance
   * @returns {string} Article content
   */
  extractContent($) {
    // Remove unwanted elements
    $('script, style, nav, header, footer, aside, .sidebar, .comments, .advertisement, .ad, iframe, noscript').remove();

    // Try multiple selectors for main content (in priority order)
    const contentSelectors = [
      'article',
      '[role="main"]',
      'main',
      '.post-content',
      '.entry-content',
      '.article-content',
      '.content',
      '#content',
      '.post-body',
      '.article-body'
    ];

    for (const selector of contentSelectors) {
      const element = $(selector).first();
      if (element.length > 0) {
        const text = element.text();
        if (text.trim().length > 200) {
          return text;
        }
      }
    }

    // Fallback: get all paragraph text
    const paragraphs = $('p').map((i, el) => $(el).text()).get();
    return paragraphs.join('\n\n');
  }

  /**
   * Clean and normalize text
   * @param {string} text - Raw text
   * @returns {string} Cleaned text
   */
  cleanText(text) {
    // Decode HTML entities
    let cleaned = he.decode(text);

    // Remove excessive whitespace
    cleaned = cleaned.replace(/\s+/g, ' ');

    // Remove excessive newlines
    cleaned = cleaned.replace(/\n{3,}/g, '\n\n');

    // Trim
    cleaned = cleaned.trim();

    return cleaned;
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
   * @returns {string} User-friendly error message
   */
  categorizeError(error) {
    if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      return 'Unable to reach URL. Please check the address.';
    }
    if (error.code === 'ETIMEDOUT' || error.message.includes('timeout')) {
      return 'Request timed out. The site may be slow or unavailable.';
    }
    if (error.response?.status === 404) {
      return 'Page not found (404). Please verify the URL.';
    }
    if (error.response?.status === 403) {
      return 'Access forbidden (403). The site may block automated access.';
    }
    if (error.response?.status === 401) {
      return 'Authentication required. This content may be behind a paywall.';
    }
    if (error.message.includes('too short')) {
      return error.message;
    }
    return 'Unable to extract content from this URL.';
  }
}

module.exports = BlogScrapingService;
