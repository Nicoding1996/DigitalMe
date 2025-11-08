/**
 * Header Component
 * Black Mirror aesthetic - System Control Panel
 */
import React from 'react';
import Navigation from './Navigation';

const Header = ({ onSettingsClick, onExportClick }) => {
  return (
    <header className="fixed top-0 left-0 right-0 h-[60px] bg-mirror-black border-b border-static-whisper z-30">
      <div className="flex items-center justify-between h-full px-6 max-w-full">
        {/* System identifier */}
        <div className="flex items-center gap-6">
          {/* Status indicator */}
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-system-active rounded-full animate-pulse" />
            <span className="font-mono text-xs text-static-ghost hidden sm:block">ONLINE</span>
          </div>
          
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
        
        {/* System time */}
        <div className="hidden lg:block font-mono text-xs text-static-ghost">
          {new Date().toLocaleTimeString('en-US', { hour12: false })}
        </div>
        
        {/* Navigation */}
        <Navigation 
          onSettingsClick={onSettingsClick}
          onExportClick={onExportClick}
        />
      </div>
    </header>
  );
};

export default Header;
