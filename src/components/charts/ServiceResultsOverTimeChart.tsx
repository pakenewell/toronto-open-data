import dynamic from 'next/dynamic';
import { useTheme } from 'next-themes';
import React, { useMemo } from 'react';
import type { TimeSeriesData } from '@/src/types/api';

const ReactEcharts = dynamic(() => import('echarts-for-react'), {
  ssr: false,
  loading: () => (
    <div className="h-[400px] animate-pulse bg-muted rounded flex items-center justify-center">
      <div className="text-sm text-muted-foreground">Loading Chart...</div>
    </div>
  ),
});

interface ServiceResultsOverTimeChartProps {
  data: TimeSeriesData[];
  title?: string;
  isLoading?: boolean;
  height?: string;
  showTrendAnalysis?: boolean;
}

const ServiceResultsOverTimeChart: React.FC<ServiceResultsOverTimeChartProps> = ({
  data,
  title = "Service Results Trends Over Time",
  isLoading = false,
  height = '400px',
  showTrendAnalysis = true,
}) => {
  const { resolvedTheme } = useTheme();

  const chartOptions = useMemo(() => {
    if (!data || data.length === 0) {
      return {
        title: {
          text: 'No time series data available',
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

    const periods = data.map(d => d.period);
    const passRates = data.map(d => d.passRate);
    const failRates = data.map(d => d.failRate);
    const unknownRates = data.map(d => d.unknownRate);
    const avgCosts = data.map(d => d.avgCost);
    const totalServices = data.map(d => d.totalServices);

    // Calculate trends
    const passRateTrend = passRates.length > 1 ? 
      ((passRates[passRates.length - 1] - passRates[0]) / passRates[0]) * 100 : 0;
    const costTrend = avgCosts.length > 1 ? 
      ((avgCosts[avgCosts.length - 1] - avgCosts[0]) / avgCosts[0]) * 100 : 0;

    return {
      aria: {
        show: true,
        description: `Time series chart showing trends in Toronto city service results over time. Displays pass rates, fail rates, and average costs.`,
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
          
          const dataIndex = params[0].dataIndex;
          const periodData = data[dataIndex];
          if (!periodData) return '';

          let html = `<div class="text-sm font-semibold mb-2">${periodData.period}</div>`;
          
          // Service volume and cost
          html += `<div class="grid grid-cols-2 gap-4 mb-2">
            <div>
              <div class="text-xs text-gray-500">Total Services</div>
              <div class="font-medium">${periodData.totalServices.toLocaleString()}</div>
            </div>
            <div>
              <div class="text-xs text-gray-500">Avg Cost</div>
              <div class="font-medium">$${periodData.avgCost.toLocaleString()}</div>
            </div>
          </div>`;

          // Results breakdown
          html += `<div class="space-y-1 mb-2">`;
          params.forEach((param) => {
            const value = typeof param.value === 'number' ? param.value.toFixed(1) : '0.0';
            html += `
              <div class="flex items-center justify-between text-xs">
                ${param.marker} 
                <span>${param.seriesName}:</span>
                <span class="font-medium">${value}%</span>
              </div>`;
          });
          html += `</div>`;

          // Month-over-month changes if available
          if (periodData.momChange) {
            html += `<div class="text-xs border-t pt-2 mt-2">
              <div class="text-gray-500 mb-1">Month-over-Month:</div>
              <div class="flex justify-between">
                <span>Services:</span>
                <span class="${periodData.momChange.services >= 0 ? 'text-green-600' : 'text-red-600'}">${periodData.momChange.services >= 0 ? '+' : ''}${periodData.momChange.services.toFixed(1)}%</span>
              </div>
              <div class="flex justify-between">
                <span>Cost:</span>
                <span class="${periodData.momChange.cost >= 0 ? 'text-red-600' : 'text-green-600'}">${periodData.momChange.cost >= 0 ? '+' : ''}${periodData.momChange.cost.toFixed(1)}%</span>
              </div>
              <div class="flex justify-between">
                <span>Pass Rate:</span>
                <span class="${periodData.momChange.passRate >= 0 ? 'text-green-600' : 'text-red-600'}">${periodData.momChange.passRate >= 0 ? '+' : ''}${periodData.momChange.passRate.toFixed(1)}%</span>
              </div>
            </div>`;
          }

          // Cost efficiency
          html += `<div class="text-xs mt-2 pt-2 border-t">
            <div class="flex justify-between">
              <span>Cost Efficiency:</span>
              <span class="font-medium">${periodData.costEfficiency.toFixed(3)}</span>
            </div>
          </div>`;

          return html;
        }
      },
      legend: {
        data: ['Pass Rate', 'Fail Rate', 'Unknown Rate'],
        top: '8%',
        textStyle: {
          color: resolvedTheme === 'dark' ? '#e2e8f0' : '#374151'
        }
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '15%',
        top: '20%',
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        data: periods,
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
        axisTick: { show: false },
      },
      yAxis: [
        {
          type: 'value',
          name: 'Percentage (%)',
          position: 'left',
          nameTextStyle: {
            color: resolvedTheme === 'dark' ? '#A0AEC0' : '#4A5568',
            padding: [0, 0, 0, -40],
          },
          axisLabel: {
            formatter: (value: number) => `${value}%`,
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
          min: 0,
          max: 100,
        },
        {
          type: 'value',
          name: 'Avg Cost ($)',
          position: 'right',
          nameTextStyle: {
            color: resolvedTheme === 'dark' ? '#A0AEC0' : '#4A5568',
            padding: [0, -40, 0, 0],
          },
          axisLabel: {
            formatter: (value: number) => `$${value.toLocaleString()}`,
            color: resolvedTheme === 'dark' ? '#A0AEC0' : '#4A5568',
          },
          axisLine: { show: false },
          axisTick: { show: false },
          splitLine: { show: false },
        }
      ],
      series: [
        {
          name: 'Pass Rate',
          type: 'line',
          yAxisIndex: 0,
          data: passRates,
          smooth: true,
          lineStyle: { width: 3, color: '#16a34a' },
          itemStyle: { color: '#16a34a' },
          areaStyle: {
            opacity: 0.1,
            color: '#16a34a'
          },
          emphasis: { focus: 'series' },
        },
        {
          name: 'Fail Rate',
          type: 'line',
          yAxisIndex: 0,
          data: failRates,
          smooth: true,
          lineStyle: { width: 3, color: '#dc2626' },
          itemStyle: { color: '#dc2626' },
          areaStyle: {
            opacity: 0.1,
            color: '#dc2626'
          },
          emphasis: { focus: 'series' },
        },
        {
          name: 'Unknown Rate',
          type: 'line',
          yAxisIndex: 0,
          data: unknownRates,
          smooth: true,
          lineStyle: { width: 2, color: '#ca8a04' },
          itemStyle: { color: '#ca8a04' },
          emphasis: { focus: 'series' },
        },
        {
          name: 'Avg Cost',
          type: 'bar',
          yAxisIndex: 1,
          data: avgCosts,
          itemStyle: { 
            color: 'rgba(59, 130, 246, 0.3)',
            borderColor: '#3b82f6',
            borderWidth: 1
          },
          barWidth: '60%',
          emphasis: { focus: 'series' },
        }
      ],
      dataZoom: [
        {
          show: true,
          type: 'slider',
          bottom: 10,
          height: 20,
          start: 0,
          end: 100,
          backgroundColor: resolvedTheme === 'dark' ? '#374151' : '#f3f4f6',
          borderColor: resolvedTheme === 'dark' ? '#4b5563' : '#d1d5db',
        },
        {
          type: 'inside',
          filterMode: 'filter',
          zoomOnMouseWheel: false,
          moveOnMouseMove: true,
        }
      ],
      // Add trend annotations if enabled
      graphic: showTrendAnalysis ? [
        {
          type: 'text',
          right: 20,
          top: 50,
          style: {
            text: `Pass Rate Trend: ${passRateTrend >= 0 ? '+' : ''}${passRateTrend.toFixed(1)}%`,
            fill: passRateTrend >= 0 ? '#16a34a' : '#dc2626',
            fontSize: 12,
            fontWeight: 'bold'
          }
        },
        {
          type: 'text',
          right: 20,
          top: 70,
          style: {
            text: `Cost Trend: ${costTrend >= 0 ? '+' : ''}${costTrend.toFixed(1)}%`,
            fill: costTrend >= 0 ? '#dc2626' : '#16a34a',
            fontSize: 12,
            fontWeight: 'bold'
          }
        }
      ] : undefined
    };
  }, [data, title, resolvedTheme, showTrendAnalysis]);

  if (isLoading) {
    return (
      <div className="animate-pulse bg-muted rounded flex items-center justify-center" style={{ height }}>
        <div className="text-sm text-muted-foreground">Loading time series data...</div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center text-muted-foreground p-4 text-center" style={{ height }}>
        No time series data available for the selected period.
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

export default ServiceResultsOverTimeChart;