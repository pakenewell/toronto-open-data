import React, { useMemo, useState } from 'react';
import Head from 'next/head';
import useSWR from 'swr';
import { Info, BookOpen, BarChart3, Activity } from 'lucide-react';

// Components
import TrendsLayout from '@/src/components/layout/TrendsLayout';
import SEO from '@/src/components/layout/SEO';
import ErrorMessage from '@/src/components/ui/ErrorMessage';
import KPICard from '@/src/components/ui/KPICard';
import { LoadingState } from '@/src/components/ui/LoadingState';
import { DataDictionary } from '@/src/components/DataDictionary';
import { DataExplorerTab } from '@/src/components/DataExplorerTab';
import { DataReadinessTab } from '@/src/components/DataReadinessTab';

// Hooks and utilities
import { useTorontoFilters } from '@/src/hooks/useTorontoFilters';
import { fetcher } from '@/src/lib/utils/apiUtils';
import { formatCurrency, formatNumber, formatPercentage } from '@/src/lib/utils/formatters';

// Types
import type { DashboardApiResponse } from '@/src/types/api';

export default function TorontoDashboard() {
  const { filters, updateFilter, updateDateRange, resetFilters, isReady } = useTorontoFilters();
  const [activeTab, setActiveTab] = useState<'data-explorer' | 'data-readiness' | 'dictionary'>('data-explorer');

  // Build API URL
  const apiUrl = useMemo(() => {
    if (!isReady) return null;
    const params = new URLSearchParams({
      start: filters.startDate,
      end: filters.endDate,
      ...(filters.serviceDivisionOwner !== 'all' && { division: filters.serviceDivisionOwner }),
      ...(filters.ward !== 'all' && { ward: filters.ward }),
      ...(filters.serviceResult !== 'all' && { result: filters.serviceResult }),
    });
    return `/api/toronto-dashboard?${params.toString()}`;
  }, [filters, isReady]);

  // Fetch data
  const { data, error, isLoading } = useSWR<DashboardApiResponse>(
    apiUrl,
    fetcher,
    {
      keepPreviousData: true,
      revalidateOnFocus: false,
    }
  );

  const dashboardData = data?.data;

  return (
    <>
      <SEO
        title="Toronto Open Data - City Service Results Dashboard"
        description="Interactive dashboard tracking Toronto city service results, costs, and performance metrics."
        keywords="Toronto open data, city services, service results, municipal data, transparency"
      />
      
      <TrendsLayout>
        <div className="space-y-6">
          {/* Municipal Header */}
          <div className="municipal-card bg-gradient-to-r from-primary/5 to-accent/5 border-l-4 border-l-primary">
            <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                    <BarChart3 className="h-5 w-5" />
                  </div>
                  <div>
                    <h1 className="text-municipal-3xl font-bold text-foreground">
                      Division X Service Results
                    </h1>
                    <p className="text-municipal-sm text-muted-foreground font-medium">
                      Open Data Dashboard
                    </p>
                  </div>
                </div>
                <p className="text-municipal-base text-muted-foreground max-w-5xl">
                  This dashboard is a demonstration of Division X service data, costs, and outcomes. 
                  It provides an overview of the dataset&apos;s readiness for the city&apos;s Open Data Portal.
                  Explore the data across different divisions, wards and time periods. This helps identify trends, noting areas for improvement and  metadata notes for the dataset.
                </p>
              </div>
            </div>
          </div>

          {/* Municipal Tab Navigation */}
          <div className="border-b border-border bg-muted/30">
            <nav className="-mb-px flex space-x-1 px-4">
              <button
                onClick={() => setActiveTab('data-explorer')}
                className={`municipal-tab ${
                  activeTab === 'data-explorer' 
                    ? 'municipal-tab-active' 
                    : 'municipal-tab-inactive'
                }`}
              >
                <BarChart3 className="h-5 w-5" />
                Data Explorer
              </button>
              <button
                onClick={() => setActiveTab('data-readiness')}
                className={`municipal-tab ${
                  activeTab === 'data-readiness' 
                    ? 'municipal-tab-active' 
                    : 'municipal-tab-inactive'
                }`}
              >
                <Activity className="h-5 w-5" />
                Data Readiness
              </button>
              <button
                onClick={() => setActiveTab('dictionary')}
                className={`municipal-tab ${
                  activeTab === 'dictionary' 
                    ? 'municipal-tab-active' 
                    : 'municipal-tab-inactive'
                }`}
              >
                <BookOpen className="h-5 w-5" />
                Data Dictionary
              </button>
            </nav>
          </div>

          {/* Tab Content */}
          {activeTab === 'data-explorer' && (
            <DataExplorerTab
              filters={filters}
              updateFilter={updateFilter}
              resetFilters={resetFilters}
              dashboardData={dashboardData}
              isLoading={isLoading}
              error={error}
            />
          )}
          
          {activeTab === 'data-readiness' && (
            <DataReadinessTab />
          )}
          
          {activeTab === 'dictionary' && (
            <DataDictionary className="mt-6" />
          )}
        </div>
      </TrendsLayout>
    </>
  );
}