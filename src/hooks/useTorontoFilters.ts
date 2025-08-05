import { useState, useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { format } from 'date-fns';
import { getDefaultStartDate, getDefaultEndDate } from '@/src/lib/utils/dateUtils';
import type { ServiceFilters } from '@/src/types/toronto';

export const useTorontoFilters = () => {
  const router = useRouter();
  const isUserAction = useRef(false);
  
  // Get initial filters from URL or defaults
  const getInitialFilters = useCallback((): ServiceFilters => {
    const query = router.query;
    return {
      startDate: (query.start as string) || format(getDefaultStartDate(), 'yyyy-MM-dd'),
      endDate: (query.end as string) || format(getDefaultEndDate(), 'yyyy-MM-dd'),
      serviceDivisionOwner: (query.division as string) || 'all',
      ward: (query.ward as string) || 'all',
      serviceResult: (query.result as 'PASS' | 'FAIL' | '' | 'UNKNOWN' | 'all') || 'all',
    };
  }, [router.query]);

  const [filters, setFilters] = useState<ServiceFilters>(getInitialFilters);
  const [isReady, setIsReady] = useState(false);

  // Initialize filters only once when router is ready and sync URL with defaults
  useEffect(() => {
    if (router.isReady && !isReady) {
      const initialFilters = getInitialFilters();
      setFilters(initialFilters);
      
      // Ensure URL has default parameters if they're missing
      const currentQuery = router.query;
      const needsUrlUpdate = !currentQuery.start || !currentQuery.end;
      
      if (needsUrlUpdate) {
        const newQuery = {
          ...currentQuery,
          start: initialFilters.startDate,
          end: initialFilters.endDate,
          ...(initialFilters.serviceDivisionOwner !== 'all' && { division: initialFilters.serviceDivisionOwner }),
          ...(initialFilters.ward !== 'all' && { ward: initialFilters.ward }),
          ...(initialFilters.serviceResult !== 'all' && { result: initialFilters.serviceResult }),
        };
        
        router.replace({
          pathname: router.pathname,
          query: newQuery,
        }, undefined, { shallow: true });
      }
      
      setIsReady(true);
    }
  }, [router.isReady, isReady, getInitialFilters, router]);

  // Sync filters with URL only when URL changes externally (not from user actions)
  useEffect(() => {
    if (!router.isReady || !isReady || isUserAction.current) {
      isUserAction.current = false;
      return;
    }
    
    const newFilters = getInitialFilters();
    // Only update if filters actually changed
    if (JSON.stringify(newFilters) !== JSON.stringify(filters)) {
      setFilters(newFilters);
    }
  }, [router.query, router.isReady, isReady]); // eslint-disable-line react-hooks/exhaustive-deps

  // Update a single filter
  const updateFilter = useCallback((key: keyof ServiceFilters, value: string) => {
    isUserAction.current = true;
    
    // Update state immediately
    setFilters(prev => ({ ...prev, [key]: value }));
    
    // Build new query
    const newQuery: Record<string, string> = {};
    
    // Preserve existing query params
    Object.keys(router.query).forEach(k => {
      if (typeof router.query[k] === 'string') {
        newQuery[k] = router.query[k] as string;
      }
    });
    
    // Update the specific filter in query
    if (key === 'startDate') {
      if (value) newQuery.start = value;
      else delete newQuery.start;
    } else if (key === 'endDate') {
      if (value) newQuery.end = value;
      else delete newQuery.end;
    } else if (key === 'serviceDivisionOwner') {
      if (value && value !== 'all') newQuery.division = value;
      else delete newQuery.division;
    } else if (key === 'ward') {
      if (value && value !== 'all') newQuery.ward = value;
      else delete newQuery.ward;
    } else if (key === 'serviceResult') {
      if (value && value !== 'all') newQuery.result = value;
      else delete newQuery.result;
    }
    
    // Update URL without triggering re-render
    router.push({
      pathname: router.pathname,
      query: newQuery,
    }, undefined, { shallow: true });
  }, [router]);

  // Update date range
  const updateDateRange = useCallback((startDate: string, endDate: string) => {
    isUserAction.current = true;
    
    setFilters(prev => ({ ...prev, startDate, endDate }));
    
    const newQuery = { ...router.query };
    if (startDate) newQuery.start = startDate;
    else delete newQuery.start;
    if (endDate) newQuery.end = endDate;
    else delete newQuery.end;
    
    router.push({
      pathname: router.pathname,
      query: newQuery,
    }, undefined, { shallow: true });
  }, [router]);

  // Reset filters
  const resetFilters = useCallback(() => {
    isUserAction.current = true;
    
    const defaultFilters: ServiceFilters = {
      startDate: format(getDefaultStartDate(), 'yyyy-MM-dd'),
      endDate: format(getDefaultEndDate(), 'yyyy-MM-dd'),
      serviceDivisionOwner: 'all',
      ward: 'all',
      serviceResult: 'all',
    };
    
    setFilters(defaultFilters);
    
    router.push({
      pathname: router.pathname,
      query: {
        start: defaultFilters.startDate,
        end: defaultFilters.endDate,
      },
    }, undefined, { shallow: true });
  }, [router]);

  return {
    filters,
    updateFilter,
    updateDateRange,
    resetFilters,
    isReady,
  };
};

export type TorontoFiltersReturn = ReturnType<typeof useTorontoFilters>;