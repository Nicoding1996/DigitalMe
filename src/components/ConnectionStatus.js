import { useState, useEffect } from 'react';
import './ConnectionStatus.css';

/**
 * ConnectionStatus Component
 * Displays connection status indicator and handles offline/online states
 */
const ConnectionStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showStatus, setShowStatus] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowStatus(true);
      setTimeout(() => setShowStatus(false), 3000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowStatus(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!showStatus && isOnline) {
    return null;
  }

  return (
    <div className={`connection-status ${isOnline ? 'online' : 'offline'}`}>
      <div className="status-indicator">
        <span className="status-dot"></span>
        <span className="status-text">
          {isOnline ? 'Connection restored' : 'Connection lost'}
        </span>
      </div>
    </div>
  );
};

export default ConnectionStatus;
