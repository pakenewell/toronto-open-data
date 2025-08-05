import React from 'react';
import { Star, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface ReadinessScore {
  category: string;
  score: number;
  maxScore: number;
  interpretation: string;
  description: string | string[];
  trend?: 'up' | 'down' | 'stable';
  trendValue?: number;
}

interface ReadinessScoreDisplayProps {
  scores: ReadinessScore[] | null;
  overallScore?: number;
  overallInterpretation?: string;
  className?: string;
  showStars?: boolean;
  showGauges?: boolean;
}

export function ReadinessScoreDisplay({
  scores,
  overallScore,
  overallInterpretation,
  className = '',
  showStars = true,
  showGauges = false
}: ReadinessScoreDisplayProps) {

  const defaultScores: ReadinessScore[] = [
    {
      category: 'Data Accuracy',
      score: 85,
      maxScore: 100,
      interpretation: 'Good - Most data values are correct with valid ward numbers and dates',
      description: 'How correct the data values are, checking wards, dates, costs, and result values',
      trend: 'up',
      trendValue: 3.2
    },
    {
      category: 'Data Consistency',
      score: 88,
      maxScore: 100,
      interpretation: 'Good - Data follows business rules and patterns consistently',
      description: 'How well data follows business rules and maintains format consistency',
      trend: 'up',
      trendValue: 2.5
    },
    {
      category: 'Data Completeness',
      score: 60,
      maxScore: 100,
      interpretation: 'Poor - Many records missing one or more required fields',
      description: 'Percentage of records with ALL required fields: division, start date, end date, cost, ward, and valid result (not UNKNOWN).',
      trend: 'stable',
      trendValue: 0.1
    },
    {
      category: 'Data Timeliness',
      score: 45,
      maxScore: 100,
      interpretation: 'Poor - Data is outdated and needs refreshing',
      description: 'Data recency (60% weight) and coverage continuity (40% weight)',
      trend: 'down',
      trendValue: -1.5
    },
    {
      category: 'Metadata Quality',
      score: 75,
      maxScore: 100,
      interpretation: 'Fair - Adequate documentation but could be improved',
      description: 'Field diversity, value diversity, notes quality, and record uniqueness',
      trend: 'up',
      trendValue: 2.1
    }
  ];

  const displayScores = scores || defaultScores;
  const calculatedOverallScore = overallScore || (displayScores.reduce((sum, score) => sum + score.score, 0) / displayScores.length);

  const getStarRating = (score: number, maxScore: number = 100): number => {
    const percentage = (score / maxScore) * 100;
    return Math.round((percentage / 100) * 5);
  };

  const getScoreColor = (score: number, maxScore: number = 100): string => {
    const percentage = (score / maxScore) * 100;
    if (percentage >= 90) return 'text-green-600';
    if (percentage >= 80) return 'text-blue-600';
    if (percentage >= 70) return 'text-yellow-600';
    if (percentage >= 60) return 'text-orange-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (score: number, maxScore: number = 100): string => {
    const percentage = (score / maxScore) * 100;
    if (percentage >= 90) return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800';
    if (percentage >= 80) return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800';
    if (percentage >= 70) return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800';
    if (percentage >= 60) return 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800';
    return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
  };

  const getOverallInterpretation = (score: number): string => {
    if (score >= 90) return 'Excellent - Ready for immediate open data publishing';
    if (score >= 80) return 'Good - Minor improvements needed before publishing';
    if (score >= 70) return 'Fair - Moderate work required to meet publishing standards';
    if (score >= 60) return 'Poor - Significant improvements needed before publishing';
    return 'Critical - Major data quality issues must be resolved';
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-5 h-5 ${
              star <= rating 
                ? 'text-yellow-400 fill-yellow-400' 
                : 'text-gray-300 dark:text-gray-600'
            }`}
          />
        ))}
        <span className="text-md text-muted-foreground ml-1">
          ({rating}/5)
        </span>
      </div>
    );
  };

  const renderGauge = (score: number, maxScore: number = 100) => {
    const percentage = (score / maxScore) * 100;
    const radius = 40;
    const strokeWidth = 8;
    const normalizedRadius = radius - strokeWidth * 2;
    const circumference = normalizedRadius * 2 * Math.PI;
    const strokeDasharray = `${circumference} ${circumference}`;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    return (
      <div className="relative w-20 h-20">
        <svg
          height={radius * 2}
          width={radius * 2}
          className="transform -rotate-90"
        >
          <circle
            stroke="currentColor"
            fill="transparent"
            strokeWidth={strokeWidth}
            r={normalizedRadius}
            cx={radius}
            cy={radius}
            className="text-gray-200 dark:text-gray-700"
          />
          <circle
            stroke="currentColor"
            fill="transparent"
            strokeWidth={strokeWidth}
            strokeDasharray={strokeDasharray}
            style={{ strokeDashoffset }}
            strokeLinecap="round"
            r={normalizedRadius}
            cx={radius}
            cy={radius}
            className={getScoreColor(score, maxScore)}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm font-semibold">
            {Math.round(percentage)}%
          </span>
        </div>
      </div>
    );
  };

  const renderTrendIcon = (trend?: string, value?: number) => {
    if (!trend || !value) return null;
    
    const absValue = Math.abs(value);
    const color = trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : 'text-gray-500';
    
    return (
      <div className={`flex items-center gap-1 text-xs ${color}`}>
        {trend === 'up' && <TrendingUp className="w-3 h-3" />}
        {trend === 'down' && <TrendingDown className="w-3 h-3" />}
        {trend === 'stable' && <Minus className="w-3 h-3" />}
        <span>{absValue.toFixed(1)}%</span>
      </div>
    );
  };

  // Move useState hook to the top level of the component
  const [descOpen, setDescOpen] = React.useState<{ [key: number]: boolean }>({});

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Overall Score */}
      <div className={`p-6 rounded-lg border ${getScoreBgColor(calculatedOverallScore)}`}>
        <div className="text-center">
          <div className="mb-4">
            <div className={`text-5xl font-bold ${getScoreColor(calculatedOverallScore)}`}>
              {calculatedOverallScore.toFixed(0)}/100
            </div>
            <div className="text-2xl font-medium text-muted-foreground mt-1">
              Overall Readiness
            </div>
          </div>

          <div className="text-md text-muted-foreground">
            Based on {displayScores.length} key readiness dimensions
          </div>
        </div>
      </div>

      {/* Individual Scores */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {displayScores.map((scoreData, index) => {
          const percentage = (scoreData.score / scoreData.maxScore) * 100;
          const showDesc = !!descOpen[index];

          return (
            <div
              key={index}
              className={`p-4 rounded-xl border ${getScoreBgColor(scoreData.score, scoreData.maxScore)}`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h4 className="font-medium text-xl mb-1">{scoreData.category}</h4>
                  <button
                    type="button"
                    className="flex items-center text-sm text-muted-foreground hover:underline focus:outline-none"
                    onClick={() =>
                      setDescOpen((prev) => ({
                        ...prev,
                        [index]: !prev[index],
                      }))
                    }
                  >
                    <span>Description</span>
                    <svg
                      className={`ml-1 w-4 h-4 transition-transform ${showDesc ? 'rotate-90' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                      viewBox="0 0 24 24"
                    >
                      <path d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                  {showDesc && (
                    <div className="mt-2 text-sm text-muted-foreground">
                      {Array.isArray(scoreData.description) ? (
                        <ul className="list-disc list-inside space-y-1">
                          {scoreData.description.map((item, i) => (
                            <li key={i}>{item}</li>
                          ))}
                        </ul>
                      ) : (
                        scoreData.description
                      )}
                    </div>
                  )}
                </div>
                {showGauges ? (
                  <div className="ml-3">
                    {renderGauge(scoreData.score, scoreData.maxScore)}
                  </div>
                ) : (
                  <div className="text-right ml-3">
                    <div className={`text-2xl font-bold ${getScoreColor(scoreData.score, scoreData.maxScore)}`}>
                      {percentage.toFixed(0)}%
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {scoreData.score}/{scoreData.maxScore}
                    </div>
                  </div>
                )}
              </div>

              {showStars && (
                <div className="mb-3">
                  {renderStars(getStarRating(scoreData.score, scoreData.maxScore))}
                </div>
              )}

              <div className="space-y-2">
                <div className={`text-lg font-medium ${getScoreColor(scoreData.score, scoreData.maxScore)}`}>
                  {scoreData.interpretation}
                </div>
                
                {scoreData.trend && (
                  <div className="flex justify-between items-center">
                    <span className="text-md text-muted-foreground">Recent trend:</span>
                    {renderTrendIcon(scoreData.trend, scoreData.trendValue)}
                  </div>
                )}
              </div>

              {/* Progress bar */}
              <div className="mt-3">
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-300 ${
                      percentage >= 90 ? 'bg-green-500' :
                      percentage >= 80 ? 'bg-blue-500' :
                      percentage >= 70 ? 'bg-yellow-500' :
                      percentage >= 60 ? 'bg-orange-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Readiness Scale Guide */}
      <div className="bg-muted p-4 rounded-lg">
        <h4 className="font-medium mb-3">Readiness Scale Guide</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded"></div>
            <div>
              <div className="font-medium text-green-700 dark:text-green-300">90-100%</div>
              <div className="text-xs text-muted-foreground">Excellent</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded"></div>
            <div>
              <div className="font-medium text-blue-700 dark:text-blue-300">80-89%</div>
              <div className="text-xs text-muted-foreground">Good</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-yellow-500 rounded"></div>
            <div>
              <div className="font-medium text-yellow-700 dark:text-yellow-300">70-79%</div>
              <div className="text-xs text-muted-foreground">Fair</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-orange-500 rounded"></div>
            <div>
              <div className="font-medium text-orange-700 dark:text-orange-300">60-69%</div>
              <div className="text-xs text-muted-foreground">Poor</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded"></div>
            <div>
              <div className="font-medium text-red-700 dark:text-red-300">&lt;60%</div>
              <div className="text-xs text-muted-foreground">Critical</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ReadinessScoreDisplay;