/**
 * GlitchEffect Component
 * Black Mirror aesthetic - Minimal glitch effect
 */
import { useEffect, useState } from 'react';

const GlitchEffect = ({ children, intensity = 'medium', trigger = false }) => {
  const [isGlitching, setIsGlitching] = useState(false);

  useEffect(() => {
    if (trigger) {
      setIsGlitching(true);
      const duration = intensity === 'low' ? 200 : intensity === 'high' ? 500 : 300;
      
      const timer = setTimeout(() => {
        setIsGlitching(false);
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [trigger, intensity]);

  return (
    <div className={isGlitching ? 'animate-glitch' : ''}>
      {children}
    </div>
  );
};

export default GlitchEffect;
