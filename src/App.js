import { useState, useEffect } from 'react';
import Header from './components/Header';
import WelcomeScreen from './components/WelcomeScreen';
import SourceConnector from './components/SourceConnector';
import AnalysisProgress from './components/AnalysisProgress';
import MirrorInterface from './components/MirrorInterface';
import SettingsPanel from './components/SettingsPanel';
import ExportModal from './components/ExportModal';
import ErrorBoundary from './components/ErrorBoundary';
import ConnectionStatus from './components/ConnectionStatus';
import { analyzeGitHub, analyzeBlog, analyzeTextSample, buildStyleProfile } from './services/StyleAnalyzer';
import { generateMockSource, generateDefaultPreferences } from './models';
import './App.css';

const STORAGE_KEY = 'digitalme_profile';
const SOURCES_KEY = 'digitalme_sources';
const PREFERENCES_KEY = 'digitalme_preferences';
const CONVERSATION_KEY = 'digitalme_conversation';
const MAX_CONVERSATION_HISTORY = 50;

function App() {
  const [onboardingStep, setOnboardingStep] = useState('welcome'); // welcome, connect, analyzing, complete
  const [styleProfile, setStyleProfile] = useState(null);
  const [analysisProgress, setAnalysisProgress] = useState({
    currentStep: 0,
    totalSteps: 0,
    message: '',
    isComplete: false
  });
  const [analysisSummary, setAnalysisSummary] = useState(null);
  const [sources, setSources] = useState([]);
  const [preferences, setPreferences] = useState(generateDefaultPreferences());
  const [conversationHistory, setConversationHistory] = useState([]);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [exportContent, setExportContent] = useState('');
  const [exportContentType, setExportContentType] = useState('text');
  const [analysisError, setAnalysisError] = useState(null);
  const [failedSources, setFailedSources] = useState([]);

  // Load profile, sources, preferences, and conversation history from LocalStorage on mount
  useEffect(() => {
    const savedProfile = localStorage.getItem(STORAGE_KEY);
    if (savedProfile) {
      try {
        const profile = JSON.parse(savedProfile);
        setStyleProfile(profile);
        setOnboardingStep('complete');
      } catch (error) {
        console.error('Failed to load saved profile:', error);
        localStorage.removeItem(STORAGE_KEY);
      }
    }

    const savedSources = localStorage.getItem(SOURCES_KEY);
    if (savedSources) {
      try {
        const sourcesData = JSON.parse(savedSources);
        setSources(sourcesData);
      } catch (error) {
        console.error('Failed to load saved sources:', error);
        localStorage.removeItem(SOURCES_KEY);
      }
    }

    const savedPreferences = localStorage.getItem(PREFERENCES_KEY);
    if (savedPreferences) {
      try {
        const prefsData = JSON.parse(savedPreferences);
        setPreferences(prefsData);
      } catch (error) {
        console.error('Failed to load saved preferences:', error);
      }
    }

    const savedConversation = localStorage.getItem(CONVERSATION_KEY);
    if (savedConversation) {
      try {
        const conversationData = JSON.parse(savedConversation);
        setConversationHistory(conversationData);
      } catch (error) {
        console.error('Failed to load saved conversation:', error);
        localStorage.removeItem(CONVERSATION_KEY);
      }
    }
  }, []);

  const handleGetStarted = () => {
    setOnboardingStep('connect');
  };

  const handleSourcesSubmit = async (submittedSources) => {
    setOnboardingStep('analyzing');
    setAnalysisError(null);
    setFailedSources([]);
    setAnalysisProgress({
      currentStep: 0,
      totalSteps: submittedSources.length + 1, // +1 for building profile
      message: 'Initializing analysis...',
      isComplete: false
    });

    const analysisResults = [];
    const sourcesData = [];
    const failed = [];

    // Analyze each source
    for (let i = 0; i < submittedSources.length; i++) {
      const source = submittedSources[i];
      
      try {
        let result;
        
        if (source.type === 'github') {
          result = await analyzeGitHub(source.value, (progress) => {
            setAnalysisProgress({
              currentStep: i + 1,
              totalSteps: submittedSources.length + 1,
              message: progress.message,
              isComplete: false
            });
          });
          
          if (result.success) {
            analysisResults.push({
              type: 'github',
              result
            });
            sourcesData.push(generateMockSource('github', source.value));
          } else {
            failed.push({ ...source, error: result.error?.message || 'Analysis failed' });
          }
        } else if (source.type === 'blog') {
          result = await analyzeBlog([source.value], (progress) => {
            setAnalysisProgress({
              currentStep: i + 1,
              totalSteps: submittedSources.length + 1,
              message: progress.message,
              isComplete: false
            });
          });
          
          if (result.success) {
            analysisResults.push({
              type: 'blog',
              result
            });
            sourcesData.push(generateMockSource('blog', source.value));
          } else {
            failed.push({ ...source, error: result.error?.message || 'Analysis failed' });
          }
        } else if (source.type === 'text') {
          result = await analyzeTextSample(source.value, (progress) => {
            setAnalysisProgress({
              currentStep: i + 1,
              totalSteps: submittedSources.length + 1,
              message: progress.message,
              isComplete: false
            });
          });
          
          if (result.success) {
            analysisResults.push({
              type: 'text',
              result
            });
            sourcesData.push(generateMockSource('text', 'Text Sample'));
          } else {
            failed.push({ ...source, error: result.error?.message || 'Analysis failed' });
          }
        }
      } catch (error) {
        console.error(`Failed to analyze ${source.type}:`, error);
        failed.push({ 
          ...source, 
          error: error.message || 'Network error occurred'
        });
      }
    }

    // Check if we have at least one successful analysis
    if (analysisResults.length === 0) {
      setAnalysisError('All sources failed to analyze. Please check your inputs and try again.');
      setFailedSources(failed);
      setAnalysisProgress({
        currentStep: 0,
        totalSteps: submittedSources.length + 1,
        message: 'Analysis failed',
        isComplete: false
      });
      return;
    }

    // Build unified style profile
    setAnalysisProgress({
      currentStep: submittedSources.length,
      totalSteps: submittedSources.length + 1,
      message: 'Building unified style profile...',
      isComplete: false
    });

    try {
      const profileResult = await buildStyleProfile(analysisResults);
      
      if (profileResult.success) {
        const profile = profileResult.profile;
        
        // Save to LocalStorage
        localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
        localStorage.setItem(SOURCES_KEY, JSON.stringify(sourcesData));
        
        // Set profile and sources state
        setStyleProfile(profile);
        setSources(sourcesData);
        
        // Prepare summary
        setAnalysisSummary({
          repositories: profile.sampleCount.repositories,
          codeLines: profile.sampleCount.codeLines,
          articles: profile.sampleCount.articles,
          wordCount: profile.sampleCount.textWords,
          confidence: profile.confidence,
          failedSources: failed.length
        });
        
        // Store failed sources if any
        if (failed.length > 0) {
          setFailedSources(failed);
        }
        
        // Mark analysis as complete
        setAnalysisProgress({
          currentStep: submittedSources.length + 1,
          totalSteps: submittedSources.length + 1,
          message: failed.length > 0 
            ? `Analysis complete with ${failed.length} failed source(s)` 
            : 'Analysis complete!',
          isComplete: true
        });
      } else {
        setAnalysisError('Failed to build style profile. Please try again.');
        setAnalysisProgress({
          currentStep: submittedSources.length,
          totalSteps: submittedSources.length + 1,
          message: 'Profile building failed',
          isComplete: false
        });
      }
    } catch (error) {
      console.error('Failed to build profile:', error);
      setAnalysisError('An unexpected error occurred while building your profile.');
      setAnalysisProgress({
        currentStep: submittedSources.length,
        totalSteps: submittedSources.length + 1,
        message: 'Profile building failed',
        isComplete: false
      });
    }
  };

  const handleRetryAnalysis = () => {
    setAnalysisError(null);
    setFailedSources([]);
    setOnboardingStep('connect');
  };

  const handleAnalysisComplete = () => {
    setOnboardingStep('complete');
  };

  const handleConversationUpdate = (newMessages) => {
    // Limit conversation history to last 50 messages
    const limitedMessages = newMessages.slice(-MAX_CONVERSATION_HISTORY);
    setConversationHistory(limitedMessages);
    
    // Save to LocalStorage
    localStorage.setItem(CONVERSATION_KEY, JSON.stringify(limitedMessages));
  };

  const handleClearHistory = () => {
    setConversationHistory([]);
    localStorage.removeItem(CONVERSATION_KEY);
  };

  const handleSubmit = (input) => {
    console.log('User submitted:', input);
  };

  const handleSettingsClick = () => {
    setIsSettingsOpen(true);
  };

  const handleSettingsClose = () => {
    setIsSettingsOpen(false);
  };

  const handleUpdateSources = (sourceId) => {
    console.log('Update sources:', sourceId);
    // TODO: Implement source management logic
    // For now, just trigger onboarding flow to add new source
    if (!sourceId) {
      setOnboardingStep('connect');
      setIsSettingsOpen(false);
    } else {
      // Remove source
      const updatedSources = sources.filter(s => s.id !== sourceId);
      setSources(updatedSources);
      localStorage.setItem(SOURCES_KEY, JSON.stringify(updatedSources));
    }
  };

  const handleUpdatePreferences = (newPreferences) => {
    setPreferences(newPreferences);
    localStorage.setItem(PREFERENCES_KEY, JSON.stringify(newPreferences));
  };

  const handleExportClick = (content = '', contentType = 'text') => {
    setExportContent(content);
    setExportContentType(contentType);
    setIsExportOpen(true);
  };

  const handleExportClose = () => {
    setIsExportOpen(false);
  };

  return (
    <ErrorBoundary>
      <ConnectionStatus />
      <div className="app">
        {onboardingStep === 'complete' && styleProfile && (
          <Header 
            onSettingsClick={handleSettingsClick}
            onExportClick={handleExportClick}
          />
        )}
        
        {onboardingStep === 'welcome' && (
          <WelcomeScreen onGetStarted={handleGetStarted} />
        )}
        
        {onboardingStep === 'connect' && (
          <SourceConnector onSourcesSubmit={handleSourcesSubmit} />
        )}
        
        {onboardingStep === 'analyzing' && (
          <AnalysisProgress
            isComplete={analysisProgress.isComplete}
            currentStep={analysisProgress.currentStep}
            totalSteps={analysisProgress.totalSteps}
            message={analysisProgress.message}
            summary={analysisSummary}
            error={analysisError}
            failedSources={failedSources}
            onComplete={handleAnalysisComplete}
            onRetry={handleRetryAnalysis}
          />
        )}
        
        {onboardingStep === 'complete' && styleProfile && (
          <MirrorInterface 
            styleProfile={styleProfile}
            conversationHistory={conversationHistory}
            onSubmit={handleSubmit}
            onExport={handleExportClick}
            onConversationUpdate={handleConversationUpdate}
          />
        )}

        <SettingsPanel
          isOpen={isSettingsOpen}
          onClose={handleSettingsClose}
          styleProfile={styleProfile}
          sources={sources}
          preferences={preferences}
          conversationHistory={conversationHistory}
          onUpdateSources={handleUpdateSources}
          onUpdatePreferences={handleUpdatePreferences}
          onClearHistory={handleClearHistory}
        />

        <ExportModal
          isOpen={isExportOpen}
          onClose={handleExportClose}
          content={exportContent}
          contentType={exportContentType}
        />
      </div>
    </ErrorBoundary>
  );
}

export default App;
