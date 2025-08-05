import React, { useState, useMemo } from 'react';
import { formatCurrency, formatNumber, formatPercentage } from '@/src/lib/utils/formatters';
import type { WardAnalysisData, WardMetrics } from '@/src/types/api';

interface CostVolumeByWardTableProps {
  wardAnalysis: WardAnalysisData;
  title?: string;
  isLoading?: boolean;
  maxHeight?: string;
}

type SortField = 'ward' | 'totalServices' | 'totalCost' | 'avgCost' | 'passRate' | 'costEfficiency';
type SortDirection = 'asc' | 'desc';

const CostVolumeByWardTable: React.FC<CostVolumeByWardTableProps> = ({
  wardAnalysis,
  title = "Cost and Volume by Ward",
  isLoading = false,
  maxHeight = '600px',
}) => {
  const [sortField, setSortField] = useState<SortField>('totalCost');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [showWard66Details, setShowWard66Details] = useState(false);

  const sortedData = useMemo(() => {
    if (!wardAnalysis?.validWards) return [];

    return [...wardAnalysis.validWards].sort((a, b) => {
      let aValue: number;
      let bValue: number;

      switch (sortField) {
        case 'ward':
          aValue = a.ward;
          bValue = b.ward;
          break;
        case 'totalServices':
          aValue = a.totalServices;
          bValue = b.totalServices;
          break;
        case 'totalCost':
          aValue = a.totalCost;
          bValue = b.totalCost;
          break;
        case 'avgCost':
          aValue = a.avgCost;
          bValue = b.avgCost;
          break;
        case 'passRate':
          aValue = a.passRate;
          bValue = b.passRate;
          break;
        case 'costEfficiency':
          aValue = a.costEfficiency;
          bValue = b.costEfficiency;
          break;
        default:
          aValue = 0;
          bValue = 0;
      }

      return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
    });
  }, [wardAnalysis?.validWards, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <span className="text-gray-400">↕️</span>;
    }
    return sortDirection === 'asc' ? <span className="text-blue-500">↑</span> : <span className="text-blue-500">↓</span>;
  };

  const getPassRateClass = (passRate: number) => {
    if (passRate >= 80) return 'text-green-600 dark:text-green-400 font-medium';
    if (passRate >= 60) return 'text-yellow-600 dark:text-yellow-400 font-medium';
    return 'text-red-600 dark:text-red-400 font-medium';
  };

  const getEfficiencyClass = (score: number) => {
    if (score >= 1) return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
    if (score >= 0.5) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
    return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
  };

  if (isLoading) {
    return (
      <div className="animate-pulse bg-muted rounded p-4 flex items-center justify-center" style={{ height: maxHeight }}>
        <div className="text-sm text-muted-foreground">Loading ward data...</div>
      </div>
    );
  }

  if (!wardAnalysis || !wardAnalysis.validWards || wardAnalysis.validWards.length === 0) {
    return (
      <div className="flex items-center justify-center text-muted-foreground p-4 text-center" style={{ height: maxHeight }}>
        No ward data available for the selected period.
      </div>
    );
  }

  const totalCost = sortedData.reduce((sum, ward) => sum + ward.totalCost, 0);
  const totalServices = sortedData.reduce((sum, ward) => sum + ward.totalServices, 0);
  const avgPassRate = sortedData.reduce((sum, ward) => sum + ward.passRate, 0) / sortedData.length;

  return (
    <div className="space-y-6">
      {/* Ward 66 Callout */}
      {wardAnalysis.invalidWard66 && wardAnalysis.invalidWard66.count > 0 && (
        <div className="card p-6 border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-950/20">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="text-2xl">⚠️</div>
              <div>
                <h3 className="text-lg font-semibold text-orange-800 dark:text-orange-200">
                  Ward 66 Data Quality Issue
                </h3>
                <p className="text-sm text-orange-700 dark:text-orange-300 mt-1">
                  Invalid ward number detected in service records - requires data cleanup
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowWard66Details(!showWard66Details)}
              className="text-sm text-orange-600 dark:text-orange-400 hover:underline"
            >
              {showWard66Details ? 'Hide Details' : 'Show Details'}
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
            <div className="text-center">
              <div className="font-bold text-lg text-orange-800 dark:text-orange-200">
                {formatNumber(wardAnalysis.invalidWard66.count)}
              </div>
              <div className="text-xs text-orange-600 dark:text-orange-400">Services</div>
            </div>
            <div className="text-center">
              <div className="font-bold text-lg text-orange-800 dark:text-orange-200">
                {formatCurrency(wardAnalysis.invalidWard66.totalCost)}
              </div>
              <div className="text-xs text-orange-600 dark:text-orange-400">Total Cost</div>
            </div>
            <div className="text-center">
              <div className="font-bold text-lg text-orange-800 dark:text-orange-200">
                {formatPercentage(wardAnalysis.invalidWard66.impactAnalysis.percentageOfTotalServices)}
              </div>
              <div className="text-xs text-orange-600 dark:text-orange-400">% of Services</div>
            </div>
            <div className="text-center">
              <div className="font-bold text-lg text-orange-800 dark:text-orange-200">
                {formatPercentage(wardAnalysis.invalidWard66.passRate)}
              </div>
              <div className="text-xs text-orange-600 dark:text-orange-400">Pass Rate</div>
            </div>
          </div>

          {showWard66Details && (
            <div className="mt-4 p-4 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
              <h4 className="font-medium text-orange-800 dark:text-orange-200 mb-2">Impact Analysis</h4>
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="flex justify-between">
                    <span>% of Total Budget:</span>
                    <span className="font-medium">
                      {formatPercentage(wardAnalysis.invalidWard66.impactAnalysis.percentageOfTotalCost)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Avg Cost Difference:</span>
                    <span className="font-medium">
                      {formatCurrency(wardAnalysis.invalidWard66.impactAnalysis.comparedToValidWards.avgCostDifference)}
                    </span>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between">
                    <span>Pass Rate Difference:</span>
                    <span className="font-medium">
                      {wardAnalysis.invalidWard66.impactAnalysis.comparedToValidWards.passRateDifference > 0 ? '+' : ''}
                      {wardAnalysis.invalidWard66.impactAnalysis.comparedToValidWards.passRateDifference.toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>
              
              {wardAnalysis.invalidWard66.recommendations && wardAnalysis.invalidWard66.recommendations.length > 0 && (
                <div className="mt-3">
                  <h5 className="font-medium text-orange-800 dark:text-orange-200 mb-1">Recommendations:</h5>
                  <ul className="text-xs text-orange-700 dark:text-orange-300 space-y-1">
                    {wardAnalysis.invalidWard66.recommendations.map((rec, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span>•</span>
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Main Ward Table */}
      <div className="card p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">{title}</h2>
        </div>

        <div 
          className="overflow-auto custom-scrollbar"
          style={{ maxHeight }}
        >
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-background border-b">
              <tr>
                <th 
                  className="text-left p-3 cursor-pointer hover:bg-accent/50 transition-colors"
                  onClick={() => handleSort('ward')}
                >
                  <div className="flex items-center gap-2">
                    Ward {getSortIcon('ward')}
                  </div>
                </th>
                <th 
                  className="text-right p-3 cursor-pointer hover:bg-accent/50 transition-colors"
                  onClick={() => handleSort('totalServices')}
                >
                  <div className="flex items-center justify-end gap-2">
                    Services {getSortIcon('totalServices')}
                  </div>
                </th>
                <th 
                  className="text-right p-3 cursor-pointer hover:bg-accent/50 transition-colors"
                  onClick={() => handleSort('totalCost')}
                >
                  <div className="flex items-center justify-end gap-2">
                    Total Cost {getSortIcon('totalCost')}
                  </div>
                </th>
                <th 
                  className="text-right p-3 cursor-pointer hover:bg-accent/50 transition-colors"
                  onClick={() => handleSort('avgCost')}
                >
                  <div className="flex items-center justify-end gap-2">
                    Avg Cost {getSortIcon('avgCost')}
                  </div>
                </th>
                <th 
                  className="text-right p-3 cursor-pointer hover:bg-accent/50 transition-colors"
                  onClick={() => handleSort('passRate')}
                >
                  <div className="flex items-center justify-end gap-2">
                    Pass Rate {getSortIcon('passRate')}
                  </div>
                </th>

              </tr>
            </thead>
            <tbody>
              {sortedData.map((ward) => {
                const costPercentage = (ward.totalCost / totalCost) * 100;
                const servicePercentage = (ward.totalServices / totalServices) * 100;
                
                return (
                  <tr 
                    key={ward.ward}
                    className="border-b hover:bg-accent/30 transition-colors"
                  >
                    <td className="p-3">
                      <div>
                        <div className="font-medium">Ward {ward.ward}</div>
                      </div>
                    </td>
                    <td className="p-3 text-right">
                      <div className="font-medium">{formatNumber(ward.totalServices)}</div>
                      <div className="text-xs text-muted-foreground">
                        {servicePercentage.toFixed(1)}%
                      </div>
                    </td>
                    <td className="p-3 text-right">
                      <div className="font-medium">{formatCurrency(ward.totalCost)}</div>
                      <div className="text-xs text-muted-foreground">
                        {costPercentage.toFixed(1)}%
                      </div>
                    </td>
                    <td className="p-3 text-right">
                      {formatCurrency(ward.avgCost)}
                    </td>
                    <td className={`p-3 text-right ${getPassRateClass(ward.passRate)}`}>
                      <div>{formatPercentage(ward.passRate)}</div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgb(203 213 225 / 0.5);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgb(148 163 184 / 0.7);
        }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgb(75 85 99 / 0.5);
        }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgb(107 114 128 / 0.7);
        }
      `}</style>
    </div>
  );
};

export default CostVolumeByWardTable;