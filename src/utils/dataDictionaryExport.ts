/**
 * Export utilities for the data dictionary
 */

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

/**
 * Export data dictionary as JSON file
 */
export const exportToJSON = (data: DataDictionary, filename: string): void => {
  const jsonString = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Export data dictionary as CSV file
 */
export const exportToCSV = (data: DataDictionary, filename: string): void => {
  // Create CSV header
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
    'Data Quality Notes',
    'Business Rules'
  ];

  // Create CSV rows
  const rows = data.fields.map(field => [
    field.fieldName,
    field.displayName,
    field.dataType,
    field.nullable ? 'No' : 'Yes',
    field.primaryKey ? 'Yes' : 'No',
    `"${field.description.replace(/"/g, '""')}"`, // Escape quotes
    Array.isArray(field.validValues) 
      ? `"${field.validValues.map(v => v ?? '(null)').join(', ').replace(/"/g, '""')}"` 
      : `"${field.validValues.replace(/"/g, '""')}"`,
    field.example || '',
    field.dataQuality.completeness !== null ? field.dataQuality.completeness.toString() : 'N/A',
    `"${field.dataQuality.notes.replace(/"/g, '""')}"`,
    field.businessRules ? `"${field.businessRules.join('; ').replace(/"/g, '""')}"` : ''
  ]);

  // Combine headers and rows
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n');

  // Add metadata section
  const metadata = `
Data Dictionary Metadata
Title:,${data.title}
Description:,${data.description}
Version:,${data.version}
Last Updated:,${data.lastUpdated}
Data Quality Score:,${data.dataQualityScore}%
Total Records:,${data.totalRecords}
Date Range:,${data.dateRange.start} to ${data.dateRange.end}

Field Definitions
${csvContent}

Data Quality Issues
Issue,Severity,Records Affected,Description,Recommendation
${data.dataQualityIssues.map(issue => 
  `"${issue.issue}",${issue.severity},${issue.recordsAffected},"${issue.description.replace(/"/g, '""')}","${issue.recommendation.replace(/"/g, '""')}"`
).join('\n')}

Usage Notes
${data.usageNotes.map((note, idx) => `${idx + 1}. "${note.replace(/"/g, '""')}"`).join('\n')}

Contact Information
Data Owner:,${data.contactInformation.dataOwner}
Last Audit Date:,${data.contactInformation.lastAuditDate}
Audited By:,${data.contactInformation.auditedBy}
`;

  // Create and download the file
  const blob = new Blob([metadata], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Generate PDF export (requires additional library like jsPDF)
 * This is a placeholder for PDF export functionality
 */
export const exportToPDF = async (data: DataDictionary, filename: string): Promise<void> => {
  // This would require importing a PDF library like jsPDF
  // For now, we'll create a printable HTML version
  
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>${data.title}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        h1 { color: #333; border-bottom: 2px solid #333; padding-bottom: 10px; }
        h2 { color: #666; margin-top: 30px; }
        table { border-collapse: collapse; width: 100%; margin-top: 10px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; font-weight: bold; }
        .metadata { background-color: #f9f9f9; padding: 15px; margin-bottom: 20px; }
        .field-section { margin-bottom: 30px; page-break-inside: avoid; }
        @media print { 
          .field-section { page-break-inside: avoid; }
          h2 { page-break-before: auto; }
        }
      </style>
    </head>
    <body>
      <h1>${data.title}</h1>
      
      <div class="metadata">
        <p><strong>Description:</strong> ${data.description}</p>
        <p><strong>Version:</strong> ${data.version} | <strong>Last Updated:</strong> ${data.lastUpdated}</p>
        <p><strong>Data Quality Score:</strong> ${data.dataQualityScore}% | <strong>Total Records:</strong> ${data.totalRecords.toLocaleString()}</p>
        <p><strong>Date Range:</strong> ${data.dateRange.start} to ${data.dateRange.end}</p>
      </div>

      <h2>Field Definitions</h2>
      ${data.fields.map(field => `
        <div class="field-section">
          <h3>${field.displayName} (${field.fieldName})</h3>
          <table>
            <tr><th>Property</th><th>Value</th></tr>
            <tr><td>Data Type</td><td>${field.dataType}</td></tr>
            <tr><td>Required</td><td>${field.nullable ? 'No' : 'Yes'}</td></tr>
            <tr><td>Primary Key</td><td>${field.primaryKey ? 'Yes' : 'No'}</td></tr>
            <tr><td>Description</td><td>${field.description}</td></tr>
            <tr><td>Valid Values</td><td>${Array.isArray(field.validValues) ? field.validValues.join(', ') : field.validValues}</td></tr>
            <tr><td>Example</td><td>${field.example || 'N/A'}</td></tr>
            <tr><td>Completeness</td><td>${field.dataQuality.completeness !== null ? field.dataQuality.completeness + '%' : 'N/A'}</td></tr>
            <tr><td>Data Quality Notes</td><td>${field.dataQuality.notes}</td></tr>
            ${field.businessRules ? `<tr><td>Business Rules</td><td><ul>${field.businessRules.map(rule => `<li>${rule}</li>`).join('')}</ul></td></tr>` : ''}
          </table>
        </div>
      `).join('')}

      <h2>Data Quality Issues</h2>
      <table>
        <tr>
          <th>Issue</th>
          <th>Severity</th>
          <th>Records Affected</th>
          <th>Description</th>
          <th>Recommendation</th>
        </tr>
        ${data.dataQualityIssues.map(issue => `
          <tr>
            <td>${issue.issue}</td>
            <td>${issue.severity}</td>
            <td>${issue.recordsAffected.toLocaleString()}</td>
            <td>${issue.description}</td>
            <td>${issue.recommendation}</td>
          </tr>
        `).join('')}
      </table>

      <h2>Usage Notes</h2>
      <ul>
        ${data.usageNotes.map(note => `<li>${note}</li>`).join('')}
      </ul>

      <h2>Contact Information</h2>
      <p><strong>Data Owner:</strong> ${data.contactInformation.dataOwner}</p>
      <p><strong>Last Audit Date:</strong> ${data.contactInformation.lastAuditDate}</p>
      <p><strong>Audited By:</strong> ${data.contactInformation.auditedBy}</p>

      <script>
        window.onload = function() {
          window.print();
        }
      </script>
    </body>
    </html>
  `;

  printWindow.document.write(htmlContent);
  printWindow.document.close();
};