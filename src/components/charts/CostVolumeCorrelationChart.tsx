import dynamic from 'next/dynamic';
import { useTheme } from 'next-themes';
import React, { useMemo } from 'react';
import { formatCurrency, formatNumber } from '@/src/lib/utils/formatters';
import { getThemeColors, municipalChartPalette } from '@/src/lib/utils/municipalColors';
import HelpTooltip from '../ui/HelpTooltip';

const ReactEcharts = dynamic(() => import('echarts-for-react'), {
  ssr: false,
  loading: () => (
    <div className="h-[400px] animate-pulse bg-muted rounded flex items-center justify-center">
      <div className="text-sm text-muted-foreground">Loading Cost-Volume Correlation...</div>
    </div>
  ),
});

interface CostVolumeDataPoint {
  period: string;
  totalCost: number;
  totalServices: number;
  avgCost: number;
}

interface CostVolumeCorrelationChartProps {
  data: CostVolumeDataPoint[];
  title?: string;
  isLoading?: boolean;
  height?: string;
  showTrendline?: boolean;
}

const CostVolumeCorrelationChart: React.FC<CostVolumeCorrelationChartProps> = ({
  data,
  title = "Cost & Volume Analysis",
  isLoading = false,
  height = '450px',
  showTrendline = true,
}) => {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const themeColors = getThemeColors(isDark);

  const chartData = useMemo(() => {
    if (!data || data.length === 0) {
      return {
        periods: [],
        costData: [],
        volumeData: [],
        correlationCoeff: 0,
        trendAnalysis: null,
      };
    }

    const periods = data.map(item => item.period);
    const costData = data.map(item => item.totalCost);
    const volumeData = data.map(item => item.totalServices);

    // Calculate correlation coefficient
    const n = costData.length;
    if (n < 2) {
      return { periods, costData, volumeData, correlationCoeff: 0, trendAnalysis: null };
    }

    const meanCost = costData.reduce((sum, val) => sum + val, 0) / n;
    const meanVolume = volumeData.reduce((sum, val) => sum + val, 0) / n;

    let numerator = 0;
    let sumSquaredCost = 0;
    let sumSquaredVolume = 0;

    for (let i = 0; i < n; i++) {
      const costDiff = costData[i] - meanCost;
      const volumeDiff = volumeData[i] - meanVolume;
      numerator += costDiff * volumeDiff;
      sumSquaredCost += costDiff * costDiff;
      sumSquaredVolume += volumeDiff * volumeDiff;
    }

    const correlationCoeff = numerator / Math.sqrt(sumSquaredCost * sumSquaredVolume);

    // Calculate trend analysis
    const trendAnalysis = {
      costTrend: ((costData[n-1] - costData[0]) / costData[0] * 100),
      volumeTrend: ((volumeData[n-1] - volumeData[0]) / volumeData[0] * 100),
    };

    return { periods, costData, volumeData, correlationCoeff, trendAnalysis };
  }, [data]);

  const option = useMemo(() => {
    const { periods, costData, volumeData, correlationCoeff } = chartData;

    return {
      title: {
        text: title,
        left: 'left',
        textStyle: {
          color: themeColors.foreground,
          fontSize: 24,
          fontWeight: 600,
        },
      },
      tooltip: {
        trigger: 'axis',
        backgroundColor: themeColors.tooltip.background,
        borderColor: themeColors.tooltip.border,
        borderWidth: 1,
        textStyle: { color: themeColors.tooltip.text },
        padding: [12, 16],
        formatter: (params: any) => {
          if (!params || params.length === 0) return '';
          
          const period = params[0].axisValue;
          let tooltipHtml = `<div class="font-semibold mb-3">${period}</div>`;
          
          params.forEach((param: any) => {
            let value = param.value;
            let formattedValue = '';
            
            if (param.seriesName.includes('Cost') && !param.seriesName.includes('Average')) {
              formattedValue = formatCurrency(value);
            } else if (param.seriesName.includes('Services')) {
              formattedValue = formatNumber(value) + ' services';
            }
            
            tooltipHtml += `
            <div class="flex items-center justify-between gap-4 py-1">
              <div class="flex items-center gap-2">
                <div class="w-3 h-3 rounded-full" style="background-color: ${param.color};"></div>
                <span>${param.seriesName}</span>
              </div>
              <span class="font-medium">${formattedValue}</span>
            </div>`;
          });
          
          return tooltipHtml;
        },
      },
      legend: {
        data: ['Total Cost', 'Total Services'],
        top: '8%',
        textStyle: { color: themeColors.foreground },
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '10%',
        top: '20%',
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        data: periods,
        axisLabel: { 
          color: themeColors.muted,
          rotate: 45,
          fontSize: 12,
        },
        axisLine: {
          lineStyle: { color: themeColors.border },
        },
      },
      yAxis: [
        {
          type: 'value',
          name: 'Total Cost ($)',
          position: 'left',
          nameTextStyle: {
            color: themeColors.muted,
            padding: [0, 0, 0, -30],
          },
          axisLabel: {
            formatter: (value: number) => formatCurrency(value, { compact: true }),
            color: themeColors.muted,
            fontSize: 14,
          },
          axisLine: {
            lineStyle: { color: themeColors.border },
          },
          splitLine: {
            lineStyle: { 
              color: themeColors.border,
              type: 'dashed',
            },
          },
        },
        {
          type: 'value',
          name: 'Services Count',
          position: 'right',
          nameTextStyle: {
            color: themeColors.muted,
            padding: [0, -30, 0, 0],
          },
          axisLabel: {
            formatter: (value: number) => formatNumber(value),
            color: themeColors.muted,
            fontSize: 14,
          },
          axisLine: {
            lineStyle: { color: themeColors.border },
          },
          splitLine: { show: false },
        },
      ],
      series: [
        {
          name: 'Total Cost',
          type: 'line',
          yAxisIndex: 0,
          data: costData,
          lineStyle: {
            color: municipalChartPalette[0],
            width: 3,
          },
          itemStyle: {
            color: municipalChartPalette[0],
          },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(10, 48, 119, 0.2)' },
                { offset: 1, color: 'rgba(10, 48, 119, 0.05)' }
              ]
            }
          },
          smooth: true,
          symbol: 'circle',
          symbolSize: 10,
        },
        {
          name: 'Total Services',
          type: 'line',
          yAxisIndex: 1,
          data: volumeData,
          lineStyle: {
            color: municipalChartPalette[1],
            width: 3,
          },
          itemStyle: {
            color: municipalChartPalette[1],
          },
          smooth: true,
          symbol: 'diamond',
          symbolSize: 10,
        },
      ],
    };
  }, [chartData, title, themeColors]);

  if (isLoading) {
    return (
      <div className="municipal-card">
        <div className="h-[400px] animate-pulse bg-muted rounded flex items-center justify-center">
          <div className="text-sm text-muted-foreground">Loading analysis...</div>
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="municipal-card">
        <div className="h-[400px] flex items-center justify-center">
          <div className="text-muted-foreground">No data available for analysis</div>
        </div>
      </div>
    );
  }

  const { correlationCoeff, trendAnalysis } = chartData;

  return (
    <div className="municipal-card">

      <ReactEcharts
        option={option}
        style={{ height }}
        opts={{ renderer: 'canvas' }}
      />

    </div>
  );
};

export default CostVolumeCorrelationChart;