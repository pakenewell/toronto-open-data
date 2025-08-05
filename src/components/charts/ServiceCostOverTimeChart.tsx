import dynamic from 'next/dynamic';
import { useTheme } from 'next-themes';
import React, { useMemo } from 'react';
import { formatCurrency } from '@/src/lib/utils/formatters';
import { getThemeColors, municipalChartPalette } from '@/src/lib/utils/municipalColors';

const ReactEcharts = dynamic(() => import('echarts-for-react'), {
  ssr: false,
  loading: () => (
    <div className="h-[400px] animate-pulse bg-muted rounded flex items-center justify-center">
      <div className="text-sm text-muted-foreground">Loading Cost Analysis Chart...</div>
    </div>
  ),
});

interface CostTimeSeriesData {
  period: string;
  totalCost: number;
  avgCost: number;
}

interface ServiceCostOverTimeChartProps {
  data: CostTimeSeriesData[];
  title?: string;
  showAvgCost?: boolean;
  isLoading?: boolean;
  height?: string;
}

const ServiceCostOverTimeChart: React.FC<ServiceCostOverTimeChartProps> = ({
  data,
  title = "Service Costs Over Time",
  showAvgCost = true,
  isLoading = false,
  height = '400px',
}) => {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const themeColors = getThemeColors(isDark);

  const chartData = useMemo(() => {
    if (!data || data.length === 0) {
      return {
        monthLabels: [],
        totalCostData: [],
        avgCostData: [],
      };
    }

    return {
      monthLabels: data.map(item => item.period),
      totalCostData: data.map(item => item.totalCost),
      avgCostData: data.map(item => item.avgCost),
    };
  }, [data]);

  const option = useMemo(() => {
    const { monthLabels, totalCostData, avgCostData } = chartData;

    return {
      title: {
        text: title,
        left: 'left',
        textStyle: {
          color: themeColors.foreground,
          fontSize: 16,
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
          
          const month = params[0].axisValue;
          let tooltipHtml = `<div class="font-semibold mb-2">${month}</div>`;
          
          params.forEach((param: any) => {
            const value = param.value;
            const formattedValue = param.seriesName.includes('Average') 
              ? formatCurrency(value) + ' per service'
              : formatCurrency(value) + ' total';
            
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
        data: showAvgCost ? ['Total Cost', 'Average Cost per Service'] : ['Total Cost'],
        top: '8%',
        textStyle: { color: themeColors.foreground },
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        top: '20%',
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        data: monthLabels,
        axisLabel: { 
          color: themeColors.muted,
          rotate: 45,
        },
        axisLine: {
          lineStyle: { color: themeColors.border },
        },
        axisTick: {
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
            padding: [0, 0, 0, -20],
          },
          axisLabel: {
            formatter: (value: number) => formatCurrency(value, { compact: true }),
            color: themeColors.muted,
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
        ...(showAvgCost ? [{
          type: 'value',
          name: 'Average Cost per Service ($)',
          position: 'right',
          nameTextStyle: {
            color: themeColors.muted,
            padding: [0, -20, 0, 0],
          },
          axisLabel: {
            formatter: (value: number) => formatCurrency(value, { compact: true }),
            color: themeColors.muted,
          },
          axisLine: {
            lineStyle: { color: themeColors.border },
          },
          splitLine: { show: false },
        }] : []),
      ],
      series: [
        {
          name: 'Total Cost',
          type: 'line',
          yAxisIndex: 0,
          data: totalCostData,
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
                { offset: 0, color: 'rgba(10, 48, 119, 0.3)' },
                { offset: 1, color: 'rgba(10, 48, 119, 0.05)' }
              ]
            }
          },
          smooth: true,
          symbol: 'circle',
          symbolSize: 6,
        },
        ...(showAvgCost ? [{
          name: 'Average Cost per Service',
          type: 'line',
          yAxisIndex: 1,
          data: avgCostData,
          lineStyle: {
            color: municipalChartPalette[1],
            width: 2,
            type: 'dashed',
          },
          itemStyle: {
            color: municipalChartPalette[1],
          },
          smooth: true,
          symbol: 'diamond',
          symbolSize: 5,
        }] : []),
      ],
    };
  }, [chartData, title, showAvgCost, themeColors]);

  if (isLoading) {
    return (
      <div className="municipal-card">
        <div className="h-[400px] animate-pulse bg-muted rounded flex items-center justify-center">
          <div className="text-sm text-muted-foreground">Loading cost analysis...</div>
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="municipal-card">
        <div className="h-[400px] flex items-center justify-center">
          <div className="text-muted-foreground">No cost data available</div>
        </div>
      </div>
    );
  }

  return (
    <div className="municipal-card">
      <ReactEcharts
        option={option}
        style={{ height }}
        opts={{ renderer: 'canvas' }}
      />
      <div className="mt-4 p-4 bg-muted/30 rounded-md">
        <h4 className="text-municipal-sm font-medium text-foreground mb-2">Cost Analysis Insights</h4>
        <p className="text-municipal-xs text-muted-foreground leading-relaxed">
          Track service cost trends over time to identify seasonal patterns and budget efficiency. 
          The total cost shows overall spending while average cost per service indicates operational efficiency.
          {showAvgCost && " Compare both metrics to understand whether cost changes are due to volume or efficiency shifts."}
        </p>
      </div>
    </div>
  );
};

export default ServiceCostOverTimeChart;