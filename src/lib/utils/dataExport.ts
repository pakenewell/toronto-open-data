import type { DashboardData } from '@/src/types/api';
import type { ServiceFilters } from '@/src/types/toronto';

export interface ExportOptions {
  format: 'csv' | 'json';
  includeMetadata?: boolean;
  sections?: ExportSection[];
}

export type ExportSection = 
  | 'summary' 
  | 'services' 
  | 'divisions' 
  | 'wards' 
  | 'timeSeries' 
  | 'expenses' 
  | 'costDistribution'
  | 'wardAnalysis';

interface ExportMetadata {
  exportDate: string;
  filters: ServiceFilters;
  dataVersion: string;
  totalRecords: number;
}

/**
 * Export dashboard data in CSV or JSON format
 */
export const exportDashboardData = (
  data: DashboardData,
  filters: ServiceFilters,
  options: ExportOptions
): void => {
  const metadata: ExportMetadata = {
    exportDate: new Date().toISOString(),
    filters,
    dataVersion: '1.0',
    totalRecords: data.kpiData.totalServices
  };

  if (options.format === 'csv') {
    exportAsCSV(data, metadata, options);
  } else {
    exportAsJSON(data, metadata, options);
  }
};

/**
 * Export data as CSV format
 */
const exportAsCSV = (
  data: DashboardData,
  metadata: ExportMetadata,
  options: ExportOptions
): void => {
  const sections = options.sections || ['summary', 'services', 'divisions', 'wards'];
  let csvContent = '';

  // Add metadata header if requested
  if (options.includeMetadata) {
    csvContent += generateMetadataCSV(metadata);
    csvContent += '\n\n';
  }

  sections.forEach((section, index) => {
    if (index > 0) csvContent += '\n\n';
    
    switch (section) {
      case 'summary':
        csvContent += generateSummaryCSV(data.kpiData);
        break;
      case 'services':
        csvContent += generateServicesCSV(data.servicesByResult);
        break;
      case 'divisions':
        csvContent += generateDivisionsCSV(data.servicesByDivision);
        break;
      case 'wards':
        csvContent += generateWardsCSV(data.topWards);
        break;
      case 'timeSeries':
        if (data.timeSeriesData) {
          csvContent += generateTimeSeriesCSV(data.timeSeriesData);
        }
        break;
      case 'expenses':
        if (data.highestExpenses) {
          csvContent += generateExpensesCSV(data.highestExpenses);
        }
        break;
      case 'costDistribution':
        if (data.costDistribution) {
          csvContent += generateCostDistributionCSV(data.costDistribution);
        }
        break;
      case 'wardAnalysis':
        if (data.wardAnalysis) {
          csvContent += generateWardAnalysisCSV(data.wardAnalysis);
        }
        break;
    }
  });

  downloadFile(csvContent, 'toronto-dashboard-export.csv', 'text/csv');
};

/**
 * Export data as JSON format
 */
const exportAsJSON = (
  data: DashboardData,
  metadata: ExportMetadata,
  options: ExportOptions
): void => {
  const sections = options.sections || ['summary', 'services', 'divisions', 'wards'];
  
  const exportData: any = {};
  
  if (options.includeMetadata) {
    exportData.metadata = metadata;
  }

  sections.forEach((section) => {
    switch (section) {
      case 'summary':
        exportData.summary = data.kpiData;
        break;
      case 'services':
        exportData.servicesByResult = data.servicesByResult;
        break;
      case 'divisions':
        exportData.servicesByDivision = data.servicesByDivision;
        break;
      case 'wards':
        exportData.topWards = data.topWards;
        break;
      case 'timeSeries':
        if (data.timeSeriesData) {
          exportData.timeSeriesData = data.timeSeriesData;
        }
        break;
      case 'expenses':
        if (data.highestExpenses) {
          exportData.highestExpenses = data.highestExpenses;
        }
        break;
      case 'costDistribution':
        if (data.costDistribution) {
          exportData.costDistribution = data.costDistribution;
        }
        break;
      case 'wardAnalysis':
        if (data.wardAnalysis) {
          exportData.wardAnalysis = data.wardAnalysis;
        }
        break;
    }
  });

  const jsonContent = JSON.stringify(exportData, null, 2);
  downloadFile(jsonContent, 'toronto-dashboard-export.json', 'application/json');
};

// CSV Generation Functions
const generateMetadataCSV = (metadata: ExportMetadata): string => {
  return [
    'EXPORT METADATA',
    `Export Date,${metadata.exportDate}`,
    `Data Version,${metadata.dataVersion}`,
    `Total Records,${metadata.totalRecords}`,
    '',
    'APPLIED FILTERS',
    `Start Date,${metadata.filters.startDate || 'All'}`,
    `End Date,${metadata.filters.endDate || 'All'}`,
    `Division,${metadata.filters.serviceDivisionOwner || 'All'}`,
    `Ward,${metadata.filters.ward || 'All'}`,
    `Service Result,${metadata.filters.serviceResult || 'All'}`
  ].join('\n');
};

const generateSummaryCSV = (kpiData: any): string => {
  return [
    'SUMMARY METRICS',
    'Metric,Value',
    `Total Services,${kpiData.totalServices}`,
    `Total Cost,$${kpiData.totalCost.toLocaleString()}`,
    `Average Cost,$${kpiData.avgCost.toLocaleString()}`,
    `Pass Rate,${kpiData.passRate.toFixed(2)}%`,
    `Fail Rate,${kpiData.failRate.toFixed(2)}%`,
    `Unique Divisions,${kpiData.uniqueDivisions}`,
    `Unique Wards,${kpiData.uniqueWards}`
  ].join('\n');
};

const generateServicesCSV = (servicesByResult: any[]): string => {
  const headers = 'Result,Count,Percentage,Total Cost,Average Cost';
  const rows = servicesByResult.map(service => 
    `${service.result},${service.count},${service.percentage.toFixed(2)}%,$${service.total_cost.toLocaleString()},$${service.avg_cost.toLocaleString()}`
  );
  return ['SERVICES BY RESULT', headers, ...rows].join('\n');
};

const generateDivisionsCSV = (divisions: any[]): string => {
  const headers = 'Division,Total Services,Total Cost,Average Cost,Pass Rate';
  const rows = divisions.map(div => 
    `"${div.division || 'Unknown'}",${div.totalServices},$${div.totalCost.toLocaleString()},$${div.avgCost.toLocaleString()},${div.passRate.toFixed(2)}%`
  );
  return ['SERVICES BY DIVISION', headers, ...rows].join('\n');
};

const generateWardsCSV = (wards: any[]): string => {
  const headers = 'Ward,Total Services,Total Cost,Average Cost,Pass Rate';
  const rows = wards.map(ward => 
    `${ward.name},${ward.count},$${ward.value.toLocaleString()},$${ward.avgCost.toLocaleString()},${ward.passRate.toFixed(2)}%`
  );
  return ['TOP WARDS BY COST', headers, ...rows].join('\n');
};

const generateTimeSeriesCSV = (timeSeriesData: any[]): string => {
  const headers = 'Period,Total Services,Total Cost,Avg Cost,Pass Count,Fail Count,Unknown Count,Pass Rate,Fail Rate,Unknown Rate,Cost Efficiency';
  const rows = timeSeriesData.map(item => 
    `${item.period},${item.totalServices},$${item.totalCost.toLocaleString()},$${item.avgCost.toLocaleString()},${item.passCount},${item.failCount},${item.unknownCount},${item.passRate.toFixed(2)}%,${item.failRate.toFixed(2)}%,${item.unknownRate.toFixed(2)}%,${item.costEfficiency.toFixed(3)}`
  );
  return ['TIME SERIES DATA', headers, ...rows].join('\n');
};

const generateExpensesCSV = (expenses: any[]): string => {
  const headers = 'Rank,ID,Division,Ward,Cost,Result,Start Date,End Date,Notes';
  const rows = expenses.map(expense => 
    `${expense.rank || ''},${expense.id},"${expense.division || 'Unknown'}",${expense.ward || ''},$${expense.cost.toLocaleString()},${expense.result},${expense.startDate || ''},${expense.endDate || ''},"${expense.notes || ''}"`
  );
  return ['HIGHEST EXPENSES', headers, ...rows].join('\n');
};

const generateCostDistributionCSV = (costDistribution: any[]): string => {
  const headers = 'Range,Min Cost,Max Cost,Count,Percentage';
  const rows = costDistribution.map(bin => 
    `"${bin.label}",$${bin.min.toLocaleString()},$${bin.max.toLocaleString()},${bin.count},${bin.percentage.toFixed(2)}%`
  );
  return ['COST DISTRIBUTION', headers, ...rows].join('\n');
};

const generateWardAnalysisCSV = (wardAnalysis: any): string => {
  let csv = ['WARD ANALYSIS SUMMARY'];
  csv.push(`Total Wards Covered,${wardAnalysis.totalWardsCovered}`);
  csv.push(`Ward Coverage Percentage,${wardAnalysis.wardCoveragePercentage.toFixed(2)}%`);
  
  if (wardAnalysis.invalidWard66) {
    csv.push('');
    csv.push('WARD 66 ISSUES');
    csv.push(`Services with Ward 66,${wardAnalysis.invalidWard66.count}`);
    csv.push(`Total Cost,$${wardAnalysis.invalidWard66.totalCost.toLocaleString()}`);
    csv.push(`Percentage of Total Services,${wardAnalysis.invalidWard66.impactAnalysis.percentageOfTotalServices.toFixed(2)}%`);
    csv.push(`Percentage of Total Cost,${wardAnalysis.invalidWard66.impactAnalysis.percentageOfTotalCost.toFixed(2)}%`);
  }

  if (wardAnalysis.validWards && wardAnalysis.validWards.length > 0) {
    csv.push('');
    csv.push('VALID WARDS DATA');
    csv.push('Ward,Total Services,Total Cost,Avg Cost,Pass Rate,Fail Rate,Unknown Rate,Cost Efficiency');
    wardAnalysis.validWards.forEach((ward: any) => {
      csv.push(`${ward.ward},${ward.totalServices},$${ward.totalCost.toLocaleString()},$${ward.avgCost.toLocaleString()},${ward.passRate.toFixed(2)}%,${ward.failRate.toFixed(2)}%,${ward.unknownRate.toFixed(2)}%,${ward.costEfficiency.toFixed(3)}`);
    });
  }

  return csv.join('\n');
};

/**
 * Download file to user's device
 */
const downloadFile = (content: string, filename: string, mimeType: string): void => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // Clean up the URL object
  URL.revokeObjectURL(url);
};

/**
 * Format filters for export filename
 */
export const generateExportFilename = (
  filters: ServiceFilters,
  format: 'csv' | 'json'
): string => {
  const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const filterParts: string[] = [];
  
  if (filters.startDate || filters.endDate) {
    const start = filters.startDate || 'start';
    const end = filters.endDate || 'end';
    filterParts.push(`${start}-to-${end}`);
  }
  
  if (filters.serviceDivisionOwner && filters.serviceDivisionOwner !== 'all') {
    filterParts.push(filters.serviceDivisionOwner.toLowerCase().replace(/\s+/g, '-'));
  }
  
  if (filters.ward && filters.ward !== 'all') {
    filterParts.push(`ward-${filters.ward}`);
  }
  
  if (filters.serviceResult && filters.serviceResult !== 'all') {
    filterParts.push(filters.serviceResult.toLowerCase());
  }

  const filterString = filterParts.length > 0 ? `-${filterParts.join('-')}` : '';
  return `toronto-dashboard-${timestamp}${filterString}.${format}`;
};