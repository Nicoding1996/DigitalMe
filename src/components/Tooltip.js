/**
 * Tooltip Component
 * Black Mirror aesthetic - System diagnostic overlay
 */
import { useState } from 'react';

const Tooltip = ({ children, content }) => {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div className="relative inline-block">
      <div
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        className="cursor-help"
      >
        {children}
      </div>
      
      {isVisible && (
        <div className="absolute z-50 left-1/2 -translate-x-1/2 bottom-full mb-2 w-80 pointer-events-none">
          <div className="bg-void-deep border border-unsettling-cyan shadow-lg">
            {/* Terminal header */}
            <div className="px-3 py-1 bg-void-elevated border-b border-unsettling-cyan">
              <div className="font-mono text-xs text-unsettling-cyan">
                [DIAGNOSTIC_INFO]
              </div>
            </div>
            
            {/* Content */}
            <div className="p-3 font-mono text-xs text-static-white leading-relaxed">
              {content}
            </div>
          </div>
          
          {/* Arrow */}
          <div className="absolute left-1/2 -translate-x-1/2 top-full">
            <div className="border-4 border-transparent border-t-unsettling-cyan" />
          </div>
        </div>
      )}
    </div>
  );
};

export default Tooltip;
