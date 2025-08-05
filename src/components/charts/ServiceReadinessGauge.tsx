import React, { useMemo } from 'react';

interface ServiceReadinessGaugeProps {
  value: number | null; // 0-100 percentage scale
  description?: string | null;
  size?: number;
  className?: string;
}

export function ServiceReadinessGauge({ 
  value, 
  description, 
  size = 160, 
  className = '' 
}: ServiceReadinessGaugeProps) {
  const minEffectiveSize = 150;
  
  // Calculate progress percentage (0-100 scale)
  const progressPercentage = useMemo(() => {
    if (value === null || value === undefined) return 0;
    const clampedValue = Math.max(0, Math.min(100, value));
    return clampedValue;
  }, [value]);

  // Calculate the stroke-dasharray for the progress arc
  const strokeWidth = size / 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = Math.PI * radius; // Half circle circumference
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (progressPercentage / 100) * circumference;

  // Generate unique gradient ID
  const uniqueId = useMemo(() => Math.random().toString(36).substr(2, 9), []);
  const gradientId = `service-readiness-gradient-${uniqueId}`;

  if (value === null || value === undefined) {
    return (
      <div className={`flex items-center justify-center ${className}`} style={{ width: size, height: size * 0.7 }}>
        <div className="text-sm text-muted-foreground">No Data</div>
      </div>
    );
  }

  const gaugeContent = (
    <div className={`flex flex-col items-center ${className}`} style={{ width: size, height: size * 0.8 }}>
      <div className="relative" style={{ width: size, height: size * 0.6 }}>
        <svg width={size} height={size * 0.6} className="transform">
          {/* Define Toronto-themed gradient */}
          <defs>
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#dc2626" /> {/* Red - Low readiness */}
              <stop offset="25%" stopColor="#ea580c" /> {/* Orange */}
              <stop offset="50%" stopColor="#ca8a04" /> {/* Yellow */}
              <stop offset="75%" stopColor="#16a34a" /> {/* Green */}
              <stop offset="100%" stopColor="#0f766e" /> {/* Toronto teal - High readiness */}
            </linearGradient>
          </defs>
          
          {/* Background arc (unfilled portion) */}
          <path
            d={`M ${strokeWidth / 2} ${size * 0.5} A ${radius} ${radius} 0 0 1 ${size - strokeWidth / 2} ${size * 0.5}`}
            fill="none"
            stroke="#e5e7eb"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            opacity="0.3"
          />
          
          {/* Progress arc (filled portion with gradient) */}
          <path
            d={`M ${strokeWidth / 2} ${size * 0.5} A ${radius} ${radius} 0 0 1 ${size - strokeWidth / 2} ${size * 0.5}`}
            fill="none"
            stroke={`url(#${gradientId})`}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            style={{
              transition: 'stroke-dashoffset 1.5s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          />
        </svg>
        
        {/* Value display */}
        <div className="absolute inset-0 flex items-end justify-center pb-2">
          <div className="text-center">
            <div
              className="font-bold text-foreground"
              style={{
                fontSize: `${Math.max(size, minEffectiveSize) * 0.15}px`,
                lineHeight: 1.1,
              }}
            >
              {value.toFixed(0)}%
            </div>
            <div
              className="text-muted-foreground mt-1"
              style={{
                fontSize: `${Math.max(size, minEffectiveSize) * 0.07}px`,
              }}
            >
              Service Readiness
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  if (description) {
    return (
      <div title={description}>
        {gaugeContent}
      </div>
    );
  }

  return gaugeContent;
}

export default ServiceReadinessGauge;