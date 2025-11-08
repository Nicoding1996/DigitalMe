/**
 * GmailConnectButton Component
 * Black Mirror aesthetic - Gmail OAuth integration interface
 * Handles OAuth flow, progress tracking, and connection management
 */
import { useState, useEffect, useRef } from 'react';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

const GmailConnectButton = ({ 
  onConnectionStart, 
  onConnectionComplete, 
  onConnectionError,
  isConnected = false 
}) => {
  const [connectionStatus, setConnectionStatus] = useState('idle');
  const [progressMessage, setProgressMessage] = useState('');
  const [analysisStats, setAnalysisStats] = useState({
    emailsRetrieved: 0,
    emailsFiltered: 0,
    emailsAnalyzed: 0,
    patternsExtracted: 0
  });
  const [error, setError] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [dots, setDots] = useState('');
  
  const pollingIntervalRef = useRef(null);
  const oauthWindowRef = useRef(null);

  // Check for OAuth completion via localStorage (fallback when postMessage/redirect is blocked)
  useEffect(() => {
    const checkAuthCompletion = () => {
      const sessionId = localStorage.getItem('gmail_session_id');
      const authStatus = localStorage.getItem('gmail_auth_status');
      
      if (sessionId && authStatus === 'success' && connectionStatus === 'connecting') {
        console.log('Detected Gmail session from localStorage:', sessionId);
        
        // Clear localStorage
        localStorage.removeItem('gmail_session_id');
        localStorage.removeItem('gmail_auth_status');
        
        // Start analysis tracking
        setSessionId(sessionId);
        setConnectionStatus('retrieving');
        setProgressMessage('Retrieving sent emails');
        
        // Start polling
        setTimeout(() => {
          pollAnalysisStatus(sessionId);
          const interval = setInterval(() => {
            pollAnalysisStatus(sessionId);
          }, 2000);
          pollingIntervalRef.current = interval;
        }, 100);
      }
    };
    
    // Check immediately
    checkAuthCompletion();
    
    // Also check periodically while connecting (in case popup completes after we start checking)
    const checkInterval = setInterval(checkAuthCompletion, 500);
    
    return () => clearInterval(checkInterval);
  }, [connectionStatus]); // eslint-disable-line react-hooks/exhaustive-deps

  // Animated dots for loading states
  useEffect(() => {
    if (connectionStatus !== 'idle' && connectionStatus !== 'complete' && connectionStatus !== 'error') {
      const interval = setInterval(() => {
        setDots(prev => (prev.length >= 3 ? '' : prev + '.'));
      }, 500);
      return () => clearInterval(interval);
    }
  }, [connectionStatus]);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
      if (oauthWindowRef.current && !oauthWindowRef.current.closed) {
        oauthWindowRef.current.close();
      }
    };
  }, []);

  /**
   * Poll backend for analysis progress
   */
  const pollAnalysisStatus = async (sid) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/gmail/analysis-status/${sid}`);
      
      if (!response.ok) {
        // Try to parse error response
        let errorData;
        try {
          errorData = await response.json();
        } catch (e) {
          errorData = { message: `Failed to fetch analysis status: ${response.statusText}` };
        }
        throw errorData;
      }

      const data = await response.json();

      // Update status and progress
      setConnectionStatus(data.status);
      
      if (data.progress?.message) {
        setProgressMessage(data.progress.message);
      }

      if (data.stats) {
        setAnalysisStats(data.stats);
      }

      // Handle completion
      if (data.status === 'complete') {
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
        }
        
        if (onConnectionComplete) {
          onConnectionComplete({
            emailsAnalyzed: data.stats.emailsAnalyzed || 0,
            emailsFiltered: data.stats.emailsFiltered || 0,
            patternsExtracted: data.stats.patternsExtracted || 0
          });
        }
      }

      // Handle error
      if (data.status === 'error') {
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
        }
        
        // Create error object with all available info
        const errorObj = {
          message: data.error || 'Analysis failed',
          canRetry: data.canRetry !== false,
          userAction: data.userAction
        };
        
        setError(errorObj);
        
        if (onConnectionError) {
          onConnectionError(errorObj);
        }
      }
    } catch (err) {
      console.error('Error polling analysis status:', err);
      
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
      
      setConnectionStatus('error');
      
      // Handle error object or create one
      const errorObj = typeof err === 'object' && err !== null && err.message
        ? err
        : { message: err.message || 'Failed to check analysis status', canRetry: true };
      
      setError(errorObj);
      
      if (onConnectionError) {
        onConnectionError(errorObj);
      }
    }
  };

  /**
   * Start polling for analysis progress
   */
  const startPolling = (sid) => {
    // Clear any existing polling
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }

    // Poll immediately
    pollAnalysisStatus(sid);

    // Then poll every 2 seconds
    pollingIntervalRef.current = setInterval(() => {
      pollAnalysisStatus(sid);
    }, 2000);
  };

  /**
   * Handle OAuth popup window
   */
  const handleConnect = async () => {
    try {
      setConnectionStatus('connecting');
      setError(null);
      setProgressMessage('Initiating OAuth flow');
      
      if (onConnectionStart) {
        onConnectionStart();
      }

      // Request OAuth URL from backend
      const response = await fetch(`${API_BASE_URL}/api/auth/gmail/initiate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          redirectUri: `${API_BASE_URL}/api/auth/gmail/callback`
        })
      });

      if (!response.ok) {
        // Try to parse error response
        let errorData;
        try {
          errorData = await response.json();
        } catch (e) {
          errorData = { message: `Failed to initiate OAuth: ${response.statusText}`, canRetry: true };
        }
        throw errorData;
      }

      const data = await response.json();

      // Open OAuth popup
      const width = 600;
      const height = 700;
      const left = window.screen.width / 2 - width / 2;
      const top = window.screen.height / 2 - height / 2;

      oauthWindowRef.current = window.open(
        data.authUrl,
        'Gmail OAuth',
        `width=${width},height=${height},left=${left},top=${top},toolbar=no,menubar=no`
      );

      // Listen for OAuth callback message
      const handleMessage = (event) => {
        // Verify origin for security
        if (event.origin !== window.location.origin && event.origin !== API_BASE_URL) {
          return;
        }

        if (event.data.type === 'gmail-oauth-success') {
          window.removeEventListener('message', handleMessage);
          
          if (oauthWindowRef.current && !oauthWindowRef.current.closed) {
            oauthWindowRef.current.close();
          }

          // Start analysis progress tracking
          const sid = event.data.sessionId;
          setSessionId(sid);
          setConnectionStatus('retrieving');
          setProgressMessage('Retrieving sent emails');
          startPolling(sid);
        } else if (event.data.type === 'gmail-oauth-error') {
          window.removeEventListener('message', handleMessage);
          
          if (oauthWindowRef.current && !oauthWindowRef.current.closed) {
            oauthWindowRef.current.close();
          }

          setConnectionStatus('error');
          
          // Handle error object or string
          const errorData = event.data.error;
          if (typeof errorData === 'object' && errorData !== null) {
            setError(errorData);
          } else {
            setError({
              message: errorData || 'OAuth failed',
              canRetry: true
            });
          }
          
          if (onConnectionError) {
            onConnectionError(errorData);
          }
        }
      };

      window.addEventListener('message', handleMessage);

      // Check if popup was blocked
      if (!oauthWindowRef.current || oauthWindowRef.current.closed) {
        window.removeEventListener('message', handleMessage);
        throw new Error('Popup blocked. Please allow popups for this site.');
      }

      // Note: We don't monitor popup closure anymore to avoid COOP warnings
      // The popup will redirect back to the main app with session ID in URL

    } catch (err) {
      console.error('Error initiating Gmail connection:', err);
      setConnectionStatus('error');
      
      // Handle error object or create one - ensure we have a proper error object
      let errorObj;
      if (typeof err === 'object' && err !== null) {
        // If it's already an error object with message, code, etc., use it
        errorObj = {
          message: err.message || 'Failed to connect to Gmail',
          code: err.code,
          canRetry: err.canRetry !== false,
          userAction: err.userAction
        };
      } else if (typeof err === 'string') {
        errorObj = { message: err, canRetry: true };
      } else {
        errorObj = { message: 'Failed to connect to Gmail', canRetry: true };
      }
      
      setError(errorObj);
      
      if (onConnectionError) {
        onConnectionError(errorObj);
      }
    }
  };

  /**
   * Handle disconnect
   */
  const handleDisconnect = async () => {
    try {
      if (!sessionId) {
        // If no session, just reset state
        setConnectionStatus('idle');
        setError(null);
        setAnalysisStats({
          emailsRetrieved: 0,
          emailsFiltered: 0,
          emailsAnalyzed: 0,
          patternsExtracted: 0
        });
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/gmail/disconnect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ sessionId })
      });

      if (!response.ok) {
        // Try to parse error response
        let errorData;
        try {
          errorData = await response.json();
        } catch (e) {
          errorData = { message: `Failed to disconnect: ${response.statusText}`, canRetry: true };
        }
        
        // Log but don't show error to user - disconnection is not critical
        console.warn('Disconnect warning:', errorData.message);
      }

      // Reset state regardless of response (best effort disconnect)
      setConnectionStatus('idle');
      setSessionId(null);
      setError(null);
      setProgressMessage('');
      setAnalysisStats({
        emailsRetrieved: 0,
        emailsFiltered: 0,
        emailsAnalyzed: 0,
        patternsExtracted: 0
      });

    } catch (err) {
      console.error('Error disconnecting Gmail:', err);
      // Don't show error to user - just reset state
      setConnectionStatus('idle');
      setSessionId(null);
      setError(null);
      setProgressMessage('');
      setAnalysisStats({
        emailsRetrieved: 0,
        emailsFiltered: 0,
        emailsAnalyzed: 0,
        patternsExtracted: 0
      });
    }
  };

  /**
   * Handle retry after error
   */
  const handleRetry = () => {
    setError(null);
    setConnectionStatus('idle');
    handleConnect();
  };

  /**
   * Render based on connection status
   */
  const renderContent = () => {
    // Error state
    if (connectionStatus === 'error') {
      // Parse error object - ensure we always have strings for rendering
      let errorMessage = 'Failed to connect to Gmail';
      let userAction = null;
      let canRetry = true;
      
      try {
        if (typeof error === 'object' && error !== null) {
          errorMessage = error.message || errorMessage;
          userAction = error.userAction;
          canRetry = error.canRetry !== false;
        } else if (typeof error === 'string') {
          if (error.startsWith('{')) {
            const errorObj = JSON.parse(error);
            errorMessage = errorObj.message || errorMessage;
            userAction = errorObj.userAction;
            canRetry = errorObj.canRetry !== false;
          } else {
            errorMessage = error;
          }
        }
      } catch (e) {
        // Use default error message if parsing fails
        errorMessage = 'Failed to connect to Gmail';
      }

      return (
        <div className="space-y-6">
          <div className="border border-glitch-red bg-void-surface p-6">
            <div className="font-mono text-xs text-static-ghost mb-4">
              [CONNECTION_ERROR]
            </div>
            <div className="text-glitch-red text-sm font-mono mb-4">
              {errorMessage}
            </div>
            {userAction && (
              <div className="text-static-muted text-xs font-mono mb-4 border-l-2 border-glitch-red pl-3">
                {userAction}
              </div>
            )}
            {canRetry && (
              <button
                onClick={handleRetry}
                className="w-full px-6 py-3 bg-void-surface border border-glitch-red text-glitch-red font-mono text-xs tracking-wider hover:bg-glitch-red hover:text-void-deep transition-all"
              >
                &gt; RETRY_CONNECTION
              </button>
            )}
            {!canRetry && (
              <button
                onClick={() => {
                  setError(null);
                  setConnectionStatus('idle');
                }}
                className="w-full px-6 py-3 bg-void-surface border border-static-whisper text-static-white font-mono text-xs tracking-wider hover:border-glitch-red hover:text-glitch-red transition-all"
              >
                &gt; DISMISS
              </button>
            )}
          </div>
        </div>
      );
    }

    // Complete state
    if (connectionStatus === 'complete') {
      // Calculate partial success message if some emails were filtered
      const total = analysisStats.emailsRetrieved || 0;
      const analyzed = analysisStats.emailsAnalyzed || 0;
      const filtered = analysisStats.emailsFiltered || 0;
      const failureRate = total > 0 ? (filtered / total) * 100 : 0;
      
      let statusColor = 'system-active';
      let statusMessage = null;
      
      if (failureRate > 30) {
        statusColor = 'unsettling-cyan';
        statusMessage = `Many emails were filtered due to automated content or insufficient original text. Analysis completed with ${analyzed} valid emails.`;
      } else if (failureRate > 10) {
        statusColor = 'unsettling-cyan';
        statusMessage = `Some emails could not be processed, but analysis completed successfully with ${analyzed} emails.`;
      }

      return (
        <div className="space-y-6">
          <div className={`border border-${statusColor} bg-void-surface p-6`}>
            <div className="font-mono text-xs text-static-ghost mb-4">
              [ANALYSIS_COMPLETE]
            </div>
            <div className={`text-${statusColor} text-2xl mb-4`}>✓</div>
            
            {statusMessage && (
              <div className="text-static-muted text-xs font-mono mb-4 border-l-2 border-unsettling-cyan pl-3">
                {statusMessage}
              </div>
            )}
            
            <div className="space-y-2 font-mono text-xs mb-6">
              <div className="flex justify-between items-center py-2 border-b border-static-whisper">
                <span className="text-static-muted">Emails Retrieved:</span>
                <span className="text-static-white">{analysisStats.emailsRetrieved}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-static-whisper">
                <span className="text-static-muted">Emails Analyzed:</span>
                <span className="text-static-white">{analysisStats.emailsAnalyzed}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-static-whisper">
                <span className="text-static-muted">Emails Filtered:</span>
                <span className="text-static-white">{analysisStats.emailsFiltered}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-static-muted">Patterns Extracted:</span>
                <span className={`text-${statusColor}`}>{analysisStats.patternsExtracted}</span>
              </div>
            </div>
            <button
              onClick={handleDisconnect}
              className="w-full px-6 py-3 bg-void-surface border border-static-whisper text-static-white font-mono text-xs tracking-wider hover:border-glitch-red hover:text-glitch-red transition-all"
            >
              &gt; DISCONNECT_GMAIL
            </button>
          </div>
        </div>
      );
    }

    // Processing states (connecting, retrieving, analyzing)
    if (connectionStatus !== 'idle') {
      const statusMessages = {
        connecting: 'Connecting to Gmail',
        retrieving: 'Retrieving sent emails',
        cleansing: 'Cleansing email content',
        analyzing: 'Analyzing writing patterns'
      };

      return (
        <div className="space-y-6">
          <div className="border border-unsettling-cyan bg-void-surface p-6">
            <div className="font-mono text-xs text-static-ghost mb-4">
              [{connectionStatus.toUpperCase()}_IN_PROGRESS]
            </div>
            <div className="font-mono text-sm text-static-white mb-6">
              &gt; {progressMessage || statusMessages[connectionStatus]}{dots}
            </div>
            
            {/* Progress stats */}
            {(analysisStats.emailsRetrieved > 0 || analysisStats.emailsAnalyzed > 0) && (
              <div className="space-y-2 font-mono text-xs mb-4">
                {analysisStats.emailsRetrieved > 0 && (
                  <div className="flex justify-between items-center py-1">
                    <span className="text-static-muted">Retrieved:</span>
                    <span className="text-unsettling-cyan">{analysisStats.emailsRetrieved}</span>
                  </div>
                )}
                {analysisStats.emailsAnalyzed > 0 && (
                  <div className="flex justify-between items-center py-1">
                    <span className="text-static-muted">Analyzed:</span>
                    <span className="text-unsettling-cyan">{analysisStats.emailsAnalyzed}</span>
                  </div>
                )}
              </div>
            )}

            {/* Visual indicator */}
            <div className="flex justify-center gap-2">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="w-2 h-2 bg-unsettling-cyan rounded-full animate-pulse"
                  style={{ animationDelay: `${i * 0.2}s` }}
                />
              ))}
            </div>
          </div>
        </div>
      );
    }

    // Idle state - show connect button
    return (
      <button
        onClick={handleConnect}
        className="w-full px-6 py-3 bg-void-surface border border-static-whisper text-static-white font-mono text-xs tracking-wider hover:border-unsettling-cyan hover:text-unsettling-cyan transition-all"
      >
        &gt; CONNECT_GMAIL
      </button>
    );
  };

  return (
    <div className="gmail-connect-container">
      {renderContent()}
    </div>
  );
};

export default GmailConnectButton;
