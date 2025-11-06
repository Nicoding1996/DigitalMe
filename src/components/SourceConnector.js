import { useState } from 'react';
import { validateGitHubUsername, validateBlogUrl, validateTextSample } from '../services/StyleAnalyzer';
import './SourceConnector.css';

const SourceConnector = ({ onSourcesSubmit }) => {
  const [activeTab, setActiveTab] = useState('github');
  const [githubUsername, setGithubUsername] = useState('');
  const [blogUrls, setBlogUrls] = useState('');
  const [textSample, setTextSample] = useState('');
  const [errors, setErrors] = useState({});

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setErrors({});
  };

  const validateAndSubmit = () => {
    const newErrors = {};
    const sources = [];

    // Validate GitHub if provided
    if (activeTab === 'github' && githubUsername.trim()) {
      if (!validateGitHubUsername(githubUsername.trim())) {
        newErrors.github = 'Invalid GitHub username format';
      } else {
        sources.push({
          type: 'github',
          value: githubUsername.trim()
        });
      }
    }

    // Validate Blog URLs if provided
    if (activeTab === 'blog' && blogUrls.trim()) {
      const urls = blogUrls.split('\n').map(url => url.trim()).filter(url => url);
      const invalidUrls = urls.filter(url => !validateBlogUrl(url));
      
      if (invalidUrls.length > 0) {
        newErrors.blog = `Invalid URL(s): ${invalidUrls.join(', ')}`;
      } else {
        urls.forEach(url => {
          sources.push({
            type: 'blog',
            value: url
          });
        });
      }
    }

    // Validate Text Sample if provided
    if (activeTab === 'text' && textSample.trim()) {
      const validation = validateTextSample(textSample.trim());
      if (!validation.valid) {
        newErrors.text = validation.message;
      } else {
        sources.push({
          type: 'text',
          value: textSample.trim()
        });
      }
    }

    // Check if at least one source is provided
    if (sources.length === 0 && Object.keys(newErrors).length === 0) {
      newErrors[activeTab] = 'Please provide at least one source';
    }

    setErrors(newErrors);

    // If no errors, submit sources
    if (Object.keys(newErrors).length === 0) {
      onSourcesSubmit(sources);
    }
  };

  return (
    <div className="source-connector">
      <div className="source-connector-content">
        <div className="source-header">
          <h2 className="source-title">Connect Your Digital Footprint</h2>
          <p className="source-description">
            Choose a source to analyze your unique style and build your AI twin
          </p>
        </div>

        <div className="source-tabs">
          <button
            className={`tab-button ${activeTab === 'github' ? 'active' : ''}`}
            onClick={() => handleTabChange('github')}
          >
            <span className="tab-icon">{'<>'}</span>
            GitHub
          </button>
          <button
            className={`tab-button ${activeTab === 'blog' ? 'active' : ''}`}
            onClick={() => handleTabChange('blog')}
          >
            <span className="tab-icon">✎</span>
            Blog
          </button>
          <button
            className={`tab-button ${activeTab === 'text' ? 'active' : ''}`}
            onClick={() => handleTabChange('text')}
          >
            <span className="tab-icon">⌘</span>
            Text Sample
          </button>
        </div>

        <div className="source-input-area">
          {activeTab === 'github' && (
            <div className="input-panel">
              <label className="input-label">GitHub Username</label>
              <input
                type="text"
                className={`input-field ${errors.github ? 'error' : ''}`}
                placeholder="Enter your GitHub username"
                value={githubUsername}
                onChange={(e) => setGithubUsername(e.target.value)}
              />
              {errors.github && <div className="error-message">{errors.github}</div>}
              <div className="input-hint">
                We'll analyze your public repositories to learn your coding style
              </div>
            </div>
          )}

          {activeTab === 'blog' && (
            <div className="input-panel">
              <label className="input-label">Blog URLs</label>
              <textarea
                className={`input-textarea ${errors.blog ? 'error' : ''}`}
                placeholder="Enter blog URLs (one per line)&#10;https://example.com/post-1&#10;https://example.com/post-2"
                value={blogUrls}
                onChange={(e) => setBlogUrls(e.target.value)}
                rows={6}
              />
              {errors.blog && <div className="error-message">{errors.blog}</div>}
              <div className="input-hint">
                We'll analyze your blog posts to learn your writing style
              </div>
            </div>
          )}

          {activeTab === 'text' && (
            <div className="input-panel">
              <label className="input-label">Text Sample</label>
              <textarea
                className={`input-textarea ${errors.text ? 'error' : ''}`}
                placeholder="Paste a sample of your writing (minimum 100 words)&#10;&#10;This can be from emails, documentation, articles, or any text that represents your writing style..."
                value={textSample}
                onChange={(e) => setTextSample(e.target.value)}
                rows={12}
              />
              {errors.text && <div className="error-message">{errors.text}</div>}
              <div className="input-hint">
                Minimum 100 words required. Current: {textSample.trim().split(/\s+/).filter(w => w).length} words
              </div>
            </div>
          )}
        </div>

        <div className="source-actions">
          <button className="analyze-button" onClick={validateAndSubmit}>
            Analyze Style
          </button>
        </div>
      </div>
    </div>
  );
};

export default SourceConnector;
