import React, { useState, useEffect, useCallback } from 'react';
import './ConnectionStatus.css';

/**
 * ConnectionStatus Component
 * 
 * Displays backend connection status with auto-retry functionality.
 * Polls the backend health endpoint and shows visual indicators.
 * 
 * **Feature: ux-polish-improvements, Property 4: Connection monitoring**
 * Validates: Requirements 1.4
 */
const ConnectionStatus = () => {
  const [status, setStatus] = useState('connected'); // 'connected' | 'disconnected' | 'reconnecting'
  const [lastChecked, setLastChecked] = useState(null);
  const [retryCount, setRetryCount] = useState(0);

  /**
   * Check backend connection health
   */
  const checkConnection = useCallback(async () => {
    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:3001';
      const response = await fetch(`${backendUrl}/api/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        // Short timeout to detect disconnections quickly
        signal: AbortSignal.timeout(5000)
      });

      if (response.ok) {
        const data = await response.json();
        
        // Connection restored
        if (status !== 'connected') {
          console.log('Backend connection restored');
          setRetryCount(0);
        }
        
        setStatus('connected');
        setLastChecked(new Date());
        return true;
      } else {
        throw new Error(`Health check failed with status ${response.status}`);
      }
    } catch (error) {
      console.error('Backend connection check failed:', error.message);
      
      if (status === 'connected') {
        console.log('Backend disconnected, starting auto-retry');
      }
      
      setStatus('disconnected');
      setLastChecked(new Date());
      return false;
    }
  }, [status]);

  /**
   * Auto-retry connection every 5 seconds when disconnected
   */
  useEffect(() => {
    let retryInterval;

    if (status === 'disconnected') {
      setStatus('reconnecting');
      
      retryInterval = setInterval(async () => {
        console.log(`Attempting to reconnect... (attempt ${retryCount + 1})`);
        setRetryCount(prev => prev + 1);
        
        const connected = await checkConnection();
        
        if (!connected) {
          setStatus('reconnecting');
        }
      }, 5000); // Retry every 5 seconds
    }

    return () => {
      if (retryInterval) {
        clearInterval(retryInterval);
      }
    };
  }, [status, checkConnection, retryCount]);

  /**
   * Initial connection check and periodic polling
   */
  useEffect(() => {
    // Initial check
    checkConnection();

    // Poll every 10 seconds when connected
    const pollInterval = setInterval(() => {
      if (status === 'connected') {
        checkConnection();
      }
    }, 10000);

    return () => clearInterval(pollInterval);
  }, [checkConnection, status]);

  /**
   * Get status display properties
   */
  const getStatusDisplay = () => {
    switch (status) {
      case 'connected':
        return {
          icon: '●',
          text: 'Connected',
          className: 'connection-status-connected'
        };
      case 'reconnecting':
        return {
          icon: '◐',
          text: 'Reconnecting...',
          className: 'connection-status-reconnecting'
        };
      case 'disconnected':
        return {
          icon: '○',
          text: 'Disconnected',
          className: 'connection-status-disconnected'
        };
      default:
        return {
          icon: '?',
          text: 'Unknown',
          className: 'connection-status-unknown'
        };
    }
  };

  const display = getStatusDisplay();

  return (
    <div className={`connection-status ${display.className}`}>
      <span className="connection-status-icon" aria-hidden="true">
        {display.icon}
      </span>
      <span className="connection-status-text">
        {display.text}
      </span>
      {status === 'reconnecting' && retryCount > 0 && (
        <span className="connection-status-retry">
          (attempt {retryCount})
        </span>
      )}
    </div>
  );
};

export default ConnectionStatus;
