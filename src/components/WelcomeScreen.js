/**
 * WelcomeScreen Component
 * Black Mirror aesthetic - Haunting, minimal, unsettling
 */
const WelcomeScreen = ({ onGetStarted }) => {
  return (
    <div className="relative flex items-center justify-center min-h-screen bg-void-deep px-6 overflow-hidden">
      {/* Scanline effect overlay */}
      <div className="scanline" />
      
      {/* Main content */}
      <div className="relative z-10 w-full max-w-2xl text-center fade-in">
        
        {/* System status indicator */}
        <div className="system-text mb-8 text-system-idle flicker">
          [SYSTEM ONLINE]
        </div>

        {/* Title - Minimal and haunting */}
        <div className="mb-16">
          <h1 className="text-6xl md:text-7xl font-display font-bold tracking-tighter mb-3">
            <span className="text-static-white">Digital</span>
            <span className="text-static-dim">Me</span>
          </h1>
          <div className="font-mono text-2xl text-static-muted tracking-[0.3em]">
            .dev
          </div>
        </div>

        {/* Description - Clinical and precise */}
        <div className="mb-16 space-y-6">
          <p className="text-xl text-static-white font-light leading-relaxed">
            Your AI-powered digital doppelgänger.
          </p>
          <p className="text-sm text-static-dim leading-loose max-w-xl mx-auto">
            Connect your digital footprint. Watch as your AI twin learns to mirror 
            your voice, your patterns, your essence.
          </p>
        </div>

        {/* Features - Minimal list */}
        <div className="mb-16 max-w-md mx-auto space-y-3">
          <div className="flex items-start gap-4 p-4 glass-panel transition-all duration-300 hover:bg-overlay-medium group">
            <span className="text-unsettling-blue font-mono text-sm flex-shrink-0 group-hover:text-glow-blue">
              01
            </span>
            <span className="text-static-dim text-sm text-left leading-relaxed">
              Analyze coding patterns and writing style
            </span>
          </div>
          
          <div className="flex items-start gap-4 p-4 glass-panel transition-all duration-300 hover:bg-overlay-medium group">
            <span className="text-unsettling-blue font-mono text-sm flex-shrink-0 group-hover:text-glow-blue">
              02
            </span>
            <span className="text-static-dim text-sm text-left leading-relaxed">
              Generate text and code in your unique voice
            </span>
          </div>
          
          <div className="flex items-start gap-4 p-4 glass-panel transition-all duration-300 hover:bg-overlay-medium group">
            <span className="text-unsettling-blue font-mono text-sm flex-shrink-0 group-hover:text-glow-blue">
              03
            </span>
            <span className="text-static-dim text-sm text-left leading-relaxed">
              Experience the mirror interface of human-AI duality
            </span>
          </div>
        </div>

        {/* CTA - Minimal and flat */}
        <button 
          onClick={onGetStarted}
          className="btn-primary text-base tracking-wide mb-16 group relative overflow-hidden"
        >
          <span className="relative z-10">INITIALIZE</span>
          <div className="absolute inset-0 bg-unsettling-blue opacity-0 group-hover:opacity-10 transition-opacity duration-300" />
        </button>

        {/* System message - Pulsing status */}
        <div className="system-text text-static-ghost animate-pulse-slow">
          READY TO INITIALIZE DIGITAL TWIN PROTOCOL
        </div>
      </div>

      {/* Subtle vignette effect */}
      <div className="absolute inset-0 pointer-events-none bg-gradient-radial from-transparent via-transparent to-mirror-black opacity-60" />
    </div>
  );
};

export default WelcomeScreen;
