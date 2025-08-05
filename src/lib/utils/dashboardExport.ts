import type { DashboardData } from '@/src/types/api';
import type { ServiceFilters } from '@/src/types/toronto';

export interface ComprehensiveExportOptions {
  format: 'csv' | 'json' | 'pdf';
  includeMetadata?: boolean;
  sections?: ExportSection[];
  tabContext?: 'data-explorer' | 'data-readiness' | 'dictionary' | 'all';
  customFilename?: string;
}

export type ExportSection = 
  | 'summary' 
  | 'services' 
  | 'divisions' 
  | 'wards' 
  | 'timeSeries' 
  | 'expenses' 
  | 'costDistribution'
  | 'wardAnalysis'
  | 'dataQuality'
  | 'readinessMetrics'
  | 'fieldCompleteness'
  | 'recommendations';

interface ExportMetadata {
  exportDate: string;
  exportTime: string;
  tabContext: string;
  filters: ServiceFilters;
  dataVersion: string;
  totalRecords: number;
  dateRange: {
    start: string;
    end: string;
  };
  generatedBy: string;
  description: string;
}

/**
 * Main comprehensive export function for all dashboard data
 */
export const exportComprehensiveDashboardData = (
  data: DashboardData,
  filters: ServiceFilters,
  options: ComprehensiveExportOptions
): void => {
  const metadata = generateExportMetadata(data, filters, options);

  switch (options.format) {
    case 'csv':
      exportAsComprehensiveCSV(data, metadata, options);
      break;
    case 'json':
      exportAsComprehensiveJSON(data, metadata, options);
      break;
    case 'pdf':
      exportAsComprehensivePDF(data, metadata, options);
      break;
    default:
      throw new Error(`Unsupported format: ${options.format}`);
  }
};

/**
 * Generate comprehensive metadata for export
 */
const generateExportMetadata = (
  data: DashboardData,
  filters: ServiceFilters,
  options: ComprehensiveExportOptions
): ExportMetadata => {
  const now = new Date();
  
  return {
    exportDate: now.toISOString().split('T')[0],
    exportTime: now.toISOString(),
    tabContext: options.tabContext || 'all',
    filters,
    dataVersion: '1.0',
    totalRecords: data.kpiData.totalServices,
    dateRange: {
      start: data.kpiData.dateRange.earliestService,
      end: data.kpiData.dateRange.latestService
    },
    generatedBy: 'Toronto Open Data Dashboard',
    description: getExportDescription(options.tabContext || 'all')
  };
};

/**
 * Get description based on tab context
 */
const getExportDescription = (tabContext: string): string => {
  switch (tabContext) {
    case 'data-explorer':
      return 'Complete data analysis export including KPIs, service results, division/ward breakdowns, and trend analysis';
    case 'data-readiness':
      return 'Data readiness assessment export including quality metrics, completeness analysis, and improvement recommendations';
    case 'dictionary':
      return 'Data dictionary export with field definitions, quality metrics, and usage guidelines';
    default:
      return 'Comprehensive Toronto city service data export with all dashboard metrics and analysis';
  }
};

/**
 * Export as comprehensive CSV with enhanced formatting
 */
const exportAsComprehensiveCSV = (
  data: DashboardData,
  metadata: ExportMetadata,
  options: ComprehensiveExportOptions
): void => {
  const sections = options.sections || getAllSectionsForTab(options.tabContext || 'all');
  let csvContent = '';

  // Add comprehensive metadata header
  if (options.includeMetadata !== false) {
    csvContent += generateComprehensiveMetadataCSV(metadata);
    csvContent += '\n\n';
  }

  // Generate content for each section
  sections.forEach((section, index) => {
    if (index > 0) csvContent += '\n\n';
    
    switch (section) {
      case 'summary':
        csvContent += generateEnhancedSummaryCSV(data.kpiData, metadata);
        break;
      case 'services':
        csvContent += generateEnhancedServicesCSV(data.servicesByResult);
        break;
      case 'divisions':
        csvContent += generateEnhancedDivisionsCSV(data.servicesByDivision);
        break;
      case 'wards':
        csvContent += generateEnhancedWardsCSV(data.topWards);
        break;
      case 'timeSeries':
        if (data.timeSeriesData) {
          csvContent += generateEnhancedTimeSeriesCSV(data.timeSeriesData);
        }
        break;
      case 'expenses':
        if (data.highestExpenses) {
          csvContent += generateEnhancedExpensesCSV(data.highestExpenses);
        }
        break;
      case 'costDistribution':
        if (data.costDistribution) {
          csvContent += generateEnhancedCostDistributionCSV(data.costDistribution);
        }
        break;
      case 'wardAnalysis':
        if (data.wardAnalysis) {
          csvContent += generateEnhancedWardAnalysisCSV(data.wardAnalysis);
        }
        break;
      case 'dataQuality':
        csvContent += generateDataQualityCSV(data.dataQuality);
        break;
      case 'readinessMetrics':
        csvContent += generateReadinessMetricsCSV(data.readinessMetrics);
        break;
      case 'fieldCompleteness':
        if (data.fieldCompleteness) {
          csvContent += generateFieldCompletenessCSV(data.fieldCompleteness);
        }
        break;
      case 'recommendations':
        csvContent += generateRecommendationsCSV(data.readinessMetrics.recommendations);
        break;
    }
  });

  const filename = options.customFilename || generateComprehensiveFilename(metadata, 'csv');
  downloadFile(csvContent, filename, 'text/csv;charset=utf-8;');
};

/**
 * Export as comprehensive JSON with enhanced structure
 */
const exportAsComprehensiveJSON = (
  data: DashboardData,
  metadata: ExportMetadata,
  options: ComprehensiveExportOptions
): void => {
  const sections = options.sections || getAllSectionsForTab(options.tabContext || 'all');
  
  const exportData: any = {
    metadata: options.includeMetadata !== false ? metadata : undefined,
    exportInfo: {
      version: '2.0',
      format: 'json',
      timestamp: metadata.exportTime,
      tabContext: metadata.tabContext,
      sectionsIncluded: sections
    }
  };

  // Add data sections
  sections.forEach((section) => {
    switch (section) {
      case 'summary':
        exportData.summary = {
          kpiData: data.kpiData,
          analysisNotes: generateSummaryAnalysis(data.kpiData)
        };
        break;
      case 'services':
        exportData.servicesByResult = {
          data: data.servicesByResult,
          analysis: generateServiceResultAnalysis(data.servicesByResult)
        };
        break;
      case 'divisions':
        exportData.servicesByDivision = {
          data: data.servicesByDivision,
          topPerformers: data.topDivisions,
          analysis: generateDivisionAnalysis(data.servicesByDivision)
        };
        break;
      case 'wards':
        exportData.wardData = {
          topWards: data.topWards,
          wardAnalysis: data.wardAnalysis,
          analysis: generateWardDataAnalysis(data.wardAnalysis)
        };
        break;
      case 'timeSeries':
        if (data.timeSeriesData) {
          exportData.timeSeriesData = {
            data: data.timeSeriesData,
            servicesOverTime: data.servicesOverTime,
            trends: generateTimeSeriesTrends(data.timeSeriesData)
          };
        }
        break;
      case 'expenses':
        if (data.highestExpenses) {
          exportData.expenses = {
            highestExpenses: data.highestExpenses,
            analysis: generateExpenseAnalysis(data.highestExpenses)
          };
        }
        break;
      case 'costDistribution':
        if (data.costDistribution) {
          exportData.costDistribution = {
            data: data.costDistribution,
            analysis: generateCostDistributionAnalysis(data.costDistribution)
          };
        }
        break;
      case 'wardAnalysis':
        if (data.wardAnalysis) {
          exportData.wardAnalysis = data.wardAnalysis;
        }
        break;
      case 'dataQuality':
        exportData.dataQuality = {
          metrics: data.dataQuality,
          analysis: generateDataQualityAnalysis(data.dataQuality)
        };
        break;
      case 'readinessMetrics':
        exportData.readinessMetrics = data.readinessMetrics;
        break;
      case 'fieldCompleteness':
        if (data.fieldCompleteness) {
          exportData.fieldCompleteness = {
            data: data.fieldCompleteness,
            summary: {
              averageCompleteness: data.fieldCompleteness.reduce((sum: number, f: any) => sum + f.completeness, 0) / data.fieldCompleteness.length,
              excellentFields: data.fieldCompleteness.filter((f: any) => f.completeness >= 90).length,
              criticalFields: data.fieldCompleteness.filter((f: any) => f.completeness < 60).length
            }
          };
        }
        break;
      case 'recommendations':
        exportData.recommendations = {
          data: data.readinessMetrics.recommendations,
          criticalIssues: data.readinessMetrics.criticalIssues,
          strengths: data.readinessMetrics.strengths
        };
        break;
    }
  });

  const filename = options.customFilename || generateComprehensiveFilename(metadata, 'json');
  const jsonContent = JSON.stringify(exportData, null, 2);
  downloadFile(jsonContent, filename, 'application/json');
};

/**
 * Export as comprehensive PDF (placeholder for PDF library integration)
 */
const exportAsComprehensivePDF = (
  data: DashboardData,
  metadata: ExportMetadata,
  options: ComprehensiveExportOptions
): void => {
  // This would use a proper PDF library like jsPDF or Puppeteer
  // For now, create a comprehensive HTML version that can be printed to PDF
  
  const sections = options.sections || getAllSectionsForTab(options.tabContext || 'all');
  
  const htmlContent = generateComprehensivePDFHTML(data, metadata, sections, options);
  
  // Open in new window for printing
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Please allow popups to generate PDF export');
    return;
  }

  printWindow.document.write(htmlContent);
  printWindow.document.close();
  
  // Auto-print after content loads
  printWindow.onload = () => {
    setTimeout(() => {
      printWindow.print();
    }, 500);
  };
};

/**
 * Get all sections for a specific tab context
 */
const getAllSectionsForTab = (tabContext: string): ExportSection[] => {
  switch (tabContext) {
    case 'data-explorer':
      return ['summary', 'services', 'divisions', 'wards', 'timeSeries', 'expenses', 'costDistribution', 'wardAnalysis'];
    case 'data-readiness':
      return ['summary', 'dataQuality', 'readinessMetrics', 'fieldCompleteness', 'recommendations'];
    case 'dictionary':
      return ['summary', 'dataQuality'];
    default:
      return ['summary', 'services', 'divisions', 'wards', 'timeSeries', 'expenses', 'costDistribution', 'wardAnalysis', 'dataQuality', 'readinessMetrics', 'fieldCompleteness', 'recommendations'];
  }
};

/**
 * Generate comprehensive metadata CSV section
 */
const generateComprehensiveMetadataCSV = (metadata: ExportMetadata): string => {
  const filterSummary = [];
  if (metadata.filters.startDate) filterSummary.push(`Start Date: ${metadata.filters.startDate}`);
  if (metadata.filters.endDate) filterSummary.push(`End Date: ${metadata.filters.endDate}`);
  if (metadata.filters.serviceDivisionOwner && metadata.filters.serviceDivisionOwner !== 'all') {
    filterSummary.push(`Division: ${metadata.filters.serviceDivisionOwner}`);
  }
  if (metadata.filters.ward && metadata.filters.ward !== 'all') {
    filterSummary.push(`Ward: ${metadata.filters.ward}`);
  }
  if (metadata.filters.serviceResult && metadata.filters.serviceResult !== 'all') {
    filterSummary.push(`Result: ${metadata.filters.serviceResult}`);
  }

  return [
    '=== TORONTO OPEN DATA DASHBOARD EXPORT ===',
    '',
    '📊 EXPORT INFORMATION',
    `Generated By,"${metadata.generatedBy}"`,
    `Export Date,${metadata.exportDate}`,
    `Export Time,${new Date(metadata.exportTime).toLocaleString()}`,
    `Report Type,"${metadata.tabContext.replace('-', ' ').toUpperCase()}"`,
    `Description,"${metadata.description}"`,
    '',
    '📈 DATA SUMMARY',
    `Total Service Records,"${metadata.totalRecords.toLocaleString()}"`,
    `Data Version,${metadata.dataVersion}`,
    `Coverage Period,"${metadata.dateRange.start} to ${metadata.dateRange.end}"`,
    '',
    '🔍 APPLIED FILTERS',
    filterSummary.length > 0 ? `"${filterSummary.join(', ')}"` : '"No filters applied - showing all available data"',
    '',
    '=' .repeat(70)
  ].join('\n');
};

// Enhanced CSV generation functions
const generateEnhancedSummaryCSV = (kpiData: any, metadata: ExportMetadata): string => {
  return [
    '',
    '📊 KEY PERFORMANCE INDICATORS',
    'Metric Name,Value,Description',
    `Total Services,"${kpiData.totalServices.toLocaleString()}",Total number of service records in the dataset`,
    `Total Cost,"$${kpiData.totalCost.toLocaleString()}",Combined estimated cost of all services`,
    `Average Cost Per Service,"$${kpiData.avgCost.toLocaleString()}",Mean cost across all service records`,
    `Service Success Rate,"${kpiData.passRate.toFixed(1)}%",Percentage of services that completed successfully`,
    `Service Failure Rate,"${kpiData.failRate.toFixed(1)}%",Percentage of services that failed to complete`,
    `Number of City Divisions,${kpiData.uniqueDivisions},Count of distinct municipal divisions providing services`,
    `Number of Wards Served,${kpiData.uniqueWards},Count of distinct Toronto wards receiving services`,
    `Data Coverage Period,"${kpiData.dateRange.timeSpan}",Total time span covered by service records`,
    `First Service Date,${kpiData.dateRange.earliestService},Date of the earliest service record`,
    `Most Recent Service Date,${kpiData.dateRange.latestService},Date of the most recent service record`
  ].join('\n');
};

const generateEnhancedServicesCSV = (servicesByResult: any[]): string => {
  const headers = 'Service Result,Service Count,Percentage of Total,Total Cost,Average Cost Per Service,Notes';
  const rows = servicesByResult.map(service => {
    const notes = service.result === 'PASS' ? 'Services completed successfully' :
                  service.result === 'FAIL' ? 'Services that failed to complete' :
                  'Services with unknown or missing result status';
    return `${service.result},"${service.count.toLocaleString()}",${service.percentage.toFixed(1)}%,"$${service.total_cost.toLocaleString()}","$${service.avg_cost.toLocaleString()}","${notes}"`;
  });
  return ['', '🎯 SERVICE RESULTS BREAKDOWN', headers, ...rows].join('\n');
};

const generateEnhancedDivisionsCSV = (divisions: any[]): string => {
  const headers = 'Division Name,Total Services,Total Cost,Average Cost Per Service,Success Rate,Failure Rate,Performance Score';
  const rows = divisions.map(div => {
    const passRate = div.pass_rate ?? 0;
    const failRate = 100 - passRate;
    const avgCost = div.avg_cost ?? 0;
    const performanceScore = avgCost > 0 ? passRate / avgCost * 1000 : 0; // Success rate per $1000 spent
    return `"${div.division || 'Unknown Division'}","${(div.count ?? 0).toLocaleString()}","$${(div.total_cost ?? 0).toLocaleString()}","$${avgCost.toLocaleString()}",${passRate.toFixed(1)}%,${failRate.toFixed(1)}%,${performanceScore.toFixed(2)}`;
  });
  return ['', '🏢 PERFORMANCE BY CITY DIVISION', headers, ...rows].join('\n');
};

const generateEnhancedWardsCSV = (wards: any[]): string => {
  const headers = 'Ward Number,Ward Name,Total Services,Total Cost,Average Cost Per Service,Success Rate,Service Efficiency';
  const rows = wards.map(ward => {
    const count = ward.count ?? 0;
    const value = ward.value ?? 0;
    const passRate = ward.passRate ?? ward.pass_rate ?? 0;
    const avgCost = ward.avgCost ?? ward.avg_cost ?? 0;
    const serviceEfficiency = value > 0 ? passRate / (value / 1000) : 0; // Success rate per $1000 spent
    return `${ward.name},"Ward ${ward.name}","${count.toLocaleString()}","$${value.toLocaleString()}","$${avgCost.toLocaleString()}",${passRate.toFixed(1)}%,${serviceEfficiency.toFixed(3)}`;
  });
  return ['', '🏘️ PERFORMANCE BY TORONTO WARD', headers, ...rows].join('\n');
};

const generateEnhancedTimeSeriesCSV = (timeSeriesData: any[]): string => {
  const headers = 'Month,Total Services,Total Cost,Average Cost,Successful Services,Failed Services,Unknown Status,Success Rate,Failure Rate,Month-over-Month Service Change,Month-over-Month Cost Change';
  const rows = timeSeriesData.map(item => {
    const totalServices = item.totalServices ?? item.total_services ?? 0;
    const totalCost = item.totalCost ?? item.total_cost ?? 0;
    const avgCost = item.avgCost ?? item.avg_cost ?? 0;
    const passCount = item.passCount ?? item.pass_count ?? 0;
    const failCount = item.failCount ?? item.fail_count ?? 0;
    const unknownCount = item.unknownCount ?? item.unknown_count ?? 0;
    const passRate = item.passRate ?? item.pass_rate ?? 0;
    const failRate = item.failRate ?? item.fail_rate ?? 0;
    const momChangeServices = item.momChange?.services ?? 0;
    const momChangeCost = item.momChange?.cost ?? 0;
    
    return `${item.period},"${totalServices.toLocaleString()}","$${totalCost.toLocaleString()}","$${avgCost.toLocaleString()}","${passCount.toLocaleString()}","${failCount.toLocaleString()}","${unknownCount.toLocaleString()}",${passRate.toFixed(1)}%,${failRate.toFixed(1)}%,${momChangeServices > 0 ? '+' : ''}${momChangeServices.toFixed(1)}%,${momChangeCost > 0 ? '+' : ''}${momChangeCost.toFixed(1)}%`;
  });
  return ['', '📈 MONTHLY TRENDS ANALYSIS', headers, ...rows].join('\n');
};

const generateEnhancedExpensesCSV = (expenses: any[]): string => {
  const headers = 'Rank,Service ID,Division,Ward,Total Cost,Service Result,Start Date,End Date,Service Duration (Days),Daily Cost Rate,Service Notes';
  const rows = expenses.map((expense, index) => {
    const startDate = expense.startDate ? new Date(expense.startDate) : null;
    const endDate = expense.endDate ? new Date(expense.endDate) : null;
    const durationDays = startDate && endDate ? Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) : 'Unknown';
    const costPerDay = typeof durationDays === 'number' && durationDays > 0 ? `$${(expense.cost / durationDays).toFixed(0)}` : 'N/A';
    
    return `${index + 1},${expense.id},"${expense.division || 'Unknown Division'}","Ward ${expense.ward || 'Unknown'}","$${expense.cost.toLocaleString()}",${expense.result},${expense.startDate || 'Not specified'},${expense.endDate || 'Not specified'},${durationDays},"${costPerDay}","${expense.notes ? expense.notes.substring(0, 100) + (expense.notes.length > 100 ? '...' : '') : 'No notes provided'}"`;
  });
  return ['', '💰 HIGHEST COST SERVICES', headers, ...rows].join('\n');
};

const generateEnhancedCostDistributionCSV = (costDistribution: any[]): string => {
  const headers = 'Range,Min Cost,Max Cost,Count,Percentage,Cumulative Count,Cumulative Percentage';
  let cumulativeCount = 0;
  const totalCount = costDistribution.reduce((sum, bin) => sum + bin.count, 0);
  
  const rows = costDistribution.map(bin => {
    cumulativeCount += bin.count;
    const cumulativePercentage = (cumulativeCount / totalCount) * 100;
    return `"${bin.label}","$${bin.min.toLocaleString()}","$${bin.max.toLocaleString()}",${bin.count},${bin.percentage.toFixed(2)}%,${cumulativeCount},${cumulativePercentage.toFixed(2)}%`;
  });
  return ['COST DISTRIBUTION ANALYSIS', headers, ...rows].join('\n');
};

const generateEnhancedWardAnalysisCSV = (wardAnalysis: any): string => {
  let csv = ['COMPREHENSIVE WARD ANALYSIS'];
  
  // Summary statistics
  csv.push('');
  csv.push('WARD COVERAGE SUMMARY');
  csv.push(`Total Valid Wards,${wardAnalysis.totalWardsCovered}`);
  csv.push(`Ward Coverage Percentage,${wardAnalysis.wardCoveragePercentage.toFixed(2)}%`);
  csv.push(`Toronto Total Wards,25`);
  csv.push(`Missing Ward Coverage,${25 - wardAnalysis.totalWardsCovered}`);
  
  // Ward 66 analysis
  if (wardAnalysis.invalidWard66) {
    csv.push('');
    csv.push('INVALID WARD 66 ANALYSIS');
    csv.push(`Services with Ward 66,${wardAnalysis.invalidWard66.count}`);
    csv.push(`Total Cost,"$${wardAnalysis.invalidWard66.totalCost.toLocaleString()}"`);
    csv.push(`Average Cost,"$${wardAnalysis.invalidWard66.avgCost.toLocaleString()}"`);
    csv.push(`Pass Rate,${wardAnalysis.invalidWard66.passRate.toFixed(2)}%`);
    csv.push(`Percentage of Total Services,${wardAnalysis.invalidWard66.impactAnalysis.percentageOfTotalServices.toFixed(2)}%`);
    csv.push(`Percentage of Total Cost,${wardAnalysis.invalidWard66.impactAnalysis.percentageOfTotalCost.toFixed(2)}%`);
    
    if (wardAnalysis.invalidWard66.recommendations) {
      csv.push('');
      csv.push('WARD 66 RECOMMENDATIONS');
      wardAnalysis.invalidWard66.recommendations.forEach((rec: string, index: number) => {
        csv.push(`${index + 1}. "${rec}"`);
      });
    }
  }

  // Valid wards detailed analysis
  if (wardAnalysis.validWards && wardAnalysis.validWards.length > 0) {
    csv.push('');
    csv.push('VALID WARDS DETAILED ANALYSIS');
    csv.push('Ward,Total Services,Total Cost,Avg Cost,Pass Rate,Fail Rate,Unknown Rate,Cost Efficiency,Services Per 1000 Residents');
    wardAnalysis.validWards.forEach((ward: any) => {
      const servicesPerThousand = ward.servicesPerCapita ? (ward.servicesPerCapita * 1000).toFixed(2) : 'N/A';
      csv.push(`${ward.ward},${ward.totalServices},"$${ward.totalCost.toLocaleString()}","$${ward.avgCost.toLocaleString()}",${ward.passRate.toFixed(2)}%,${ward.failRate.toFixed(2)}%,${ward.unknownRate.toFixed(2)}%,${ward.costEfficiency.toFixed(3)},${servicesPerThousand}`);
    });
  }

  // Ward efficiency ranking
  if (wardAnalysis.wardEfficiencyRanking && wardAnalysis.wardEfficiencyRanking.length > 0) {
    csv.push('');
    csv.push('WARD EFFICIENCY RANKING');
    csv.push('Rank,Ward,Efficiency Score,Total Services,Total Cost,Pass Rate,Cost Per Passing Service');
    wardAnalysis.wardEfficiencyRanking.forEach((ward: any) => {
      csv.push(`${ward.rank},${ward.ward},${ward.efficiencyScore.toFixed(3)},${ward.totalServices},"$${ward.totalCost.toLocaleString()}",${ward.passRate.toFixed(2)}%,"$${ward.costPerPassingService.toFixed(2)}"`);
    });
  }

  return csv.join('\n');
};

const generateDataQualityCSV = (dataQuality: any): string => {
  let csv = ['DATA QUALITY ASSESSMENT'];
  csv.push('');
  csv.push('OVERALL SCORE');
  csv.push(`Overall Data Quality Score,${dataQuality.overallScore.toFixed(2)}%`);
  csv.push('');
  csv.push('DIMENSION SCORES');
  csv.push('Dimension,Score,Details,Issues Count,Recommendations Count');
  
  Object.entries(dataQuality).forEach(([key, value]: [string, any]) => {
    if (key === 'overallScore') return;
    
    const dimension = value as any;
    csv.push(`${key},${dimension.score.toFixed(2)}%,"${dimension.details}",${dimension.issues?.length || 0},${dimension.recommendations?.length || 0}`);
  });
  
  // Detailed issues and recommendations
  csv.push('');
  csv.push('DETAILED ISSUES AND RECOMMENDATIONS');
  csv.push('Dimension,Type,Item');
  
  Object.entries(dataQuality).forEach(([key, value]: [string, any]) => {
    if (key === 'overallScore') return;
    
    const dimension = value as any;
    
    if (dimension.issues) {
      dimension.issues.forEach((issue: string) => {
        csv.push(`${key},Issue,"${issue}"`);
      });
    }
    
    if (dimension.recommendations) {
      dimension.recommendations.forEach((rec: string) => {
        csv.push(`${key},Recommendation,"${rec}"`);
      });
    }
  });
  
  return csv.join('\n');
};

const generateReadinessMetricsCSV = (readinessMetrics: any): string => {
  let csv = ['DATA READINESS ASSESSMENT'];
  csv.push('');
  csv.push('OVERALL READINESS SCORE');
  csv.push(`Score,${readinessMetrics.overallReadinessScore.toFixed(2)}%`);
  
  csv.push('');
  csv.push('DATA QUALITY DIMENSIONS');
  csv.push('Dimension,Score,Interpretation');
  
  // Handle new consolidated dimensions structure
  if (readinessMetrics.consolidatedDimensions) {
    csv.push(`Data Accuracy,${readinessMetrics.consolidatedDimensions.accuracy.toFixed(2)}%,"Validates ward numbers, dates, costs, and result values"`);
    csv.push(`Data Consistency,${readinessMetrics.consolidatedDimensions.consistency.toFixed(2)}%,"Checks business rules and format consistency"`);
    csv.push(`Data Completeness,${readinessMetrics.consolidatedDimensions.completeness.toFixed(2)}%,"Percentage of records with ALL required fields"`);
    csv.push(`Data Timeliness,${readinessMetrics.consolidatedDimensions.timeliness.toFixed(2)}%,"Data recency and coverage continuity"`);
    csv.push(`Metadata Quality,${readinessMetrics.consolidatedDimensions.metadata.toFixed(2)}%,"Field diversity and documentation quality"`);
  }
  
  // Include legacy breakdown if present
  if (readinessMetrics.breakdown) {
    csv.push('');
    csv.push('DETAILED BREAKDOWN');
    csv.push('Component,Score');
    Object.entries(readinessMetrics.breakdown).forEach(([key, value]: [string, any]) => {
      csv.push(`${key},${value.toFixed(2)}%`);
    });
  }
  
  csv.push('');
  csv.push('CRITICAL ISSUES');
  if (readinessMetrics.criticalIssues && readinessMetrics.criticalIssues.length > 0) {
    readinessMetrics.criticalIssues.forEach((issue: string, index: number) => {
      csv.push(`${index + 1}. "${issue}"`);
    });
  } else {
    csv.push('No critical issues identified');
  }
  
  csv.push('');
  csv.push('STRENGTHS');
  if (readinessMetrics.strengths && readinessMetrics.strengths.length > 0) {
    readinessMetrics.strengths.forEach((strength: string, index: number) => {
      csv.push(`${index + 1}. "${strength}"`);
    });
  } else {
    csv.push('No specific strengths identified');
  }
  
  return csv.join('\n');
};

const generateRecommendationsCSV = (recommendations: any[]): string => {
  let csv = ['IMPROVEMENT RECOMMENDATIONS'];
  csv.push('');
  csv.push('Priority,Category,Issue,Recommendation,Estimated Impact');
  
  recommendations.forEach((rec) => {
    csv.push(`${rec.priority.toUpperCase()},${rec.category},"${rec.issue}","${rec.recommendation}","${rec.estimatedImpact}"`);
  });
  
  return csv.join('\n');
};

const generateFieldCompletenessCSV = (fieldCompleteness: any): string => {
  let csv = ['FIELD COMPLETENESS ANALYSIS'];
  csv.push('');
  csv.push('Field Name,Completeness %,Missing Count,Quality Category');
  
  // Sort fields by completeness ascending
  const sortedFields = [...fieldCompleteness].sort((a, b) => a.completeness - b.completeness);
  
  sortedFields.forEach((field) => {
    // Determine quality category based on completeness
    let category = '';
    if (field.completeness >= 90) category = 'Excellent';
    else if (field.completeness >= 80) category = 'Good';
    else if (field.completeness >= 70) category = 'Fair';
    else if (field.completeness >= 60) category = 'Poor';
    else category = 'Critical';
    
    // Use correct field names from API
    const fieldName = field.field || field.fieldName || 'Unknown Field';
    const missingCount = field.missingRecords || field.missingCount || 0;
    
    csv.push(`"${fieldName}",${field.completeness.toFixed(1)}%,${missingCount.toLocaleString()},${category}`);
  });
  
  // Add summary statistics
  csv.push('');
  csv.push('SUMMARY STATISTICS');
  const avgCompleteness = fieldCompleteness.reduce((sum: number, f: any) => sum + f.completeness, 0) / fieldCompleteness.length;
  const excellentFields = fieldCompleteness.filter((f: any) => f.completeness >= 90).length;
  const criticalFields = fieldCompleteness.filter((f: any) => f.completeness < 60).length;
  
  csv.push(`Average Field Completeness,${avgCompleteness.toFixed(1)}%`);
  csv.push(`Excellent Fields (≥90%),${excellentFields}`);
  csv.push(`Critical Fields (<60%),${criticalFields}`);
  
  return csv.join('\n');
};

// Analysis generation functions for JSON export
const generateSummaryAnalysis = (kpiData: any): any => {
  return {
    performance: {
      passRateCategory: kpiData.passRate >= 80 ? 'Excellent' : kpiData.passRate >= 60 ? 'Good' : 'Needs Improvement',
      costEfficiency: kpiData.avgCost < 10000 ? 'Efficient' : kpiData.avgCost < 50000 ? 'Moderate' : 'High Cost',
      divisionCoverage: kpiData.uniqueDivisions >= 10 ? 'Comprehensive' : 'Limited'
    },
    insights: [
      `${kpiData.passRate.toFixed(1)}% overall success rate across ${kpiData.totalServices.toLocaleString()} services`,
      `Average service cost of $${kpiData.avgCost.toLocaleString()}`,
      `Services span ${kpiData.uniqueDivisions} divisions and ${kpiData.uniqueWards} wards`
    ]
  };
};

const generateServiceResultAnalysis = (servicesByResult: any[]): any => {
  const passService = servicesByResult.find(s => s.result === 'PASS');
  const failService = servicesByResult.find(s => s.result === 'FAIL');
  const unknownService = servicesByResult.find(s => s.result === 'UNKNOWN');
  
  return {
    distribution: {
      primary: passService ? 'PASS' : failService ? 'FAIL' : 'UNKNOWN',
      riskLevel: (failService?.percentage || 0) > 30 ? 'High' : (failService?.percentage || 0) > 15 ? 'Medium' : 'Low'
    },
    costAnalysis: {
      highestCostCategory: servicesByResult.reduce((prev, curr) => prev.avg_cost > curr.avg_cost ? prev : curr).result,
      costVariance: 'Significant' // This would be calculated from actual variance
    }
  };
};

const generateDivisionAnalysis = (divisions: any[]): any => {
  if (!divisions || divisions.length === 0) {
    return { performance: {}, insights: [] };
  }
  
  const topPerformer = divisions.reduce((prev, curr) => {
    const prevRate = prev.passRate ?? prev.pass_rate ?? 0;
    const currRate = curr.passRate ?? curr.pass_rate ?? 0;
    return prevRate > currRate ? prev : curr;
  });
  
  const highestCost = divisions.reduce((prev, curr) => {
    const prevCost = prev.totalCost ?? prev.total_cost ?? 0;
    const currCost = curr.totalCost ?? curr.total_cost ?? 0;
    return prevCost > currCost ? prev : curr;
  });
  
  const averagePassRate = divisions.reduce((sum, div) => {
    const passRate = div.passRate ?? div.pass_rate ?? 0;
    return sum + passRate;
  }, 0) / divisions.length;
  
  const topPerformerRate = topPerformer.passRate ?? topPerformer.pass_rate ?? 0;
  const highestCostAmount = highestCost.totalCost ?? highestCost.total_cost ?? 0;
  
  return {
    performance: {
      topPerformer: topPerformer.division,
      highestCostDivision: highestCost.division,
      averagePassRate: averagePassRate
    },
    insights: [
      `${topPerformer.division} has the highest success rate at ${topPerformerRate.toFixed(1)}%`,
      `${highestCost.division} accounts for the highest total cost at $${highestCostAmount.toLocaleString()}`
    ]
  };
};

const generateWardDataAnalysis = (wardAnalysis: any): any => {
  return {
    coverage: {
      validWards: wardAnalysis.totalWardsCovered,
      coveragePercentage: wardAnalysis.wardCoveragePercentage,
      dataQualityIssues: wardAnalysis.invalidWard66 ? ['Ward 66 invalid entries detected'] : []
    },
    efficiency: {
      topPerformingWard: wardAnalysis.wardEfficiencyRanking?.[0]?.ward || 'N/A',
      averageEfficiency: wardAnalysis.validWards ? 
        wardAnalysis.validWards.reduce((sum: number, ward: any) => sum + ward.costEfficiency, 0) / wardAnalysis.validWards.length : 0
    }
  };
};

const generateTimeSeriesTrends = (timeSeriesData: any[]): any => {
  if (!timeSeriesData || timeSeriesData.length < 2) return { trend: 'Insufficient data' };
  
  const latest = timeSeriesData[timeSeriesData.length - 1];
  const previous = timeSeriesData[timeSeriesData.length - 2];
  
  const latestServices = latest.totalServices ?? latest.total_services ?? 0;
  const previousServices = previous.totalServices ?? previous.total_services ?? 0;
  const latestCost = latest.totalCost ?? latest.total_cost ?? 0;
  const previousCost = previous.totalCost ?? previous.total_cost ?? 0;
  const latestPassRate = latest.passRate ?? latest.pass_rate ?? 0;
  const previousPassRate = previous.passRate ?? previous.pass_rate ?? 0;
  
  return {
    serviceVolume: {
      trend: latestServices > previousServices ? 'Increasing' : 'Decreasing',
      change: previousServices > 0 ? ((latestServices - previousServices) / previousServices * 100).toFixed(1) + '%' : 'N/A'
    },
    costTrend: {
      trend: latestCost > previousCost ? 'Increasing' : 'Decreasing',
      change: previousCost > 0 ? ((latestCost - previousCost) / previousCost * 100).toFixed(1) + '%' : 'N/A'
    },
    qualityTrend: {
      trend: latestPassRate > previousPassRate ? 'Improving' : 'Declining',
      change: (latestPassRate - previousPassRate).toFixed(1) + ' percentage points'
    }
  };
};

const generateExpenseAnalysis = (expenses: any[]): any => {
  const totalHighExpenses = expenses.reduce((sum, exp) => sum + exp.cost, 0);
  const avgHighExpense = totalHighExpenses / expenses.length;
  
  return {
    summary: {
      totalHighExpenseCost: totalHighExpenses,
      averageHighExpense: avgHighExpense,
      mostExpensiveDivision: expenses[0]?.division || 'N/A'
    },
    patterns: {
      resultDistribution: {
        pass: expenses.filter(e => e.result === 'PASS').length,
        fail: expenses.filter(e => e.result === 'FAIL').length,
        unknown: expenses.filter(e => e.result === 'UNKNOWN').length
      }
    }
  };
};

const generateCostDistributionAnalysis = (costDistribution: any[]): any => {
  const totalServices = costDistribution.reduce((sum, bin) => sum + bin.count, 0);
  const lowCostServices = costDistribution.slice(0, 3).reduce((sum, bin) => sum + bin.count, 0);
  const highCostServices = costDistribution.slice(-3).reduce((sum, bin) => sum + bin.count, 0);
  
  return {
    distribution: {
      lowCostPercentage: (lowCostServices / totalServices * 100).toFixed(1),
      highCostPercentage: (highCostServices / totalServices * 100).toFixed(1),
      pattern: lowCostServices > highCostServices ? 'Right-skewed (many low-cost services)' : 'Left-skewed (many high-cost services)'
    },
    insights: [
      `${(lowCostServices / totalServices * 100).toFixed(1)}% of services are in the lowest cost brackets`,
      `${(highCostServices / totalServices * 100).toFixed(1)}% of services are in the highest cost brackets`
    ]
  };
};

const generateDataQualityAnalysis = (dataQuality: any): any => {
  const scores = Object.entries(dataQuality)
    .filter(([key]) => key !== 'overallScore')
    .map(([key, value]: [string, any]) => ({ dimension: key, score: value.score }));
  
  const bestDimension = scores.reduce((prev, curr) => prev.score > curr.score ? prev : curr);
  const worstDimension = scores.reduce((prev, curr) => prev.score < curr.score ? prev : curr);
  
  return {
    performance: {
      overallCategory: dataQuality.overallScore >= 80 ? 'Excellent' : dataQuality.overallScore >= 60 ? 'Good' : 'Needs Improvement',
      bestDimension: bestDimension.dimension,
      worstDimension: worstDimension.dimension
    },
    recommendations: {
      priority: worstDimension.score < 50 ? 'Critical' : worstDimension.score < 70 ? 'High' : 'Medium',
      focusArea: worstDimension.dimension
    }
  };
};

/**
 * Generate comprehensive PDF HTML content
 */
const generateComprehensivePDFHTML = (
  data: DashboardData,
  metadata: ExportMetadata,
  sections: ExportSection[],
  options: ComprehensiveExportOptions
): string => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Toronto Open Data Dashboard - ${metadata.tabContext} Export</title>
      <meta charset="utf-8">
      <style>
        body { 
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
          margin: 20px; 
          line-height: 1.6;
          color: #333;
        }
        .header { 
          text-align: center; 
          margin-bottom: 40px; 
          padding-bottom: 20px;
          border-bottom: 3px solid #2563eb;
        }
        .header h1 {
          color: #1e40af;
          margin-bottom: 10px;
          font-size: 2.5em;
        }
        .header .subtitle {
          color: #6b7280;
          font-size: 1.2em;
          margin-bottom: 20px;
        }
        .metadata {
          background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
          padding: 20px;
          border-radius: 8px;
          margin-bottom: 30px;
          border-left: 4px solid #3b82f6;
        }
        .metadata h2 {
          color: #1e40af;
          margin-top: 0;
        }
        .section { 
          margin-bottom: 40px; 
          page-break-inside: avoid; 
        }
        .section h2 {
          color: #1e40af;
          border-bottom: 2px solid #e5e7eb;
          padding-bottom: 10px;
          margin-bottom: 20px;
        }
        table { 
          width: 100%; 
          border-collapse: collapse; 
          margin-bottom: 20px;
          font-size: 0.9em;
        }
        th, td { 
          border: 1px solid #d1d5db; 
          padding: 12px 8px; 
          text-align: left; 
          vertical-align: top;
        }
        th { 
          background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
          color: white;
          font-weight: 600;
          text-align: center;
        }
        tr:nth-child(even) { 
          background-color: #f9fafb; 
        }
        tr:hover {
          background-color: #f3f4f6;
        }
        .kpi-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
          margin-bottom: 30px;
        }
        .kpi-card {
          background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
          padding: 20px;
          border-radius: 8px;
          border: 1px solid #e5e7eb;
          text-align: center;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }
        .kpi-value {
          font-size: 2em;
          font-weight: bold;
          color: #1e40af;
          margin-bottom: 5px;
        }
        .kpi-label {
          color: #6b7280;
          font-size: 0.9em;
        }
        .chart-placeholder {
          background: #f3f4f6;
          border: 2px dashed #9ca3af;
          border-radius: 8px;
          padding: 40px;
          text-align: center;
          color: #6b7280;
          margin: 20px 0;
        }
        .quality-metric {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 15px;
          margin-bottom: 15px;
        }
        .quality-score {
          display: inline-block;
          padding: 4px 12px;
          border-radius: 20px;
          font-weight: 600;
          font-size: 0.9em;
        }
        .score-excellent { background-color: #d1fae5; color: #065f46; }
        .score-good { background-color: #fef3c7; color: #92400e; }
        .score-poor { background-color: #fee2e2; color: #991b1b; }
        .recommendation {
          background: #eff6ff;
          border-left: 4px solid #3b82f6;
          padding: 15px;
          margin-bottom: 15px;
          border-radius: 0 8px 8px 0;
        }
        .priority-high { border-left-color: #dc2626; background: #fef2f2; }
        .priority-medium { border-left-color: #d97706; background: #fffbeb; }
        .priority-low { border-left-color: #059669; background: #f0fdf4; }
        .footer {
          margin-top: 40px;
          padding-top: 20px;
          border-top: 1px solid #e5e7eb;
          text-align: center;
          color: #6b7280;
          font-size: 0.9em;
        }
        @media print {
          body { margin: 0; }
          .section { page-break-inside: avoid; }
          .header { page-break-after: avoid; }
          .kpi-grid { page-break-inside: avoid; }
          .chart-placeholder { page-break-inside: avoid; }
        }
        @page {
          margin: 1in;
          @top-center {
            content: "Toronto Open Data Dashboard Export";
            font-size: 10pt;
            color: #6b7280;
          }
          @bottom-center {
            content: "Page " counter(page) " of " counter(pages);
            font-size: 10pt;
            color: #6b7280;
          }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Toronto Open Data Dashboard</h1>
        <div class="subtitle">${metadata.description}</div>
        <div style="font-size: 0.9em; color: #6b7280;">Generated on ${metadata.exportDate} at ${new Date(metadata.exportTime).toLocaleTimeString()}</div>
      </div>

      <div class="metadata">
        <h2>Export Information</h2>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 15px;">
          <div><strong>Context:</strong> ${metadata.tabContext}</div>
          <div><strong>Total Records:</strong> ${metadata.totalRecords.toLocaleString()}</div>
          <div><strong>Date Range:</strong> ${metadata.dateRange.start} to ${metadata.dateRange.end}</div>
          <div><strong>Data Version:</strong> ${metadata.dataVersion}</div>
        </div>
        ${generateFilterSummaryHTML(metadata.filters)}
      </div>

      ${sections.includes('summary') ? generateSummaryHTML(data.kpiData) : ''}
      ${sections.includes('services') ? generateServicesHTML(data.servicesByResult) : ''}
      ${sections.includes('divisions') ? generateDivisionsHTML(data.servicesByDivision.slice(0, 20)) : ''}
      ${sections.includes('wards') ? generateWardsHTML(data.topWards.slice(0, 15)) : ''}
      ${sections.includes('timeSeries') && data.timeSeriesData ? generateTimeSeriesHTML(data.timeSeriesData.slice(0, 12)) : ''}
      ${sections.includes('expenses') && data.highestExpenses ? generateExpensesHTML(data.highestExpenses.slice(0, 20)) : ''}
      ${sections.includes('costDistribution') && data.costDistribution ? generateCostDistributionHTML(data.costDistribution) : ''}
      ${sections.includes('wardAnalysis') && data.wardAnalysis ? generateWardAnalysisHTML(data.wardAnalysis) : ''}
      ${sections.includes('dataQuality') ? generateDataQualityHTML(data.dataQuality) : ''}
      ${sections.includes('readinessMetrics') ? generateReadinessMetricsHTML(data.readinessMetrics) : ''}
      ${sections.includes('fieldCompleteness') && data.fieldCompleteness ? generateFieldCompletenessHTML(data.fieldCompleteness) : ''}
      ${sections.includes('recommendations') ? generateRecommendationsHTML(data.readinessMetrics.recommendations) : ''}

      <div class="footer">
        <p>This report was generated by the Toronto Open Data Dashboard</p>
        <p>For questions or feedback, please contact the Data & Analytics team</p>
        <p>Export completed at ${new Date(metadata.exportTime).toLocaleString()}</p>
      </div>

      <script>
        // Auto-print functionality
        window.onload = function() {
          // Small delay to ensure content is fully rendered
          setTimeout(function() {
            window.print();
          }, 1000);
        }
        
        // Add page numbers
        window.onbeforeprint = function() {
          // This would add page numbers if supported
        }
      </script>
    </body>
    </html>
  `;
};

// HTML generation helper functions
const generateFilterSummaryHTML = (filters: ServiceFilters): string => {
  const appliedFilters = [];
  if (filters.startDate) appliedFilters.push(`Start Date: ${filters.startDate}`);
  if (filters.endDate) appliedFilters.push(`End Date: ${filters.endDate}`);
  if (filters.serviceDivisionOwner && filters.serviceDivisionOwner !== 'all') {
    appliedFilters.push(`Division: ${filters.serviceDivisionOwner}`);
  }
  if (filters.ward && filters.ward !== 'all') {
    appliedFilters.push(`Ward: ${filters.ward}`);
  }
  if (filters.serviceResult && filters.serviceResult !== 'all') {
    appliedFilters.push(`Result: ${filters.serviceResult}`);
  }
  
  return appliedFilters.length > 0 ? 
    `<div style="margin-top: 15px;"><strong>Applied Filters:</strong> ${appliedFilters.join(' | ')}</div>` : 
    `<div style="margin-top: 15px;"><strong>Filters:</strong> None applied (showing all data)</div>`;
};

const generateSummaryHTML = (kpiData: any): string => {
  return `
    <div class="section">
      <h2>Dashboard Summary</h2>
      <div class="kpi-grid">
        <div class="kpi-card">
          <div class="kpi-value">${kpiData.totalServices.toLocaleString()}</div>
          <div class="kpi-label">Total Services</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-value">$${kpiData.totalCost.toLocaleString()}</div>
          <div class="kpi-label">Total Cost</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-value">$${kpiData.avgCost.toLocaleString()}</div>
          <div class="kpi-label">Average Cost</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-value">${kpiData.passRate.toFixed(1)}%</div>
          <div class="kpi-label">Pass Rate</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-value">${kpiData.uniqueDivisions}</div>
          <div class="kpi-label">Divisions</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-value">${kpiData.uniqueWards}</div>
          <div class="kpi-label">Wards</div>
        </div>
      </div>
      
      <h3>Data Coverage</h3>
      <table>
        <tr><th>Metric</th><th>Value</th><th>Description</th></tr>
        <tr><td>Time Span</td><td>${kpiData.dateRange.timeSpan}</td><td>Period covered by the data</td></tr>
        <tr><td>Earliest Service</td><td>${kpiData.dateRange.earliestService}</td><td>Date of first service record</td></tr>
        <tr><td>Latest Service</td><td>${kpiData.dateRange.latestService}</td><td>Date of most recent service record</td></tr>
        <tr><td>Fail Rate</td><td>${kpiData.failRate.toFixed(2)}%</td><td>Percentage of services that failed</td></tr>
      </table>
    </div>
  `;
};

const generateServicesHTML = (servicesByResult: any[]): string => {
  const rows = servicesByResult.map(service => `
    <tr>
      <td><span class="quality-score ${service.result === 'PASS' ? 'score-excellent' : service.result === 'FAIL' ? 'score-poor' : 'score-good'}">${service.result}</span></td>
      <td>${service.count.toLocaleString()}</td>
      <td>${service.percentage.toFixed(2)}%</td>
      <td>$${service.total_cost.toLocaleString()}</td>
      <td>$${service.avg_cost.toLocaleString()}</td>
    </tr>
  `).join('');
  
  return `
    <div class="section">
      <h2>Service Results Analysis</h2>
      <table>
        <tr><th>Result</th><th>Count</th><th>Percentage</th><th>Total Cost</th><th>Average Cost</th></tr>
        ${rows}
      </table>
    </div>
  `;
};

const generateDivisionsHTML = (divisions: any[]): string => {
  const rows = divisions.map(div => `
    <tr>
      <td>${div.division || 'Unknown'}</td>
      <td>${(div.totalServices ?? div.count ?? 0).toLocaleString()}</td>
      <td>$${(div.totalCost ?? div.total_cost ?? 0).toLocaleString()}</td>
      <td>$${(div.avgCost ?? div.avg_cost ?? 0).toLocaleString()}</td>
      <td>${(div.passRate ?? div.pass_rate ?? 0).toFixed(1)}%</td>
    </tr>
  `).join('');
  
  return `
    <div class="section">
      <h2>Services by Division</h2>
      <table>
        <tr><th>Division</th><th>Total Services</th><th>Total Cost</th><th>Avg Cost</th><th>Pass Rate</th></tr>
        ${rows}
      </table>
    </div>
  `;
};

const generateWardsHTML = (wards: any[]): string => {
  const rows = wards.map(ward => `
    <tr>
      <td>Ward ${ward.name}</td>
      <td>${(ward.count ?? 0).toLocaleString()}</td>
      <td>$${(ward.value ?? 0).toLocaleString()}</td>
      <td>$${(ward.avgCost ?? ward.avg_cost ?? 0).toLocaleString()}</td>
      <td>${(ward.passRate ?? ward.pass_rate ?? 0).toFixed(1)}%</td>
    </tr>
  `).join('');
  
  return `
    <div class="section">
      <h2>Ward Performance Analysis</h2>
      <table>
        <tr><th>Ward</th><th>Total Services</th><th>Total Cost</th><th>Avg Cost</th><th>Pass Rate</th></tr>
        ${rows}
      </table>
    </div>
  `;
};

const generateTimeSeriesHTML = (timeSeriesData: any[]): string => {
  const rows = timeSeriesData.map(item => `
    <tr>
      <td>${item.period}</td>
      <td>${(item.totalServices ?? item.total_services ?? 0).toLocaleString()}</td>
      <td>$${(item.totalCost ?? item.total_cost ?? 0).toLocaleString()}</td>
      <td>${(item.passRate ?? item.pass_rate ?? 0).toFixed(1)}%</td>
      <td>${item.momChange?.services > 0 ? '+' : ''}${(item.momChange?.services ?? 0).toFixed(1)}%</td>
      <td>${item.momChange?.cost > 0 ? '+' : ''}${(item.momChange?.cost ?? 0).toFixed(1)}%</td>
    </tr>
  `).join('');
  
  return `
    <div class="section">
      <h2>Time Series Analysis</h2>
      <table>
        <tr><th>Period</th><th>Services</th><th>Total Cost</th><th>Pass Rate</th><th>Service Change</th><th>Cost Change</th></tr>
        ${rows}
      </table>
    </div>
  `;
};

const generateExpensesHTML = (expenses: any[]): string => {
  const rows = expenses.map((expense, index) => `
    <tr>
      <td>${index + 1}</td>
      <td>${expense.division || 'Unknown'}</td>
      <td>Ward ${expense.ward || 'N/A'}</td>
      <td>$${expense.cost.toLocaleString()}</td>
      <td><span class="quality-score ${expense.result === 'PASS' ? 'score-excellent' : expense.result === 'FAIL' ? 'score-poor' : 'score-good'}">${expense.result}</span></td>
      <td>${expense.startDate || 'N/A'}</td>
    </tr>
  `).join('');
  
  return `
    <div class="section">
      <h2>Highest Expenses</h2>
      <table>
        <tr><th>Rank</th><th>Division</th><th>Ward</th><th>Cost</th><th>Result</th><th>Start Date</th></tr>
        ${rows}
      </table>
    </div>
  `;
};

const generateCostDistributionHTML = (costDistribution: any[]): string => {
  const rows = costDistribution.map(bin => `
    <tr>
      <td>${bin.label}</td>
      <td>$${bin.min.toLocaleString()}</td>
      <td>$${bin.max.toLocaleString()}</td>
      <td>${bin.count.toLocaleString()}</td>
      <td>${bin.percentage.toFixed(2)}%</td>
    </tr>
  `).join('');
  
  return `
    <div class="section">
      <h2>Cost Distribution Analysis</h2>
      <table>
        <tr><th>Range</th><th>Min Cost</th><th>Max Cost</th><th>Count</th><th>Percentage</th></tr>
        ${rows}
      </table>
    </div>
  `;
};

const generateWardAnalysisHTML = (wardAnalysis: any): string => {
  let html = `
    <div class="section">
      <h2>Ward Analysis</h2>
      <div class="kpi-grid" style="grid-template-columns: repeat(3, 1fr);">
        <div class="kpi-card">
          <div class="kpi-value">${wardAnalysis.totalWardsCovered}</div>
          <div class="kpi-label">Valid Wards</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-value">${wardAnalysis.wardCoveragePercentage.toFixed(1)}%</div>
          <div class="kpi-label">Coverage</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-value">${25 - wardAnalysis.totalWardsCovered}</div>
          <div class="kpi-label">Missing Wards</div>
        </div>
      </div>
  `;
  
  if (wardAnalysis.invalidWard66) {
    html += `
      <h3>Ward 66 Data Quality Issue</h3>
      <div style="background: #fef2f2; border: 1px solid #fecaca; padding: 15px; border-radius: 8px; margin: 15px 0;">
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px;">
          <div><strong>Affected Services:</strong> ${wardAnalysis.invalidWard66.count.toLocaleString()}</div>
          <div><strong>Total Cost:</strong> $${wardAnalysis.invalidWard66.totalCost.toLocaleString()}</div>
          <div><strong>% of Total Services:</strong> ${wardAnalysis.invalidWard66.impactAnalysis.percentageOfTotalServices.toFixed(2)}%</div>
          <div><strong>% of Total Cost:</strong> ${wardAnalysis.invalidWard66.impactAnalysis.percentageOfTotalCost.toFixed(2)}%</div>
        </div>
      </div>
    `;
  }
  
  if (wardAnalysis.validWards && wardAnalysis.validWards.length > 0) {
    const wardRows = wardAnalysis.validWards.slice(0, 15).map((ward: any) => `
      <tr>
        <td>Ward ${ward.ward}</td>
        <td>${ward.totalServices.toLocaleString()}</td>
        <td>$${ward.totalCost.toLocaleString()}</td>
        <td>${ward.passRate.toFixed(1)}%</td>
        <td>${ward.costEfficiency.toFixed(3)}</td>
      </tr>
    `).join('');
    
    html += `
      <h3>Valid Ward Performance (Top 15)</h3>
      <table>
        <tr><th>Ward</th><th>Services</th><th>Total Cost</th><th>Pass Rate</th><th>Efficiency</th></tr>
        ${wardRows}
      </table>
    `;
  }
  
  html += '</div>';
  return html;
};

const generateDataQualityHTML = (dataQuality: any): string => {
  let html = `
    <div class="section">
      <h2>Data Quality Assessment</h2>
      <div class="kpi-card" style="text-align: center; margin-bottom: 30px;">
        <div class="kpi-value">${dataQuality.overallScore.toFixed(1)}%</div>
        <div class="kpi-label">Overall Data Quality Score</div>
      </div>
  `;
  
  Object.entries(dataQuality).forEach(([key, value]: [string, any]) => {
    if (key === 'overallScore') return;
    
    const dimension = value as any;
    const scoreClass = dimension.score >= 80 ? 'score-excellent' : dimension.score >= 60 ? 'score-good' : 'score-poor';
    
    html += `
      <div class="quality-metric">
        <div style="display: flex; justify-content: between; align-items: center; margin-bottom: 10px;">
          <h3 style="margin: 0; text-transform: capitalize;">${key}</h3>
          <span class="quality-score ${scoreClass}">${dimension.score.toFixed(1)}%</span>
        </div>
        <p style="margin-bottom: 15px; color: #6b7280;">${dimension.details}</p>
    `;
    
    if (dimension.issues && dimension.issues.length > 0) {
      html += '<div style="margin-bottom: 10px;"><strong style="color: #dc2626;">Issues:</strong><ul style="margin: 5px 0; padding-left: 20px;">';
      dimension.issues.forEach((issue: string) => {
        html += `<li style="color: #dc2626; margin-bottom: 3px;">${issue}</li>`;
      });
      html += '</ul></div>';
    }
    
    if (dimension.recommendations && dimension.recommendations.length > 0) {
      html += '<div><strong style="color: #2563eb;">Recommendations:</strong><ul style="margin: 5px 0; padding-left: 20px;">';
      dimension.recommendations.forEach((rec: string) => {
        html += `<li style="color: #2563eb; margin-bottom: 3px;">${rec}</li>`;
      });
      html += '</ul></div>';
    }
    
    html += '</div>';
  });
  
  html += '</div>';
  return html;
};

const generateReadinessMetricsHTML = (readinessMetrics: any): string => {
  // Helper function to get color class based on score
  const getScoreClass = (score: number): string => {
    if (score >= 90) return 'score-excellent';
    if (score >= 80) return 'score-good';
    if (score >= 70) return 'score-fair';
    if (score >= 60) return 'score-poor';
    return 'score-critical';
  };

  let html = `
    <div class="section">
      <h2>Data Readiness Assessment</h2>
      <div class="kpi-card" style="text-align: center; margin-bottom: 30px; background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);">
        <div class="kpi-value" style="font-size: 3em;">${readinessMetrics.overallReadinessScore.toFixed(1)}%</div>
        <div class="kpi-label" style="font-size: 1.2em;">Overall Readiness Score</div>
      </div>`;

  // Handle new consolidated dimensions
  if (readinessMetrics.consolidatedDimensions) {
    html += `
      <h3 style="margin-bottom: 20px;">Data Quality Dimensions</h3>
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; margin-bottom: 30px;">`;
    
    const dimensions = [
      { key: 'accuracy', name: 'Data Accuracy', desc: 'Validates ward numbers, dates, costs, and result values' },
      { key: 'consistency', name: 'Data Consistency', desc: 'Checks business rules and format consistency' },
      { key: 'completeness', name: 'Data Completeness', desc: 'Percentage of records with ALL required fields' },
      { key: 'timeliness', name: 'Data Timeliness', desc: 'Data recency and coverage continuity' },
      { key: 'metadata', name: 'Metadata Quality', desc: 'Field diversity and documentation quality' }
    ];
    
    dimensions.forEach(dim => {
      const score = readinessMetrics.consolidatedDimensions[dim.key];
      const scoreClass = getScoreClass(score);
      
      html += `
        <div class="quality-metric">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
            <h4 style="margin: 0; color: #1e40af;">${dim.name}</h4>
            <span class="quality-score ${scoreClass}">${score.toFixed(1)}%</span>
          </div>
          <p style="margin: 0; color: #6b7280; font-size: 0.9em;">${dim.desc}</p>
        </div>`;
    });
    
    html += '</div>';
  }
  
  // Include legacy breakdown if present
  if (readinessMetrics.breakdown && Object.keys(readinessMetrics.breakdown).length > 0) {
    html += `
      <h3>Detailed Breakdown</h3>
      <table>
        <tr><th>Component</th><th>Score</th></tr>
        ${Object.entries(readinessMetrics.breakdown).map(([key, value]: [string, any]) => `
          <tr><td style="text-transform: capitalize;">${key}</td><td>${value.toFixed(1)}%</td></tr>
        `).join('')}
      </table>`;
  }
  
  // Critical Issues
  if (readinessMetrics.criticalIssues && readinessMetrics.criticalIssues.length > 0) {
    html += `
      <h3 style="color: #dc2626;">Critical Issues</h3>
      <div style="display: grid; gap: 10px;">
        ${readinessMetrics.criticalIssues.map((issue: string) => `
          <div style="background: #fef2f2; border-left: 4px solid #dc2626; padding: 15px; border-radius: 0 8px 8px 0;">
            ${issue}
          </div>
        `).join('')}
      </div>`;
  }
  
  // Strengths
  if (readinessMetrics.strengths && readinessMetrics.strengths.length > 0) {
    html += `
      <h3 style="color: #059669;">Strengths</h3>
      <div style="display: grid; gap: 10px;">
        ${readinessMetrics.strengths.map((strength: string) => `
          <div style="background: #f0fdf4; border-left: 4px solid #059669; padding: 15px; border-radius: 0 8px 8px 0;">
            ${strength}
          </div>
        `).join('')}
      </div>`;
  }
  
  html += '</div>';
  return html;
};

const generateRecommendationsHTML = (recommendations: any[]): string => {
  return `
    <div class="section">
      <h2>Improvement Recommendations</h2>
      <div style="display: grid; gap: 15px;">
        ${recommendations.map((rec) => `
          <div class="recommendation priority-${rec.priority}">
            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 10px;">
              <span class="quality-score ${rec.priority === 'high' ? 'score-poor' : rec.priority === 'medium' ? 'score-good' : 'score-excellent'}">
                ${rec.priority.toUpperCase()}
              </span>
              <span style="color: #6b7280; text-transform: capitalize;">${rec.category}</span>
            </div>
            <h3 style="margin: 0 0 10px 0;">${rec.issue}</h3>
            <p style="margin-bottom: 10px; color: #374151;">${rec.recommendation}</p>
            <div style="font-size: 0.9em; color: #2563eb; font-weight: 600;">
              Estimated Impact: ${rec.estimatedImpact}
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
};

const generateFieldCompletenessHTML = (fieldCompleteness: any): string => {
  // Sort fields by completeness ascending for visual impact
  const sortedFields = [...fieldCompleteness].sort((a, b) => a.completeness - b.completeness);
  
  // Calculate summary statistics
  const avgCompleteness = fieldCompleteness.reduce((sum: number, f: any) => sum + f.completeness, 0) / fieldCompleteness.length;
  const excellentFields = fieldCompleteness.filter((f: any) => f.completeness >= 90).length;
  const criticalFields = fieldCompleteness.filter((f: any) => f.completeness < 60).length;
  
  return `
    <div class="section">
      <h2>Field Completeness Analysis</h2>
      
      <div style="background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%); padding: 20px; border-radius: 8px; margin-bottom: 20px;">
        <h3 style="margin-top: 0;">Summary Statistics</h3>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
          <div>
            <div style="font-size: 1.5em; font-weight: bold; color: #1e40af;">${avgCompleteness.toFixed(1)}%</div>
            <div style="color: #6b7280;">Average Completeness</div>
          </div>
          <div>
            <div style="font-size: 1.5em; font-weight: bold; color: #059669;">${excellentFields}</div>
            <div style="color: #6b7280;">Excellent Fields (≥90%)</div>
          </div>
          <div>
            <div style="font-size: 1.5em; font-weight: bold; color: #dc2626;">${criticalFields}</div>
            <div style="color: #6b7280;">Critical Fields (<60%)</div>
          </div>
        </div>
      </div>
      
      <h3>Field-by-Field Breakdown</h3>
      <table style="width: 100%; margin-bottom: 20px;">
        <tr>
          <th style="text-align: left;">Field Name</th>
          <th style="text-align: center;">Completeness</th>
          <th style="text-align: center;">Missing Records</th>
          <th style="text-align: center;">Category</th>
        </tr>
        ${sortedFields.map((field) => {
          let category = '';
          let categoryColor = '';
          if (field.completeness >= 90) {
            category = 'Excellent';
            categoryColor = '#059669';
          } else if (field.completeness >= 80) {
            category = 'Good';
            categoryColor = '#2563eb';
          } else if (field.completeness >= 70) {
            category = 'Fair';
            categoryColor = '#d97706';
          } else if (field.completeness >= 60) {
            category = 'Poor';
            categoryColor = '#dc2626';
          } else {
            category = 'Critical';
            categoryColor = '#991b1b';
          }
          
          // Use correct field names from API
          const fieldName = field.field || field.fieldName || 'Unknown Field';
          const missingCount = field.missingRecords || field.missingCount || 0;
          
          return `
            <tr>
              <td style="font-weight: 600; color: #374151;">${fieldName}</td>
              <td style="text-align: center;">
                <div style="display: flex; align-items: center; justify-content: center; gap: 10px;">
                  <div style="width: 100px; height: 8px; background: #e5e7eb; border-radius: 4px; overflow: hidden;">
                    <div style="width: ${field.completeness}%; height: 100%; background: ${categoryColor};"></div>
                  </div>
                  <span style="font-weight: 600; color: ${categoryColor};">${field.completeness.toFixed(1)}%</span>
                </div>
              </td>
              <td style="text-align: center; color: #6b7280;">${missingCount.toLocaleString()}</td>
              <td style="text-align: center;">
                <span style="color: ${categoryColor}; font-weight: 600;">${category}</span>
              </td>
            </tr>
          `;
        }).join('')}
      </table>
      
      <div class="chart-placeholder">
        <p>Data Completeness by Field Bar Chart</p>
        <p style="font-size: 0.9em;">Visual representation of field completeness percentages</p>
      </div>
    </div>
  `;
};

/**
 * Generate comprehensive filename with context and timestamp
 */
const generateComprehensiveFilename = (
  metadata: ExportMetadata,
  format: 'csv' | 'json' | 'pdf'
): string => {
  const timestamp = metadata.exportDate;
  const context = metadata.tabContext !== 'all' ? `-${metadata.tabContext}` : '';
  
  let filterString = '';
  if (metadata.filters.serviceDivisionOwner && metadata.filters.serviceDivisionOwner !== 'all') {
    filterString += `-${metadata.filters.serviceDivisionOwner.toLowerCase().replace(/\s+/g, '-')}`;
  }
  if (metadata.filters.ward && metadata.filters.ward !== 'all') {
    filterString += `-ward-${metadata.filters.ward}`;
  }
  if (metadata.filters.serviceResult && metadata.filters.serviceResult !== 'all') {
    filterString += `-${metadata.filters.serviceResult.toLowerCase()}`;
  }
  
  return `toronto-dashboard${context}-${timestamp}${filterString}.${format}`;
};

/**
 * Download file utility
 */
const downloadFile = (content: string, filename: string, mimeType: string): void => {
  // Add BOM for CSV files to ensure proper encoding
  if (mimeType.includes('csv')) {
    content = '\ufeff' + content;
  }
  
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // Clean up the URL object after a short delay
  setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 100);
};

export {
  generateComprehensiveFilename,
  downloadFile
};
