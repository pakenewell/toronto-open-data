export const formatCurrency = (
  amount: number | string | null | undefined, 
  options: { compact?: boolean; decimals?: number } = {}
): string => {
  const number = Number(amount);
  const validNumber = isNaN(number) ? 0 : number;
  const { compact = false, decimals = 2 } = options;

  if (compact) {
    // Use compact notation for large numbers
    if (validNumber >= 1000000) {
      return `$${(validNumber / 1000000).toFixed(1)}M`;
    } else if (validNumber >= 1000) {
      return `$${(validNumber / 1000).toFixed(1)}K`;
    }
  }

  return `$${validNumber.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  })}`;
};

export const formatNumber = (value: number | string | null | undefined): string => {
  if (value === null || value === undefined) return '0';
  const number = Number(value);
  return isNaN(number) ? '0' : number.toLocaleString();
};

export const formatPercentage = (value: number | null | undefined, decimals: number = 1): string => {
  if (value === null || value === undefined) return '0%';
  return `${value.toFixed(decimals)}%`;
};

export const formatDate = (dateString: string | null | undefined): string => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return 'N/A';
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};