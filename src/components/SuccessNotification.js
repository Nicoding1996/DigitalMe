/**
 * SuccessNotification Component
 * Black Mirror aesthetic - Brief success confirmation
 * Requirement 4.3: Show brief success confirmation for profile saves
 */
import { useEffect, useState } from 'react';

const SuccessNotification = ({ message, duration = 2000, onClose }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      if (onClose) {
        setTimeout(onClose, 300); // Wait for fade out animation
      }
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  if (!isVisible) {
    return null;
  }

  return (
    <div 
      className={`fixed top-20 right-4 z-50 border border-system-active bg-void-elevated px-4 py-3 shadow-lg transition-opacity duration-300 ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
      style={{ maxWidth: '320px' }}
    >
      <div className="flex items-center gap-3">
        <div className="w-2 h-2 bg-system-active rounded-full animate-pulse" />
        <div className="font-mono text-xs text-static-white">
          {message}
        </div>
      </div>
    </div>
  );
};

export default SuccessNotification;
