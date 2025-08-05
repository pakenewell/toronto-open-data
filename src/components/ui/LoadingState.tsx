import React from 'react';
import { clsx } from 'clsx';
import type { LoadingStateProps } from '@/src/types/ui';

export const LoadingState: React.FC<LoadingStateProps> = ({
  variant = 'spinner',
  text = 'Loading...',
  size = 'md',
  className,
  intensity = 'subtle',
}) => {
  const sizeClasses = {
    sm: 'h-32',
    md: 'h-64',
    lg: 'h-96',
  };

  const intensityClasses = {
    subtle: 'opacity-50',
    vibrant: 'opacity-100',
  };

  const renderLoader = () => {
    switch (variant) {
      case 'dots':
        return (
          <div className="flex space-x-2">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className={clsx(
                  'w-3 h-3 rounded-full bg-primary animate-bounce',
                  intensityClasses[intensity]
                )}
                style={{ animationDelay: `${i * 0.1}s` }}
              />
            ))}
          </div>
        );
      
      case 'spinner':
      default:
        return (
          <div className={clsx('relative', size === 'sm' ? 'w-8 h-8' : size === 'md' ? 'w-12 h-12' : 'w-16 h-16')}>
            <div className={clsx(
              'absolute inset-0 rounded-full border-4 border-gray-200',
              intensityClasses[intensity]
            )} />
            <div className={clsx(
              'absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin',
              intensityClasses[intensity]
            )} />
          </div>
        );
    }
  };

  return (
    <div
      className={clsx(
        'flex flex-col items-center justify-center',
        sizeClasses[size],
        className
      )}
    >
      {renderLoader()}
      {text && (
        <p className="mt-4 text-sm text-muted-foreground">{text}</p>
      )}
    </div>
  );
};