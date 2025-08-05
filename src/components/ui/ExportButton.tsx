import React, { useState } from 'react';
import { Download, FileText, Table, Code, Loader2 } from 'lucide-react';
import { exportComprehensiveDashboardData, type ComprehensiveExportOptions } from '@/src/lib/utils/dashboardExport';
import type { DashboardData } from '@/src/types/api';
import type { ServiceFilters } from '@/src/types/toronto';

export type ExportFormat = 'pdf' | 'csv' | 'json' | 'excel';

interface ExportOption {
  format: ExportFormat;
  label: string;
  description: string;
  icon: React.ReactNode;
  mimeType: string;
}

interface ExportButtonProps {
  data: DashboardData;
  filters?: ServiceFilters;
  filename?: string;
  className?: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  formats?: ExportFormat[];
  tabContext?: 'data-explorer' | 'data-readiness' | 'dictionary' | 'all';
  onExport?: (format: ExportFormat, data: DashboardData) => Promise<void> | void;
  disabled?: boolean;
}

export function ExportButton({
  data,
  filters = {} as ServiceFilters,
  filename,
  className = '',
  variant = 'default',
  size = 'md',
  formats = ['pdf', 'csv', 'json'],
  tabContext = 'all',
  onExport,
  disabled = false
}: ExportButtonProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isExporting, setIsExporting] = useState<ExportFormat | null>(null);

  const exportOptions: Record<ExportFormat, ExportOption> = {
    pdf: {
      format: 'pdf',
      label: 'PDF Report',
      description: 'Comprehensive dashboard report',
      icon: <FileText className="w-4 h-4" />,
      mimeType: 'application/pdf'
    },
    csv: {
      format: 'csv',
      label: 'CSV Data',
      description: 'Structured data for analysis',
      icon: <Table className="w-4 h-4" />,
      mimeType: 'text/csv'
    },
    json: {
      format: 'json',
      label: 'JSON Data',
      description: 'Complete dataset with analysis',
      icon: <Code className="w-4 h-4" />,
      mimeType: 'application/json'
    },
    excel: {
      format: 'excel',
      label: 'Excel Workbook',
      description: 'Formatted spreadsheet',
      icon: <Table className="w-4 h-4" />,
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    }
  };

  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2';
  
  const variantClasses = {
    default: 'bg-primary text-primary-foreground hover:bg-primary/90 focus:ring-primary',
    outline: 'border border-input bg-transparent hover:bg-accent hover:text-accent-foreground focus:ring-accent',
    ghost: 'hover:bg-accent hover:text-accent-foreground focus:ring-accent'
  };

  const sizeClasses = {
    sm: 'h-8 px-3 text-sm',
    md: 'h-10 px-4 text-sm',
    lg: 'h-12 px-6 text-base'
  };

  // Get appropriate export format for legacy 'excel' option
  const getExportFormat = (format: ExportFormat): 'csv' | 'json' | 'pdf' => {
    return format === 'excel' ? 'csv' : format;
  };

  const handleExport = async (format: ExportFormat) => {
    if (disabled || isExporting) return;
    
    try {
      setIsExporting(format);
      
      if (onExport) {
        await onExport(format, data);
      } else {
        // Use comprehensive dashboard export
        const exportFormat = getExportFormat(format);
        const options: ComprehensiveExportOptions = {
          format: exportFormat,
          includeMetadata: true,
          tabContext: tabContext,
          customFilename: filename,
          sections: undefined // Use default sections for the tab context
        };
        
        await exportComprehensiveDashboardData(data, filters, options);
      }
      
      setIsDropdownOpen(false);
    } catch (error) {
      console.error(`Export failed for format ${format}:`, error);
      // In a real app, you'd show a proper error message
      alert(`Export failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsExporting(null);
    }
  };

  const buttonClasses = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`;

  return (
    <div className="relative inline-block">
      <button
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        disabled={disabled}
        className={`${buttonClasses} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        {isExporting ? (
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        ) : (
          <Download className="w-4 h-4 mr-2" />
        )}
        {isExporting ? 'Exporting...' : 'Export'}
      </button>

      {isDropdownOpen && !disabled && (
        <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg z-50">
          <div className="py-1">
            {formats.map((format) => {
              const option = exportOptions[format];
              const isCurrentlyExporting = isExporting === format;
              
              return (
                <button
                  key={format}
                  onClick={() => handleExport(format)}
                  disabled={isCurrentlyExporting}
                  className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-3 disabled:opacity-50"
                >
                  {isCurrentlyExporting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    option.icon
                  )}
                  <div>
                    <div className="font-medium">{option.label}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {option.description}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Backdrop to close dropdown */}
      {isDropdownOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsDropdownOpen(false)}
        />
      )}
    </div>
  );
}

export default ExportButton;