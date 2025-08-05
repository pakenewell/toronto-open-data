# Toronto Open Data Chart Components

This directory contains chart components adapted from the OnOurDime project specifically for the Toronto Open Data dashboard. These components are designed to visualize Toronto city service results data with a Toronto-themed color palette and appropriate contextual information.

## Components

### 1. ServiceReadinessGauge
A gauge chart showing service readiness as a percentage (0-100%).
- **Adapted from**: AutonomyGauge (1-5 scale → 0-100% scale)
- **Use case**: Display overall service readiness or health score
- **Colors**: Toronto-themed gradient (red → orange → yellow → green → teal)

```tsx
import { ServiceReadinessGauge } from '@/components/charts';

<ServiceReadinessGauge 
  value={85} 
  description="Overall service readiness score"
  size={200}
/>
```

### 2. DataQualityRadarChart
A radar chart displaying data quality dimensions.
- **Adapted from**: MandateSpiderChart
- **Use case**: Show data quality metrics across multiple dimensions
- **Dimensions**: Completeness, Accuracy, Timeliness, Consistency, Validity, Accessibility

```tsx
import { DataQualityRadarChart } from '@/components/charts';

<DataQualityRadarChart 
  qualityMetrics={{
    completeness: 85,
    accuracy: 92,
    timeliness: 78,
    consistency: 88,
    validity: 90,
    accessibility: 95
  }}
  collapsible={true}
/>
```

### 3. ServiceVolumeOverTimeChart
A line chart showing service volume trends over time.
- **Adapted from**: SpendingOverTimeChart
- **Use case**: Display service volume trends by result type (PASS/FAIL/UNKNOWN)
- **Features**: Interactive tooltips, zoom controls, contextual insights

```tsx
import { ServiceVolumeOverTimeChart } from '@/components/charts';

<ServiceVolumeOverTimeChart 
  monthLabels={['Jan 2024', 'Feb 2024', 'Mar 2024']}
  seriesData={[
    { name: 'PASS', data: [120, 145, 130] },
    { name: 'FAIL', data: [15, 12, 18] },
    { name: 'UNKNOWN', data: [5, 8, 3] }
  ]}
  palette={['#16a34a', '#dc2626', '#ca8a04']}
/>
```

### 4. ServiceResultsDonutChart
A donut chart showing distribution of service results.
- **Adapted from**: Donut patterns in MonthlySpendingHeatmap
- **Use case**: Show proportion of PASS/FAIL/UNKNOWN service results
- **Features**: Custom center text, interactive tooltips, contextual information

```tsx
import { ServiceResultsDonutChart } from '@/components/charts';

<ServiceResultsDonutChart 
  data={[
    { name: 'PASS', value: 450, color: '#16a34a' },
    { name: 'FAIL', value: 35, color: '#dc2626' },
    { name: 'UNKNOWN', value: 15, color: '#ca8a04' }
  ]}
  title="Service Results Distribution"
  centerText={{ 
    title: '500', 
    subtitle: 'Total Services' 
  }}
  formatValueFn={(value) => value.toLocaleString()}
/>
```

## Key Adaptations Made

### Theme and Colors
- **Toronto Branding**: Updated color palette to use Toronto-themed colors
- **Primary Colors**: Teal (#0f766e) as primary, maintaining accessibility
- **Result Colors**: Green (PASS), Red (FAIL), Yellow/Orange (UNKNOWN)

### Data Structure Adaptations
- **Service Focus**: Changed from financial data to service volume/quality metrics
- **Toronto Context**: Added contextual tooltips relevant to city services
- **Result Categories**: Adapted for PASS/FAIL/UNKNOWN service results

### Functionality Enhancements
- **Accessibility**: Maintained ARIA labels and screen reader support
- **Responsiveness**: Preserved responsive design patterns
- **Interactivity**: Kept interactive features like zoom, tooltips, and data views

## Dependencies

These components require:
- `echarts` and `echarts-for-react` for chart rendering
- `framer-motion` for animations (DataQualityRadarChart)
- `next-themes` for theme detection
- `lucide-react` for icons
- `tailwindcss` for styling

## Usage Notes

1. All components support both light and dark themes via `next-themes`
2. Components are designed to work with the Toronto service results database schema
3. Loading states are built-in for all components
4. Tooltips provide contextual information specific to Toronto city services
5. Components handle edge cases like missing data gracefully

## Integration with Toronto Data

These components are designed to work with data from the `city_of_toronto.service_results` table:

```sql
-- Example data structure
{
  id: bigint,
  start_date: date,
  end_date: date,
  service_division_owner: text,
  service_result: text, -- 'PASS', 'FAIL', or empty
  ward: bigint,
  estimated_cost: double precision,
  notes: text
}
```

The charts can be integrated into the main dashboard to provide visual insights into Toronto's service performance and data quality.