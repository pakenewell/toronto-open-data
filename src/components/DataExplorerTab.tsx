import React, { useState, useEffect } from 'react';
import Button from './ui/Button';
import ErrorMessage from './ui/ErrorMessage';
import KPICard from './ui/KPICard';
import { LoadingState } from './ui/LoadingState';
import ExportButton from './ui/ExportButton';
import HelpTooltip from './ui/HelpTooltip';
import ServiceResultsDonutChart from './charts/ServiceResultsDonutChart';
import CostDistributionHistogram from './charts/CostDistributionHistogram';
import HighestExpensesList from './charts/HighestExpensesList';
import CostVolumeByDivisionTable from './charts/CostVolumeByDivisionTable';
import CostVolumeByWardTable from './charts/CostVolumeByWardTable';
import CostVolumeCorrelationChart from './charts/CostVolumeCorrelationChart';
import { formatCurrency, formatNumber, formatPercentage } from '@/src/lib/utils/formatters';
import type { DashboardData } from '@/src/types/api';
import type { ServiceFilters } from '@/src/types/toronto';

interface DataExplorerTabProps {
  filters: ServiceFilters;
  updateFilter: (key: keyof ServiceFilters, value: string) => void;
  resetFilters: () => void;
  dashboardData: DashboardData | undefined;
  isLoading: boolean;
  error: Error | null;
}

export function DataExplorerTab({
  filters,
  updateFilter,
  resetFilters,
  dashboardData,
  isLoading,
  error
}: DataExplorerTabProps) {
  // State to store all available divisions for the dropdown
  const [allAvailableDivisions, setAllAvailableDivisions] = useState<string[]>([]);

  // Update available divisions when data changes, but only add new ones
  useEffect(() => {
    if (dashboardData?.servicesByDivision) {
      const currentDivisions = dashboardData.servicesByDivision.map(d => d.division).filter(Boolean);
      setAllAvailableDivisions(prev => {
        const combined = Array.from(new Set([...prev, ...currentDivisions]));
        return combined.sort();
      });
    }
  }, [dashboardData?.servicesByDivision]);


  // Transform servicesByResult for donut chart
  const transformServiceResultsForDonut = () => {
    if (!dashboardData?.servicesByResult) return [];
    
    return dashboardData.servicesByResult.map(result => ({
      name: result.result,
      value: result.count
    }));
  };

  // Transform servicesOverTime for cost analysis
  const transformCostOverTime = () => {
    if (!dashboardData?.servicesOverTime) return [];
    
    return dashboardData.servicesOverTime.map(item => ({
      period: item.period,
      totalCost: item.total_cost,
      totalServices: item.total_services,
      avgCost: item.avg_cost,
    }));
  };


  return (
    <>
      {/* Enhanced Filters */}
      <div className="flex flex-wrap gap-4 p-4 bg-card rounded-lg border">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-sm font-medium mb-1">Start Date</label>
          <input
            type="date"
            value={filters.startDate}
            onChange={(e) => updateFilter('startDate', e.target.value)}
            className="w-full px-3 py-2 border rounded-md"
            title="Select start date"
            placeholder="Select start date"
          />
        </div>
        <div className="flex-1 min-w-[200px]">
          <label className="block text-sm font-medium mb-1">End Date</label>
          <input
            type="date"
            value={filters.endDate}
            onChange={(e) => updateFilter('endDate', e.target.value)}
            className="w-full px-3 py-2 border rounded-md"
            title="Select end date"
            placeholder="Select end date"
          />
        </div>
        <div className="flex-1 min-w-[200px]">
          <label className="block text-sm font-medium mb-1">Service Division</label>
          <select
            value={filters.serviceDivisionOwner}
            onChange={(e) => updateFilter('serviceDivisionOwner', e.target.value)}
            className="w-full px-3 py-2 border rounded-md"
            title="Select service division"
          >
            <option value="all">All Divisions</option>
            {allAvailableDivisions.map((division) => (
              <option key={division} value={division}>
                {division}
              </option>
            ))}
          </select>
        </div>
        <div className="flex-1 min-w-[200px]">
          <label className="block text-sm font-medium mb-1">Service Result</label>
          <select
            value={filters.serviceResult}
            onChange={(e) => updateFilter('serviceResult', e.target.value)}
            className="w-full px-3 py-2 border rounded-md"
            title="Select service result"
          >
            <option value="all">All Results</option>
            <option value="PASS">Pass</option>
            <option value="FAIL">Fail</option>
            <option value="UNKNOWN">Unknown</option>
          </select>
        </div>
        <div className="flex items-end gap-2">
          <Button onClick={resetFilters} variant="ghost" size="sm">
            Reset
          </Button>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <ErrorMessage
          message="Failed to load dashboard data"
          details={error.message}
        />
      )}

      {/* Loading State */}
      {isLoading && !dashboardData && (
        <LoadingState text="Loading dashboard data..." />
      )}

      {/* Header with Export */}
      {dashboardData && (
        <div className="space-y-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">Data Explorer</h2>
              <p className="text-muted-foreground">
                Comprehensive analysis of Toronto Division X service performance
              </p>
            </div>
            <ExportButton 
              data={dashboardData}
              filters={filters}
              filename="toronto-data-explorer-report"
              formats={['pdf', 'csv', 'json']}
              tabContext="data-explorer"
              className="ml-4"
            />
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <KPICard
              title="Total Services"
              value={formatNumber(dashboardData.kpiData.totalServices)}
              isLoading={isLoading}
              description=""
              subValue={`${dashboardData.kpiData.uniqueDivisions} divisions • ${dashboardData.kpiData.uniqueWards} wards`}
            />
            <KPICard
              title="Total Cost"
              value={formatCurrency(dashboardData.kpiData.totalCost)}
              isLoading={isLoading}
              description=""
              subValue=""
            />
            <KPICard
              title="Average Cost"
              value={formatCurrency(dashboardData.kpiData.avgCost)}
              isLoading={isLoading}
              description=""
              subValue=""
            />
            <KPICard
              title="Pass Rate"
              value={formatPercentage(dashboardData.kpiData.passRate)}
              isLoading={isLoading}
              description=""
              subValue={`${formatPercentage(dashboardData.kpiData.failRate)} fail rate`}
            />
          </div>

          {/* Primary Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card p-6">
              <div className="flex items-center gap-2 mb-4">
                <h2 className="text-xl font-semibold">Service Results Distribution</h2>
                <HelpTooltip
                  title="Service Results Breakdown"
                  content={
                    <div className="space-y-2">
                      <p>
                        Visualize the proportion of services by their final status: Pass, Fail, or Unknown.
                      </p>
                      <p className="text-municipal-xs">
                        <strong>Pass:</strong> Service completed successfully<br/>
                        <strong>Fail:</strong> Service did not meet requirements<br/>
                        <strong>Unknown:</strong> Status could not be determined
                      </p>
                    </div>
                  }
                  methodology="Service results are categorized based on final status codes. Percentages show the distribution of outcomes across all services in the selected time period."
                />
              </div>
              <ServiceResultsDonutChart
                data={transformServiceResultsForDonut()}
                isLoading={isLoading}
                height="300px"
                formatValueFn={formatNumber}
                centerText={{
                  title: formatNumber(dashboardData?.kpiData.totalServices || 0),
                  subtitle: ''
                }}
              />
            </div>

            {/* Cost Distribution Histogram */}
            <div className="card p-6">
              <h2 className="text-xl font-semibold mb-4">Cost Distribution</h2>
              <CostDistributionHistogram
                data={dashboardData?.costDistribution || []}
                isLoading={isLoading}
                height="350px"
              />
            </div>
          </div>

          {/* Cost-Volume Correlation Analysis */}
          <CostVolumeCorrelationChart
            data={transformCostOverTime()}
            isLoading={isLoading}
            title="Cost vs Volume Analysis"
            showTrendline={true}
          />

          {/* Enhanced Division and Ward Analysis */}
          <div className="grid grid-cols-1 gap-6">
            <CostVolumeByDivisionTable
              data={dashboardData?.servicesByDivision || []}
              isLoading={isLoading}
              maxHeight="500px"
            />

            {dashboardData?.wardAnalysis && (
              <CostVolumeByWardTable
                wardAnalysis={dashboardData.wardAnalysis}
                isLoading={isLoading}
                maxHeight="500px"
              />
            )}

          </div>


          {/* Highest Expenses List */}
          <div className="grid grid-cols-1 gap-6">
            <HighestExpensesList
              data={dashboardData?.highestExpenses || []}
              isLoading={isLoading}
              maxHeight="400px"
            />
          </div>
        </div>
      )}
    </>
  );
}