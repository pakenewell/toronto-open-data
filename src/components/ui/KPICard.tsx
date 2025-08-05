import React from 'react';
import { clsx } from 'clsx';
import { LoadingState } from './LoadingState';
import type { KPICardProps } from '@/src/types/ui';

const KPICard: React.FC<KPICardProps> = ({
  title,
  value,
  isLoading = false,
  animationDelay = 0,
  className,
  icon,
  description,
  subValue,
  trend,
}) => {
  return (
    <div
      className={clsx(
        'municipal-card transition-all duration-300 hover:shadow-municipal-lg hover:border-primary/20 group',
        className,
        'kpi-card-animation'
      )}
      data-animation-delay={animationDelay}
    >
      <div className="space-y-3 min-h-0">
        <div className="flex items-start justify-between gap-2">
          <h3 
            className="text-municipal-lg font-medium text-muted-foreground flex items-center gap-2.5 truncate min-w-0 flex-1"
            title={typeof title === 'string' ? title : ''}
          >
            {icon && (
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary group-hover:bg-primary/15 transition-colors flex-shrink-0">
                {icon}
              </div>
            )}
            <span className="truncate">{title}</span>
          </h3>
        </div>
        <div className="text-municipal-xl font-bold text-foreground leading-none break-all">
          {isLoading ? (
            <LoadingState variant="dots" size="sm" text="" />
          ) : (
            <span className="inline-block max-w-full" title={typeof value === 'string' ? value : String(value)}>
              {value}
            </span>
          )}
        </div>
        {subValue && (
          <div className="text-municipal-sm text-muted-foreground font-medium truncate" title={typeof subValue === 'string' ? subValue : ''}>
            {subValue}
          </div>
        )}
        {description && (
          <div 
            className="text-municipal-xs text-muted-foreground leading-relaxed line-clamp-3"
            title={typeof description === 'string' ? description : ''}
          >
            {description}
          </div>
        )}
        {trend && (
          <div className="flex items-center gap-1 text-municipal-xs text-accent font-medium truncate">
            <span title={typeof trend.label === 'string' ? trend.label : ''}>{trend.label}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default KPICard;