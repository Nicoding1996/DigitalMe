/**
 * SourceConnector Component
 * Black Mirror aesthetic - Clinical data input interface
 */
import { useState } from 'react';
import { validateGitHubUsername, validateBlogUrl, validateTextSample } from '../services/StyleAnalyzer';
import GmailConnectButton from './GmailConnectButton';

const SourceConnector = ({ onSourcesSubmit }) => {
  const [activeTab, setActiveTab] = useState('text');
  const [githubUsername, setGithubUsername] = useState('');
  const [blogUrls, setBlogUrls] = useState('');
  const [textSample, setTextSample] = useState('');
  const [errors, setErrors] = useState({});
  const [gmailConnected, setGmailConnected] = useState(false);
  const [gmailStats, setGmailStats] = useState(null);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setErrors({});
  };

  const handleGmailConnectionStart = () => {
    setErrors({});
  };

  const handleGmailConnectionComplete = (stats) => {
    console.log('[SourceConnector] Gmail connection complete, stats:', stats);
    setGmailConnected(true);
    setGmailStats(stats);
    
    // Submit Gmail source with profile automatically after successful connection
    const gmailSource = {
      type: 'gmail',
      value: {
        emailsAnalyzed: stats.emailsAnalyzed,
        emailsFiltered: stats.emailsFiltered,
        patternsExtracted: stats.patternsExtracted
      },
      profile: stats.profile // Include the pre-analyzed profile from backend
    };
    
    console.log('[SourceConnector] Submitting Gmail source:', gmailSource);
    onSourcesSubmit([gmailSource]);
  };

  const handleGmailConnectionError = (error) => {
    setErrors({ gmail: error });
    setGmailConnected(false);
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
    <div className="relative flex items-center justify-center min-h-screen bg-mirror-black px-6 py-12">
      {/* Scanline effect */}
      <div className="scanline" />
      
      <div className="relative z-10 w-full max-w-3xl fade-in">
        {/* Header */}
        <div className="mb-12">
          <h2 className="text-3xl font-display font-bold text-static-white mb-4 tracking-tight">
            [ACQUIRE_SOURCE_DATA]
          </h2>
          <p className="font-mono text-xs text-static-muted leading-relaxed mb-3">
            &gt; Choose a source to analyze your unique style and build your digital doppelgänger
          </p>
          <p className="font-mono text-xs text-static-ghost leading-relaxed">
            <span className="text-unsettling-cyan">&gt;</span> [SYSTEM_NOTE] Additional data sources increase profile accuracy. Sources can be added post-initialization via [CONFIG]
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8">
          <button
            onClick={() => handleTabChange('text')}
            className={`flex-1 px-6 py-4 font-mono text-xs tracking-wider transition-all ${
              activeTab === 'text'
                ? 'bg-void-elevated text-unsettling-cyan border border-unsettling-cyan'
                : 'bg-void-surface text-static-muted border border-static-whisper hover:border-static-ghost'
            }`}
          >
            <span className="block mb-2 text-lg">⌘</span>
            [TEXT]
          </button>
          
          <button
            onClick={() => handleTabChange('gmail')}
            className={`flex-1 px-6 py-4 font-mono text-xs tracking-wider transition-all ${
              activeTab === 'gmail'
                ? 'bg-void-elevated text-unsettling-cyan border border-unsettling-cyan'
                : 'bg-void-surface text-static-muted border border-static-whisper hover:border-static-ghost'
            }`}
          >
            <span className="block mb-2 text-lg">✉</span>
            [GMAIL]
          </button>
          
          <button
            onClick={() => handleTabChange('blog')}
            className={`flex-1 px-6 py-4 font-mono text-xs tracking-wider transition-all ${
              activeTab === 'blog'
                ? 'bg-void-elevated text-unsettling-cyan border border-unsettling-cyan'
                : 'bg-void-surface text-static-muted border border-static-whisper hover:border-static-ghost'
            }`}
          >
            <span className="block mb-2 text-lg">✎</span>
            [BLOG]
          </button>
          
          <button
            onClick={() => handleTabChange('github')}
            className={`flex-1 px-6 py-4 font-mono text-xs tracking-wider transition-all ${
              activeTab === 'github'
                ? 'bg-void-elevated text-unsettling-cyan border border-unsettling-cyan'
                : 'bg-void-surface text-static-muted border border-static-whisper hover:border-static-ghost'
            }`}
          >
            <span className="block mb-2 text-lg">{'<>'}</span>
            [GITHUB]
          </button>
        </div>

        {/* Input Area */}
        <div className="border border-static-whisper bg-void-surface p-8 mb-8">
          {activeTab === 'gmail' && (
            <div className="space-y-4">
              <label className="system-text block">GMAIL ACCOUNT</label>
              <div className="text-static-ghost text-xs mb-6">
                Connect your Gmail account to analyze your sent emails and extract your writing style patterns
              </div>
              <GmailConnectButton
                onConnectionStart={handleGmailConnectionStart}
                onConnectionComplete={handleGmailConnectionComplete}
                onConnectionError={handleGmailConnectionError}
                isConnected={gmailConnected}
              />
              {errors.gmail && (
                <div className="text-glitch-red text-sm font-mono mt-4">
                  {typeof errors.gmail === 'object' ? errors.gmail.message : errors.gmail}
                </div>
              )}
            </div>
          )}

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
              <label className="system-text block">BLOG & CONTENT URLS</label>
              <textarea
                className={`input-field min-h-[180px] ${errors.blog ? 'border-glitch-red' : ''}`}
                placeholder="Enter URLs to your writing (one per line)&#10;https://yourblog.com/post-1&#10;https://medium.com/@you/article&#10;https://linkedin.com/posts/you/..."
                value={blogUrls}
                onChange={(e) => setBlogUrls(e.target.value)}
                rows={6}
              />
              {errors.blog && (
                <div className="text-glitch-red text-sm font-mono">{errors.blog}</div>
              )}
              <div className="text-static-ghost text-xs italic mt-3">
                We'll analyze your blog posts, articles, and public writing to learn your style
              </div>
            </div>
          )}

          {activeTab === 'text' && (
            <div className="space-y-4">
              <label className="system-text block">TEXT SAMPLE</label>
              <textarea
                className={`input-field min-h-[200px] ${errors.text ? 'border-glitch-red' : ''}`}
                placeholder="Paste a sample of your writing (minimum 100 words)&#10;&#10;This can be from emails, documentation, articles, chat messages, or any text that represents your writing style..."
                value={textSample}
                onChange={(e) => setTextSample(e.target.value)}
                rows={8}
              />
              {errors.text && (
                <div className="text-glitch-red text-sm font-mono">{errors.text}</div>
              )}
              <div className="text-static-ghost text-xs font-mono mt-3">
                WORD COUNT: {textSample.trim().split(/\s+/).filter(w => w).length} / 100 MINIMUM
              </div>
              <div className="text-static-ghost text-xs font-mono mt-2 border-t border-static-whisper pt-3">
                <span className="text-system-warning">[!]</span> <span className="text-static-muted">CHAT_PROTOCOL:</span> Extract only user-generated messages. Exclude external participant data.
              </div>
            </div>
          )}
        </div>

        {/* Action Button - Only show for non-Gmail tabs */}
        {activeTab !== 'gmail' && (
          <button 
            onClick={validateAndSubmit}
            className="w-full px-8 py-4 bg-void-surface border border-static-whisper text-static-white font-mono text-sm tracking-wider hover:border-unsettling-cyan hover:text-unsettling-cyan transition-all"
          >
            &gt; ANALYZE_STYLE
          </button>
        )}
      </div>
    </div>
  );
};

export default SourceConnector;
