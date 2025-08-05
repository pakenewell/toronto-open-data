import type { ComprehensiveExportOptions } from './dashboardExport';

interface DataDictionary {
  title: string;
  description: string;
  version: string;
  lastUpdated: string;
  dataQualityScore: number;
  totalRecords: number;
  dateRange: {
    start: string;
    end: string;
  };
  fields: Array<{
    fieldName: string;
    displayName: string;
    dataType: string;
    nullable: boolean;
    primaryKey: boolean;
    description: string;
    validValues: string | (string | null)[];
    example: string;
    dataQuality: {
      completeness: number | null;
      uniqueness: number | null;
      validity: number | null;
      notes: string;
    };
    businessRules?: string[];
    statistics?: {
      min: number;
      max: number;
      mean: number;
      median: number;
      standardDeviation: number;
    };
    referenceData?: {
      source: string;
      lastUpdated: string;
      note?: string;
    };
    privacyNotes?: string;
  }>;
  dataQualityIssues: Array<{
    issue: string;
    severity: string;
    recordsAffected: number;
    description: string;
    recommendation: string;
  }>;
  usageNotes: string[];
  contactInformation: {
    dataOwner: string;
    lastAuditDate: string;
    auditedBy: string;
  };
}

export interface DictionaryExportOptions {
  format: 'csv' | 'json' | 'pdf';
  includeMetadata?: boolean;
  includeStatistics?: boolean;
  includeBusinessRules?: boolean;
  includeQualityMetrics?: boolean;
  customFilename?: string;
}

/**
 * Export data dictionary in comprehensive format
 */
export const exportDataDictionary = (
  dictionary: DataDictionary,
  options: DictionaryExportOptions
): void => {
  switch (options.format) {
    case 'csv':
      exportDictionaryAsCSV(dictionary, options);
      break;
    case 'json':
      exportDictionaryAsJSON(dictionary, options);
      break;
    case 'pdf':
      exportDictionaryAsPDF(dictionary, options);
      break;
    default:
      throw new Error(`Unsupported format: ${options.format}`);
  }
};

/**
 * Export dictionary as comprehensive CSV
 */
const exportDictionaryAsCSV = (
  dictionary: DataDictionary,
  options: DictionaryExportOptions
): void => {
  let csvContent = '';

  // Add metadata header if requested
  if (options.includeMetadata !== false) {
    csvContent += generateDictionaryMetadataCSV(dictionary);
    csvContent += '\n\n';
  }

  // Field definitions
  csvContent += generateFieldDefinitionsCSV(dictionary.fields, options);
  csvContent += '\n\n';

  // Data quality issues
  if (dictionary.dataQualityIssues.length > 0) {
    csvContent += generateDataQualityIssuesCSV(dictionary.dataQualityIssues);
    csvContent += '\n\n';
  }

  // Usage notes
  csvContent += generateUsageNotesCSV(dictionary.usageNotes);
  csvContent += '\n\n';

  // Contact information
  csvContent += generateContactInformationCSV(dictionary.contactInformation);

  const filename = options.customFilename || generateDictionaryFilename('csv');
  downloadFile(csvContent, filename, 'text/csv;charset=utf-8;');
};

/**
 * Export dictionary as enhanced JSON
 */
const exportDictionaryAsJSON = (
  dictionary: DataDictionary,
  options: DictionaryExportOptions
): void => {
  const exportData: any = {
    exportInfo: {
      version: '2.0',
      format: 'json',
      timestamp: new Date().toISOString(),
      description: 'Toronto Open Data Service Results Data Dictionary'
    },
    dictionary: dictionary,
    analysis: {
      fieldCount: dictionary.fields.length,
      requiredFields: dictionary.fields.filter(f => !f.nullable).length,
      fieldsWithStatistics: dictionary.fields.filter(f => f.statistics).length,
      avgCompleteness: dictionary.fields.reduce((sum, f) => sum + (f.dataQuality.completeness || 0), 0) / dictionary.fields.length,
      qualityIssuesCount: dictionary.dataQualityIssues.length
    }
  };

  if (options.includeMetadata !== false) {
    exportData.metadata = {
      exportDate: new Date().toISOString().split('T')[0],
      exportTime: new Date().toISOString(),
      generatedBy: 'Toronto Open Data Dashboard',
      includeStatistics: options.includeStatistics,
      includeBusinessRules: options.includeBusinessRules,
      includeQualityMetrics: options.includeQualityMetrics
    };
  }

  const filename = options.customFilename || generateDictionaryFilename('json');
  const jsonContent = JSON.stringify(exportData, null, 2);
  downloadFile(jsonContent, filename, 'application/json');
};

/**
 * Export dictionary as comprehensive PDF
 */
const exportDictionaryAsPDF = (
  dictionary: DataDictionary,
  options: DictionaryExportOptions
): void => {
  const htmlContent = generateDictionaryPDFHTML(dictionary, options);
  
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

// CSV generation helper functions
const generateDictionaryMetadataCSV = (dictionary: DataDictionary): string => {
  return [
    '=== TORONTO SERVICE RESULTS DATA DICTIONARY ===',
    '',
    'DICTIONARY INFORMATION',
    `Title,"${dictionary.title}"`,
    `Description,"${dictionary.description}"`,
    `Version,${dictionary.version}`,
    `Last Updated,${dictionary.lastUpdated}`,
    `Data Quality Score,${dictionary.dataQualityScore}%`,
    `Total Records,${dictionary.totalRecords.toLocaleString()}`,
    `Date Range,${dictionary.dateRange.start} to ${dictionary.dateRange.end}`,
    '',
    'CONTACT INFORMATION',
    `Data Owner,"${dictionary.contactInformation.dataOwner}"`,
    `Last Audit Date,${dictionary.contactInformation.lastAuditDate}`,
    `Audited By,"${dictionary.contactInformation.auditedBy}"`,
    '',
    '=' .repeat(80)
  ].join('\n');
};

const generateFieldDefinitionsCSV = (
  fields: DataDictionary['fields'],
  options: DictionaryExportOptions
): string => {
  const headers = [
    'Field Name',
    'Display Name',
    'Data Type',
    'Required',
    'Primary Key',
    'Description',
    'Valid Values',
    'Example',
    'Completeness %',
    'Uniqueness %',
    'Validity %',
    'Data Quality Notes'
  ];

  if (options.includeBusinessRules !== false) {
    headers.push('Business Rules');
  }

  if (options.includeStatistics !== false) {
    headers.push('Min Value', 'Max Value', 'Mean Value', 'Median Value', 'Std Deviation');
  }

  const rows = fields.map(field => {
    const row = [
      field.fieldName,
      field.displayName,
      field.dataType,
      field.nullable ? 'No' : 'Yes',
      field.primaryKey ? 'Yes' : 'No',
      `"${field.description.replace(/"/g, '""')}"`,
      Array.isArray(field.validValues) 
        ? `"${field.validValues.map(v => v ?? '(null)').join(', ').replace(/"/g, '""')}"` 
        : `"${field.validValues.replace(/"/g, '""')}"`,
      field.example || '',
      field.dataQuality.completeness !== null ? field.dataQuality.completeness.toFixed(1) : 'N/A',
      field.dataQuality.uniqueness !== null ? field.dataQuality.uniqueness.toFixed(1) : 'N/A',
      field.dataQuality.validity !== null ? field.dataQuality.validity.toFixed(1) : 'N/A',
      `"${field.dataQuality.notes.replace(/"/g, '""')}"`
    ];

    if (options.includeBusinessRules !== false) {
      row.push(field.businessRules ? `"${field.businessRules.join('; ').replace(/"/g, '""')}"` : '');
    }

    if (options.includeStatistics !== false && field.statistics) {
      row.push(
        field.statistics.min.toFixed(2),
        field.statistics.max.toFixed(2),
        field.statistics.mean.toFixed(2),
        field.statistics.median.toFixed(2),
        field.statistics.standardDeviation.toFixed(2)
      );
    } else if (options.includeStatistics !== false) {
      row.push('N/A', 'N/A', 'N/A', 'N/A', 'N/A');
    }

    return row.join(',');
  });

  return [
    'FIELD DEFINITIONS',
    headers.join(','),
    ...rows
  ].join('\n');
};

const generateDataQualityIssuesCSV = (issues: DataDictionary['dataQualityIssues']): string => {
  const headers = 'Issue,Severity,Records Affected,Description,Recommendation';
  const rows = issues.map(issue => 
    `"${issue.issue.replace(/"/g, '""')}",${issue.severity},${issue.recordsAffected.toLocaleString()},"${issue.description.replace(/"/g, '""')}","${issue.recommendation.replace(/"/g, '""')}"`
  );
  
  return [
    'DATA QUALITY ISSUES',
    headers,
    ...rows
  ].join('\n');
};

const generateUsageNotesCSV = (usageNotes: string[]): string => {
  const rows = usageNotes.map((note, index) => 
    `${index + 1},"${note.replace(/"/g, '""')}"`
  );
  
  return [
    'USAGE NOTES',
    'Number,Note',
    ...rows
  ].join('\n');
};

const generateContactInformationCSV = (contactInfo: DataDictionary['contactInformation']): string => {
  return [
    'CONTACT INFORMATION',
    'Field,Value',
    `Data Owner,"${contactInfo.dataOwner}"`,
    `Last Audit Date,${contactInfo.lastAuditDate}`,
    `Audited By,"${contactInfo.auditedBy}"`
  ].join('\n');
};

/**
 * Generate comprehensive PDF HTML for dictionary
 */
const generateDictionaryPDFHTML = (
  dictionary: DataDictionary,
  options: DictionaryExportOptions
): string => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>${dictionary.title}</title>
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
        .metadata {
          background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
          padding: 20px;
          border-radius: 8px;
          margin-bottom: 30px;
          border-left: 4px solid #3b82f6;
        }
        .field-section {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 20px;
          margin-bottom: 20px;
          page-break-inside: avoid;
        }
        .field-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 15px;
          padding-bottom: 10px;
          border-bottom: 2px solid #f3f4f6;
        }
        .field-name {
          font-size: 1.3em;
          font-weight: bold;
          color: #1e40af;
        }
        .field-type {
          background: #f3f4f6;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 0.9em;
          color: #6b7280;
        }
        .field-details {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 15px;
          margin-bottom: 15px;
        }
        .detail-item {
          background: #f9fafb;
          padding: 10px;
          border-radius: 6px;
        }
        .detail-label {
          font-weight: 600;
          color: #374151;
          margin-bottom: 5px;
        }
        .detail-value {
          color: #6b7280;
          font-size: 0.95em;
        }
        .quality-metrics {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
          margin-top: 15px;
        }
        .quality-metric {
          text-align: center;
          padding: 10px;
          background: #eff6ff;
          border-radius: 6px;
        }
        .quality-score {
          font-size: 1.2em;
          font-weight: bold;
          color: #2563eb;
        }
        .quality-label {
          font-size: 0.85em;
          color: #6b7280;
          margin-top: 5px;
        }
        .business-rules {
          background: #f0fdf4;
          border-left: 4px solid #22c55e;
          padding: 15px;
          margin-top: 15px;
        }
        .statistics {
          background: #fefce8;
          border-left: 4px solid #eab308;
          padding: 15px;
          margin-top: 15px;
        }
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 10px;
          margin-top: 10px;
        }
        .stat-item {
          text-align: center;
          padding: 8px;
          background: white;
          border-radius: 4px;
        }
        .issues-section {
          background: #fef2f2;
          border: 1px solid #fecaca;
          border-radius: 8px;
          padding: 20px;
          margin-bottom: 30px;
        }
        .issue-item {
          background: white;
          border: 1px solid #f3f4f6;
          border-radius: 6px;
          padding: 15px;
          margin-bottom: 15px;
        }
        .severity-high { border-left: 4px solid #dc2626; }
        .severity-medium { border-left: 4px solid #d97706; }
        .severity-low { border-left: 4px solid #059669; }
        .usage-notes {
          background: #f0f9ff;
          border: 1px solid #e0f2fe;
          border-radius: 8px;
          padding: 20px;
        }
        .note-item {
          display: flex;
          align-items: flex-start;
          margin-bottom: 12px;
        }
        .note-number {
          background: #2563eb;
          color: white;
          border-radius: 50%;
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.85em;
          font-weight: bold;
          margin-right: 12px;
          flex-shrink: 0;
        }
        @media print {
          body { margin: 0; }
          .field-section { page-break-inside: avoid; }
          .header { page-break-after: avoid; }
        }
        @page {
          margin: 1in;
          @top-center {
            content: "${dictionary.title}";
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
        <h1>${dictionary.title}</h1>
        <p style="font-size: 1.2em; color: #6b7280;">${dictionary.description}</p>
        <p style="font-size: 0.9em; color: #6b7280;">Generated on ${new Date().toLocaleDateString()}</p>
      </div>

      <div class="metadata">
        <h2 style="color: #1e40af; margin-top: 0;">Dictionary Information</h2>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 15px;">
          <div><strong>Version:</strong> ${dictionary.version}</div>
          <div><strong>Last Updated:</strong> ${dictionary.lastUpdated}</div>
          <div><strong>Total Records:</strong> ${dictionary.totalRecords.toLocaleString()}</div>
          <div><strong>Data Quality Score:</strong> ${dictionary.dataQualityScore}%</div>
          <div><strong>Date Range:</strong> ${dictionary.dateRange.start} to ${dictionary.dateRange.end}</div>
          <div><strong>Fields Count:</strong> ${dictionary.fields.length}</div>
        </div>
      </div>

      <h2 style="color: #1e40af; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">Field Definitions</h2>
      
      ${dictionary.fields.map(field => `
        <div class="field-section">
          <div class="field-header">
            <div>
              <div class="field-name">${field.displayName}</div>
              <div style="color: #6b7280; font-size: 0.9em;">${field.fieldName}</div>
            </div>
            <div class="field-type">${field.dataType}${field.primaryKey ? ' (PK)' : ''}</div>
          </div>
          
          <div class="field-details">
            <div class="detail-item">
              <div class="detail-label">Description</div>
              <div class="detail-value">${field.description}</div>
            </div>
            
            <div class="detail-item">
              <div class="detail-label">Requirements</div>
              <div class="detail-value">${field.nullable ? 'Optional' : 'Required'}</div>
            </div>
            
            <div class="detail-item">
              <div class="detail-label">Valid Values</div>
              <div class="detail-value">${Array.isArray(field.validValues) ? field.validValues.join(', ') : field.validValues}</div>
            </div>
            
            <div class="detail-item">
              <div class="detail-label">Example</div>
              <div class="detail-value" style="font-family: monospace;">${field.example || 'N/A'}</div>
            </div>
          </div>
          
          ${options.includeQualityMetrics !== false ? `
            <div class="quality-metrics">
              <div class="quality-metric">
                <div class="quality-score">${field.dataQuality.completeness || 'N/A'}${field.dataQuality.completeness ? '%' : ''}</div>
                <div class="quality-label">Completeness</div>
              </div>
              <div class="quality-metric">
                <div class="quality-score">${field.dataQuality.uniqueness || 'N/A'}${field.dataQuality.uniqueness ? '%' : ''}</div>
                <div class="quality-label">Uniqueness</div>
              </div>
              <div class="quality-metric">
                <div class="quality-score">${field.dataQuality.validity || 'N/A'}${field.dataQuality.validity ? '%' : ''}</div>
                <div class="quality-label">Validity</div>
              </div>
            </div>
          ` : ''}
          
          ${field.dataQuality.notes ? `
            <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 10px; margin-top: 15px;">
              <strong>Quality Notes:</strong> ${field.dataQuality.notes}
            </div>
          ` : ''}
          
          ${options.includeBusinessRules !== false && field.businessRules && field.businessRules.length > 0 ? `
            <div class="business-rules">
              <strong style="color: #059669;">Business Rules:</strong>
              <ul style="margin: 8px 0 0 20px;">
                ${field.businessRules.map(rule => `<li>${rule}</li>`).join('')}
              </ul>
            </div>
          ` : ''}
          
          ${options.includeStatistics !== false && field.statistics ? `
            <div class="statistics">
              <strong style="color: #d97706;">Statistical Summary:</strong>
              <div class="stats-grid">
                <div class="stat-item">
                  <div style="font-weight: bold;">$${field.statistics.min.toLocaleString()}</div>
                  <div style="font-size: 0.8em; color: #6b7280;">Min</div>
                </div>
                <div class="stat-item">
                  <div style="font-weight: bold;">$${field.statistics.max.toLocaleString()}</div>
                  <div style="font-size: 0.8em; color: #6b7280;">Max</div>
                </div>
                <div class="stat-item">
                  <div style="font-weight: bold;">$${field.statistics.mean.toLocaleString()}</div>
                  <div style="font-size: 0.8em; color: #6b7280;">Mean</div>
                </div>
                <div class="stat-item">
                  <div style="font-weight: bold;">$${field.statistics.median.toLocaleString()}</div>
                  <div style="font-size: 0.8em; color: #6b7280;">Median</div>
                </div>
                <div class="stat-item">
                  <div style="font-weight: bold;">${field.statistics.standardDeviation.toFixed(2)}</div>
                  <div style="font-size: 0.8em; color: #6b7280;">Std Dev</div>
                </div>
              </div>
            </div>
          ` : ''}
        </div>
      `).join('')}
      
      ${dictionary.dataQualityIssues.length > 0 ? `
        <div class="issues-section">
          <h2 style="color: #dc2626; margin-top: 0;">Data Quality Issues</h2>
          ${dictionary.dataQualityIssues.map(issue => `
            <div class="issue-item severity-${issue.severity.toLowerCase()}">
              <div style="display: flex; justify-content: between; align-items: center; margin-bottom: 10px;">
                <h3 style="margin: 0; color: #374151;">${issue.issue}</h3>
                <span style="background: ${issue.severity === 'high' ? '#fee2e2' : issue.severity === 'medium' ? '#fef3c7' : '#f0fdf4'}; color: ${issue.severity === 'high' ? '#991b1b' : issue.severity === 'medium' ? '#92400e' : '#166534'}; padding: 4px 8px; border-radius: 12px; font-size: 0.8em; font-weight: bold;">${issue.severity.toUpperCase()}</span>
              </div>
              <p style="margin-bottom: 10px; color: #6b7280;">${issue.description}</p>
              <div style="background: #f9fafb; padding: 10px; border-radius: 6px;">
                <strong>Recommendation:</strong> ${issue.recommendation}
              </div>
              <div style="font-size: 0.9em; color: #6b7280; margin-top: 8px;">
                <strong>Records Affected:</strong> ${issue.recordsAffected.toLocaleString()}
              </div>
            </div>
          `).join('')}
        </div>
      ` : ''}
      
      <div class="usage-notes">
        <h2 style="color: #1e40af; margin-top: 0;">Usage Notes</h2>
        ${dictionary.usageNotes.map((note, index) => `
          <div class="note-item">
            <div class="note-number">${index + 1}</div>
            <div>${note}</div>
          </div>
        `).join('')}
      </div>
      
      <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #6b7280; font-size: 0.9em;">
        <p><strong>Contact Information</strong></p>
        <p>Data Owner: ${dictionary.contactInformation.dataOwner}</p>
        <p>Last Audit: ${dictionary.contactInformation.lastAuditDate} by ${dictionary.contactInformation.auditedBy}</p>
        <p style="margin-top: 20px;">Generated on ${new Date().toLocaleString()}</p>
      </div>

      <script>
        window.onload = function() {
          setTimeout(function() {
            window.print();
          }, 1000);
        }
      </script>
    </body>
    </html>
  `;
};

/**
 * Generate filename for dictionary export
 */
const generateDictionaryFilename = (format: string): string => {
  const timestamp = new Date().toISOString().split('T')[0];
  return `toronto-service-results-dictionary-${timestamp}.${format}`;
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
