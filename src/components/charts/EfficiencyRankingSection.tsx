import React, { useState } from 'react';
import { clsx } from 'clsx';
import { ChevronDown, ChevronUp, Trophy, Award, Medal } from 'lucide-react';
import EfficiencyScoreDisplay from '../ui/EfficiencyScoreDisplay';
import HelpTooltip from '../ui/HelpTooltip';
import { formatCurrency, formatNumber, formatPercentage } from '@/src/lib/utils/formatters';
import type { WardEfficiencyItem } from '@/src/types/api';

interface EfficiencyRankingSectionProps {
  efficiencyRanking: WardEfficiencyItem[];
  title?: string;
  showTopN?: number;
  isLoading?: boolean;
  className?: string;
}

const EfficiencyRankingSection: React.FC<EfficiencyRankingSectionProps> = ({
  efficiencyRanking,
  title = "Ward Efficiency Rankings",
  showTopN = 10,
  isLoading = false,
  className,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showAll, setShowAll] = useState(false);

  if (isLoading) {
    return (
      <div className={clsx("municipal-card animate-pulse", className)}>
        <div className="h-64 bg-muted rounded flex items-center justify-center">
          <div className="text-sm text-muted-foreground">Loading efficiency rankings...</div>
        </div>
      </div>
    );
  }

  if (!efficiencyRanking || efficiencyRanking.length === 0) {
    return (
      <div className={clsx("municipal-card", className)}>
        <div className="h-32 flex items-center justify-center text-muted-foreground">
          No efficiency data available
        </div>
      </div>
    );
  }

  const displayedRankings = showAll ? efficiencyRanking : efficiencyRanking.slice(0, showTopN);

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="h-5 w-5 text-yellow-500" />;
    if (rank === 2) return <Award className="h-5 w-5 text-gray-400" />;
    if (rank === 3) return <Medal className="h-5 w-5 text-amber-600" />;
    return <span className="text-muted-foreground font-medium">#{rank}</span>;
  };

  const averageScore = efficiencyRanking.reduce((sum, item) => sum + item.efficiencyScore, 0) / efficiencyRanking.length;

  return (
    <div className={clsx("municipal-card", className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h3 className="text-municipal-xl font-semibold text-foreground">
            {title}
          </h3>
          <HelpTooltip
            title="Ward Efficiency Rankings"
            content={
              <div className="space-y-2">
                <p>
                  Wards are ranked by their efficiency scores, which measure how effectively 
                  municipal services are delivered considering both cost and quality factors.
                </p>
                <p className="text-municipal-xs">
                  <strong>Current Analysis:</strong><br/>
                  • {efficiencyRanking.length} wards analyzed<br/>
                  • Average efficiency: {(averageScore * 100).toFixed(1)}/100<br/>
                  • Rankings updated based on latest service data
                </p>
              </div>
            }
            methodology={`
              Efficiency rankings are determined by calculating each ward's efficiency score 
              and sorting them from highest to lowest performance. The score considers:
              
              1. Service Success Rate (weighted 40%)
              2. Cost per Successful Service (weighted 35%)
              3. Service Volume Consistency (weighted 15%)
              4. Resource Utilization (weighted 10%)
              
              Higher scores indicate better municipal service efficiency.
            `}
          />
        </div>
        
        <div className="text-municipal-sm text-muted-foreground">
          Showing {displayedRankings.length} of {efficiencyRanking.length} wards
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 p-4 bg-accent/10 rounded-lg">
        <div className="text-center">
          <div className="text-municipal-lg font-bold text-success">
            {((efficiencyRanking[0]?.efficiencyScore || 0) * 100).toFixed(1)}
          </div>
          <div className="text-municipal-xs text-muted-foreground">Best Score</div>
        </div>
        <div className="text-center">
          <div className="text-municipal-lg font-bold text-foreground">
            {(averageScore * 100).toFixed(1)}
          </div>
          <div className="text-municipal-xs text-muted-foreground">Average Score</div>
        </div>
        <div className="text-center">
          <div className="text-municipal-lg font-bold text-primary">
            Ward {efficiencyRanking[0]?.ward || 'N/A'}
          </div>
          <div className="text-municipal-xs text-muted-foreground">Top Performer</div>
        </div>
        <div className="text-center">
          <div className="text-municipal-lg font-bold text-accent">
            {formatCurrency(efficiencyRanking[0]?.costPerPassingService || 0, { compact: true })}
          </div>
          <div className="text-municipal-xs text-muted-foreground">Best Cost/Success</div>
        </div>
      </div>

      {/* Rankings List */}
      <div className="space-y-3">
        {displayedRankings.map((item, index) => (
          <div
            key={item.ward}
            className={clsx(
              "flex items-center gap-4 p-4 rounded-lg border transition-all duration-200",
              "hover:border-primary/30 hover:bg-primary/5",
              item.rank <= 3 && "bg-gradient-to-r from-primary/5 to-accent/5 border-primary/20"
            )}
          >
            {/* Rank Icon */}
            <div className="flex items-center justify-center w-12">
              {getRankIcon(item.rank)}
            </div>

            {/* Ward Info */}
            <div className="min-w-[100px]">
              <div className="font-semibold text-foreground">Ward {item.ward}</div>
              <div className="text-municipal-xs text-muted-foreground">
                {formatNumber(item.totalServices)} services
              </div>
            </div>

            {/* Efficiency Score Display */}
            <div className="flex-1">
              <EfficiencyScoreDisplay
                score={item.efficiencyScore}
                totalServices={item.totalServices}
                totalCost={item.totalCost}
                passRate={item.passRate}
                costPerPassingService={item.costPerPassingService}
                rank={item.rank}
                ward={item.ward}
                showDetails={true}
              />
            </div>

            {/* Additional Metrics */}
            <div className="grid grid-cols-2 gap-4 text-municipal-xs min-w-[200px]">
              <div>
                <div className="text-muted-foreground">Pass Rate</div>
                <div className="font-medium">{formatPercentage(item.passRate)}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Cost/Success</div>
                <div className="font-medium">{formatCurrency(item.costPerPassingService, { compact: true })}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Show More/Less Button */}
      {efficiencyRanking.length > showTopN && (
        <div className="mt-6 text-center">
          <button
            onClick={() => setShowAll(!showAll)}
            className="btn-secondary flex items-center gap-2 mx-auto"
          >
            {showAll ? (
              <>
                <ChevronUp className="h-4 w-4" />
                Show Top {showTopN}
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4" />
                Show All {efficiencyRanking.length} Wards
              </>
            )}
          </button>
        </div>
      )}

      {/* Methodology Footer */}
      <div className="mt-6 p-4 bg-muted/30 rounded-md">
        <h4 className="text-municipal-sm font-medium text-foreground mb-2">
          Understanding Efficiency Scores
        </h4>
        <p className="text-municipal-xs text-muted-foreground leading-relaxed">
          These scores help identify which wards are delivering municipal services most effectively. 
          Higher scores indicate better balance between service quality (pass rates) and cost efficiency. 
          Use these rankings to identify best practices and areas for improvement across Toronto&apos;s wards.
        </p>
      </div>
    </div>
  );
};

export default EfficiencyRankingSection;