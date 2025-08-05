import React, { useMemo } from 'react';
import { Check, X, AlertTriangle, ExternalLink } from 'lucide-react';

interface DCATField {
  field: string;
  required: boolean;
  present: boolean;
  quality: 'excellent' | 'good' | 'fair' | 'poor' | 'missing';
  description: string;
  value?: string;
  recommendation?: string;
}

interface DCATComplianceData {
  overallScore: number;
  requiredFields: DCATField[];
  recommendedFields: DCATField[];
  optionalFields: DCATField[];
  complianceLevel: 'full' | 'substantial' | 'partial' | 'minimal';
}

interface DCATComplianceCardProps {
  complianceData: DCATComplianceData | null;
  className?: string;
}

export function DCATComplianceCard({
  complianceData,
  className = ''
}: DCATComplianceCardProps) {
  
  const defaultComplianceData: DCATComplianceData = {
    overallScore: 73,
    complianceLevel: 'substantial',
    requiredFields: [
      {
        field: 'title',
        required: true,
        present: true,
        quality: 'excellent',
        description: 'A descriptive name for the dataset',
        value: 'City of Toronto Service Results',
        recommendation: 'Title is clear and descriptive'
      },
      {
        field: 'description',
        required: true,
        present: true,
        quality: 'good',
        description: 'A free-text account of the dataset',
        value: 'Service delivery results and costs...',
        recommendation: 'Could be more detailed about data collection methods'
      },
      {
        field: 'publisher',
        required: true,
        present: true,
        quality: 'excellent',
        description: 'The entity responsible for making the dataset available',
        value: 'City of Toronto',
        recommendation: 'Publisher is clearly identified'
      },
      {
        field: 'identifier',
        required: true,
        present: true,
        quality: 'excellent',
        description: 'A unique identifier for the dataset',
        value: 'toronto-service-results-2024',
        recommendation: 'Unique identifier follows best practices'
      },
      {
        field: 'issued',
        required: true,
        present: false,
        quality: 'missing',
        description: 'Date of formal issuance of the dataset',
        recommendation: 'Add publication date for compliance'
      },
      {
        field: 'modified',
        required: true,
        present: true,
        quality: 'good',
        description: 'Most recent date the dataset was changed',
        value: '2024-12-15',
        recommendation: 'Update frequency could be more specific'
      }
    ],
    recommendedFields: [
      {
        field: 'keyword',
        required: false,
        present: true,
        quality: 'good',
        description: 'Tags describing the dataset',
        value: 'services, government, toronto, performance',
        recommendation: 'Good keyword coverage for discoverability'
      },
      {
        field: 'theme',
        required: false,
        present: false,
        quality: 'missing',
        description: 'Category of the dataset',
        recommendation: 'Add theme classification (e.g., "Government Services")'
      },
      {
        field: 'contactPoint',
        required: false,
        present: true,
        quality: 'fair',
        description: 'Contact information for the dataset',
        value: 'opendata@toronto.ca',
        recommendation: 'Could include dedicated contact person'
      },
      {
        field: 'license',
        required: false,
        present: true,
        quality: 'excellent',
        description: 'Legal license under which the dataset is made available',
        value: 'Open Government License - Toronto',
        recommendation: 'License is clearly specified and appropriate'
      }
    ],
    optionalFields: [
      {
        field: 'spatial',
        required: false,
        present: true,
        quality: 'excellent',
        description: 'Geographic coverage of the dataset',
        value: 'Toronto, Ontario, Canada',
        recommendation: 'Geographic coverage is well specified'
      },
      {
        field: 'temporal',
        required: false,
        present: true,
        quality: 'good',
        description: 'Time period covered by the dataset',
        value: '2020-2024',
        recommendation: 'Temporal coverage is specified'
      },
      {
        field: 'accrualPeriodicity',
        required: false,
        present: false,
        quality: 'missing',
        description: 'Frequency with which dataset is updated',
        recommendation: 'Specify update frequency (e.g., "monthly")'
      }
    ]
  };

  const data = complianceData || defaultComplianceData;

  const { stats, complianceSummary } = useMemo(() => {
    const allFields = [...data.requiredFields, ...data.recommendedFields, ...data.optionalFields];
    
    const stats = {
      total: allFields.length,
      present: allFields.filter(f => f.present).length,
      missing: allFields.filter(f => !f.present).length,
      requiredPresent: data.requiredFields.filter(f => f.present).length,
      requiredTotal: data.requiredFields.length,
      recommendedPresent: data.recommendedFields.filter(f => f.present).length,
      recommendedTotal: data.recommendedFields.length
    };

    const complianceSummary = {
      required: (stats.requiredPresent / stats.requiredTotal) * 100,
      recommended: stats.recommendedTotal > 0 ? (stats.recommendedPresent / stats.recommendedTotal) * 100 : 0,
      overall: (stats.present / stats.total) * 100
    };

    return { stats, complianceSummary };
  }, [data]);

  const getQualityColor = (quality: string) => {
    switch (quality) {
      case 'excellent': return 'text-green-600 bg-green-50 dark:bg-green-900/20';
      case 'good': return 'text-blue-600 bg-blue-50 dark:bg-blue-900/20';
      case 'fair': return 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20';
      case 'poor': return 'text-orange-600 bg-orange-50 dark:bg-orange-900/20';
      case 'missing': return 'text-red-600 bg-red-50 dark:bg-red-900/20';
      default: return 'text-gray-600 bg-gray-50 dark:bg-gray-900/20';
    }
  };

  const getComplianceLevelInfo = (level: string) => {
    switch (level) {
      case 'full':
        return { color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-900/20', text: 'Full Compliance' };
      case 'substantial':
        return { color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20', text: 'Substantial Compliance' };
      case 'partial':
        return { color: 'text-yellow-600', bg: 'bg-yellow-50 dark:bg-yellow-900/20', text: 'Partial Compliance' };
      case 'minimal':
        return { color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-900/20', text: 'Minimal Compliance' };
      default:
        return { color: 'text-gray-600', bg: 'bg-gray-50 dark:bg-gray-900/20', text: 'Unknown' };
    }
  };

  const levelInfo = getComplianceLevelInfo(data.complianceLevel);

  return (
    <div className={`card p-6 ${className}`}>
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold">DCAT Metadata Compliance</h3>
          <a
            href="https://www.w3.org/TR/vocab-dcat-2/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 transition-colors"
          >
            DCAT Standard
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
        <p className="text-sm text-muted-foreground">
          Compliance with the Data Catalog Vocabulary (DCAT) standard for open data publishing
        </p>
      </div>

      {/* Overall Score and Level */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="text-center p-4 border rounded-lg">
          <div className="text-2xl font-bold text-primary mb-1">
            {data.overallScore}%
          </div>
          <div className="text-sm text-muted-foreground">Overall Score</div>
        </div>
        <div className="text-center p-4 border rounded-lg">
          <div className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${levelInfo.bg} ${levelInfo.color}`}>
            {levelInfo.text}
          </div>
          <div className="text-sm text-muted-foreground mt-1">Compliance Level</div>
        </div>
      </div>

      {/* Compliance Breakdown */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="text-center p-3 bg-muted rounded-lg">
          <div className="font-semibold text-lg">
            {complianceSummary.required.toFixed(0)}%
          </div>
          <div className="text-xs text-muted-foreground">Required Fields</div>
          <div className="text-xs mt-1">
            {stats.requiredPresent}/{stats.requiredTotal}
          </div>
        </div>
        <div className="text-center p-3 bg-muted rounded-lg">
          <div className="font-semibold text-lg">
            {complianceSummary.recommended.toFixed(0)}%
          </div>
          <div className="text-xs text-muted-foreground">Recommended</div>
          <div className="text-xs mt-1">
            {stats.recommendedPresent}/{stats.recommendedTotal}
          </div>
        </div>
        <div className="text-center p-3 bg-muted rounded-lg">
          <div className="font-semibold text-lg">
            {stats.present}
          </div>
          <div className="text-xs text-muted-foreground">Total Present</div>
          <div className="text-xs mt-1">
            of {stats.total} fields
          </div>
        </div>
      </div>

      {/* Field Details */}
      <div className="space-y-6">
        {/* Required Fields */}
        <div>
          <h4 className="font-medium text-red-600 mb-3 flex items-center gap-2">
            <span className="w-2 h-2 bg-red-500 rounded-full"></span>
            Required Fields ({stats.requiredPresent}/{stats.requiredTotal})
          </h4>
          <div className="space-y-2">
            {data.requiredFields.map((field, index) => (
              <div key={index} className="flex items-start gap-3 p-3 border rounded-lg">
                <div className="flex-shrink-0 mt-0.5">
                  {field.present ? (
                    <Check className="w-4 h-4 text-green-600" />
                  ) : (
                    <X className="w-4 h-4 text-red-600" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h5 className="font-medium text-sm">{field.field}</h5>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getQualityColor(field.quality)}`}>
                      {field.quality}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mb-1">{field.description}</p>
                  {field.value && (
                    <p className="text-xs bg-muted p-2 rounded font-mono mb-1">{field.value}</p>
                  )}
                  {field.recommendation && (
                    <p className="text-xs text-blue-600">{field.recommendation}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recommended Fields */}
        <div>
          <h4 className="font-medium text-yellow-600 mb-3 flex items-center gap-2">
            <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
            Recommended Fields ({stats.recommendedPresent}/{stats.recommendedTotal})
          </h4>
          <div className="space-y-2">
            {data.recommendedFields.slice(0, 4).map((field, index) => (
              <div key={index} className="flex items-start gap-3 p-3 border rounded-lg">
                <div className="flex-shrink-0 mt-0.5">
                  {field.present ? (
                    <Check className="w-4 h-4 text-green-600" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-yellow-600" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h5 className="font-medium text-sm">{field.field}</h5>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getQualityColor(field.quality)}`}>
                      {field.quality}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mb-1">{field.description}</p>
                  {field.value && (
                    <p className="text-xs bg-muted p-2 rounded font-mono mb-1">{field.value}</p>
                  )}
                  {field.recommendation && (
                    <p className="text-xs text-blue-600">{field.recommendation}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Key Recommendations */}
        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
          <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">Key Recommendations</h4>
          <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
            <li>• Add formal publication date (issued field) to meet DCAT requirements</li>
            <li>• Include theme classification for better discoverability</li>
            <li>• Specify update frequency in accrualPeriodicity field</li>
            <li>• Consider adding more detailed contact information</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default DCATComplianceCard;