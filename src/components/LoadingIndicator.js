/**
 * LoadingIndicator Component
 * Black Mirror aesthetic - System Processing
 */
const LoadingIndicator = () => {
  return (
    <div className="flex flex-col items-center gap-4">
      {/* Processing dots */}
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 bg-unsettling-cyan rounded-full animate-pulse" />
        <span className="w-2 h-2 bg-unsettling-cyan rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
        <span className="w-2 h-2 bg-unsettling-cyan rounded-full animate-pulse" style={{ animationDelay: '0.4s' }} />
      </div>
      
      {/* Processing text */}
      <div className="font-mono text-xs text-static-muted animate-pulse-slow">
        [PROCESSING...]
      </div>
    </div>
  );
};

export default LoadingIndicator;
