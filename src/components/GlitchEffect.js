import { useEffect, useState } from 'react';
import './GlitchEffect.css';

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

  const intensityClass = `glitch-intensity-${intensity}`;
  const activeClass = isGlitching ? 'glitch-active' : '';

  return (
    <div className={`glitch-wrapper ${intensityClass} ${activeClass}`}>
      {children}
    </div>
  );
};

export default GlitchEffect;
