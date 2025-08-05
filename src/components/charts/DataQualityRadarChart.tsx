import { motion } from 'framer-motion';
import { ChevronDown, ChevronUp } from 'lucide-react';
import React, { useMemo } from 'react';
import dynamic from 'next/dynamic';
import { useTheme } from 'next-themes';

const ReactEcharts = dynamic(() => import('echarts-for-react'), {
  ssr: false,
  loading: () => <div className="h-[200px] animate-pulse bg-muted rounded" />,
});

interface DataQualityRadarChartProps {
  qualityMetrics: Record<string, number> | null;
  className?: string;
  size?: number;
  collapsible?: boolean;
}

interface QualityDataPoint {
  key: string;
  label: string;
  value: number; // 0-100 scale normalized
}

export function DataQualityRadarChart({ 
  qualityMetrics, 
  className = '', 
  size = 200,
  collapsible = false 
}: DataQualityRadarChartProps) {
  const [isCollapsed, setIsCollapsed] = React.useState(collapsible);
  const { resolvedTheme } = useTheme();

  const { chartOptions, qualityData } = useMemo(() => {
    if (!qualityMetrics || typeof qualityMetrics !== 'object') {
      return { chartOptions: null, qualityData: [] };
    }

    const dataPoints: QualityDataPoint[] = [];
    
    // Map Toronto service data quality dimensions - 5 consolidated dimensions
    const qualityMapping: Record<string, string> = {
      completeness: 'Data Completeness',
      accuracy: 'Data Accuracy',
      timeliness: 'Data Timeliness',
      consistency: 'Data Consistency',
      metadata: 'Metadata Quality'
    };

    // Extract quality metrics
    Object.entries(qualityMetrics).forEach(([key, value]) => {
      if (typeof value === 'number') {
        dataPoints.push({
          key,
          label: qualityMapping[key] || key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
          value: Math.max(0, Math.min(100, value)),
        });
      }
    });

    // Default quality dimensions if none provided - 5 consolidated dimensions
    if (dataPoints.length === 0) {
      const defaultMetrics = [
        { key: 'completeness', label: 'Data Completeness', value: 60 },
        { key: 'accuracy', label: 'Data Accuracy', value: 85 },
        { key: 'timeliness', label: 'Data Timeliness', value: 45 },
        { key: 'consistency', label: 'Data Consistency', value: 88 },
        { key: 'metadata', label: 'Metadata Quality', value: 75 }
      ];
      dataPoints.push(...defaultMetrics);
    }

    // Prepare data for ECharts radar
    const indicators = dataPoints.map(item => ({
      name: item.label,
      max: 100,
      min: 0
    }));

    const chartOptions = {
      radar: {
        indicator: indicators,
        shape: 'polygon',
        splitNumber: 5,
        name: {
          textStyle: {
            color: resolvedTheme === 'dark' ? '#e2e8f0' : '#374151',
            fontSize: 11
          }
        },
        splitLine: {
          lineStyle: {
            color: resolvedTheme === 'dark' ? '#374151' : '#e5e7eb'
          }
        },
        splitArea: {
          show: true,
          areaStyle: {
            color: resolvedTheme === 'dark' 
              ? ['rgba(255,255,255,0.02)', 'rgba(255,255,255,0.05)']
              : ['rgba(0,0,0,0.01)', 'rgba(0,0,0,0.03)']
          }
        },
        axisLine: {
          lineStyle: {
            color: resolvedTheme === 'dark' ? '#4b5563' : '#d1d5db'
          }
        }
      },
      series: [{
        name: 'Data Quality',
        type: 'radar',
        data: [{
          value: dataPoints.map(item => item.value),
          name: 'Quality Score',
          itemStyle: {
            color: '#0f766e' // Toronto teal
          },
          areaStyle: {
            color: 'rgba(15, 118, 110, 0.2)'
          },
          lineStyle: {
            color: '#0f766e',
            width: 2
          },
          symbol: 'circle',
          symbolSize: 4
        }]
      }],
      tooltip: {
        backgroundColor: resolvedTheme === 'dark' ? 'rgba(26,32,44,0.95)' : 'rgba(255,255,255,0.95)',
        borderColor: resolvedTheme === 'dark' ? '#4A5568' : '#E2E8F0',
        textStyle: { color: resolvedTheme === 'dark' ? '#E2E8F0' : '#2D3748' },
        formatter: (params: any) => {
          if (!params || !params.value) return '';
          const data = params.value;
          let html = `<div class="font-semibold mb-2">${params.name}</div>`;
          dataPoints.forEach((point, index) => {
            html += `<div class="flex justify-between items-center mb-1">
              <span>${point.label}:</span>
              <span class="font-medium">${data[index]}%</span>
            </div>`;
          });
          return html;
        }
      }
    };

    return { chartOptions, qualityData: dataPoints };
  }, [qualityMetrics, resolvedTheme]);

  if (!qualityData.length) {
    return (
      <div className={`flex items-center justify-center p-4 text-sm text-muted-foreground ${className}`}>
        No data quality metrics available
      </div>
    );
  }

  const chartContent = (
    <div style={{ width: size, height: size }}>
      {chartOptions && (
        <ReactEcharts
          option={chartOptions}
          style={{ width: '100%', height: '100%' }}
          opts={{ renderer: 'canvas' }}
        />
      )}
    </div>
  );

  if (collapsible) {
    return (
      <div className={className}>
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="w-full flex justify-between items-center p-2 text-sm font-medium hover:bg-muted rounded transition-colors"
        >
          <span>Data Quality Analysis</span>
          {isCollapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
        </button>
        
        {!isCollapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex justify-center overflow-visible">
              {chartContent}
            </div>
            
            {/* Data table */}
            <div className="mt-4 space-y-1">
              {qualityData.map((item) => (
                <div key={item.key} className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">{item.label}:</span>
                  <div className="flex items-center gap-2">
                    <div className="w-16 bg-muted rounded-full h-2">
                      <div 
                        className="bg-primary h-2 rounded-full transition-all duration-300"
                        style={{ width: `${item.value}%` }}
                      />
                    </div>
                    <span className="font-medium w-12 text-right">{item.value}%</span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    );
  }

  return (
    <div className={className}>
      {chartContent}
    </div>
  );
}

export default DataQualityRadarChart;