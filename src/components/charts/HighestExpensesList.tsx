import React from 'react';
import { formatCurrency } from '@/src/lib/utils/formatters';
import type { HighestExpenseItem } from '@/src/types/api';

interface HighestExpensesListProps {
  data: HighestExpenseItem[];
  title?: string;
  isLoading?: boolean;
  maxHeight?: string;
}

const HighestExpensesList: React.FC<HighestExpensesListProps> = ({
  data,
  title = "Top 50 Expenses",
  isLoading = false,
  maxHeight = '500px',
}) => {
  if (isLoading) {
    return (
      <div className="animate-pulse bg-muted rounded p-4 flex items-center justify-center" style={{ height: maxHeight }}>
        <div className="text-sm text-muted-foreground">Loading expense data...</div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center text-muted-foreground p-4 text-center" style={{ height: maxHeight }}>
        No expense data available for the selected period.
      </div>
    );
  }

  const getResultBadgeClass = (result: string) => {
    switch (result) {
      case 'PASS':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'FAIL':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      case 'UNKNOWN':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const formatDateRange = (startDate: string | null, endDate: string | null) => {
    if (!startDate && !endDate) return 'No dates available';
    if (!endDate) return new Date(startDate!).toLocaleDateString();
    if (!startDate) return `Ended ${new Date(endDate).toLocaleDateString()}`;
    
    const start = new Date(startDate).toLocaleDateString();
    const end = new Date(endDate).toLocaleDateString();
    return start === end ? start : `${start} - ${end}`;
  };

  return (
    <div className="card p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">{title}</h2>
        <div className="text-sm text-muted-foreground">
          Showing {data.length} items
        </div>
      </div>
      
      <div 
        className="space-y-3 overflow-y-auto pr-2 custom-scrollbar"
        style={{ maxHeight }}
      >
        {data.map((expense, index) => (
          <div
            key={expense.id}
            className="flex items-start justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="flex items-center justify-center w-6 h-6 bg-primary/10 text-primary text-xs font-bold rounded-full">
                  {expense.rank || index + 1}
                </span>
                <span className={`px-2 py-1 rounded text-xs font-medium ${getResultBadgeClass(expense.result)}`}>
                  {expense.result}
                </span>
              </div>
              
              <div className="space-y-1">
                {expense.division && (
                  <div className="font-medium text-sm">
                    {expense.division}
                  </div>
                )}
                
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  {expense.ward && expense.ward !== 66 && (
                    <span>Ward {expense.ward}</span>
                  )}
                  {expense.ward === 66 && (
                    <span className="text-orange-600 dark:text-orange-400 font-medium">
                      ⚠️ Ward 66 (Invalid)
                    </span>
                  )}
                  <span>{formatDateRange(expense.startDate, expense.endDate)}</span>
                </div>
                
                {expense.notes && (
                  <div className="text-xs text-muted-foreground mt-1 truncate">
                    {expense.notes}
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex flex-col items-end ml-4">
              <div className="font-bold text-lg">
                {formatCurrency(expense.cost)}
              </div>
              <div className="text-xs text-muted-foreground">
                ID: {expense.id}
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgb(203 213 225 / 0.5);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgb(148 163 184 / 0.7);
        }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgb(75 85 99 / 0.5);
        }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgb(107 114 128 / 0.7);
        }
      `}</style>
    </div>
  );
};

export default HighestExpensesList;