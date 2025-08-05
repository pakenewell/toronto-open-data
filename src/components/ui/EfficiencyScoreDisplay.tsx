import React from 'react';
import { clsx } from 'clsx';
import HelpTooltip from './HelpTooltip';
import { formatCurrency, formatPercentage } from '@/src/lib/utils/formatters';

interface EfficiencyScoreDisplayProps {
  score: number;
  totalServices?: number;
  totalCost?: number;
  passRate?: number;
  costPerPassingService?: number;
  rank?: number;
  ward?: number;
  showDetails?: boolean;
  className?: string;
}

const EfficiencyScoreDisplay: React.FC<EfficiencyScoreDisplayProps> = ({
  score,
  totalServices,
  totalCost,
  passRate,
  costPerPassingService,
  rank,
  ward,
  showDetails = true,
  className,
}) => {
  // Scale the efficiency score to 0-100 range
  // Assuming original scores are between 0-1 or similar, scale appropriately
  const scaledScore = Math.min(100, Math.max(0, score * 100));
  
  // Determine color based on efficiency score
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-success';
    if (score >= 60) return 'text-warning';
    if (score >= 40) return 'text-destructive';
    return 'text-muted-foreground';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return 'bg-success/10 border-success/20';
    if (score >= 60) return 'bg-warning/10 border-warning/20';
    if (score >= 40) return 'bg-destructive/10 border-destructive/20';
    return 'bg-muted/10 border-muted/20';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    return 'Needs Improvement';
  };

  const methodologyContent = `
    Efficiency Score is calculated using a weighted formula that considers:
    • Service Success Rate (40%): Higher pass rates indicate better service delivery
    • Cost Effectiveness (35%): Lower cost per successful service shows efficiency  
    • Service Volume (15%): Consistent service delivery across time periods
    • Resource Utilization (10%): Optimal use of municipal resources
    
    The score is normalized to a 0-100 scale where:
    • 80-100: Excellent efficiency, best practices
    • 60-79: Good performance with room for optimization
    • 40-59: Fair performance, needs focused improvements
    • 0-39: Poor efficiency, requires immediate attention
  `;

  return (
    <div className={clsx('flex items-center gap-3', className)}>
      {/* Score Display */}
      <div className={clsx(
        'flex items-center justify-center rounded-lg border px-3 py-2 min-w-[80px]',
        getScoreBgColor(scaledScore)
      )}>
        <div className="text-center">
          <div className={clsx('text-lg font-bold', getScoreColor(scaledScore))}>
            {scaledScore.toFixed(0)}
          </div>
          <div className="text-municipal-xs text-muted-foreground">
            /100
          </div>
        </div>
      </div>

      {/* Score Label and Help */}
      <div className="flex items-center gap-2">
        <div>
          <div className={clsx('font-medium text-municipal-sm', getScoreColor(scaledScore))}>
            {getScoreLabel(scaledScore)}
          </div>
          {rank && (
            <div className="text-municipal-xs text-muted-foreground">
              Rank #{rank}
            </div>
          )}
        </div>
        
        <HelpTooltip
          title={`Efficiency Score${ward ? ` for Ward ${ward}` : ''}`}
          content={
            <div className="space-y-2">
              <p>
                This efficiency score measures how well municipal services are delivered 
                considering both cost and quality factors.
              </p>
              {showDetails && totalServices && (
                <div className="text-municipal-xs space-y-1">
                  <div><strong>Services:</strong> {totalServices.toLocaleString()}</div>
                  {totalCost && <div><strong>Total Cost:</strong> {formatCurrency(totalCost)}</div>}
                  {passRate !== undefined && <div><strong>Pass Rate:</strong> {formatPercentage(passRate)}</div>}
                  {costPerPassingService && (
                    <div><strong>Cost per Success:</strong> {formatCurrency(costPerPassingService)}</div>
                  )}
                </div>
              )}
            </div>
          }
          methodology={methodologyContent}
          size="md"
        />
      </div>

      {/* Progress Bar */}
      <div className="flex-1 max-w-[120px]">
        <div className="w-full bg-muted/30 rounded-full h-2">
          <div
            className={clsx(
              'h-2 rounded-full transition-all duration-500',
              scaledScore >= 80 ? 'bg-success' :
              scaledScore >= 60 ? 'bg-warning' :
              scaledScore >= 40 ? 'bg-destructive' : 'bg-muted',
              `efficiency-score-bar-width-${Math.round(scaledScore)}`
            )}
          />
        </div>
      </div>
    </div>
  );
};

export default EfficiencyScoreDisplay;