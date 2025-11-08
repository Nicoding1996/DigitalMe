/**
 * WelcomeScreen Component
 * Black Mirror aesthetic - System Boot Sequence
 */
const WelcomeScreen = ({ onGetStarted }) => {
  return (
    <div className="relative flex items-center justify-center min-h-screen bg-mirror-black px-6 overflow-hidden">
      {/* Scanline effect overlay */}
      <div className="scanline" />
      
      {/* Main content */}
      <div className="relative z-10 w-full max-w-3xl fade-in">
        
        {/* Boot sequence header */}
        <div className="mb-12 font-mono text-xs text-static-ghost space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-system-active">●</span>
            <span>SYSTEM_BOOT_SEQUENCE_INITIATED</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-system-active">●</span>
            <span>LOADING_DIGITAL_TWIN_PROTOCOL</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-system-active">●</span>
            <span>MIRROR_INTERFACE_READY</span>
          </div>
        </div>

        {/* System name - Terminal style */}
        <div className="mb-16 border border-static-whisper bg-void-surface p-8">
          <div className="font-mono text-xs text-static-ghost mb-6">
            [SYSTEM_IDENTIFICATION]
          </div>
          <h1 className="text-5xl md:text-6xl font-display font-bold tracking-tighter mb-4">
            <span className="text-static-white">DIGITAL</span>
            <span className="text-unsettling-cyan">_</span>
            <span className="text-static-white">ME</span>
          </h1>
          <div className="font-mono text-sm text-static-muted">
            &gt; AI-POWERED DOPPELGÄNGER SYSTEM v1.0.0
          </div>
        </div>

        {/* System capabilities */}
        <div className="mb-12 space-y-0 border border-static-whisper bg-void-surface">
          <div className="px-6 py-3 bg-void-elevated border-b border-static-whisper font-mono text-xs text-static-ghost">
            [SYSTEM_CAPABILITIES]
          </div>
          
          <div className="divide-y divide-static-whisper">
            <div className="px-6 py-4 hover:bg-void-elevated transition-colors group">
              <div className="flex items-start gap-4">
                <span className="text-unsettling-cyan font-mono text-xs flex-shrink-0 pt-1">
                  [01]
                </span>
                <div className="flex-1">
                  <div className="font-mono text-sm text-static-white mb-1">
                    PATTERN_ANALYSIS
                  </div>
                  <div className="font-mono text-xs text-static-muted">
                    Analyze coding patterns and writing style from digital sources
                  </div>
                </div>
              </div>
            </div>
            
            <div className="px-6 py-4 hover:bg-void-elevated transition-colors group">
              <div className="flex items-start gap-4">
                <span className="text-unsettling-cyan font-mono text-xs flex-shrink-0 pt-1">
                  [02]
                </span>
                <div className="flex-1">
                  <div className="font-mono text-sm text-static-white mb-1">
                    CONTENT_GENERATION
                  </div>
                  <div className="font-mono text-xs text-static-muted">
                    Generate text and code in your unique voice and style
                  </div>
                </div>
              </div>
            </div>
            
            <div className="px-6 py-4 hover:bg-void-elevated transition-colors group">
              <div className="flex items-start gap-4">
                <span className="text-unsettling-cyan font-mono text-xs flex-shrink-0 pt-1">
                  [03]
                </span>
                <div className="flex-1">
                  <div className="font-mono text-sm text-static-white mb-1">
                    MIRROR_INTERFACE
                  </div>
                  <div className="font-mono text-xs text-static-muted">
                    Experience human-AI duality across the dimensional void
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Initialize button */}
        <div className="flex flex-col items-center gap-4">
          <button 
            onClick={onGetStarted}
            className="w-full max-w-md px-8 py-4 bg-void-surface border border-static-whisper text-static-white font-mono text-sm tracking-wider hover:border-unsettling-cyan hover:text-unsettling-cyan transition-all group"
          >
            <span className="flex items-center justify-center gap-3">
              <span>&gt;</span>
              <span>INITIALIZE_SYSTEM</span>
            </span>
          </button>
          
          <div className="font-mono text-xs text-static-ghost animate-pulse-slow">
            [PRESS_TO_BEGIN_INITIALIZATION_SEQUENCE]
          </div>
        </div>
      </div>

      {/* Vignette effect */}
      <div className="absolute inset-0 pointer-events-none bg-gradient-radial from-transparent via-transparent to-mirror-black opacity-60" />
    </div>
  );
};

export default WelcomeScreen;
