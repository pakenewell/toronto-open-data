import React, { useMemo } from 'react';
import useSWR from 'swr';
import KPICard from './ui/KPICard';
import { LoadingState } from './ui/LoadingState';
import ErrorMessage from './ui/ErrorMessage';
import ExportButton from './ui/ExportButton';
import { formatPercentage, formatNumber, formatCurrency } from '@/src/lib/utils/formatters';
import { fetcher } from '@/src/lib/utils/apiUtils';
import {
  DataCompletenessBarChart,
  ReadinessScoreDisplay
} from './charts';
import { Calendar, Database, CheckCircle, XCircle } from 'lucide-react';
import type { DashboardData, DashboardApiResponse } from '@/src/types/api';

interface DataReadinessTabProps {
  // No props needed - component fetches its own unfiltered data
}

export function DataReadinessTab({}: DataReadinessTabProps) {
  // Fetch unfiltered data specifically for readiness assessment
  const { data, error, isLoading } = useSWR<DashboardApiResponse>(
    '/api/data-readiness',
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000 // Cache for 1 minute
    }
  );
  
  const dashboardData = data?.data;
  // Get field completeness data from API response
  const fieldCompletenessData = dashboardData?.fieldCompleteness || null;

  // Calculate enhanced KPI metrics based on data quality
  const enhancedKPIs = useMemo(() => {
    if (!dashboardData) return null;
    
    const totalRecords = dashboardData.kpiData.totalServices;
    const completenessRate = dashboardData.dataQuality.completeness.score;
    // Complete records are those with required fields AND valid results AND cost data
    // Based on audit: ~78.4% have valid results, ~81.3% have costs
    const estimatedCompleteRecords = Math.round(totalRecords * 0.6); // ~60% have all critical data
    
    return {
      totalRecords,
      completeRecords: estimatedCompleteRecords,
      missingRecords: totalRecords - estimatedCompleteRecords,
      completenessRate
    };
  }, [dashboardData]);

  return (
    <>
      {/* Error State */}
      {error && (
        <ErrorMessage
          message="Failed to load data readiness metrics"
          details={error.message}
        />
      )}

      {/* Loading State */}
      {isLoading && !dashboardData && (
        <LoadingState text="Loading data readiness metrics..." />
      )}

      {dashboardData && (
        <>
          {/* Header with Export */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">Data Readiness Assessment</h2>
                <p className="text-muted-foreground">
                This assessment evaluates the completeness, accuracy, consistency, timeliness, and metadata quality of Toronto Division X service data. Metrics and scores highlight strengths and gaps to guide improvements for open data publishing.
                </p>
            </div>
            <ExportButton 
              data={dashboardData}
              filename="toronto-data-readiness-report"
              formats={['pdf', 'csv', 'json']}
              tabContext="data-readiness"
              className="ml-4"
            />
          </div>

          {/* Enhanced KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            <KPICard
              title="Total Records"
              value={formatNumber(dashboardData.kpiData.totalServices)}
              isLoading={isLoading}
              icon={<Database className="w-5 h-5" />}
              description=""
            />
            {enhancedKPIs && (
              <>

                <KPICard
                  title="Data Completeness"
                  value={`${enhancedKPIs.completenessRate.toFixed(1)}%`}
                  isLoading={isLoading}
                  icon={<CheckCircle className="w-5 h-5 text-amber-600" />}
                  description=""
                />
              </>
            )}
            <KPICard
              title="Date Range"
              value={dashboardData.kpiData.dateRange.timeSpan}
              isLoading={isLoading}
              icon={<Calendar className="w-5 h-5" />}
              description=""
              subValue={`${dashboardData.kpiData.dateRange.earliestService} to ${dashboardData.kpiData.dateRange.latestService}`}
            />
          </div>

          {/* Overall Readiness Score Display */}
            <div className="mb-8">
            <ReadinessScoreDisplay
              scores={
              dashboardData.readinessMetrics.consolidatedDimensions
              ? [
                {
                category: 'Data Accuracy',
                score: Number(dashboardData.readinessMetrics.consolidatedDimensions.accuracy.toFixed(2)),
                maxScore: 100,
                interpretation: dashboardData.readinessMetrics.consolidatedDimensions.accuracy >= 90 ? 'Excellent' : 
                    dashboardData.readinessMetrics.consolidatedDimensions.accuracy >= 80 ? 'Good' : 'Fair',
                description: [
                  'Ward numbers (1-25)',
                  'Date ranges (50yr past-1yr future)',
                  'Positive costs',
                  'Valid results (PASS/FAIL)',
                  'UNKNOWN results receive 0.5 penalty'
                ]
                },
                {
                category: 'Data Consistency',
                score: Number(dashboardData.readinessMetrics.consolidatedDimensions.consistency.toFixed(2)),
                maxScore: 100,
                interpretation: dashboardData.readinessMetrics.consolidatedDimensions.consistency >= 90 ? 'Excellent' : 
                    dashboardData.readinessMetrics.consolidatedDimensions.consistency >= 80 ? 'Good' : 'Fair',
                description: [
                  'Records with results have divisions',
                  'Costs have complete info',
                  'UNKNOWN results don\'t have high costs (>$100k)',
                  'Proper text formatting'
                ]
                },
                {
                category: 'Data Completeness',
                score: Number(dashboardData.readinessMetrics.consolidatedDimensions.completeness.toFixed(2)),
                maxScore: 100,
                interpretation: dashboardData.readinessMetrics.consolidatedDimensions.completeness >= 90 ? 'Excellent' : 
                    dashboardData.readinessMetrics.consolidatedDimensions.completeness >= 80 ? 'Good' : 'Fair',
                description: [
                  'Division',
                  'Start date',
                  'End date',
                  'Cost',
                  'Ward',
                  'Valid result (not UNKNOWN)'
                ]
                },
                {
                category: 'Data Timeliness',
                score: Number(dashboardData.readinessMetrics.consolidatedDimensions.timeliness.toFixed(2)),
                maxScore: 100,
                interpretation: dashboardData.readinessMetrics.consolidatedDimensions.timeliness >= 90 ? 'Excellent' : 
                    dashboardData.readinessMetrics.consolidatedDimensions.timeliness >= 80 ? 'Good' : 'Fair',
                description: [
                  'Recency: 100% if current, 0% if >365 days old',
                  'Coverage: Penalizes gaps between date ranges',
                  'Most recent data point determines recency score'
                ]
                },
                {
                category: 'Metadata Quality',
                score: Number(dashboardData.readinessMetrics.consolidatedDimensions.metadata.toFixed(2)),
                maxScore: 100,
                interpretation: dashboardData.readinessMetrics.consolidatedDimensions.metadata >= 90 ? 'Excellent' : 
                    dashboardData.readinessMetrics.consolidatedDimensions.metadata >= 80 ? 'Good' : 'Fair',
                description: [
                  'Field diversity (25%)',
                  'Value diversity in divisions/wards (25%)',
                  'Notes with content (25%)',
                  'Unique record combinations (25%)'
                ]
                }
              ]
              : null
              }
              overallScore={Number(dashboardData.readinessMetrics.overallReadinessScore.toFixed(2))}
              className=""
              showStars={true}
              showGauges={false}
            />
            </div>

          {/* Data Completeness by Field Chart */}
          <div className="card p-6 mb-8">
            <DataCompletenessBarChart
              fieldCompleteness={fieldCompletenessData}
              title="Data Completeness by Field"
              height={350}
            />
          </div>


        </>
      )}
    </>
  );
}