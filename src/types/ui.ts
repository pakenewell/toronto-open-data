import { ReactNode } from 'react';

export interface TrendsLayoutProps {
  children: ReactNode;
}

export interface ButtonProps {
  children: ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  disabled?: boolean;
}

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: ReactNode;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export interface KPICardProps {
  title: ReactNode;
  value: ReactNode;
  isLoading?: boolean;
  animationDelay?: number;
  className?: string;
  icon?: ReactNode;
  description?: string;
  subValue?: string;
  trend?: {
    value: number;
    label: string;
  };
}

export interface LoadingStateProps {
  variant?: 'spinner' | 'dots' | 'chart-line' | 'chart-pie' | 'sparkle';
  text?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  intensity?: 'subtle' | 'vibrant';
}

export interface ErrorMessageProps {
  message: string;
  details?: string;
  code?: number;
  className?: string;
}

export interface TooltipProps {
  children: ReactNode;
  tooltipContent: ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  variant?: 'default' | 'source';
  sourceData?: {
    tooltip: string;
    description?: string;
    source?: string;
    link?: string;
  };
}

export interface ListContainerProps {
  title: ReactNode;
  isLoading?: boolean;
  items?: any[];
  renderItem: (item: any) => ReactNode;
  emptyMessage?: string;
}

export interface ChartContainerProps {
  title: ReactNode;
  isLoading?: boolean;
  children: ReactNode;
  className?: string;
}