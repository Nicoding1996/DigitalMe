/**
 * SourceConnector Component
 * Black Mirror aesthetic - Clinical data input interface
 */
import { useState } from 'react';
import { validateGitHubUsername, validateBlogUrl, validateTextSample } from '../services/StyleAnalyzer';
import GmailConnectButton from './GmailConnectButton';

const SourceConnector = ({ onSourcesSubmit, onCancel }) => {
  const [activeTab, setActiveTab] = useState('text');
  const [githubUsername, setGithubUsername] = useState('');
  const [blogUrls, setBlogUrls] = useState('');
  const [textSample, setTextSample] = useState('');
  const [errors, setErrors] = useState({});
  const [gmailConnected, setGmailConnected] = useState(false);
  const [gmailStats, setGmailStats] = useState(null);
  const [gmailSource, setGmailSource] = useState(null); // Store Gmail source for multi-source submission

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
    
    // Store Gmail source for multi-source submission
    // Format it to match what App.js expects (result.profile structure)
    const source = {
      type: 'gmail',
      value: {
        emailsAnalyzed: stats.emailsAnalyzed,
        emailsFiltered: stats.emailsFiltered,
        patternsExtracted: stats.patternsExtracted
      },
      result: {
        profile: stats.profile, // Include the pre-analyzed profile from backend
        metadata: stats.profile?.metadata // Include metadata if available
      }
    };
    
    setGmailSource(source);
    console.log('[SourceConnector] Gmail source ready for submission');
  };

  const handleGmailConnectionError = (error) => {
    setErrors({ gmail: error });
    setGmailConnected(false);
  };

  // Check which sources are filled and valid
  const getFilledSources = () => {
    const filled = {
      text: false,
      gmail: false,
      blog: false,
      github: false
    };

    // Text
    if (textSample.trim()) {
      const validation = validateTextSample(textSample.trim());
      filled.text = validation.valid;
    }

    // Gmail
    filled.gmail = gmailConnected && gmailSource !== null;

    // Blog
    if (blogUrls.trim()) {
      const urls = blogUrls.split('\n').map(url => url.trim()).filter(url => url);
      const invalidUrls = urls.filter(url => !validateBlogUrl(url));
      filled.blog = urls.length > 0 && invalidUrls.length === 0;
    }

    // GitHub
    if (githubUsername.trim()) {
      filled.github = validateGitHubUsername(githubUsername.trim());
    }

    return filled;
  };

  const validateAndSubmit = () => {
    const newErrors = {};
    const sources = [];

    // Collect all filled sources
    if (githubUsername.trim()) {
      if (!validateGitHubUsername(githubUsername.trim())) {
        newErrors.github = 'Invalid GitHub username format';
      } else {
        sources.push({ type: 'github', value: githubUsername.trim() });
      }
    }

    if (blogUrls.trim()) {
      const urls = blogUrls.split('\n').map(url => url.trim()).filter(url => url);
      const invalidUrls = urls.filter(url => !validateBlogUrl(url));
      
      if (invalidUrls.length > 0) {
        newErrors.blog = `Invalid URL(s): ${invalidUrls.join(', ')}`;
      } else {
        urls.forEach(url => sources.push({ type: 'blog', value: url }));
      }
    }

    if (textSample.trim()) {
      const validation = validateTextSample(textSample.trim());
      if (!validation.valid) {
        newErrors.text = validation.message;
      } else {
        sources.push({ type: 'text', value: textSample.trim() });
      }
    }

    // Add Gmail source if connected
    if (gmailConnected && gmailSource) {
      sources.push(gmailSource);
    }

    if (sources.length === 0 && Object.keys(newErrors).length === 0) {
      newErrors.general = 'Please provide at least one source';
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      // Always enable advanced analysis - it's core to creating an authentic doppelgänger
      onSourcesSubmit(sources, true);
    }
  };

  const filledSources = getFilledSources();
  const filledCount = Object.values(filledSources).filter(Boolean).length;
  const hasAnySources = filledCount > 0;

  return (
    <div className="relative min-h-screen bg-mirror-black px-6 py-6 overflow-y-auto">
      {/* Scanline effect */}
      <div className="scanline" />
      
      <div className="relative z-10 w-full max-w-3xl mx-auto fade-in pb-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-3xl font-display font-bold text-static-white tracking-tight">
              [ACQUIRE_SOURCE_DATA]
            </h2>
            {onCancel && (
              <button
                onClick={onCancel}
                className="px-4 py-2 min-h-[44px] font-mono text-xs text-static-muted hover:text-static-white border border-static-whisper hover:border-static-ghost active:bg-void-elevated transition-all touch-manipulation"
                aria-label="Go back"
              >
                ← BACK
              </button>
            )}
          </div>
          <p className="font-mono text-xs text-static-muted leading-relaxed mb-3">
            &gt; Choose a source to analyze your unique style and build your digital doppelgänger
          </p>
          <p className="font-mono text-xs text-static-ghost leading-relaxed">
            <span className="text-unsettling-cyan">&gt;</span> [SYSTEM_NOTE] More content increases profile accuracy. Aim for 3,000+ words for optimal results. Sources can be added post-initialization via [CONFIG]
          </p>
        </div>

        {/* Tabs with status indicators */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => handleTabChange('text')}
            className={`relative flex-1 px-6 py-4 min-h-[44px] font-mono text-xs tracking-wider transition-all touch-manipulation ${
              activeTab === 'text'
                ? 'bg-void-elevated text-unsettling-cyan border border-unsettling-cyan'
                : 'bg-void-surface text-static-muted border border-static-whisper hover:border-static-ghost active:bg-void-elevated'
            }`}
          >
            {filledSources.text && (
              <span className="absolute top-2 right-2 text-system-active text-sm">✓</span>
            )}
            <span className="block mb-2 text-lg">⌘</span>
            [TEXT]
          </button>
          
          <button
            onClick={() => handleTabChange('gmail')}
            className={`relative flex-1 px-6 py-4 min-h-[44px] font-mono text-xs tracking-wider transition-all touch-manipulation ${
              activeTab === 'gmail'
                ? 'bg-void-elevated text-unsettling-cyan border border-unsettling-cyan'
                : 'bg-void-surface text-static-muted border border-static-whisper hover:border-static-ghost active:bg-void-elevated'
            }`}
          >
            {filledSources.gmail && (
              <span className="absolute top-2 right-2 text-system-active text-sm">✓</span>
            )}
            <span className="block mb-2 text-lg">✉</span>
            [GMAIL]
          </button>
          
          <button
            onClick={() => handleTabChange('blog')}
            className={`relative flex-1 px-6 py-4 min-h-[44px] font-mono text-xs tracking-wider transition-all touch-manipulation ${
              activeTab === 'blog'
                ? 'bg-void-elevated text-unsettling-cyan border border-unsettling-cyan'
                : 'bg-void-surface text-static-muted border border-static-whisper hover:border-static-ghost active:bg-void-elevated'
            }`}
          >
            {filledSources.blog && (
              <span className="absolute top-2 right-2 text-system-active text-sm">✓</span>
            )}
            <span className="block mb-2 text-lg">✎</span>
            [BLOG]
          </button>
          
          <button
            onClick={() => handleTabChange('github')}
            className={`relative flex-1 px-6 py-4 min-h-[44px] font-mono text-xs tracking-wider transition-all touch-manipulation ${
              activeTab === 'github'
                ? 'bg-void-elevated text-unsettling-cyan border border-unsettling-cyan'
                : 'bg-void-surface text-static-muted border border-static-whisper hover:border-static-ghost active:bg-void-elevated'
            }`}
          >
            {filledSources.github && (
              <span className="absolute top-2 right-2 text-system-active text-sm">✓</span>
            )}
            <span className="block mb-2 text-lg">⎇</span>
            [GITHUB]
          </button>
        </div>

        {/* Input Area */}
        <div className="border border-static-whisper bg-void-surface p-6 mb-6 max-h-[50vh] overflow-y-auto">
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
                <div className="mt-4 px-4 py-3 bg-void-surface border border-glitch-red">
                  <div className="flex items-start gap-3">
                    <span className="text-glitch-red text-lg">⚠</span>
                    <div className="flex-1">
                      <div className="text-glitch-red text-sm font-mono font-bold mb-1">
                        [CONNECTION_FAILED]
                      </div>
                      <div className="text-static-ghost text-xs font-mono">
                        {typeof errors.gmail === 'object' ? errors.gmail.message : errors.gmail}
                      </div>
                      <button
                        onClick={() => setErrors({})}
                        className="mt-3 px-3 py-2 min-h-[44px] text-xs font-mono border border-static-whisper text-static-white hover:border-unsettling-cyan hover:text-unsettling-cyan active:bg-void-elevated transition-all touch-manipulation"
                      >
                        Try Again
                      </button>
                    </div>
                  </div>
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
                <div className="mt-2 px-4 py-3 bg-void-surface border border-glitch-red">
                  <div className="flex items-start gap-3">
                    <span className="text-glitch-red text-lg">⚠</span>
                    <div className="flex-1">
                      <div className="text-glitch-red text-sm font-mono font-bold mb-1">
                        [VALIDATION_ERROR]
                      </div>
                      <div className="text-static-ghost text-xs font-mono">
                        {errors.github}
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <div className="text-static-ghost text-xs italic mt-3">
                We'll analyze your commit messages and README files to learn your technical writing style
              </div>
            </div>
          )}

          {activeTab === 'blog' && (
            <div className="space-y-4">
              <label className="system-text block">BLOG & CONTENT URLS</label>
              <textarea
                className={`input-field min-h-[120px] max-h-[250px] ${errors.blog ? 'border-glitch-red' : ''}`}
                placeholder="Enter URLs to your writing (one per line)&#10;https://yourblog.com/post-1&#10;https://medium.com/@you/article&#10;https://linkedin.com/posts/you/..."
                value={blogUrls}
                onChange={(e) => setBlogUrls(e.target.value)}
                rows={5}
              />
              {errors.blog && (
                <div className="mt-2 px-4 py-3 bg-void-surface border border-glitch-red">
                  <div className="flex items-start gap-3">
                    <span className="text-glitch-red text-lg">⚠</span>
                    <div className="flex-1">
                      <div className="text-glitch-red text-sm font-mono font-bold mb-1">
                        [INVALID_URL]
                      </div>
                      <div className="text-static-ghost text-xs font-mono">
                        {errors.blog}
                      </div>
                    </div>
                  </div>
                </div>
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
                className={`input-field min-h-[150px] max-h-[300px] ${errors.text ? 'border-glitch-red' : ''}`}
                placeholder="Paste a sample of your writing (minimum 100 words)&#10;&#10;This can be from emails, documentation, articles, chat messages, or any text that represents your writing style..."
                value={textSample}
                onChange={(e) => setTextSample(e.target.value)}
                rows={6}
              />
              {errors.text && (
                <div className="mt-2 px-4 py-3 bg-void-surface border border-glitch-red">
                  <div className="flex items-start gap-3">
                    <span className="text-glitch-red text-lg">⚠</span>
                    <div className="flex-1">
                      <div className="text-glitch-red text-sm font-mono font-bold mb-1">
                        [INSUFFICIENT_DATA]
                      </div>
                      <div className="text-static-ghost text-xs font-mono">
                        {errors.text}
                      </div>
                    </div>
                  </div>
                </div>
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

        {/* Source Status and Action Button */}
        <div className="space-y-3">
          {/* Error message for general errors */}
          {errors.general && (
            <div className="px-4 py-2 bg-void-surface border border-glitch-red text-glitch-red font-mono text-xs">
              {errors.general}
            </div>
          )}

          {/* Action Button with inline source count */}
          <button 
            onClick={validateAndSubmit}
            disabled={!hasAnySources}
            className={`w-full px-8 py-3 min-h-[44px] font-mono text-sm tracking-wider transition-all touch-manipulation ${
              hasAnySources
                ? 'bg-void-surface border border-static-whisper text-static-white hover:border-unsettling-cyan hover:text-unsettling-cyan active:bg-void-elevated'
                : 'bg-void-surface border border-static-whisper text-static-muted opacity-60 cursor-not-allowed'
            }`}
          >
            <div className="flex items-center justify-between">
              <span>
                {filledCount > 1 
                  ? `> ANALYZE_ALL_SOURCES`
                  : '> ANALYZE_STYLE'
                }
              </span>
              {hasAnySources && (
                <span className="text-system-active text-xs">
                  [{filledCount}/4] {filledCount === 1 && '• Add more for accuracy'}
                </span>
              )}
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default SourceConnector;
