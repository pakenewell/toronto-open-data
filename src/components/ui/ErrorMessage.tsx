import React from 'react';
import { AlertCircle } from 'lucide-react';
import { clsx } from 'clsx';
import type { ErrorMessageProps } from '@/src/types/ui';

const ErrorMessage: React.FC<ErrorMessageProps> = ({
  message,
  details,
  code,
  className,
}) => {
  return (
    <div
      className={clsx(
        'rounded-lg border border-destructive/50 bg-destructive/10 p-4',
        className
      )}
    >
      <div className="flex items-start space-x-3">
        <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h3 className="text-sm font-medium text-destructive">
            {code ? `Error ${code}` : 'Error'}
          </h3>
          <p className="mt-1 text-sm text-destructive/90">{message}</p>
          {details && (
            <details className="mt-2">
              <summary className="cursor-pointer text-xs text-destructive/70 hover:text-destructive">
                Show details
              </summary>
              <pre className="mt-2 text-xs text-destructive/70 overflow-x-auto">
                {details}
              </pre>
            </details>
          )}
        </div>
      </div>
    </div>
  );
};

export default ErrorMessage;