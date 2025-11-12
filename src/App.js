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
const ANALYSIS_RESULTS_KEY = 'digitalme_analysis_results'; // Store raw analysis results
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
  const [storedAnalysisResults, setStoredAnalysisResults] = useState([]); // Store raw analysis results
  const [preferences, setPreferences] = useState(generateDefaultPreferences());
  const [conversationHistory, setConversationHistory] = useState([]);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [exportContent, setExportContent] = useState('');
  const [exportContentType, setExportContentType] = useState('text');
  const [analysisError, setAnalysisError] = useState(null);
  const [failedSources, setFailedSources] = useState([]);
  const [advancedAnalysisState, setAdvancedAnalysisState] = useState(null);

  // Load profile, sources, analysis results, preferences, and conversation history from LocalStorage on mount
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

    const savedAnalysisResults = localStorage.getItem(ANALYSIS_RESULTS_KEY);
    if (savedAnalysisResults) {
      try {
        const analysisData = JSON.parse(savedAnalysisResults);
        setStoredAnalysisResults(analysisData);
      } catch (error) {
        console.error('Failed to load saved analysis results:', error);
        localStorage.removeItem(ANALYSIS_RESULTS_KEY);
      }
    } else if (savedProfile && savedSources) {
      // Data migration: If user has profile but no stored analysis results,
      // they're using the old system. We can't recover the original analysis results,
      // but we can create placeholder results that preserve source types.
      try {
        const profile = JSON.parse(savedProfile);
        const sourcesData = JSON.parse(savedSources);
        
        console.log('[Migration] Detected old profile format. Creating placeholder analysis results for', sourcesData.length, 'sources');
        
        // Create placeholder analysis results from existing profile
        // We split the profile data evenly across all sources to maintain proper attribution
        const placeholderResults = sourcesData.map((source) => {
          // Calculate word count per source (split evenly)
          const totalWords = profile.sampleCount?.textWords || profile.sampleCount?.emailWords || 0;
          const wordsPerSource = Math.floor(totalWords / sourcesData.length);
          
          return {
            type: source.type, // Preserve the actual source type (text, gmail, blog, etc.)
            result: {
              writingStyle: profile.writing,
              profile: {
                writing: profile.writing,
                sampleCount: {
                  ...profile.sampleCount,
                  textWords: source.type === 'text' ? wordsPerSource : 0,
                  emailWords: source.type === 'gmail' ? wordsPerSource : 0
                }
              },
              metrics: {
                wordCount: wordsPerSource,
                totalWords: wordsPerSource
              }
            }
          };
        });
        
        setStoredAnalysisResults(placeholderResults);
        localStorage.setItem(ANALYSIS_RESULTS_KEY, JSON.stringify(placeholderResults));
        
        console.log('[Migration] Created placeholder results:', placeholderResults.map(r => r.type));
      } catch (error) {
        console.error('[Migration] Failed to migrate old profile:', error);
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

  const handleSourcesSubmit = async (submittedSources, advancedAnalysisEnabled = true) => {
    setOnboardingStep('analyzing');
    setAnalysisError(null);
    setFailedSources([]);
    // Always enable advanced analysis for authentic doppelgänger creation
    setAdvancedAnalysisState({
      enabled: true,
      status: {}
    });
    
    // Check if we're adding to existing sources or creating new profile
    const isAddingToExisting = sources && sources.length > 0 && styleProfile;
    
    setAnalysisProgress({
      currentStep: 0,
      totalSteps: submittedSources.length + 1, // +1 for building profile
      message: isAddingToExisting ? 'Adding new sources...' : 'Initializing analysis...',
      isComplete: false
    });

    const analysisResults = [];
    const sourcesData = [];
    const failed = [];

    // Analyze each source
    for (let i = 0; i < submittedSources.length; i++) {
      const source = submittedSources[i];
      
      console.log('[Analysis] Processing source:', {
        type: source.type,
        hasProfile: !!source.result?.profile,
        source: source
      });
      
      try {
        let result;
        
        // Gmail sources are already analyzed by the backend
        if (source.type === 'gmail' && source.result?.profile) {
          console.log('[Analysis] Using pre-analyzed Gmail profile');
          setAnalysisProgress({
            currentStep: i + 1,
            totalSteps: submittedSources.length + 1,
            message: 'Gmail analysis complete',
            isComplete: false
          });
          
          analysisResults.push({
            type: 'gmail',
            result: source.result
          });
          sourcesData.push(generateMockSource('gmail', 'Gmail Account'));
        } else if (source.type === 'gmail') {
          console.error('[Analysis] Gmail source missing profile!', source);
          failed.push({ ...source, error: 'Gmail profile not received from backend' });
        } else if (source.type === 'github') {
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
      // If adding to existing profile, we need to rebuild with ALL sources
      let allAnalysisResults = analysisResults;
      let allSourcesData = sourcesData;
      
      if (isAddingToExisting && storedAnalysisResults.length > 0) {
        console.log('[Analysis] Merging with existing sources:', storedAnalysisResults.length);
        
        // Merge new sources with existing ones
        allSourcesData = [...sources, ...sourcesData];
        
        // Use stored analysis results instead of creating a virtual "existing" source
        // This preserves the original source types (text, gmail, blog, etc.)
        allAnalysisResults = [...storedAnalysisResults, ...analysisResults];
        
        console.log('[Analysis] Rebuilding profile with', allAnalysisResults.length, 'sources');
      }
      
      const profileResult = await buildStyleProfile(allAnalysisResults);
      
      if (profileResult.success) {
        let profile = profileResult.profile;
        
        // Run advanced analysis (always enabled for authentic doppelgänger)
        try {
          console.log('[Advanced Analysis] Starting advanced analysis...');
          console.log('[Advanced Analysis] Analysis results:', allAnalysisResults);
          
          // Collect all text from sources for advanced analysis
          const allText = allAnalysisResults
            .map(result => {
              if (result.type === 'text' && result.result?.text) {
                console.log('[Advanced Analysis] Found text sample:', result.result.text.length, 'chars');
                return result.result.text;
              } else if (result.type === 'gmail' && result.result?.profile?.metadata?.emailTexts) {
                console.log('[Advanced Analysis] Found Gmail texts:', result.result.profile.metadata.emailTexts.length, 'emails');
                return result.result.profile.metadata.emailTexts.join('\n\n');
              } else if (result.type === 'blog' && result.result?.text) {
                console.log('[Advanced Analysis] Found blog text:', result.result.text.length, 'chars');
                return result.result.text;
              }
              console.log('[Advanced Analysis] No text found for type:', result.type);
              return '';
            })
            .filter(text => text)
            .join('\n\n');
          
          console.log('[Advanced Analysis] Total text collected:', allText.length, 'chars');
          
          if (allText.length > 100) {
            const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:3001';
            
            // Update status for each analysis type
            const analysisTypes = ['phrases', 'thoughtFlow', 'quirks', 'contextual'];
            
            for (const type of analysisTypes) {
              setAdvancedAnalysisState(prev => ({
                ...prev,
                status: { ...prev.status, [type]: 'running' }
              }));
            }
            
            const response = await fetch(`${backendUrl}/api/analyze-advanced`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ text: allText })
            });
            
            if (response.ok) {
              const data = await response.json();
              console.log('[Advanced Analysis] Results received:', data);
              
              // Check if we have partial or complete results
              if (data.success && data.results) {
                // Merge advanced results into profile
                profile = {
                  ...profile,
                  advanced: data.results
                };
                
                // Mark analyses as complete or failed based on results
                const hasResults = (arr) => Array.isArray(arr) && arr.length > 0;
                const hasObject = (obj) => obj && typeof obj === 'object' && Object.keys(obj).length > 0;
                
                setAdvancedAnalysisState(prev => ({
                  ...prev,
                  status: {
                    phrases: hasResults(data.results.phrases) ? 'complete' : 'failed',
                    thoughtFlow: data.results.thoughtPatterns?.flowScore !== undefined ? 'complete' : 'failed',
                    quirks: hasResults(data.results.personalityMarkers) ? 'complete' : 'failed',
                    contextual: hasObject(data.results.contextualPatterns) ? 'complete' : 'failed'
                  }
                }));
                
                if (data.partial) {
                  console.log('[Advanced Analysis] Partial results received - some analyses failed');
                }
              } else {
                throw new Error('Invalid response format');
              }
            } else {
              const errorData = await response.json().catch(() => ({}));
              console.error('[Advanced Analysis] API error:', response.status, errorData);
              
              // If the error indicates we can continue, just mark as failed
              if (errorData.canContinue) {
                console.log('[Advanced Analysis] Continuing with basic profile');
              }
              
              // Mark all as failed but continue with basic profile
              setAdvancedAnalysisState(prev => ({
                ...prev,
                status: {
                  phrases: 'failed',
                  thoughtFlow: 'failed',
                  quirks: 'failed',
                  contextual: 'failed'
                }
              }));
            }
          } else {
            console.log('[Advanced Analysis] Not enough text for advanced analysis');
          }
        } catch (advancedError) {
          console.error('[Advanced Analysis] Error:', advancedError);
          // Mark all as failed but continue with basic profile
          setAdvancedAnalysisState(prev => ({
            ...prev,
            status: {
              phrases: 'failed',
              thoughtFlow: 'failed',
              quirks: 'failed',
              contextual: 'failed'
            }
          }));
        }
        
        // Save to LocalStorage
        localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
        localStorage.setItem(SOURCES_KEY, JSON.stringify(allSourcesData));
        localStorage.setItem(ANALYSIS_RESULTS_KEY, JSON.stringify(allAnalysisResults));
        
        // Set profile, sources, and analysis results state
        setStyleProfile(profile);
        setSources(allSourcesData);
        setStoredAnalysisResults(allAnalysisResults);
        
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
      // Remove source and corresponding analysis result
      const sourceIndex = sources.findIndex(s => s.id === sourceId);
      const updatedSources = sources.filter(s => s.id !== sourceId);
      const updatedAnalysisResults = storedAnalysisResults.filter((_, idx) => idx !== sourceIndex);
      
      setSources(updatedSources);
      setStoredAnalysisResults(updatedAnalysisResults);
      localStorage.setItem(SOURCES_KEY, JSON.stringify(updatedSources));
      localStorage.setItem(ANALYSIS_RESULTS_KEY, JSON.stringify(updatedAnalysisResults));
      
      // TODO: Rebuild profile with remaining sources
    }
  };

  const handleUpdatePreferences = (newPreferences) => {
    setPreferences(newPreferences);
    localStorage.setItem(PREFERENCES_KEY, JSON.stringify(newPreferences));
  };

  const handleExportClick = (content = '', contentType = 'text') => {
    // Check if first parameter is an event object (from button click)
    const isEvent = content && typeof content === 'object' && content.nativeEvent;
    
    // If no content provided or it's an event, export full conversation history
    if (isEvent || !content) {
      if (conversationHistory.length > 0) {
        // Pass raw conversation data - formatting happens in ExportModal
        const formattedConversation = conversationHistory
          .map(msg => {
            const role = msg.role === 'user' ? 'YOU' : 'DIGITAL_ME';
            const timestamp = new Date(msg.timestamp).toLocaleString();
            return `[${role}] ${timestamp}\n${msg.content}\n`;
          })
          .join('\n---\n\n');
        
        setExportContent(formattedConversation);
        setExportContentType('text');
      } else {
        setExportContent('[NO_CONVERSATION_HISTORY]');
        setExportContentType('text');
      }
    } else {
      setExportContent(content);
      setExportContentType(contentType);
    }
    setIsExportOpen(true);
  };

  const handleExportClose = () => {
    setIsExportOpen(false);
  };

  const handleReanalyzeAdvanced = async () => {
    if (!storedAnalysisResults || storedAnalysisResults.length === 0) {
      console.error('[Re-analyze] No stored analysis results available');
      return;
    }

    try {
      console.log('[Re-analyze] Starting advanced analysis on existing sources...');
      
      // Collect all text from stored analysis results
      const allText = storedAnalysisResults
        .map(result => {
          if (result.type === 'text' && result.result?.text) {
            return result.result.text;
          } else if (result.type === 'gmail' && result.result?.profile?.metadata?.emailTexts) {
            return result.result.profile.metadata.emailTexts.join('\n\n');
          } else if (result.type === 'blog' && result.result?.text) {
            return result.result.text;
          }
          return '';
        })
        .filter(text => text)
        .join('\n\n');
      
      if (allText.length < 100) {
        console.error('[Re-analyze] Not enough text for advanced analysis');
        return;
      }

      const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:3001';
      
      const response = await fetch(`${backendUrl}/api/analyze-advanced`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: allText })
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('[Re-analyze] Advanced analysis complete:', data);
        
        if (data.success && data.results) {
          // Merge advanced results into existing profile
          const updatedProfile = {
            ...styleProfile,
            advanced: data.results
          };
          
          // Save updated profile
          localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedProfile));
          setStyleProfile(updatedProfile);
          
          if (data.partial) {
            console.log('[Re-analyze] Partial results - some analyses failed but profile updated');
          } else {
            console.log('[Re-analyze] Profile updated with complete advanced analysis');
          }
        } else {
          throw new Error('Invalid response format');
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('[Re-analyze] API error:', response.status, errorData.message);
        throw new Error(errorData.message || 'Advanced analysis API request failed');
      }
    } catch (error) {
      console.error('[Re-analyze] Error:', error);
      throw error;
    }
  };

  return (
    <ErrorBoundary>
      <ConnectionStatus />
      <div className="app">
        {onboardingStep === 'complete' && styleProfile && (
          <Header 
            onSettingsClick={handleSettingsClick}
            onExportClick={handleExportClick}
            hasContent={conversationHistory.length > 0}
          />
        )}
        
        {onboardingStep === 'welcome' && (
          <WelcomeScreen onGetStarted={handleGetStarted} />
        )}
        
        {onboardingStep === 'connect' && (
          <SourceConnector 
            onSourcesSubmit={handleSourcesSubmit}
            onCancel={() => {
              // If we have a profile, go back to complete state (settings)
              // Otherwise go back to welcome
              if (styleProfile) {
                setOnboardingStep('complete');
                setIsSettingsOpen(true);
              } else {
                setOnboardingStep('welcome');
              }
            }}
          />
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
            advancedAnalysis={advancedAnalysisState}
          />
        )}
        
        {onboardingStep === 'complete' && styleProfile && (
          <MirrorInterface 
            styleProfile={styleProfile}
            conversationHistory={conversationHistory}
            preferences={preferences}
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
          onReanalyzeAdvanced={handleReanalyzeAdvanced}
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
