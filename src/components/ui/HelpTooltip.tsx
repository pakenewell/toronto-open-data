import React, { useState } from 'react';
import { HelpCircle, X } from 'lucide-react';
import { clsx } from 'clsx';

interface HelpTooltipProps {
  title: string;
  content: string | React.ReactNode;
  methodology?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  position?: 'top' | 'bottom' | 'left' | 'right';
}

const HelpTooltip: React.FC<HelpTooltipProps> = ({
  title,
  content,
  methodology,
  className,
  size = 'md',
  position = 'top',
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5', 
    lg: 'h-6 w-6',
  };

  const positionClasses = {
    top: 'bottom-full left-1/2 transform -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 transform -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 transform -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 transform -translate-y-1/2 ml-2',
  };

  const arrowClasses = {
    top: 'top-full left-1/2 transform -translate-x-1/2 border-l-transparent border-r-transparent border-b-transparent',
    bottom: 'bottom-full left-1/2 transform -translate-x-1/2 border-l-transparent border-r-transparent border-t-transparent',
    left: 'left-full top-1/2 transform -translate-y-1/2 border-t-transparent border-b-transparent border-r-transparent',
    right: 'right-full top-1/2 transform -translate-y-1/2 border-t-transparent border-b-transparent border-l-transparent',
  };

  return (
    <div className={clsx('relative inline-block', className)}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
        className={clsx(
          'text-muted-foreground hover:text-primary transition-colors duration-200',
          'focus:outline-none focus:ring-2 focus:ring-primary/20 rounded-full',
          sizeClasses[size]
        )}
        aria-label={`Help information for ${title}`}
      >
        <HelpCircle className="w-full h-full" />
      </button>
      
      {isOpen && (
        <>
          {/* Backdrop for mobile */}
          <div 
            className="fixed inset-0 z-40 md:hidden"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Tooltip content */}
          <div
            className={clsx(
              'absolute z-50 w-80 max-w-sm',
              'bg-card border border-border rounded-lg shadow-municipal-lg',
              'p-4 text-sm',
              positionClasses[position],
              // Mobile positioning override
              'md:relative md:inset-auto',
              'max-md:fixed max-md:top-1/2 max-md:left-1/2 max-md:transform max-md:-translate-x-1/2 max-md:-translate-y-1/2'
            )}
          >
            {/* Close button for mobile */}
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-2 right-2 md:hidden text-muted-foreground hover:text-foreground"
              aria-label="Close help"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Arrow */}
            <div
              className={clsx(
                'absolute w-0 h-0 border-4 hidden md:block',
                'border-card',
                arrowClasses[position]
              )}
            />
            
            {/* Content */}
            <div className="space-y-3">
              <h4 className="font-semibold text-foreground text-municipal-sm">
                {title}
              </h4>
              
              <div className="text-muted-foreground leading-relaxed text-municipal-xs">
                {content}
              </div>
              
              {methodology && (
                <div className="pt-2 border-t border-border">
                  <h5 className="font-medium text-foreground text-municipal-xs mb-1">
                    Calculation Method:
                  </h5>
                  <div className="text-muted-foreground text-municipal-xs leading-relaxed">
                    {methodology}
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default HelpTooltip;