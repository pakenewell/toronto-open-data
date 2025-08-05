import React, { useState, useMemo } from 'react';
import { formatCurrency, formatNumber, formatPercentage } from '@/src/lib/utils/formatters';
import type { ServiceAggregation } from '@/src/types/toronto';

interface CostVolumeByDivisionTableProps {
  data: ServiceAggregation[];
  title?: string;
  isLoading?: boolean;
  maxHeight?: string;
}

type SortField = 'division' | 'count' | 'total_cost' | 'avg_cost' | 'pass_rate';
type SortDirection = 'asc' | 'desc';

const CostVolumeByDivisionTable: React.FC<CostVolumeByDivisionTableProps> = ({
  data,
  title = "Cost and Volume by Division",
  isLoading = false,
  maxHeight = '600px',
}) => {
  const [sortField, setSortField] = useState<SortField>('total_cost');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const sortedData = useMemo(() => {
    if (!data) return [];

    return [...data].sort((a, b) => {
      let aValue: number | string;
      let bValue: number | string;

      switch (sortField) {
        case 'division':
          aValue = a.division || '';
          bValue = b.division || '';
          break;
        case 'count':
          aValue = a.count;
          bValue = b.count;
          break;
        case 'total_cost':
          aValue = a.total_cost;
          bValue = b.total_cost;
          break;
        case 'avg_cost':
          aValue = a.avg_cost;
          bValue = b.avg_cost;
          break;
        case 'pass_rate':
          aValue = a.pass_rate;
          bValue = b.pass_rate;
          break;
        default:
          aValue = 0;
          bValue = 0;
      }

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      return sortDirection === 'asc' 
        ? (aValue as number) - (bValue as number)
        : (bValue as number) - (aValue as number);
    });
  }, [data, sortField, sortDirection]);

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

  const getPassRateClass = (pass_rate: number) => {
    if (pass_rate >= 80) return 'text-green-600 dark:text-green-400 font-medium';
    if (pass_rate >= 60) return 'text-yellow-600 dark:text-yellow-400 font-medium';
    return 'text-red-600 dark:text-red-400 font-medium';
  };


  if (isLoading) {
    return (
      <div className="animate-pulse bg-muted rounded p-4 flex items-center justify-center" style={{ height: maxHeight }}>
        <div className="text-sm text-muted-foreground">Loading division data...</div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center text-muted-foreground p-4 text-center" style={{ height: maxHeight }}>
        No division data available for the selected period.
      </div>
    );
  }

  const totalCost = sortedData.reduce((sum, div) => sum + div.total_cost, 0);
  const totalServices = sortedData.reduce((sum, div) => sum + div.count, 0);
  const avgPassRate = sortedData.reduce((sum, div) => sum + div.pass_rate, 0) / sortedData.length;

  return (
    <div className="card p-6">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h2 className="text-lg font-semibold">{title}</h2>
          <div className="text-sm text-muted-foreground mt-1">
            <div className="flex items-center gap-4">
              <span>{sortedData.length} divisions</span>
            </div>
          </div>
        </div>
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
                onClick={() => handleSort('division')}
              >
                <div className="flex items-center gap-2">
                  Division {getSortIcon('division')}
                </div>
              </th>
              <th 
                className="text-right p-3 cursor-pointer hover:bg-accent/50 transition-colors"
                onClick={() => handleSort('count')}
              >
                <div className="flex items-center justify-end gap-2">
                  Services {getSortIcon('count')}
                </div>
              </th>
              <th 
                className="text-right p-3 cursor-pointer hover:bg-accent/50 transition-colors"
                onClick={() => handleSort('total_cost')}
              >
                <div className="flex items-center justify-end gap-2">
                  Total Cost {getSortIcon('total_cost')}
                </div>
              </th>
              <th 
                className="text-right p-3 cursor-pointer hover:bg-accent/50 transition-colors"
                onClick={() => handleSort('avg_cost')}
              >
                <div className="flex items-center justify-end gap-2">
                  Avg Cost {getSortIcon('avg_cost')}
                </div>
              </th>
              <th 
                className="text-right p-3 cursor-pointer hover:bg-accent/50 transition-colors"
                onClick={() => handleSort('pass_rate')}
              >
                <div className="flex items-center justify-end gap-2">
                  Pass Rate {getSortIcon('pass_rate')}
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedData.map((division, index) => {
              const costPercentage = (division.total_cost / totalCost) * 100;
              const servicePercentage = (division.count / totalServices) * 100;
              
              return (
                <tr 
                  key={division.division || index}
                  className="border-b hover:bg-accent/30 transition-colors"
                >
                  <td className="p-3">
                    <div>
                      <div className="font-medium">{division.division || 'Unknown Division'}</div>
                    </div>
                  </td>
                  <td className="p-3 text-right">
                    <div className="font-medium">{formatNumber(division.count)}</div>
                    <div className="text-xs text-muted-foreground">
                      {servicePercentage.toFixed(1)}%
                    </div>
                  </td>
                  <td className="p-3 text-right">
                    <div className="font-medium">{formatCurrency(division.total_cost)}</div>
                    <div className="text-xs text-muted-foreground">
                      {costPercentage.toFixed(1)}%
                    </div>
                  </td>
                  <td className="p-3 text-right">
                    {formatCurrency(division.avg_cost)}
                  </td>
                  <td className={`p-3 text-right ${getPassRateClass(division.pass_rate)}`}>
                    {formatPercentage(division.pass_rate)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
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

export default CostVolumeByDivisionTable;