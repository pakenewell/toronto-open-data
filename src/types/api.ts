import type { ServiceResult, ServiceAggregation, WardAggregation } from './toronto';

export interface DashboardApiResponse {
  timestamp: string;
  requestId: string;
  meta: {
    request_id: string;
    updatedDate: string;
  };
  data: DashboardData;
  links: {
    self: string;
    export?: {
      csv: string;
      json: string;
    };
  };
}

export interface DashboardData {
  kpiData: KpiData;
  servicesByDivision: ServiceAggregation[];
  servicesOverTime: ServicesOverTimeItem[];
  servicesByResult: ResultBreakdown[];
  topDivisions: TopListItem[];
  topWards: TopListItem[];
  heatmapData: HeatmapTuple[];
  
  // New enhanced data for charts
  dataQuality: DataQualityMetrics;
  timeSeriesData: TimeSeriesData[];
  costDistribution: CostDistributionBin[];
  highestExpenses: HighestExpenseItem[];
  wardAnalysis: WardAnalysisData;
  readinessMetrics: ReadinessMetrics;
  
  // Field completeness data for data readiness tab
  fieldCompleteness?: FieldCompleteness[];
}

export interface KpiData {
  totalServices: number;
  totalCost: number;
  avgCost: number;
  passRate: number;
  failRate: number;
  uniqueDivisions: number;
  uniqueWards: number;
  dateRange: {
    earliestService: string;
    latestService: string;
    timeSpan: string;
  };
}

export interface ServicesOverTimeItem {
  period: string;
  total_services: number;
  total_cost: number;
  avg_cost: number;
  pass_count: number;
  fail_count: number;
  pass_rate: number;
}

export interface ResultBreakdown {
  result: 'PASS' | 'FAIL' | 'UNKNOWN';
  count: number;
  percentage: number;
  total_cost: number;
  avg_cost: number;
}

export interface TopListItem {
  id: number | string;
  name: string;
  value: number; // This will be total_cost
  count: number;
  avgCost: number;
  passRate: number;
}

export type HeatmapTuple = [number, number, number]; // [year, month, value]

// New enhanced interfaces for chart data
export interface DataQualityMetrics {
  completeness: DataQualityDimension;
  accuracy: DataQualityDimension;
  timeliness: DataQualityDimension;
  consistency: DataQualityDimension;
  validity: DataQualityDimension;
  overallScore: number;
}

export interface DataQualityDimension {
  score: number;
  details: string;
  issues: string[];
  recommendations: string[];
}

export interface TimeSeriesData {
  period: string;
  totalServices: number;
  totalCost: number;
  avgCost: number;
  passCount: number;
  failCount: number;
  unknownCount: number;
  passRate: number;
  failRate: number;
  unknownRate: number;
  momChange: {
    services: number;
    cost: number;
    passRate: number;
  };
  costEfficiency: number; // pass rate / avg cost ratio
}

export interface CostDistributionBin {
  min: number;
  max: number;
  count: number;
  percentage: number;
  label: string;
}

export interface HighestExpenseItem {
  id: number;
  division: string | null;
  ward: number | null;
  cost: number;
  result: 'PASS' | 'FAIL' | 'UNKNOWN';
  startDate: string | null;
  endDate: string | null;
  notes: string | null;
  rank: number;
}

export interface WardAnalysisData {
  validWards: WardMetrics[];
  invalidWard66: Ward66Analysis;
  wardEfficiencyRanking: WardEfficiencyItem[];
  totalWardsCovered: number;
  wardCoveragePercentage: number;
}

export interface WardMetrics {
  ward: number;
  totalServices: number;
  totalCost: number;
  avgCost: number;
  passRate: number;
  failRate: number;
  unknownRate: number;
  costEfficiency: number;
  servicesPerCapita?: number; // if population data available
}

export interface Ward66Analysis {
  count: number;
  totalCost: number;
  avgCost: number;
  passRate: number;
  impactAnalysis: {
    percentageOfTotalServices: number;
    percentageOfTotalCost: number;
    comparedToValidWards: {
      avgCostDifference: number;
      passRateDifference: number;
    };
  };
  recommendations: string[];
}

export interface WardEfficiencyItem {
  ward: number;
  efficiencyScore: number;
  totalServices: number;
  totalCost: number;
  passRate: number;
  costPerPassingService: number;
  rank: number;
}

export interface ReadinessMetrics {
  dataReadinessScore: number;
  operationalReadinessScore: number;
  qualityReadinessScore: number;
  overallReadinessScore: number;
  
  breakdown: {
    dataCompleteness: number;
    dataFreshness: number;
    dataConsistency: number;
    operationalEfficiency: number;
    serviceReliability: number;
    costManagement: number;
    qualityAssurance: number;
    processMaturity: number;
  };
  
  recommendations: ReadinessRecommendation[];
  criticalIssues: string[];
  strengths: string[];
  
  // Consolidated 5 dimensions for UI display
  consolidatedDimensions?: {
    accuracy: number;
    consistency: number;
    completeness: number;
    timeliness: number;
    metadata: number;
  };
}

export interface FieldCompleteness {
  field: string;
  completeness: number;
  totalRecords: number;
  completeRecords: number;
  missingRecords: number;
  description?: string;
}

export interface ReadinessRecommendation {
  category: 'data' | 'operational' | 'quality';
  priority: 'high' | 'medium' | 'low';
  issue: string;
  recommendation: string;
  estimatedImpact: string;
}