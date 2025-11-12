/**
 * GlitchEffect Component
 * Black Mirror aesthetic - Random, brief digital corruption
 * Creates "did that just happen?" moments
 */
import { useEffect, useState } from 'react';
import './GlitchEffect.css';

const GlitchEffect = ({ children, intensity = 'medium', trigger = false, autoGlitch = true }) => {
  const [isGlitching, setIsGlitching] = useState(false);
  const [glitchType, setGlitchType] = useState(1);

  // Manual trigger
  useEffect(() => {
    if (trigger) {
      triggerGlitch();
    }
  }, [trigger]);

  // Auto glitch at random intervals
  useEffect(() => {
    if (!autoGlitch) return;

    const scheduleNextGlitch = () => {
      // Random interval between 3-15 seconds
      const delay = Math.random() * 12000 + 3000;
      
      return setTimeout(() => {
        triggerGlitch();
        scheduleNextGlitch();
      }, delay);
    };

    const timer = scheduleNextGlitch();
    return () => clearTimeout(timer);
  }, [autoGlitch, intensity]);

  const triggerGlitch = () => {
    // Random glitch type (1-3 for different effects)
    setGlitchType(Math.floor(Math.random() * 3) + 1);
    setIsGlitching(true);

    // Brief duration - 100-300ms
    const duration = Math.random() * 200 + 100;
    
    setTimeout(() => {
      setIsGlitching(false);
    }, duration);
  };

  const glitchClass = isGlitching 
    ? `glitch-container glitch-active glitch-type-${glitchType} glitch-${intensity}` 
    : 'glitch-container';

  return (
    <div className={glitchClass}>
      <div className="glitch-content">
        {children}
      </div>
      {isGlitching && (
        <>
          <div className="glitch-layer glitch-layer-1" aria-hidden="true">
            {children}
          </div>
          <div className="glitch-layer glitch-layer-2" aria-hidden="true">
            {children}
          </div>
        </>
      )}
    </div>
  );
};

export default GlitchEffect;
