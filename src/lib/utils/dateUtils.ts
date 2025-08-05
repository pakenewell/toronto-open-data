import { format, parseISO, differenceInMonths, startOfMonth, endOfMonth } from 'date-fns';

export const formatYearMonth = (date: Date): string => {
  return format(date, 'yyyy-MM');
};

export const parseYearMonth = (yearMonth: string): Date => {
  return parseISO(`${yearMonth}-01`);
};

export const getDefaultStartDate = (): Date => {
  return new Date('2000-01-14');
};

export const getDefaultEndDate = (): Date => {
  return endOfMonth(new Date());
};

export const generateMonthsInRange = (startDate: Date, endDate: Date): string[] => {
  const months: string[] = [];
  const currentDate = new Date(startDate);
  
  while (currentDate <= endDate) {
    months.push(formatYearMonth(currentDate));
    currentDate.setMonth(currentDate.getMonth() + 1);
  }
  
  return months;
};

export const calculateTimeSpan = (startDate: string, endDate: string): string => {
  if (!startDate || !endDate) return 'N/A';
  
  try {
    const start = parseISO(startDate);
    const end = parseISO(endDate);
    const months = differenceInMonths(end, start) + 1;
    
    if (months < 12) {
      return `${months} month${months !== 1 ? 's' : ''}`;
    } else {
      const years = Math.floor(months / 12);
      const remainingMonths = months % 12;
      return `${years} year${years !== 1 ? 's' : ''}${remainingMonths > 0 ? ` ${remainingMonths} month${remainingMonths !== 1 ? 's' : ''}` : ''}`;
    }
  } catch {
    return 'N/A';
  }
};