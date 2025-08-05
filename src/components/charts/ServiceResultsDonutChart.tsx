import dynamic from 'next/dynamic';
import { useTheme } from 'next-themes';
import React, { useMemo } from 'react';
import { municipalChartPalette, serviceResultColors } from '@/src/lib/utils/municipalColors';

const ReactEcharts = dynamic(() => import('echarts-for-react'), {
  ssr: false,
  loading: () => (
    <div className="h-[300px] animate-pulse bg-muted rounded flex items-center justify-center">
      <div className="text-sm text-muted-foreground">Loading Chart...</div>
    </div>
  ),
});

interface ServiceResultData {
  name: string;
  value: number;
  color?: string;
}

interface ServiceResultsDonutChartProps {
  data: ServiceResultData[];
  title?: string;
  formatValueFn?: (value: number) => string;
  isLoading?: boolean;
  height?: string;
  showLegend?: boolean;
  centerText?: { title: string; subtitle?: string };
}

const ServiceResultsDonutChart: React.FC<ServiceResultsDonutChartProps> = ({
  data,
  title,
  formatValueFn,
  isLoading = false,
  height = '300px',
  showLegend = true,
  centerText,
}) => {
  const { resolvedTheme } = useTheme();

  const chartOptions = useMemo(() => {
    // Use service result colors from municipal colors
    const defaultColors = serviceResultColors;
    if (!data || data.length === 0) {
      return {
        title: {
          text: 'No service results data available',
          left: 'center',
          top: 'center',
          textStyle: {
            color: resolvedTheme === 'dark' ? '#9ca3af' : '#6b7280',
            fontSize: 14,
          },
        },
        series: [],
      };
    }

    // Calculate total for percentage calculations
    const total = data.reduce((sum, item) => sum + item.value, 0);

    // Prepare data with colors
    const seriesData = data.map((item, index) => ({
      name: item.name,
      value: item.value,
      itemStyle: {
        color: item.color || defaultColors[item.name as keyof typeof defaultColors] || municipalChartPalette[index % municipalChartPalette.length]
      }
    }));

    return {
      aria: {
        show: true,
        description: `Donut chart showing distribution of Toronto city service results. Total services: ${total}`,
      },
      title: title ? {
        text: title,
        left: 'center',
        top: '5%',
        textStyle: {
          color: resolvedTheme === 'dark' ? '#e2e8f0' : '#374151',
          fontSize: 16,
          fontWeight: 'bold'
        }
      } : undefined,
      tooltip: {
        trigger: 'item',
        backgroundColor: resolvedTheme === 'dark' ? 'rgba(26,32,44,0.95)' : 'rgba(255,255,255,0.95)',
        borderColor: resolvedTheme === 'dark' ? '#4A5568' : '#E2E8F0',
        borderWidth: 1,
        textStyle: { color: resolvedTheme === 'dark' ? '#E2E8F0' : '#2D3748' },
        padding: [8, 12],
        formatter: (params: any) => {
          if (!params || typeof params.value !== 'number') return '';
          
          const percentage = total > 0 ? ((params.value / total) * 100).toFixed(1) : '0.0';
          const formattedValue = formatValueFn ? formatValueFn(params.value) : params.value.toLocaleString();
          
          let contextInfo = '';
          switch (params.name) {
            case 'PASS':
              contextInfo = 'Services completed successfully';
              break;
            case 'FAIL':
              contextInfo = 'Services that encountered issues';
              break;
            case 'UNKNOWN':
              contextInfo = 'Services with unclear outcomes';
              break;
            default:
              contextInfo = `${params.name} service results`;
          }
          
          return `
            <div class="text-sm">
              <div class="font-semibold mb-2">${params.name}</div>
              <div class="flex justify-between items-center mb-1">
                <span>Count:</span>
                <span class="font-medium">${formattedValue}</span>
              </div>
              <div class="flex justify-between items-center mb-2">
                <span>Percentage:</span>
                <span class="font-medium">${percentage}%</span>
              </div>
              <div class="text-xs text-gray-500 mt-2">
                ${contextInfo}
              </div>
            </div>
          `;
        }
      },
      legend: showLegend ? {
        orient: 'horizontal',
        bottom: '5%',
        left: 'center',
        textStyle: {
          color: resolvedTheme === 'dark' ? '#e2e8f0' : '#374151'
        },
        formatter: (name: string) => {
          const item = data.find(d => d.name === name);
          if (!item) return name;
          const percentage = total > 0 ? ((item.value / total) * 100).toFixed(0) : '0';
          return `${name} (${percentage}%)`;
        }
      } : undefined,
      series: [
        {
          name: 'Service Results',
          type: 'pie',
          radius: ['40%', '70%'], // Donut shape
          center: ['50%', '50%'],
          avoidLabelOverlap: false,
          itemStyle: {
            borderRadius: 4,
            borderColor: resolvedTheme === 'dark' ? '#1f2937' : '#ffffff',
            borderWidth: 2
          },
          emphasis: {
            label: {
              show: true,
              fontSize: 14,
              fontWeight: 'bold'
            },
            itemStyle: {
              shadowBlur: 10,
              shadowOffsetX: 0,
              shadowColor: 'rgba(0, 0, 0, 0.5)'
            }
          },
          labelLine: {
            show: false
          },
          label: {
            show: false
          },
          data: seriesData
        }
      ],
      // Add center text if provided
      graphic: centerText ? [
        {
          type: 'text',
          left: 'center',
          top: 'center',
          style: {
            text: centerText.title,
            textAlign: 'center',
            fill: resolvedTheme === 'dark' ? '#e2e8f0' : '#374151',
            fontSize: 18,
            fontWeight: 'bold'
          }
        },
        centerText.subtitle ? {
          type: 'text',
          left: 'center',
          top: 'center',
          style: {
            text: centerText.subtitle,
            textAlign: 'center',
            fill: resolvedTheme === 'dark' ? '#9ca3af' : '#6b7280',
            fontSize: 12,
            y: 25
          }
        } : null
      ].filter(Boolean) : undefined
    };
  }, [data, title, formatValueFn, resolvedTheme, showLegend, centerText]);

  if (isLoading) {
    return (
      <div className="animate-pulse bg-muted rounded flex items-center justify-center" style={{ height }}>
        <div className="text-sm text-muted-foreground">Loading service results...</div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center text-muted-foreground p-4 text-center" style={{ height }}>
        No service results data available for the selected period.
      </div>
    );
  }

  return (
    <div className="relative">
      <ReactEcharts
        option={chartOptions}
        notMerge={true}
        lazyUpdate={true}
        theme={resolvedTheme === 'dark' ? 'dark' : undefined}
        style={{ height: height, width: '100%' }}
        opts={{ renderer: 'canvas' }}
      />
    </div>
  );
};

export default ServiceResultsDonutChart;