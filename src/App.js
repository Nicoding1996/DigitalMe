import { useState, useEffect } from 'react';
import Header from './components/Header';
import WelcomeScreen from './components/WelcomeScreen';
import SourceConnector from './components/SourceConnector';
import AnalysisProgress from './components/AnalysisProgress';
import MirrorInterface from './components/MirrorInterface';
import SettingsPanel from './components/SettingsPanel';
import { analyzeGitHub, analyzeBlog, analyzeTextSample, buildStyleProfile } from './services/StyleAnalyzer';
import { generateMockSource, generateDefaultPreferences } from './models';
import './App.css';

const STORAGE_KEY = 'digitalme_profile';
const SOURCES_KEY = 'digitalme_sources';
const PREFERENCES_KEY = 'digitalme_preferences';

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
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Load profile, sources, and preferences from LocalStorage on mount
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
  }, []);

  const handleGetStarted = () => {
    setOnboardingStep('connect');
  };

  const handleSourcesSubmit = async (submittedSources) => {
    setOnboardingStep('analyzing');
    setAnalysisProgress({
      currentStep: 0,
      totalSteps: submittedSources.length + 1, // +1 for building profile
      message: 'Initializing analysis...',
      isComplete: false
    });

    const analysisResults = [];
    const sourcesData = [];

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
          
          analysisResults.push({
            type: 'github',
            result
          });

          sourcesData.push(generateMockSource('github', source.value));
        } else if (source.type === 'blog') {
          result = await analyzeBlog([source.value], (progress) => {
            setAnalysisProgress({
              currentStep: i + 1,
              totalSteps: submittedSources.length + 1,
              message: progress.message,
              isComplete: false
            });
          });
          
          analysisResults.push({
            type: 'blog',
            result
          });

          sourcesData.push(generateMockSource('blog', source.value));
        } else if (source.type === 'text') {
          result = await analyzeTextSample(source.value, (progress) => {
            setAnalysisProgress({
              currentStep: i + 1,
              totalSteps: submittedSources.length + 1,
              message: progress.message,
              isComplete: false
            });
          });
          
          analysisResults.push({
            type: 'text',
            result
          });

          sourcesData.push(generateMockSource('text', 'Text Sample'));
        }
      } catch (error) {
        console.error(`Failed to analyze ${source.type}:`, error);
      }
    }

    // Build unified style profile
    setAnalysisProgress({
      currentStep: submittedSources.length,
      totalSteps: submittedSources.length + 1,
      message: 'Building unified style profile...',
      isComplete: false
    });

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
        confidence: profile.confidence
      });
      
      // Mark analysis as complete
      setAnalysisProgress({
        currentStep: submittedSources.length + 1,
        totalSteps: submittedSources.length + 1,
        message: 'Analysis complete!',
        isComplete: true
      });
    }
  };

  const handleAnalysisComplete = () => {
    setOnboardingStep('complete');
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

  const handleExportClick = () => {
    console.log('Export clicked');
    // TODO: Open export modal (Task 7)
  };

  return (
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
          onComplete={handleAnalysisComplete}
        />
      )}
      
      {onboardingStep === 'complete' && styleProfile && (
        <MirrorInterface 
          styleProfile={styleProfile}
          conversationHistory={[]}
          onSubmit={handleSubmit}
        />
      )}

      <SettingsPanel
        isOpen={isSettingsOpen}
        onClose={handleSettingsClose}
        styleProfile={styleProfile}
        sources={sources}
        preferences={preferences}
        onUpdateSources={handleUpdateSources}
        onUpdatePreferences={handleUpdatePreferences}
      />
    </div>
  );
}

export default App;
