/**
 * SourceConnector Component
 * Black Mirror aesthetic - Clinical data input interface
 */
import { useState } from 'react';
import { validateGitHubUsername, validateBlogUrl, validateTextSample } from '../services/StyleAnalyzer';

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

    if (activeTab === 'github' && githubUsername.trim()) {
      if (!validateGitHubUsername(githubUsername.trim())) {
        newErrors.github = 'Invalid GitHub username format';
      } else {
        sources.push({ type: 'github', value: githubUsername.trim() });
      }
    }

    if (activeTab === 'blog' && blogUrls.trim()) {
      const urls = blogUrls.split('\n').map(url => url.trim()).filter(url => url);
      const invalidUrls = urls.filter(url => !validateBlogUrl(url));
      
      if (invalidUrls.length > 0) {
        newErrors.blog = `Invalid URL(s): ${invalidUrls.join(', ')}`;
      } else {
        urls.forEach(url => sources.push({ type: 'blog', value: url }));
      }
    }

    if (activeTab === 'text' && textSample.trim()) {
      const validation = validateTextSample(textSample.trim());
      if (!validation.valid) {
        newErrors.text = validation.message;
      } else {
        sources.push({ type: 'text', value: textSample.trim() });
      }
    }

    if (sources.length === 0 && Object.keys(newErrors).length === 0) {
      newErrors[activeTab] = 'Please provide at least one source';
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      onSourcesSubmit(sources);
    }
  };

  return (
    <div className="relative flex items-center justify-center min-h-screen bg-void-deep px-6 py-12">
      {/* Scanline effect */}
      <div className="scanline" />
      
      <div className="relative z-10 w-full max-w-2xl fade-in">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl font-display font-bold text-static-white mb-4 tracking-tight">
            Connect Your Digital Footprint
          </h2>
          <p className="text-sm text-static-dim leading-relaxed">
            Choose a source to analyze your unique style and build your AI twin
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8">
          <button
            onClick={() => handleTabChange('github')}
            className={`flex-1 px-6 py-4 font-mono text-sm tracking-wide transition-all duration-300 ${
              activeTab === 'github'
                ? 'bg-void-elevated text-static-white border-2 border-unsettling-blue'
                : 'bg-void-surface text-static-muted border-2 border-static-whisper hover:border-static-ghost'
            }`}
          >
            <span className="block mb-1 text-lg">{'<>'}</span>
            GitHub
          </button>
          
          <button
            onClick={() => handleTabChange('blog')}
            className={`flex-1 px-6 py-4 font-mono text-sm tracking-wide transition-all duration-300 ${
              activeTab === 'blog'
                ? 'bg-void-elevated text-static-white border-2 border-unsettling-blue'
                : 'bg-void-surface text-static-muted border-2 border-static-whisper hover:border-static-ghost'
            }`}
          >
            <span className="block mb-1 text-lg">✎</span>
            Blog
          </button>
          
          <button
            onClick={() => handleTabChange('text')}
            className={`flex-1 px-6 py-4 font-mono text-sm tracking-wide transition-all duration-300 ${
              activeTab === 'text'
                ? 'bg-void-elevated text-static-white border-2 border-unsettling-blue'
                : 'bg-void-surface text-static-muted border-2 border-static-whisper hover:border-static-ghost'
            }`}
          >
            <span className="block mb-1 text-lg">⌘</span>
            Text Sample
          </button>
        </div>

        {/* Input Area */}
        <div className="glass-panel p-8 mb-8">
          {activeTab === 'github' && (
            <div className="space-y-4">
              <label className="system-text block">GITHUB USERNAME</label>
              <input
                type="text"
                className={`input-field ${errors.github ? 'border-glitch-red' : ''}`}
                placeholder="Enter your GitHub username"
                value={githubUsername}
                onChange={(e) => setGithubUsername(e.target.value)}
              />
              {errors.github && (
                <div className="text-glitch-red text-sm font-mono">{errors.github}</div>
              )}
              <div className="text-static-ghost text-xs italic mt-3">
                We'll analyze your public repositories to learn your coding style
              </div>
            </div>
          )}

          {activeTab === 'blog' && (
            <div className="space-y-4">
              <label className="system-text block">BLOG URLS</label>
              <textarea
                className={`input-field min-h-[180px] ${errors.blog ? 'border-glitch-red' : ''}`}
                placeholder="Enter blog URLs (one per line)&#10;https://example.com/post-1&#10;https://example.com/post-2"
                value={blogUrls}
                onChange={(e) => setBlogUrls(e.target.value)}
                rows={6}
              />
              {errors.blog && (
                <div className="text-glitch-red text-sm font-mono">{errors.blog}</div>
              )}
              <div className="text-static-ghost text-xs italic mt-3">
                We'll analyze your blog posts to learn your writing style
              </div>
            </div>
          )}

          {activeTab === 'text' && (
            <div className="space-y-4">
              <label className="system-text block">TEXT SAMPLE</label>
              <textarea
                className={`input-field min-h-[280px] ${errors.text ? 'border-glitch-red' : ''}`}
                placeholder="Paste a sample of your writing (minimum 100 words)&#10;&#10;This can be from emails, documentation, articles, or any text that represents your writing style..."
                value={textSample}
                onChange={(e) => setTextSample(e.target.value)}
                rows={12}
              />
              {errors.text && (
                <div className="text-glitch-red text-sm font-mono">{errors.text}</div>
              )}
              <div className="text-static-ghost text-xs font-mono mt-3">
                WORD COUNT: {textSample.trim().split(/\s+/).filter(w => w).length} / 100 MINIMUM
              </div>
            </div>
          )}
        </div>

        {/* Action Button */}
        <button 
          onClick={validateAndSubmit}
          className="btn-primary w-full text-base tracking-wide group relative overflow-hidden"
        >
          <span className="relative z-10">ANALYZE STYLE</span>
          <div className="absolute inset-0 bg-unsettling-blue opacity-0 group-hover:opacity-10 transition-opacity duration-300" />
        </button>
      </div>
    </div>
  );
};

export default SourceConnector;
