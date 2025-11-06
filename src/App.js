import { useState, useEffect } from 'react';
import WelcomeScreen from './components/WelcomeScreen';
import SourceConnector from './components/SourceConnector';
import AnalysisProgress from './components/AnalysisProgress';
import MirrorInterface from './components/MirrorInterface';
import { analyzeGitHub, analyzeBlog, analyzeTextSample, buildStyleProfile } from './services/StyleAnalyzer';
import './App.css';

const STORAGE_KEY = 'digitalme_profile';

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

  // Load profile from LocalStorage on mount
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
  }, []);

  const handleGetStarted = () => {
    setOnboardingStep('connect');
  };

  const handleSourcesSubmit = async (sources) => {
    setOnboardingStep('analyzing');
    setAnalysisProgress({
      currentStep: 0,
      totalSteps: sources.length + 1, // +1 for building profile
      message: 'Initializing analysis...',
      isComplete: false
    });

    const analysisResults = [];

    // Analyze each source
    for (let i = 0; i < sources.length; i++) {
      const source = sources[i];
      
      try {
        let result;
        
        if (source.type === 'github') {
          result = await analyzeGitHub(source.value, (progress) => {
            setAnalysisProgress({
              currentStep: i + 1,
              totalSteps: sources.length + 1,
              message: progress.message,
              isComplete: false
            });
          });
          
          analysisResults.push({
            type: 'github',
            result
          });
        } else if (source.type === 'blog') {
          result = await analyzeBlog([source.value], (progress) => {
            setAnalysisProgress({
              currentStep: i + 1,
              totalSteps: sources.length + 1,
              message: progress.message,
              isComplete: false
            });
          });
          
          analysisResults.push({
            type: 'blog',
            result
          });
        } else if (source.type === 'text') {
          result = await analyzeTextSample(source.value, (progress) => {
            setAnalysisProgress({
              currentStep: i + 1,
              totalSteps: sources.length + 1,
              message: progress.message,
              isComplete: false
            });
          });
          
          analysisResults.push({
            type: 'text',
            result
          });
        }
      } catch (error) {
        console.error(`Failed to analyze ${source.type}:`, error);
      }
    }

    // Build unified style profile
    setAnalysisProgress({
      currentStep: sources.length,
      totalSteps: sources.length + 1,
      message: 'Building unified style profile...',
      isComplete: false
    });

    const profileResult = await buildStyleProfile(analysisResults);
    
    if (profileResult.success) {
      const profile = profileResult.profile;
      
      // Save to LocalStorage
      localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
      
      // Set profile state
      setStyleProfile(profile);
      
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
        currentStep: sources.length + 1,
        totalSteps: sources.length + 1,
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

  return (
    <div className="app">
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
    </div>
  );
}

export default App;
