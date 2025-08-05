import React from 'react';
import { clsx } from 'clsx';
import type { ButtonProps } from '@/src/types/ui';

const Button: React.FC<ButtonProps> = ({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  className,
  disabled = false,
}) => {
  const baseClasses = 'font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variantClasses = {
    primary: 'bg-primary text-primary-foreground hover:bg-primary/90',
    secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
    ghost: 'hover:bg-accent hover:text-accent-foreground',
  };
  
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2',
    lg: 'px-6 py-3 text-lg',
  };
  
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={clsx(
        baseClasses,
        variantClasses[variant],
        sizeClasses[size],
        'rounded-md',
        className
      )}
    >
      {children}
    </button>
  );
};

export default Button;