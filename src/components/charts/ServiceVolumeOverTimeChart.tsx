import dynamic from 'next/dynamic';
import { useTheme } from 'next-themes';
import React, { useMemo } from 'react';

const ReactEcharts = dynamic(() => import('echarts-for-react'), {
  ssr: false,
  loading: () => (
    <div className="h-[400px] animate-pulse bg-muted rounded flex items-center justify-center">
      <div className="text-sm text-muted-foreground">Loading Chart...</div>
    </div>
  ),
});

interface ServiceVolumeData {
  name: string;
  data: number[];
}

interface ServiceVolumeOverTimeChartProps {
  monthLabels: string[];
  seriesData: ServiceVolumeData[];
  palette?: string[];
  isLoading?: boolean;
  height?: string;
}

// Helper function to calculate month-over-month change
const calculateMonthOverMonth = (currentValue: number, previousValue: number | undefined): string => {
  if (!previousValue || previousValue === 0) return '';
  const change = ((currentValue - previousValue) / previousValue) * 100;
  const sign = change >= 0 ? '+' : '';
  return `${sign}${change.toFixed(1)}%`;
};

// Helper function to format contextual information based on service category
const getServiceContextualInfo = (percentage: number, seriesName: string): string => {
  const contextMap: Record<string, { high: string; medium: string; low: string }> = {
    'PASS': {
      high: 'High success rate - services performing well',
      medium: 'Standard success rate for city services',
      low: 'Lower success rate - may need attention'
    },
    'FAIL': {
      high: 'Elevated failure rate - requires investigation',
      medium: 'Some service failures within expected range',
      low: 'Minimal service failures'
    },
    'UNKNOWN': {
      high: 'High number of unclassified results',
      medium: 'Some results pending classification',
      low: 'Most results properly categorized'
    }
  };
  
  const context = contextMap[seriesName];
  if (!context) return '';
  
  if (percentage > 40) return context.high;
  if (percentage > 20) return context.medium;
  return context.low;
};

const ServiceVolumeOverTimeChart: React.FC<ServiceVolumeOverTimeChartProps> = ({
  monthLabels,
  seriesData,
  palette = ['#0f766e', '#dc2626', '#ca8a04', '#7c3aed', '#0ea5e9'],
  isLoading = false,
  height = '400px',
}) => {
  const { resolvedTheme } = useTheme();

  const options = useMemo(
    () => ({
      aria: {
        show: true,
        description: 'Interactive line chart displaying trends in Toronto city service volumes over time, broken down by service result categories.',
      },
      toolbox: {
        show: true,
        orient: 'vertical',
        left: 'right',
        top: 'center',
        feature: {
          mark: { show: true },
          dataView: {
            show: true,
            readOnly: true,
            title: 'View Data Table',
          },
          magicType: {
            show: true,
            type: ['line', 'bar', 'stack'],
            title: { line: 'Switch to Line Chart', bar: 'Switch to Bar Chart', stack: 'Stack Series'}
          },
          restore: { show: true, title: 'Restore View' },
          saveAsImage: { show: true, title: 'Save as Image' }
        }
      },
      tooltip: {
        trigger: 'axis',
        backgroundColor:
          resolvedTheme === 'dark'
            ? 'rgba(26,32,44,0.95)'
            : 'rgba(255,255,255,0.95)',
        borderColor: resolvedTheme === 'dark' ? '#4A5568' : '#E2E8F0',
        borderWidth: 1,
        textStyle: { color: resolvedTheme === 'dark' ? '#E2E8F0' : '#2D3748' },
        padding: [8, 12],
        formatter: (params: any[]) => {
          if (!params || params.length === 0 || !params[0]) return '';

          const currentMonthIndex = params[0].dataIndex as number;
          const currentMonth = params[0].axisValueLabel;
          
          let tooltipHtml = `<div class="text-sm font-semibold mb-2">${currentMonth}</div>`;
          let monthlyTotal = 0;
          let previousMonthTotal = 0;

          // Calculate totals
          params.forEach((param) => {
            const value = Number(param.value) || 0;
            monthlyTotal += value;
            
            // Get previous month value if available
            if (currentMonthIndex > 0) {
              const seriesIndex = (seriesData ?? []).findIndex(s => s.name === param.seriesName);
              if (
                seriesData &&
                seriesIndex >= 0 &&
                seriesData[seriesIndex] &&
                Array.isArray(seriesData[seriesIndex].data) &&
                seriesData[seriesIndex].data[currentMonthIndex - 1] !== undefined
              ) {
                previousMonthTotal += seriesData[seriesIndex].data?.[currentMonthIndex - 1] ?? 0;
              }
            }
          });

          // Month-over-month change for total
          const totalMoM = calculateMonthOverMonth(monthlyTotal, previousMonthTotal);
          const totalMoMPercent = previousMonthTotal > 0 ? ((monthlyTotal - previousMonthTotal) / previousMonthTotal) * 100 : 0;

          // Add context for significant total variation
          let significantVariationContext = '';
          if (Math.abs(totalMoMPercent) > 25) {
            if (totalMoMPercent > 25) {
              significantVariationContext = `<div class="text-xs mt-2 p-2 bg-yellow-100 dark:bg-yellow-900/20 rounded">
                <strong>Significant increase detected (${totalMoMPercent > 0 ? '+' : ''}${totalMoMPercent.toFixed(1)}%)</strong><br/>
                Common causes: Seasonal demand, new service launches, or policy changes
              </div>`;
            } else if (totalMoMPercent < -25) {
              significantVariationContext = `<div class="text-xs mt-2 p-2 bg-blue-100 dark:bg-blue-900/20 rounded">
                <strong>Significant decrease detected (${totalMoMPercent.toFixed(1)}%)</strong><br/>
                Common causes: Service optimization, reduced demand, or operational changes
              </div>`;
            }
          }

          // Render each series with enhanced information
          params.forEach((param) => {
            const value = Number(param.value) || 0;
            const percentage = monthlyTotal > 0 ? ((value / monthlyTotal) * 100).toFixed(1) : '0';
            
            // Get previous month value for this series
            let previousValue: number | undefined;
            if (currentMonthIndex > 0) {
              const seriesIndex = (seriesData ?? []).findIndex(s => s.name === param.seriesName);
              if (seriesIndex >= 0) {
                previousValue = seriesData?.[seriesIndex]?.data?.[currentMonthIndex - 1] ?? undefined;
              }
            }
            
            const momChange = calculateMonthOverMonth(value, previousValue);
            const contextInfo = getServiceContextualInfo(parseFloat(percentage), param.seriesName);
            
            tooltipHtml += `
            <div class="mb-2">
              <div class="flex items-center justify-between gap-2 text-xs" style="line-height: 1.5;">
                <span class="flex items-center">
                  ${param.marker} 
                  <span class="font-medium">${param.seriesName}:</span>
                </span>
                <span class="font-medium">${value.toLocaleString()} services <span style="color: ${resolvedTheme === 'dark' ? '#A0AEC0' : '#718096'}; font-size: 0.7rem;">(${percentage}%)</span></span>
              </div>
              ${momChange ? `<div class="text-xs ml-5" style="color: ${resolvedTheme === 'dark' ? '#CBD5E0' : '#4A5568'};">MoM: ${momChange}</div>` : ''}
              ${contextInfo ? `<div class="text-xs ml-5 mt-1" style="color: ${resolvedTheme === 'dark' ? '#A0AEC0' : '#718096'};">${contextInfo}</div>` : ''}
            </div>`;
          });

          tooltipHtml += `
          <div class="flex items-center justify-between text-sm mt-2 pt-2 border-t" style="border-color: ${resolvedTheme === 'dark' ? '#4A5568' : '#CBD5E0'};">
            <span class="font-semibold">Total:</span>
            <span class="font-bold">${monthlyTotal.toLocaleString()} services ${totalMoM ? `<span style="color: ${resolvedTheme === 'dark' ? '#A0AEC0' : '#718096'}; font-size: 0.8rem;">(${totalMoM})</span>` : ''}</span>
          </div>`;
          
          // Add significant variation context if applicable
          tooltipHtml += significantVariationContext;
          
          return tooltipHtml;
        },
      },
      legend: {
        data: (seriesData ?? []).map((s) => s.name),
        inactiveColor: resolvedTheme === 'dark' ? '#718096' : '#A0AEC0',
        textStyle: { color: resolvedTheme === 'dark' ? '#E2E8F0' : '#2D3748' },
        top: '5%',
        type: 'scroll',
        show: true,
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '12%',
        top: '20%',
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: monthLabels,
        axisLabel: { color: resolvedTheme === 'dark' ? '#A0AEC0' : '#4A5568' },
        axisLine: {
          lineStyle: {
            color: resolvedTheme === 'dark' ? '#4A5568' : '#CBD5E0',
          },
        },
        axisTick: { show: false },
      },
      yAxis: {
        type: 'value',
        name: 'Service Volume',
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
      dataZoom: [
        {
          show: true,
          type: 'slider',
          bottom: 10,
          height: 20,
          start: 0,
          end: 100,
          throttle: 100,
          backgroundColor: resolvedTheme === 'dark' ? '#374151' : '#f3f4f6',
          borderColor: resolvedTheme === 'dark' ? '#4b5563' : '#d1d5db',
        },
        {
          type: 'inside',
          filterMode: 'filter',
          zoomOnMouseWheel: false,
          moveOnMouseMove: true,
          moveOnMouseWheel: false,
          preventDefaultMouseMove: false,
          throttle: 50,
        },
      ],
      series: (seriesData ?? []).map((s, index) => ({
        name: s.name,
        type: 'line',
        smooth: true,
        showSymbol: false,
        lineStyle: { width: 2.5 },
        itemStyle: { color: palette[index % palette.length] },
        color: palette[index % palette.length],
        emphasis: { focus: 'series', lineStyle: { width: 3.5 } },
        data: s.data,
      })),
    }),
    [monthLabels, seriesData, palette, resolvedTheme]
  );
  
  if (isLoading) {
    return (
      <div className="h-[400px] animate-pulse bg-muted rounded flex items-center justify-center">
        <div className="text-sm text-muted-foreground">Loading service volume data...</div>
      </div>
    );
  }

  if (!monthLabels || monthLabels.length === 0) {
    return (
      <div className="h-[400px] flex items-center justify-center text-muted-foreground p-4 text-center">
        No service volume data available for the selected period.
      </div>
    );
  }

  return (
    <div className="relative group">
      <ReactEcharts
        option={options}
        notMerge={true}
        lazyUpdate={true}
        theme={resolvedTheme === 'dark' ? 'dark' : undefined}
        style={{ height: height, width: '100%' }}
        opts={{ renderer: 'canvas' }}
      />
    </div>
  );
};

export default ServiceVolumeOverTimeChart;