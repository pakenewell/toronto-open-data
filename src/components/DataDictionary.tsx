import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import dataDictionary from '../data/data-dictionary.json';
import { ExportButton, ExportFormat } from './ui/ExportButton';
import { exportDataDictionary, type DictionaryExportOptions } from '../lib/utils/dictionaryExport';

interface DataDictionaryProps {
  className?: string;
}

export const DataDictionary: React.FC<DataDictionaryProps> = ({ className = '' }) => {
  const [expandedField, setExpandedField] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const toggleField = (fieldName: string) => {
    setExpandedField(expandedField === fieldName ? null : fieldName);
  };

  const filteredFields = dataDictionary.fields.filter(field =>
    field.fieldName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    field.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    field.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleExport = async (format: ExportFormat, data: any) => {
    const exportOptions: DictionaryExportOptions = {
      format: format === 'excel' ? 'csv' : format as 'csv' | 'json' | 'pdf',
      includeMetadata: true,
      includeStatistics: true,
      includeBusinessRules: true,
      includeQualityMetrics: true
    };
    
    exportDataDictionary(dataDictionary, exportOptions);
  };

  const getQualityColor = (score: number | null | undefined) => {
    if (score === null || score === undefined) return 'text-gray-500';
    if (score >= 95) return 'text-green-600';
    if (score >= 80) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className={`bg-white rounded-lg shadow-sm ${className}`}>
      {/* Header */}
      <div className="px-6 py-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{dataDictionary.title}</h2>
            <p className="mt-2 text-base text-gray-700">{dataDictionary.description}</p>
            <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-lg p-3 shadow-sm">
                <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">Version</div>
                <div className="text-lg font-semibold text-gray-900">{dataDictionary.version}</div>
              </div>
              <div className="bg-white rounded-lg p-3 shadow-sm">
                <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">Last Updated</div>
                <div className="text-lg font-semibold text-gray-900">{dataDictionary.lastUpdated}</div>
              </div>
              <div className="bg-white rounded-lg p-3 shadow-sm">
                <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">Records</div>
                <div className="text-lg font-semibold text-gray-900">{dataDictionary.totalRecords.toLocaleString()}</div>
              </div>
            </div>
          </div>
          <div className="ml-6">
            <ExportButton
              data={dataDictionary as any}
              filename="toronto-service-results-dictionary"
              formats={['pdf', 'csv', 'json']}
              tabContext="dictionary"
              onExport={handleExport}
              className="ml-4"
            />
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
        <div className="max-w-md">
          <label htmlFor="field-search" className="block text-sm font-medium text-gray-700 mb-2">
            Search Field Definitions
          </label>
          <input
            id="field-search"
            type="text"
            placeholder="Search by field name, display name, or description..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Results Summary */}
      {searchTerm && (
        <div className="px-6 py-2 bg-blue-50 border-b border-gray-200">
          <p className="text-sm text-blue-700">
            Showing {filteredFields.length} of {dataDictionary.fields.length} fields
            {filteredFields.length === 0 && (
              <span className="ml-1 text-blue-600">- try a different search term</span>
            )}
          </p>
        </div>
      )}

      {/* Fields Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Field Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Display Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Data Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Required
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Completeness
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Details
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredFields.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center">
                  <div className="text-gray-500">
                    <p className="text-lg font-medium">No fields found</p>
                    <p className="text-sm mt-1">
                      {searchTerm ? 'Try adjusting your search term' : 'No field definitions available'}
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredFields.map((field) => (
              <React.Fragment key={field.fieldName}>
                <tr className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {field.fieldName}
                    {field.primaryKey && (
                      <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                        PK
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {field.displayName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {field.dataType}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {field.nullable ? 'No' : 'Yes'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={getQualityColor(field.dataQuality.completeness)}>
                      {field.dataQuality.completeness}%
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <button
                      onClick={() => toggleField(field.fieldName)}
                      className="text-indigo-600 hover:text-indigo-900"
                    >
                      {expandedField === field.fieldName ? (
                        <ChevronUp className="h-5 w-5" />
                      ) : (
                        <ChevronDown className="h-5 w-5" />
                      )}
                    </button>
                  </td>
                </tr>
                {expandedField === field.fieldName && (
                  <tr>
                    <td colSpan={6} className="px-6 py-4 bg-gray-50">
                      <div className="space-y-4">
                        <div>
                          <h4 className="text-sm font-medium text-gray-900">Description</h4>
                          <p className="mt-1 text-sm text-gray-600">{field.description}</p>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <h4 className="text-sm font-medium text-gray-900">Valid Values</h4>
                            <p className="mt-1 text-sm text-gray-600">
                              {Array.isArray(field.validValues) 
                                ? field.validValues.map(v => v || '(empty)').join(', ')
                                : field.validValues}
                            </p>
                          </div>
                          
                          <div>
                            <h4 className="text-sm font-medium text-gray-900">Example</h4>
                            <p className="mt-1 text-sm text-gray-600 font-mono">
                              {field.example || 'N/A'}
                            </p>
                          </div>
                        </div>

                        {field.businessRules && field.businessRules.length > 0 && (
                          <div>
                            <h4 className="text-sm font-medium text-gray-900">Business Rules</h4>
                            <ul className="mt-1 text-sm text-gray-600 list-disc list-inside">
                              {field.businessRules.map((rule, idx) => (
                                <li key={idx}>{rule}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {field.dataQuality.notes && (
                          <div>
                            <h4 className="text-sm font-medium text-gray-900">Data Quality Notes</h4>
                            <p className="mt-1 text-sm text-gray-600">{field.dataQuality.notes}</p>
                          </div>
                        )}

                        {field.statistics && (
                          <div>
                            <h4 className="text-sm font-medium text-gray-900">Statistics</h4>
                            <div className="mt-1 text-sm text-gray-600 grid grid-cols-2 md:grid-cols-4 gap-2">
                              <div>Min: ${field.statistics.min.toLocaleString()}</div>
                              <div>Max: ${field.statistics.max.toLocaleString()}</div>
                              <div>Mean: ${field.statistics.mean.toLocaleString()}</div>
                              <div>Median: ${field.statistics.median.toLocaleString()}</div>
                            </div>
                          </div>
                        )}

                        {field.referenceData && (
                          <div>
                            <h4 className="text-sm font-medium text-gray-900">Reference Data</h4>
                            <p className="mt-1 text-sm text-gray-600">
                              Source: {field.referenceData.source}<br />
                              Last Updated: {field.referenceData.lastUpdated}<br />
                              {field.referenceData.note && `Note: ${field.referenceData.note}`}
                            </p>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            )))}
          </tbody>
        </table>
      </div>


      {/* Usage Notes */}
      <div className="px-6 py-6 border-t border-gray-200 bg-gray-50">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Usage Notes</h3>
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <ul className="space-y-3 text-sm text-gray-700">
            {dataDictionary.usageNotes.map((note, idx) => (
              <li key={idx} className="flex items-start">
                <span className="inline-flex items-center justify-center w-5 h-5 bg-indigo-100 text-indigo-600 rounded-full text-xs font-medium mr-3 mt-0.5 flex-shrink-0">
                  {idx + 1}
                </span>
                <span className="leading-relaxed">{note}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};