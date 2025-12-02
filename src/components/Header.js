/**
 * Header Component
 * Black Mirror aesthetic - System Control Panel
 */
import React, { useState, useEffect } from 'react';
import Navigation from './Navigation';

const Header = ({ onSourcesClick, onSettingsClick }) => {
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <header className="fixed top-0 left-0 right-0 h-[60px] bg-mirror-black border-b border-static-whisper z-30">
      <div className="flex items-center justify-between h-full px-6 max-w-full">
        {/* System identifier */}
        <div className="flex items-center gap-6">
          {/* System name */}
          <div className="flex items-center gap-3">
            <div className="font-mono text-sm font-bold text-unsettling-cyan tracking-wider">
              [DIGITAL_ME.SYS]
            </div>
            <div className="hidden md:block font-mono text-xs text-static-ghost">
              v1.0.0
            </div>
          </div>
        </div>
        
        {/* System time - centered to align with divider */}
        <div className="hidden md:block absolute left-1/2 -translate-x-1/2 font-mono text-xs text-static-ghost">
          {currentTime.toLocaleTimeString('en-US', { hour12: false })}
        </div>
        
        {/* Navigation */}
        <Navigation 
          onSourcesClick={onSourcesClick}
          onSettingsClick={onSettingsClick}
        />
      </div>
    </header>
  );
};

export default Header;
