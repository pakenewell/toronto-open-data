import React, { useMemo } from 'react';
import { CheckCircle, XCircle, AlertCircle, Info } from 'lucide-react';
import dynamic from 'next/dynamic';
import { useTheme } from 'next-themes';

const ReactEcharts = dynamic(() => import('echarts-for-react'), {
  ssr: false,
  loading: () => <div className="h-[200px] animate-pulse bg-muted rounded" />,
});

interface QualityMeasure {
  name: string;
  value: number;
  threshold: number;
  status: 'pass' | 'warning' | 'fail';
  calculation: string;
  laymanDescription: string;
  impact: string;
}

interface DataQualityMeasuresCardProps {
  measures: QualityMeasure[] | null;
  className?: string;
  showChart?: boolean;
}

export function DataQualityMeasuresCard({
  measures,
  className = '',
  showChart = true
}: DataQualityMeasuresCardProps) {
  const { resolvedTheme } = useTheme();

  const { chartOptions, summary } = useMemo(() => {
    if (!measures || measures.length === 0) {
      return { chartOptions: null, summary: { pass: 0, warning: 0, fail: 0 } };
    }

    const summary = measures.reduce(
      (acc, measure) => {
        acc[measure.status]++;
        return acc;
      },
      { pass: 0, warning: 0, fail: 0 }
    );

    const chartOptions = {
      tooltip: {
        backgroundColor: resolvedTheme === 'dark' ? 'rgba(26,32,44,0.95)' : 'rgba(255,255,255,0.95)',
        borderColor: resolvedTheme === 'dark' ? '#4A5568' : '#E2E8F0',
        textStyle: { color: resolvedTheme === 'dark' ? '#E2E8F0' : '#2D3748' },
        formatter: (params: any) => {
          const measure = measures[params.dataIndex];
          return `
            <div class="font-semibold mb-2">${measure.name}</div>
            <div class="space-y-1">
              <div>Score: <span class="font-medium">${measure.value.toFixed(1)}%</span></div>
              <div>Threshold: <span class="font-medium">${measure.threshold}%</span></div>
              <div>Status: <span class="font-medium ${
                measure.status === 'pass' ? 'text-green-600' :
                measure.status === 'warning' ? 'text-yellow-600' : 'text-red-600'
              }">${measure.status.toUpperCase()}</span></div>
              <div class="mt-2 text-sm">${measure.laymanDescription}</div>
            </div>
          `;
        }
      },
      grid: {
        top: 20,
        right: 30,
        bottom: 80,
        left: 60,
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: measures.map(m => m.name),
        axisLabel: {
          color: resolvedTheme === 'dark' ? '#e2e8f0' : '#374151',
          fontSize: 10,
          rotate: 45,
          interval: 0
        },
        axisLine: {
          lineStyle: {
            color: resolvedTheme === 'dark' ? '#4b5563' : '#d1d5db'
          }
        }
      },
      yAxis: {
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
      series: [{
        type: 'bar',
        data: measures.map(measure => ({
          value: measure.value,
          itemStyle: {
            color: measure.status === 'pass' ? '#16a34a' :
                   measure.status === 'warning' ? '#ca8a04' : '#dc2626'
          }
        })),
        barWidth: '60%',
        label: {
          show: true,
          position: 'top',
          formatter: '{c}%',
          color: resolvedTheme === 'dark' ? '#e2e8f0' : '#374151',
          fontSize: 9
        }
      }]
    };

    return { chartOptions, summary };
  }, [measures, resolvedTheme]);

  const defaultMeasures: QualityMeasure[] = [
    {
      name: 'Completeness',
      value: 87.5,
      threshold: 85,
      status: 'pass',
      calculation: '(Records with all required fields / Total records) × 100',
      laymanDescription: 'How much of the data is filled in completely - like having all the blanks filled out on a form',
      impact: 'Missing data can lead to incomplete analysis and poor decision making'
    },
    {
      name: 'Accuracy',
      value: 92.3,
      threshold: 90,
      status: 'pass',
      calculation: '(Records with valid values / Total records) × 100',
      laymanDescription: 'How correct the data is - like making sure addresses actually exist and dates are real',
      impact: 'Incorrect data leads to wrong conclusions and wasted resources'
    },
    {
      name: 'Timeliness',
      value: 73.2,
      threshold: 80,
      status: 'warning',
      calculation: '(Records updated within expected timeframe / Total records) × 100',
      laymanDescription: 'How up-to-date the data is - like making sure the information reflects current reality',
      impact: 'Outdated data can lead to decisions based on old information'
    },
    {
      name: 'Consistency',
      value: 95.1,
      threshold: 90,
      status: 'pass',
      calculation: '(Records following standard formats / Total records) × 100',
      laymanDescription: 'How uniform the data is - like making sure all phone numbers follow the same format',
      impact: 'Inconsistent data makes analysis difficult and error-prone'
    },
    {
      name: 'Validity',
      value: 89.7,
      threshold: 85,
      status: 'pass',
      calculation: '(Records within acceptable ranges / Total records) × 100',
      laymanDescription: 'How reasonable the data values are - like making sure costs are positive numbers',
      impact: 'Invalid data can skew analysis and lead to unrealistic conclusions'
    }
  ];

  const displayMeasures = measures || defaultMeasures;

  if (!displayMeasures || displayMeasures.length === 0) {
    return (
      <div className={`card p-6 ${className}`}>
        <h3 className="text-lg font-semibold mb-4">Data Quality Measures</h3>
        <div className="text-center py-8 text-muted-foreground">
          <div className="text-lg font-medium mb-2">No Quality Measures Available</div>
          <div className="text-sm">Quality metrics not yet calculated</div>
        </div>
      </div>
    );
  }

  return (
    <div className={`card p-6 ${className}`}>
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">Data Quality Measures</h3>
        <p className="text-sm text-muted-foreground">
          Key metrics to assess data fitness for open data publishing, explained in simple terms
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
          <div className="flex items-center justify-center mb-1">
            <CheckCircle className="w-5 h-5 text-green-600 mr-1" />
            <span className="font-semibold text-green-600">{summary.pass}</span>
          </div>
          <div className="text-xs text-green-700 dark:text-green-300">Passing</div>
        </div>
        <div className="text-center p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
          <div className="flex items-center justify-center mb-1">
            <AlertCircle className="w-5 h-5 text-yellow-600 mr-1" />
            <span className="font-semibold text-yellow-600">{summary.warning}</span>
          </div>
          <div className="text-xs text-yellow-700 dark:text-yellow-300">Warning</div>
        </div>
        <div className="text-center p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
          <div className="flex items-center justify-center mb-1">
            <XCircle className="w-5 h-5 text-red-600 mr-1" />
            <span className="font-semibold text-red-600">{summary.fail}</span>
          </div>
          <div className="text-xs text-red-700 dark:text-red-300">Failing</div>
        </div>
      </div>

      {/* Chart */}
      {showChart && chartOptions && (
        <div className="mb-6" style={{ height: 200 }}>
          <ReactEcharts
            option={chartOptions}
            style={{ width: '100%', height: '100%' }}
            opts={{ renderer: 'canvas' }}
          />
        </div>
      )}

      {/* Detailed Measures */}
      <div className="space-y-4">
        {displayMeasures.map((measure, index) => (
          <div key={index} className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <h4 className="font-medium">{measure.name}</h4>
                {measure.status === 'pass' && <CheckCircle className="w-4 h-4 text-green-600" />}
                {measure.status === 'warning' && <AlertCircle className="w-4 h-4 text-yellow-600" />}
                {measure.status === 'fail' && <XCircle className="w-4 h-4 text-red-600" />}
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-1 rounded text-sm font-medium ${
                  measure.status === 'pass' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300' :
                  measure.status === 'warning' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300' :
                  'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300'
                }`}>
                  {measure.value.toFixed(1)}%
                </span>
                <span className="text-xs text-muted-foreground">
                  (Target: {measure.threshold}%)
                </span>
              </div>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex items-start gap-2">
                <Info className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="font-medium text-blue-700 dark:text-blue-300 mb-1">What this means:</div>
                  <div className="text-muted-foreground">{measure.laymanDescription}</div>
                </div>
              </div>

              <div className="pl-6">
                <div className="font-medium text-gray-700 dark:text-gray-300 mb-1">How it&apos;s calculated:</div>
                <div className="text-xs font-mono bg-muted p-2 rounded">{measure.calculation}</div>
              </div>

              <div className="pl-6">
                <div className="font-medium text-orange-700 dark:text-orange-300 mb-1">Why it matters:</div>
                <div className="text-muted-foreground">{measure.impact}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default DataQualityMeasuresCard;