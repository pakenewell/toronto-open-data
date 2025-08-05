import dynamic from 'next/dynamic';
import { useTheme } from 'next-themes';
import React, { useMemo } from 'react';
import type { CostDistributionBin } from '@/src/types/api';
import { municipalChartPalette } from '@/src/lib/utils/municipalColors';

const ReactEcharts = dynamic(() => import('echarts-for-react'), {
  ssr: false,
  loading: () => (
    <div className="h-[400px] animate-pulse bg-muted rounded flex items-center justify-center">
      <div className="text-sm text-muted-foreground">Loading Chart...</div>
    </div>
  ),
});

interface CostDistributionHistogramProps {
  data: CostDistributionBin[];
  title?: string;
  isLoading?: boolean;
  height?: string;
}

const CostDistributionHistogram: React.FC<CostDistributionHistogramProps> = ({
  data,
  title = "Cost Distribution Analysis",
  isLoading = false,
  height = '400px',
}) => {
  const { resolvedTheme } = useTheme();

  const chartOptions = useMemo(() => {
    if (!data || data.length === 0) {
      return {
        title: {
          text: 'No cost distribution data available',
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

    // Calculate total services for context
    const totalServices = data.reduce((sum, bin) => sum + bin.count, 0);

    // Prepare data for histogram
    const histogramData = data.map((bin, index) => ({
      name: bin.label,
      value: bin.count,
      percentage: bin.percentage,
      range: `$${bin.min.toLocaleString()} - $${bin.max.toLocaleString()}`,
      itemStyle: {
        color: municipalChartPalette[index % municipalChartPalette.length]
      }
    }));

    return {
      aria: {
        show: true,
        description: `Histogram showing distribution of Toronto city service costs across different price ranges. Total services: ${totalServices}`,
      },
      title: {
        text: title,
        left: 'center',
        top: '3%',
        textStyle: {
          color: resolvedTheme === 'dark' ? '#e2e8f0' : '#374151',
          fontSize: 16,
          fontWeight: 'bold'
        }
      },
      tooltip: {
        trigger: 'axis',
        backgroundColor: resolvedTheme === 'dark' ? 'rgba(26,32,44,0.95)' : 'rgba(255,255,255,0.95)',
        borderColor: resolvedTheme === 'dark' ? '#4A5568' : '#E2E8F0',
        borderWidth: 1,
        textStyle: { color: resolvedTheme === 'dark' ? '#E2E8F0' : '#2D3748' },
        padding: [8, 12],
        formatter: (params: any[]) => {
          if (!params || params.length === 0) return '';
          
          const param = params[0];
          const bin = data[param.dataIndex];
          if (!bin) return '';

          const avgCostInBin = (bin.min + bin.max) / 2;
          
          return `
            <div class="text-sm">
              <div class="font-semibold mb-2">${bin.label}</div>
              <div class="flex justify-between items-center mb-1">
                <span>Cost Range:</span>
                <span class="font-medium">$${bin.min.toLocaleString()} - $${bin.max.toLocaleString()}</span>
              </div>
              <div class="flex justify-between items-center mb-1">
                <span>Services:</span>
                <span class="font-medium">${bin.count.toLocaleString()}</span>
              </div>
              <div class="flex justify-between items-center mb-1">
                <span>Percentage:</span>
                <span class="font-medium">${bin.percentage.toFixed(1)}%</span>
              </div>
              <div class="flex justify-between items-center mb-2">
                <span>Avg Cost:</span>
                <span class="font-medium">$${avgCostInBin.toLocaleString()}</span>
              </div>
              <div class="text-xs text-gray-500 mt-2 pt-2 border-t">
                ${bin.percentage > 30 ? 'High concentration of services in this cost range' :
                  bin.percentage > 10 ? 'Moderate service concentration' :
                  'Lower service volume in this cost range'}
              </div>
            </div>
          `;
        }
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '15%',
        top: '15%',
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        data: data.map(bin => bin.label),
        axisLabel: {
          color: resolvedTheme === 'dark' ? '#A0AEC0' : '#4A5568',
          rotate: 45,
          fontSize: 10
        },
        axisLine: {
          lineStyle: {
            color: resolvedTheme === 'dark' ? '#4A5568' : '#CBD5E0',
          },
        },
        axisTick: { 
          show: true,
          lineStyle: {
            color: resolvedTheme === 'dark' ? '#4A5568' : '#CBD5E0',
          }
        },
      },
      yAxis: {
        type: 'value',
        name: 'Number of Services',
        nameTextStyle: {
          color: resolvedTheme === 'dark' ? '#A0AEC0' : '#4A5568',
          padding: [0, 0, 0, -40],
        },
        axisLabel: {
          formatter: (value: number) => value.toLocaleString(),
          color: resolvedTheme === 'dark' ? '#A0AEC0' : '#4A5568',
        },
        splitLine: {
          lineStyle: {
            color: resolvedTheme === 'dark' ? '#4A5568' : '#CBD5E0',
            type: 'dashed',
          },
        },
        axisLine: { show: false },
        axisTick: { show: false },
      },
      series: [
        {
          name: 'Service Count',
          type: 'bar',
          data: histogramData,
          barWidth: '60%',
          itemStyle: {
            borderRadius: [4, 4, 0, 0],
          },
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowOffsetX: 0,
              shadowColor: 'rgba(0, 0, 0, 0.5)'
            }
          },
          label: {
            show: false,
            position: 'top',
            color: resolvedTheme === 'dark' ? '#E2E8F0' : '#2D3748',
            fontSize: 10,
            formatter: (params: any) => {
              if (params.value > totalServices * 0.05) { // Only show labels for bars > 5%
                return params.value.toLocaleString();
              }
              return '';
            }
          }
        }
      ],
      dataZoom: [
        {
          show: false,
          type: 'inside',
          filterMode: 'filter',
          zoomOnMouseWheel: false,
          moveOnMouseMove: true,
          moveOnMouseWheel: false,
          preventDefaultMouseMove: false,
        }
      ]
    };
  }, [data, title, resolvedTheme]);

  if (isLoading) {
    return (
      <div className="animate-pulse bg-muted rounded flex items-center justify-center" style={{ height }}>
        <div className="text-sm text-muted-foreground">Loading cost distribution data...</div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center text-muted-foreground p-4 text-center" style={{ height }}>
        No cost distribution data available for the selected period.
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

export default CostDistributionHistogram;