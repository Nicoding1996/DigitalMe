/**
 * GmailConnectButton Component
 * Black Mirror aesthetic - Gmail OAuth integration interface
 * Handles OAuth flow, progress tracking, and connection management
 */
import { useState, useEffect, useRef } from 'react';

// Helper function to get backend URL dynamically
const getBackendUrl = () => {
  return process.env.REACT_APP_BACKEND_URL || 'http://localhost:3001';
};

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

  // No need for URL parameter or localStorage checking anymore
  // The postMessage from the popup will handle everything

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
      console.log('[Gmail OAuth] Polling analysis status for session:', sid);
      const response = await fetch(`${getBackendUrl()}/api/gmail/analysis-status/${sid}`);
      
      if (!response.ok) {
        console.log('[Gmail OAuth] Analysis status request failed:', response.status, response.statusText);
        // Try to parse error response
        let errorData;
        try {
          errorData = await response.json();
          console.log('[Gmail OAuth] Error data:', errorData);
        } catch (e) {
          errorData = { message: `Failed to fetch analysis status: ${response.statusText}` };
        }
        throw errorData;
      }

      const data = await response.json();
      console.log('[Gmail OAuth] Analysis status received:', data.status, 'Stats:', data.stats);

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
        console.log('[Gmail OAuth] Analysis complete! Data received:', {
          hasProfile: !!data.profile,
          stats: data.stats,
          profileKeys: data.profile ? Object.keys(data.profile) : []
        });
        
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
        }
        
        if (onConnectionComplete) {
          const completionData = {
            emailsAnalyzed: data.stats.emailsAnalyzed || 0,
            emailsFiltered: data.stats.emailsFiltered || 0,
            patternsExtracted: data.stats.patternsExtracted || 0,
            profile: data.profile // Include the analysis profile
          };
          console.log('[Gmail OAuth] Calling onConnectionComplete with:', completionData);
          onConnectionComplete(completionData);
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
      
      // Don't treat "session not found" as fatal - OAuth callback may not have fired yet
      const isSessionNotFound = err?.code === 'session_not_found' || 
                                err?.message?.includes('not found') ||
                                err?.message?.includes('expired');
      
      if (isSessionNotFound) {
        console.log('[Gmail OAuth] Session not found during polling - OAuth may still be in progress');
        // Don't stop polling or show error - let the fallback polling continue
        return;
      }
      
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
      const backendUrl = getBackendUrl();
      const response = await fetch(`${backendUrl}/api/auth/gmail/initiate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          redirectUri: `${backendUrl}/api/auth/gmail/callback`
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
        console.log('[Gmail OAuth] Received postMessage:', {
          origin: event.origin,
          type: event.data?.type,
          hasSessionId: !!event.data?.sessionId
        });
        
        // Verify origin for security
        const backendUrl = getBackendUrl();
        const backendOrigin = new URL(backendUrl).origin;
        
        // Accept messages from frontend origin, backend origin, or wildcard (for popup)
        const isValidOrigin = event.origin === window.location.origin || 
                             event.origin === backendOrigin ||
                             event.origin === 'null'; // Popup might have null origin
        
        if (!isValidOrigin) {
          console.log('[Gmail OAuth] Message rejected - invalid origin:', event.origin, 'Expected:', window.location.origin, 'or', backendOrigin);
          return;
        }

        if (event.data.type === 'gmail-oauth-success') {
          console.log('[Gmail OAuth] Success message received, sessionId:', event.data.sessionId);
          window.removeEventListener('message', handleMessage);
          
          if (oauthWindowRef.current && !oauthWindowRef.current.closed) {
            oauthWindowRef.current.close();
          }

          // Start analysis progress tracking
          const sid = event.data.sessionId;
          console.log('[Gmail OAuth] Starting analysis tracking for session:', sid);
          setSessionId(sid);
          localStorage.setItem('gmail_session_id', sid); // Store for disconnect on reset
          setConnectionStatus('retrieving');
          setProgressMessage('Retrieving sent emails');
          startPolling(sid);
        } else if (event.data.type === 'gmail-oauth-error') {
          console.log('[Gmail OAuth] Error message received:', event.data.error);
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

      console.log('[Gmail OAuth] Registering message listener, expecting origin:', backendUrl);
      console.log('[Gmail OAuth] Session ID for this OAuth flow:', data.sessionId);
      window.addEventListener('message', handleMessage);

      // Check if popup was blocked
      if (!oauthWindowRef.current || oauthWindowRef.current.closed) {
        console.log('[Gmail OAuth] Popup was blocked');
        window.removeEventListener('message', handleMessage);
        throw new Error('Popup blocked. Please allow popups for this site.');
      }
      
      console.log('[Gmail OAuth] Popup opened successfully');
      
      // CRITICAL: Store session ID immediately so we can poll for it
      const sessionId = data.sessionId;
      setSessionId(sessionId);
      localStorage.setItem('gmail_session_id', sessionId);
      
      console.log('[Gmail OAuth] Session ID stored:', sessionId);

      // FALLBACK: Poll for analysis completion if postMessage fails
      // This handles cases where postMessage is blocked by browser security
      // Start polling immediately to catch fast OAuth completions
      let pollAttempts = 0;
      const maxPollAttempts = 120; // Poll for up to 2 minutes (120 * 1 second)
      let messageReceived = false;
      
      console.log('[Gmail OAuth] Starting fallback polling for session:', sessionId);
      
      // Update handleMessage to set flag
      const originalHandleMessage = handleMessage;
      const wrappedHandleMessage = (event) => {
        messageReceived = true;
        originalHandleMessage(event);
      };
      
      // Replace the message handler
      window.removeEventListener('message', handleMessage);
      window.addEventListener('message', wrappedHandleMessage);
      
      const pollForAuth = setInterval(async () => {
        pollAttempts++;
        
        // Stop polling if message was received or max attempts reached
        if (messageReceived || pollAttempts >= maxPollAttempts) {
          clearInterval(pollForAuth);
          if (!messageReceived) {
            window.removeEventListener('message', wrappedHandleMessage);
            console.log('[Gmail OAuth] Polling stopped - max attempts reached');
            
            // Show timeout error to user
            setConnectionStatus('error');
            const timeoutError = {
              message: 'OAuth authentication timed out. Please try again.',
              canRetry: true,
              userAction: 'The authentication window may have been closed or the process took too long. Click RETRY to try again.'
            };
            setError(timeoutError);
            
            if (onConnectionError) {
              onConnectionError(timeoutError);
            }
          }
          return;
        }
        
        // Check analysis session status directly (session is created immediately after OAuth)
        // NOTE: sessionId from /initiate is now guaranteed to match backend's sessionId
        // because both use the state token as the session ID
        try {
          // Check analysis status directly - no need to check OAuth status first
          // since we create the analysis session immediately in the OAuth callback
          const analysisStatusResponse = await fetch(`${getBackendUrl()}/api/gmail/analysis-status/${sessionId}`);
          
          if (analysisStatusResponse.ok) {
            const analysisData = await analysisStatusResponse.json();
            
            console.log('[Gmail OAuth] Analysis status:', analysisData.status);
            
            // If we have an analysis session, stop OAuth polling and start analysis polling
            if (analysisData.status) {
              clearInterval(pollForAuth);
              window.removeEventListener('message', wrappedHandleMessage);
              messageReceived = true;
              
              // Try to close popup
              try {
                if (oauthWindowRef.current && !oauthWindowRef.current.closed) {
                  oauthWindowRef.current.close();
                }
              } catch (e) {
                // Ignore errors
              }
              
              // Start analysis tracking
              console.log('[Gmail OAuth] Starting analysis tracking for session:', sessionId);
              setConnectionStatus(analysisData.status);
              
              if (analysisData.progress?.message) {
                setProgressMessage(analysisData.progress.message);
              }
              
              // Start polling for analysis progress
              startPolling(sessionId);
            }
          } else if (analysisStatusResponse.status === 404) {
            // Analysis session not created yet, keep waiting
            // This should rarely happen now that we create session immediately
            if (pollAttempts % 5 === 0) {
              console.log('[Gmail OAuth] Waiting for analysis session to be created... (attempt', pollAttempts, '/', maxPollAttempts, ') - sessionId:', sessionId);
            }
          }
        } catch (err) {
          // Network error - ignore and keep polling
          if (pollAttempts % 10 === 0) {
            console.log('[Gmail OAuth] Polling network error (will retry):', err.message);
          }
        }
      }, 1000); // Poll every 1 second for faster detection

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

      const response = await fetch(`${getBackendUrl()}/api/gmail/disconnect`, {
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
      localStorage.removeItem('gmail_session_id'); // Clear stored session ID
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
      localStorage.removeItem('gmail_session_id'); // Clear stored session ID
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
