import React, { useMemo } from 'react';
import dynamic from 'next/dynamic';
import { useTheme } from 'next-themes';

const ReactEcharts = dynamic(() => import('echarts-for-react'), {
  ssr: false,
  loading: () => <div className="h-[300px] animate-pulse bg-muted rounded" />,
});

interface FieldCompleteness {
  field: string;
  completeness: number;
  totalRecords: number;
  completeRecords: number;
  missingRecords: number;
  description?: string;
}

interface DataCompletenessBarChartProps {
  fieldCompleteness: FieldCompleteness[] | null;
  className?: string;
  height?: number;
  title?: string;
}

export function DataCompletenessBarChart({
  fieldCompleteness,
  className = '',
  height = 300,
  title = 'Data Completeness by Field'
}: DataCompletenessBarChartProps) {
  const { resolvedTheme } = useTheme();

  const chartOptions = useMemo(() => {
    if (!fieldCompleteness || fieldCompleteness.length === 0) {
      return null;
    }

    // Sort by completeness percentage (ascending to show worst first)
    const sortedData = [...fieldCompleteness].sort((a, b) => a.completeness - b.completeness);

    const fieldNames = sortedData.map(item => item.field);
    const completenessValues = sortedData.map(item => item.completeness);
    
    // Color coding based on completeness
    const itemColors = completenessValues.map(value => {
      if (value >= 90) return '#16a34a'; // Green - Excellent
      if (value >= 80) return '#3b82f6'; // Blue - Good
      if (value >= 70) return '#eab308'; // Yellow - Fair
      if (value >= 60) return '#f97316'; // Orange - Poor
      return '#dc2626'; // Red - Critical
    });

    return {
      tooltip: {
        backgroundColor: resolvedTheme === 'dark' ? 'rgba(26,32,44,0.95)' : 'rgba(255,255,255,0.95)',
        borderColor: resolvedTheme === 'dark' ? '#4A5568' : '#E2E8F0',
        textStyle: { color: resolvedTheme === 'dark' ? '#E2E8F0' : '#2D3748' },
        formatter: (params: any) => {
          const data = sortedData[params.dataIndex];
          return `
            <div class="font-semibold mb-2">${data.field}</div>
            <div class="space-y-1">
              <div>Completeness: <span class="font-medium">${data.completeness.toFixed(1)}%</span></div>
              <div>Complete Records: <span class="font-medium">${data.completeRecords.toLocaleString()}</span></div>
              <div>Missing Records: <span class="font-medium">${data.missingRecords.toLocaleString()}</span></div>
              <div>Total Records: <span class="font-medium">${data.totalRecords.toLocaleString()}</span></div>
              ${data.description ? `<div class="mt-2 text-sm text-gray-600">${data.description}</div>` : ''}
            </div>
          `;
        }
      },
      grid: {
        top: 10,
        right: 30,
        bottom: 40,
        left: 140,
        containLabel: true
      },
      xAxis: {
        type: 'value',
        min: 0,
        max: 100,
        axisLabel: {
          formatter: '{value}%',
          color: resolvedTheme === 'dark' ? '#e2e8f0' : '#374151'
        },
        axisLine: {
          lineStyle: {
            color: resolvedTheme === 'dark' ? '#4b5563' : '#d1d5db'
          }
        },
        splitLine: {
          lineStyle: {
            color: resolvedTheme === 'dark' ? '#374151' : '#e5e7eb'
          }
        }
      },
      yAxis: {
        type: 'category',
        data: fieldNames,
        axisLabel: {
          color: resolvedTheme === 'dark' ? '#e2e8f0' : '#374151',
          fontSize: 12,
          formatter: (value: string) => {
            // Format field names to be more readable
            return value
              .replace(/_/g, ' ')
              .replace(/\b\w/g, (char: string) => char.toUpperCase());
          }
        },
        axisLine: {
          lineStyle: {
            color: resolvedTheme === 'dark' ? '#4b5563' : '#d1d5db'
          }
        }
      },
      series: [{
        type: 'bar',
        data: completenessValues.map((value, index) => ({
          value,
          itemStyle: {
            color: itemColors[index]
          }
        })),
        barWidth: '70%',
        label: {
          show: true,
          position: 'right',
          formatter: '{c}%',
          color: resolvedTheme === 'dark' ? '#e2e8f0' : '#374151',
          fontSize: 11,
          distance: 5
        }
      }]
    };
  }, [fieldCompleteness, resolvedTheme]);

  if (!fieldCompleteness || fieldCompleteness.length === 0) {
    return (
      <div className={`flex items-center justify-center p-8 text-sm text-muted-foreground ${className}`}>
        <div className="text-center">
          <div className="text-lg font-medium mb-2">No Field Completeness Data</div>
          <div>Field completeness analysis not available</div>
        </div>
      </div>
    );
  }

  return (
    <div className={`w-full ${className}`}>
      <div className="mb-6">
        <h3 className="text-xl font-semibold mb-3">{title}</h3>
        <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 bg-green-500 rounded-sm"></div>
            <span>≥90% Excellent</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 bg-blue-500 rounded-sm"></div>
            <span>80-89% Good</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 bg-yellow-500 rounded-sm"></div>
            <span>70-79% Fair</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 bg-orange-500 rounded-sm"></div>
            <span>60-69% Poor</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 bg-red-500 rounded-sm"></div>
            <span>&lt;60% Critical</span>
          </div>
        </div>
      </div>
      
      <div style={{ height }}>
        {chartOptions && (
          <ReactEcharts
            option={chartOptions}
            style={{ width: '100%', height: '100%' }}
            opts={{ renderer: 'canvas' }}
          />
        )}
      </div>

      {/* Summary Stats */}
      <div className="mt-6 grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
          <div className="text-2xl font-semibold text-green-600 dark:text-green-400">
            {fieldCompleteness.filter(f => f.completeness >= 90).length}
          </div>
          <div className="text-sm text-green-700 dark:text-green-300">Excellent</div>
        </div>
        <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <div className="text-2xl font-semibold text-blue-600 dark:text-blue-400">
            {fieldCompleteness.filter(f => f.completeness >= 80 && f.completeness < 90).length}
          </div>
          <div className="text-sm text-blue-700 dark:text-blue-300">Good</div>
        </div>
        <div className="text-center p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
          <div className="text-2xl font-semibold text-yellow-600 dark:text-yellow-400">
            {fieldCompleteness.filter(f => f.completeness >= 70 && f.completeness < 80).length}
          </div>
          <div className="text-sm text-yellow-700 dark:text-yellow-300">Fair</div>
        </div>
        <div className="text-center p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
          <div className="text-2xl font-semibold text-orange-600 dark:text-orange-400">
            {fieldCompleteness.filter(f => f.completeness >= 60 && f.completeness < 70).length}
          </div>
          <div className="text-sm text-orange-700 dark:text-orange-300">Poor</div>
        </div>
        <div className="text-center p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
          <div className="text-2xl font-semibold text-red-600 dark:text-red-400">
            {fieldCompleteness.filter(f => f.completeness < 60).length}
          </div>
          <div className="text-sm text-red-700 dark:text-red-300">Critical</div>
        </div>
      </div>
    </div>
  );
}

export default DataCompletenessBarChart;