import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseCity } from '@/src/lib/supabase';
import type { 
  DashboardApiResponse, 
  DashboardData, 
  ServicesOverTimeItem, 
  ResultBreakdown, 
  TopListItem,
  DataQualityMetrics,
  DataQualityDimension,
  TimeSeriesData,
  CostDistributionBin,
  HighestExpenseItem,
  WardAnalysisData,
  WardMetrics,
  Ward66Analysis,
  WardEfficiencyItem,
  ReadinessMetrics,
  ReadinessRecommendation
} from '@/src/types/api';
import type { ServiceResult } from '@/src/types/toronto';
import { formatYearMonth, calculateTimeSpan } from '@/src/lib/utils/dateUtils';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<DashboardApiResponse | { error: string }>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { start, end, division, ward, result } = req.query;
  
  // Handle date parameters - use dataset defaults if not provided
  let startDate = typeof start === 'string' ? start : null;
  let endDate = typeof end === 'string' ? end : null;
  
  // If dates are not provided, get the actual data range from the database
  if (!startDate || !endDate) {
    try {
      const { data: dateRange, error: dateError } = await supabaseCity
        .from('service_results')
        .select('start_date, end_date')
        .not('start_date', 'is', null)
        .not('end_date', 'is', null)
        .order('start_date', { ascending: true })
        .limit(1);
      
      const { data: maxDateRange, error: maxDateError } = await supabaseCity
        .from('service_results')
        .select('start_date, end_date')
        .not('start_date', 'is', null)
        .not('end_date', 'is', null)
        .order('end_date', { ascending: false })
        .limit(1);
      
      if (!dateError && !maxDateError && dateRange && maxDateRange && dateRange.length > 0 && maxDateRange.length > 0) {
        startDate = startDate || dateRange[0].start_date;
        endDate = endDate || maxDateRange[0].end_date;
      } else {
        // Fallback to default date range
        const defaultStart = new Date();
        defaultStart.setMonth(defaultStart.getMonth() - 6);
        const defaultEnd = new Date();
        
        startDate = startDate || defaultStart.toISOString().split('T')[0];
        endDate = endDate || defaultEnd.toISOString().split('T')[0];
      }
    } catch (error) {
      console.error('Error fetching date range:', error);
      // Fallback to default date range
      const defaultStart = new Date();
      defaultStart.setMonth(defaultStart.getMonth() - 6);
      const defaultEnd = new Date();
      
      startDate = startDate || defaultStart.toISOString().split('T')[0];
      endDate = endDate || defaultEnd.toISOString().split('T')[0];
    }
  }

  try {
    // Build base query
    let query = supabaseCity
      .from('service_results')
      .select('*')
      .gte('start_date', startDate)
      .lte('end_date', endDate);
    
    // Apply filters
    if (division && division !== 'all') {
      query = query.eq('service_division_owner', division);
    }
    
    if (ward && ward !== 'all') {
      query = query.eq('ward', ward);
    }
    
    if (result && result !== 'all') {
      if (result === 'UNKNOWN') {
        query = query.or('service_result.is.null,service_result.eq.');
      } else {
        query = query.eq('service_result', result);
      }
    }
    
    // Fetch all data
    const { data: services, error } = await query;
    
    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({ error: 'Failed to fetch data from database' });
    }
    
    if (!services || services.length === 0) {
      // Return empty data structure
      const emptyResponse: DashboardApiResponse = {
        timestamp: new Date().toISOString(),
        requestId: `req_${Date.now()}`,
        meta: {
          request_id: `req_${Date.now()}`,
          updatedDate: new Date().toISOString()
        },
        data: {
          kpiData: {
            totalServices: 0,
            totalCost: 0,
            avgCost: 0,
            passRate: 0,
            failRate: 0,
            uniqueDivisions: 0,
            uniqueWards: 0,
            dateRange: {
              earliestService: startDate || new Date().toISOString().split('T')[0],
              latestService: endDate || new Date().toISOString().split('T')[0],
              timeSpan: calculateTimeSpan(startDate || new Date().toISOString().split('T')[0], endDate || new Date().toISOString().split('T')[0])
            }
          },
          servicesByDivision: [],
          servicesOverTime: [],
          servicesByResult: [],
          topDivisions: [],
          topWards: [],
          heatmapData: [],
          
          // Empty enhanced data
          dataQuality: getEmptyDataQuality(),
          timeSeriesData: [],
          costDistribution: [],
          highestExpenses: [],
          wardAnalysis: getEmptyWardAnalysis(),
          readinessMetrics: getEmptyReadinessMetrics()
        },
        links: {
          self: `/api/toronto-dashboard?start=${startDate}&end=${endDate}`
        }
      };
      
      return res.status(200).json(emptyResponse);
    }
    
    // Calculate KPI data
    const totalServices = services.length;
    const totalCost = services.reduce((sum, s) => sum + (s.estimated_cost || 0), 0);
    const avgCost = totalServices > 0 ? totalCost / totalServices : 0;
    const passCount = services.filter(s => s.service_result === 'PASS').length;
    const failCount = services.filter(s => s.service_result === 'FAIL').length;
    const unknownCount = services.filter(s => s.service_result === null || s.service_result === '').length;
    
    const uniqueDivisions = new Set(services.map(s => s.service_division_owner).filter(Boolean)).size;
    const uniqueWards = new Set(services.map(s => s.ward).filter(Boolean)).size;
    
    const dates = services
      .filter(s => s.start_date)
      .map(s => new Date(s.start_date!))
      .filter(d => !isNaN(d.getTime()));
    const earliestDate = dates.length > 0 ? new Date(Math.min(...dates.map(d => d.getTime()))) : new Date(startDate || new Date().toISOString().split('T')[0]);
    const latestDate = services
      .filter(s => s.end_date)
      .map(s => new Date(s.end_date!))
      .filter(d => !isNaN(d.getTime()));
    const latestServiceDate = latestDate.length > 0 ? new Date(Math.max(...latestDate.map(d => d.getTime()))) : new Date(endDate || new Date().toISOString().split('T')[0]);
    
    // Calculate services over time
    const monthlyData = new Map<string, any>();
    
    services.forEach((service: ServiceResult) => {
      if (!service.start_date) return; // Skip if no start date
      
      const monthKey = formatYearMonth(new Date(service.start_date));
      
      if (!monthlyData.has(monthKey)) {
        monthlyData.set(monthKey, {
          period: monthKey,
          total_services: 0,
          total_cost: 0,
          pass_count: 0,
          fail_count: 0
        });
      }
      
      const month = monthlyData.get(monthKey);
      month.total_services++;
      month.total_cost += service.estimated_cost || 0;
      if (service.service_result === 'PASS') month.pass_count++;
      if (service.service_result === 'FAIL') month.fail_count++;
    });
    
    const servicesOverTime: ServicesOverTimeItem[] = Array.from(monthlyData.values())
      .map(month => ({
        ...month,
        avg_cost: month.total_services > 0 ? month.total_cost / month.total_services : 0,
        pass_rate: month.total_services > 0 ? (month.pass_count / month.total_services) * 100 : 0
      }))
      .sort((a, b) => a.period.localeCompare(b.period));
    
    // Calculate services by result
    const servicesByResult: ResultBreakdown[] = [
      {
        result: 'PASS',
        count: passCount,
        percentage: totalServices > 0 ? (passCount / totalServices) * 100 : 0,
        total_cost: services.filter(s => s.service_result === 'PASS').reduce((sum, s) => sum + (s.estimated_cost || 0), 0),
        avg_cost: passCount > 0 ? services.filter(s => s.service_result === 'PASS').reduce((sum, s) => sum + (s.estimated_cost || 0), 0) / passCount : 0
      },
      {
        result: 'FAIL',
        count: failCount,
        percentage: totalServices > 0 ? (failCount / totalServices) * 100 : 0,
        total_cost: services.filter(s => s.service_result === 'FAIL').reduce((sum, s) => sum + (s.estimated_cost || 0), 0),
        avg_cost: failCount > 0 ? services.filter(s => s.service_result === 'FAIL').reduce((sum, s) => sum + (s.estimated_cost || 0), 0) / failCount : 0
      },
      {
        result: 'UNKNOWN',
        count: unknownCount,
        percentage: totalServices > 0 ? (unknownCount / totalServices) * 100 : 0,
        total_cost: services.filter(s => s.service_result === null || s.service_result === '').reduce((sum, s) => sum + (s.estimated_cost || 0), 0),
        avg_cost: unknownCount > 0 ? services.filter(s => s.service_result === null || s.service_result === '').reduce((sum, s) => sum + (s.estimated_cost || 0), 0) / unknownCount : 0
      }
    ];
    
    // Calculate top divisions
    const divisionData = new Map<string, any>();
    
    services.forEach((service: ServiceResult) => {
      if (service.service_division_owner) {
        if (!divisionData.has(service.service_division_owner)) {
          divisionData.set(service.service_division_owner, {
            name: service.service_division_owner,
            count: 0,
            total_cost: 0,
            pass_count: 0
          });
        }
        
        const div = divisionData.get(service.service_division_owner);
        div.count++;
        div.total_cost += service.estimated_cost || 0;
        if (service.service_result === 'PASS') div.pass_count++;
      }
    });
    
    const topDivisions: TopListItem[] = Array.from(divisionData.values())
      .map(div => ({
        id: div.name,
        name: div.name,
        value: div.total_cost,
        count: div.count,
        avgCost: div.count > 0 ? div.total_cost / div.count : 0,
        passRate: div.count > 0 ? (div.pass_count / div.count) * 100 : 0
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
    
    // Calculate top wards
    const wardData = new Map<number, any>();
    
    services.forEach((service: ServiceResult) => {
      if (service.ward) {
        if (!wardData.has(service.ward)) {
          wardData.set(service.ward, {
            ward: service.ward,
            count: 0,
            total_cost: 0,
            pass_count: 0
          });
        }
        
        const ward = wardData.get(service.ward);
        ward.count++;
        ward.total_cost += service.estimated_cost || 0;
        if (service.service_result === 'PASS') ward.pass_count++;
      }
    });
    
    const topWards: TopListItem[] = Array.from(wardData.values())
      .map(ward => ({
        id: ward.ward,
        name: `Ward ${ward.ward}`,
        value: ward.total_cost,
        count: ward.count,
        avgCost: ward.count > 0 ? ward.total_cost / ward.count : 0,
        passRate: ward.count > 0 ? (ward.pass_count / ward.count) * 100 : 0
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
    
    // Calculate heatmap data
    const heatmapMap = new Map<string, number>();
    
    services.forEach((service: ServiceResult) => {
      if (!service.start_date) return; // Skip if no start date
      
      const date = new Date(service.start_date);
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const key = `${year}-${month}`;
      
      if (!heatmapMap.has(key)) {
        heatmapMap.set(key, 0);
      }
      
      heatmapMap.set(key, heatmapMap.get(key)! + (service.estimated_cost || 0));
    });
    
    const heatmapData: [number, number, number][] = Array.from(heatmapMap.entries())
      .map(([key, value]): [number, number, number] => {
        const [year, month] = key.split('-').map(Number);
        return [year, month, value];
      })
      .sort((a, b) => a[0] - b[0] || a[1] - b[1]);
    
    // Calculate services by division for aggregation
    const servicesByDivision = Array.from(divisionData.values())
      .map(div => ({
        division: div.name,
        count: div.count,
        total_cost: div.total_cost,
        avg_cost: div.count > 0 ? div.total_cost / div.count : 0,
        pass_count: div.pass_count,
        fail_count: services.filter(s => s.service_division_owner === div.name && s.service_result === 'FAIL').length,
        pass_rate: div.count > 0 ? (div.pass_count / div.count) * 100 : 0
      }))
      .sort((a, b) => b.total_cost - a.total_cost);

    // ========== ENHANCED DATA CALCULATIONS ==========

    // 1. Calculate Data Quality Metrics
    const dataQuality = calculateDataQualityMetrics(services);

    // 2. Calculate Enhanced Time Series Data with Month-over-Month changes
    const timeSeriesData = calculateEnhancedTimeSeriesData(services);

    // 3. Calculate Cost Distribution for Histogram
    const costDistribution = calculateCostDistribution(services);

    // 4. Get Top 50 Highest Expenses
    const highestExpenses = calculateHighestExpenses(services);

    // 5. Calculate Ward Analysis (including invalid ward 66)
    const wardAnalysis = calculateWardAnalysis(services, Array.from(wardData.values()));

    // 6. Calculate Overall Readiness Scores
    const readinessMetrics = calculateReadinessMetrics(services, dataQuality);
    
    const responseData: DashboardData = {
      kpiData: {
        totalServices,
        totalCost,
        avgCost,
        passRate: totalServices > 0 ? (passCount / totalServices) * 100 : 0,
        failRate: totalServices > 0 ? (failCount / totalServices) * 100 : 0,
        uniqueDivisions,
        uniqueWards,
        dateRange: {
          earliestService: earliestDate.toISOString().split('T')[0],
          latestService: latestServiceDate.toISOString().split('T')[0],
          timeSpan: calculateTimeSpan(earliestDate.toISOString().split('T')[0], latestServiceDate.toISOString().split('T')[0])
        }
      },
      servicesByDivision,
      servicesOverTime,
      servicesByResult,
      topDivisions,
      topWards,
      heatmapData,
      
      // Enhanced data for new chart requirements
      dataQuality,
      timeSeriesData,
      costDistribution,
      highestExpenses,
      wardAnalysis,
      readinessMetrics
    };
    
    const response: DashboardApiResponse = {
      timestamp: new Date().toISOString(),
      requestId: `req_${Date.now()}`,
      meta: {
        request_id: `req_${Date.now()}`,
        updatedDate: new Date().toISOString()
      },
      data: responseData,
      links: {
        self: `/api/toronto-dashboard?start=${startDate}&end=${endDate}`
      }
    };
    
    // Add caching headers for performance
    res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');
    res.status(200).json(response);
    
  } catch (error) {
    console.error('API error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
}

// ========== CALCULATION FUNCTIONS ==========

function calculateDataQualityMetrics(services: ServiceResult[]): DataQualityMetrics {
  const totalServices = services.length;
  
  // Completeness calculation
  const completenessMetrics = {
    startDate: services.filter(s => s.start_date).length / totalServices,
    endDate: services.filter(s => s.end_date).length / totalServices,
    division: services.filter(s => s.service_division_owner).length / totalServices,
    result: services.filter(s => s.service_result && s.service_result.trim() !== '').length / totalServices,
    ward: services.filter(s => s.ward !== null && s.ward !== undefined).length / totalServices,
    cost: services.filter(s => s.estimated_cost !== null && s.estimated_cost !== undefined).length / totalServices
  };
  
  const completenessScore = (Object.values(completenessMetrics).reduce((sum, val) => sum + val, 0) / Object.keys(completenessMetrics).length) * 100;
  
  // Accuracy calculation (based on valid ward numbers and reasonable cost ranges)
  const validWards = services.filter(s => s.ward && s.ward >= 1 && s.ward <= 25).length;
  const invalidWard66 = services.filter(s => s.ward === 66).length;
  const invalidWards = services.filter(s => s.ward && (s.ward < 1 || (s.ward > 25 && s.ward !== 66))).length;
  const accuracyScore = totalServices > 0 ? ((validWards + invalidWard66) / totalServices) * 100 : 100;
  
  // Timeliness calculation (based on date ranges and data freshness)
  const currentDate = new Date();
  const recentServices = services.filter(s => {
    if (!s.end_date) return false;
    const endDate = new Date(s.end_date);
    const daysDiff = (currentDate.getTime() - endDate.getTime()) / (1000 * 3600 * 24);
    return daysDiff <= 90; // Services within last 90 days
  }).length;
  const timelinessScore = totalServices > 0 ? (recentServices / totalServices) * 100 : 0;
  
  // Consistency calculation (consistent data patterns)
  const divisionWithResult = services.filter(s => s.service_division_owner && s.service_result).length;
  const consistencyScore = totalServices > 0 ? (divisionWithResult / totalServices) * 100 : 100;
  
  // Validity calculation (valid enum values and data ranges)
  const validResults = services.filter(s => 
    s.service_result === null || s.service_result === '' || s.service_result === 'PASS' || s.service_result === 'FAIL'
  ).length;
  const validCosts = services.filter(s => 
    s.estimated_cost === null || s.estimated_cost === undefined || (s.estimated_cost >= 0 && s.estimated_cost <= 10000000)
  ).length;
  const validityScore = totalServices > 0 ? ((validResults + validCosts) / (totalServices * 2)) * 100 : 100;
  
  const overallScore = (completenessScore + accuracyScore + timelinessScore + consistencyScore + validityScore) / 5;
  
  return {
    completeness: {
      score: completenessScore,
      details: `${completenessScore.toFixed(1)}% of required fields are populated`,
      issues: Object.entries(completenessMetrics)
        .filter(([, score]) => score < 0.9)
        .map(([field, score]) => `${field}: ${(score * 100).toFixed(1)}% complete`),
      recommendations: completenessScore < 95 ? [
        'Implement data validation at entry point',
        'Add required field constraints',
        'Create data quality monitoring dashboard'
      ] : ['Maintain current data entry standards']
    },
    accuracy: {
      score: accuracyScore,
      details: `${accuracyScore.toFixed(1)}% of ward data appears accurate`,
      issues: [
        ...(invalidWards > 0 ? [`${invalidWards} services have invalid ward numbers`] : []),
        ...(invalidWard66 > 0 ? [`${invalidWard66} services assigned to non-existent Ward 66`] : [])
      ],
      recommendations: invalidWards > 0 || invalidWard66 > 0 ? [
        'Implement ward number validation',
        'Create ward mapping reference table',
        'Add data cleansing process for Ward 66 records'
      ] : ['Ward data accuracy is excellent']
    },
    timeliness: {
      score: timelinessScore,
      details: `${timelinessScore.toFixed(1)}% of services are from the last 90 days`,
      issues: timelinessScore < 50 ? ['Data appears to be outdated', 'Recent service data is sparse'] : [],
      recommendations: timelinessScore < 80 ? [
        'Increase data collection frequency',
        'Implement real-time data feeds',
        'Create data freshness monitoring'
      ] : ['Data timeliness is acceptable']
    },
    consistency: {
      score: consistencyScore,
      details: `${consistencyScore.toFixed(1)}% of services have both division and result data`,
      issues: consistencyScore < 90 ? ['Inconsistent data entry patterns', 'Missing paired data fields'] : [],
      recommendations: consistencyScore < 95 ? [
        'Standardize data entry workflows',
        'Implement cross-field validation',
        'Create data consistency rules'
      ] : ['Data consistency is good']
    },
    validity: {
      score: validityScore,
      details: `${validityScore.toFixed(1)}% of data values are within valid ranges`,
      issues: validityScore < 95 ? ['Some data values outside expected ranges', 'Invalid enum values detected'] : [],
      recommendations: validityScore < 98 ? [
        'Add data type validation',
        'Implement range checking',
        'Create data dictionary with valid values'
      ] : ['Data validity is excellent']
    },
    overallScore
  };
}

function calculateEnhancedTimeSeriesData(services: ServiceResult[]): TimeSeriesData[] {
  const monthlyData = new Map<string, any>();
  
  services.forEach((service: ServiceResult) => {
    if (!service.start_date) return;
    
    const monthKey = formatYearMonth(new Date(service.start_date));
    
    if (!monthlyData.has(monthKey)) {
      monthlyData.set(monthKey, {
        period: monthKey,
        totalServices: 0,
        totalCost: 0,
        passCount: 0,
        failCount: 0,
        unknownCount: 0
      });
    }
    
    const month = monthlyData.get(monthKey);
    month.totalServices++;
    month.totalCost += service.estimated_cost || 0;
    
    if (service.service_result === 'PASS') month.passCount++;
    else if (service.service_result === 'FAIL') month.failCount++;
    else month.unknownCount++;
  });
  
  const sortedData = Array.from(monthlyData.values()).sort((a, b) => a.period.localeCompare(b.period));
  
  return sortedData.map((month, index) => {
    const avgCost = month.totalServices > 0 ? month.totalCost / month.totalServices : 0;
    const passRate = month.totalServices > 0 ? (month.passCount / month.totalServices) * 100 : 0;
    const failRate = month.totalServices > 0 ? (month.failCount / month.totalServices) * 100 : 0;
    const unknownRate = month.totalServices > 0 ? (month.unknownCount / month.totalServices) * 100 : 0;
    
    // Calculate month-over-month changes
    const prevMonth = index > 0 ? sortedData[index - 1] : null;
    const momChange = prevMonth ? {
      services: prevMonth.totalServices > 0 ? ((month.totalServices - prevMonth.totalServices) / prevMonth.totalServices) * 100 : 0,
      cost: prevMonth.totalCost > 0 ? ((month.totalCost - prevMonth.totalCost) / prevMonth.totalCost) * 100 : 0,
      passRate: prevMonth.passCount > 0 ? (passRate - ((prevMonth.passCount / prevMonth.totalServices) * 100)) : 0
    } : { services: 0, cost: 0, passRate: 0 };
    
    // Calculate cost efficiency (pass rate / avg cost ratio)
    const costEfficiency = avgCost > 0 ? passRate / (avgCost / 1000) : 0; // normalized per $1000
    
    return {
      period: month.period,
      totalServices: month.totalServices,
      totalCost: month.totalCost,
      avgCost,
      passCount: month.passCount,
      failCount: month.failCount,
      unknownCount: month.unknownCount,
      passRate,
      failRate,
      unknownRate,
      momChange,
      costEfficiency
    };
  });
}

function calculateCostDistribution(services: ServiceResult[]): CostDistributionBin[] {
  const costs = services
    .map(s => s.estimated_cost || 0)
    .filter(cost => cost > 0)
    .sort((a, b) => a - b);
  
  if (costs.length === 0) return [];
  
  const min = costs[0];
  const max = costs[costs.length - 1];
  
  // Use quantile-based binning for better distribution visibility
  const binCount = Math.min(12, Math.max(6, Math.ceil(Math.sqrt(costs.length) * 0.8)));
  
  // Create bins that ensure each bin has a reasonable number of items
  const minItemsPerBin = Math.max(1, Math.floor(costs.length / (binCount * 2)));
  const bins: CostDistributionBin[] = [];
  
  // If there's a large range, use hybrid approach: quantile-based for lower costs, 
  // log-scale for higher costs
  const range = max - min;
  const medianCost = costs[Math.floor(costs.length / 2)];
  const q75Cost = costs[Math.floor(costs.length * 0.75)];
  
  if (range > medianCost * 100) {
    // Large range detected - use hybrid binning
    
    // First, create fine-grained bins for the lower 75% of data
    const lowCostData = costs.filter(c => c <= q75Cost);
    const lowBinCount = Math.ceil(binCount * 0.7);
    const lowBinSize = (q75Cost - min) / lowBinCount;
    
    for (let i = 0; i < lowBinCount; i++) {
      const binMin = min + (i * lowBinSize);
      const binMax = i === lowBinCount - 1 ? q75Cost : min + ((i + 1) * lowBinSize);
      const count = costs.filter(cost => cost >= binMin && cost <= binMax).length;
      
      if (count > 0) {
        bins.push({
          min: binMin,
          max: binMax,
          count,
          percentage: (count / costs.length) * 100,
          label: formatCostRange(binMin, binMax)
        });
      }
    }
    
    // Then create logarithmic bins for the upper 25% to handle outliers
    const highCostData = costs.filter(c => c > q75Cost);
    if (highCostData.length > 0) {
      const highBinCount = binCount - bins.length;
      const logMin = Math.log10(q75Cost);
      const logMax = Math.log10(max);
      const logBinSize = (logMax - logMin) / highBinCount;
      
      for (let i = 0; i < highBinCount; i++) {
        const logBinMin = logMin + (i * logBinSize);
        const logBinMax = i === highBinCount - 1 ? logMax : logMin + ((i + 1) * logBinSize);
        const binMin = i === 0 ? q75Cost : Math.pow(10, logBinMin);
        const binMax = Math.pow(10, logBinMax);
        
        const count = costs.filter(cost => cost > binMin && cost <= binMax).length;
        
        if (count > 0) {
          bins.push({
            min: binMin,
            max: binMax,
            count,
            percentage: (count / costs.length) * 100,
            label: formatCostRange(binMin, binMax)
          });
        }
      }
    }
  } else {
    // Normal range - use equal-width bins
    const binSize = range / binCount;
    
    for (let i = 0; i < binCount; i++) {
      const binMin = min + (i * binSize);
      const binMax = i === binCount - 1 ? max : min + ((i + 1) * binSize);
      const count = costs.filter(cost => cost >= binMin && cost <= binMax).length;
      
      if (count > 0) {
        bins.push({
          min: binMin,
          max: binMax,
          count,
          percentage: (count / costs.length) * 100,
          label: formatCostRange(binMin, binMax)
        });
      }
    }
  }
  
  return bins;
}

function formatCostRange(min: number, max: number): string {
  const formatCost = (cost: number): string => {
    if (cost < 1000) {
      return `$${cost.toFixed(0)}`;
    } else if (cost < 1000000) {
      return `$${(cost / 1000).toFixed(1)}K`;
    } else {
      return `$${(cost / 1000000).toFixed(2)}M`;
    }
  };
  
  return `${formatCost(min)} - ${formatCost(max)}`;
}

function calculateHighestExpenses(services: ServiceResult[]): HighestExpenseItem[] {
  return services
    .filter(s => s.estimated_cost && s.estimated_cost > 0)
    .sort((a, b) => (b.estimated_cost || 0) - (a.estimated_cost || 0))
    .slice(0, 50)
    .map((service, index) => ({
      id: service.id,
      division: service.service_division_owner,
      ward: service.ward,
      cost: service.estimated_cost || 0,
      result: (service.service_result === null || service.service_result === '') ? 'UNKNOWN' : service.service_result as 'PASS' | 'FAIL' | 'UNKNOWN',
      startDate: service.start_date,
      endDate: service.end_date,
      notes: service.notes,
      rank: index + 1
    }));
}

function calculateWardAnalysis(services: ServiceResult[], wardDataArray: any[]): WardAnalysisData {
  // Separate valid wards (1-25) from Ward 66
  const validWardNumbers = Array.from({length: 25}, (_, i) => i + 1);
  const ward66Services = services.filter(s => s.ward === 66);
  const validWardServices = services.filter(s => s.ward && s.ward >= 1 && s.ward <= 25);
  
  // Calculate metrics for valid wards
  const validWards: WardMetrics[] = validWardNumbers.map(wardNum => {
    const wardServices = services.filter(s => s.ward === wardNum);
    const totalServices = wardServices.length;
    const totalCost = wardServices.reduce((sum, s) => sum + (s.estimated_cost || 0), 0);
    const passCount = wardServices.filter(s => s.service_result === 'PASS').length;
    const failCount = wardServices.filter(s => s.service_result === 'FAIL').length;
    const unknownCount = wardServices.filter(s => s.service_result === null || s.service_result === '').length;
    
    return {
      ward: wardNum,
      totalServices,
      totalCost,
      avgCost: totalServices > 0 ? totalCost / totalServices : 0,
      passRate: totalServices > 0 ? (passCount / totalServices) * 100 : 0,
      failRate: totalServices > 0 ? (failCount / totalServices) * 100 : 0,
      unknownRate: totalServices > 0 ? (unknownCount / totalServices) * 100 : 0,
      costEfficiency: totalServices > 0 && totalCost > 0 ? (passCount / totalServices) / (totalCost / totalServices / 1000) : 0
    };
  }).filter(ward => ward.totalServices > 0);
  
  // Calculate Ward 66 analysis
  const ward66TotalCost = ward66Services.reduce((sum, s) => sum + (s.estimated_cost || 0), 0);
  const ward66PassCount = ward66Services.filter(s => s.service_result === 'PASS').length;
  const ward66PassRate = ward66Services.length > 0 ? (ward66PassCount / ward66Services.length) * 100 : 0;
  const ward66AvgCost = ward66Services.length > 0 ? ward66TotalCost / ward66Services.length : 0;
  
  // Compare Ward 66 to valid wards
  const validWardsAvgCost = validWards.length > 0 ? validWards.reduce((sum, w) => sum + w.avgCost, 0) / validWards.length : 0;
  const validWardsAvgPassRate = validWards.length > 0 ? validWards.reduce((sum, w) => sum + w.passRate, 0) / validWards.length : 0;
  
  const invalidWard66: Ward66Analysis = {
    count: ward66Services.length,
    totalCost: ward66TotalCost,
    avgCost: ward66AvgCost,
    passRate: ward66PassRate,
    impactAnalysis: {
      percentageOfTotalServices: services.length > 0 ? (ward66Services.length / services.length) * 100 : 0,
      percentageOfTotalCost: services.reduce((sum, s) => sum + (s.estimated_cost || 0), 0) > 0 ? 
        (ward66TotalCost / services.reduce((sum, s) => sum + (s.estimated_cost || 0), 0)) * 100 : 0,
      comparedToValidWards: {
        avgCostDifference: ward66AvgCost - validWardsAvgCost,
        passRateDifference: ward66PassRate - validWardsAvgPassRate
      }
    },
    recommendations: [
      'Investigate data entry process for Ward 66 assignments',
      'Implement ward validation rules to prevent invalid assignments',
      'Review and correct historical Ward 66 records',
      'Create mapping table for proper ward assignment'
    ]
  };
  
  // Calculate ward efficiency ranking
  const wardEfficiencyRanking: WardEfficiencyItem[] = validWards
    .map(ward => {
      const costPerPassingService = ward.passRate > 0 ? (ward.totalCost / (ward.totalServices * (ward.passRate / 100))) : Infinity;
      const efficiencyScore = ward.passRate > 0 && ward.avgCost > 0 ? 
        (ward.passRate / 100) / (ward.avgCost / 1000) * 100 : 0;
      
      return {
        ward: ward.ward,
        efficiencyScore,
        totalServices: ward.totalServices,
        totalCost: ward.totalCost,
        passRate: ward.passRate,
        costPerPassingService,
        rank: 0 // Will be set after sorting
      };
    })
    .sort((a, b) => b.efficiencyScore - a.efficiencyScore)
    .map((ward, index) => ({
      ...ward,
      rank: index + 1
    }));
  
  return {
    validWards,
    invalidWard66,
    wardEfficiencyRanking,
    totalWardsCovered: validWards.length,
    wardCoveragePercentage: (validWards.length / 25) * 100
  };
}

function calculateReadinessMetrics(services: ServiceResult[], dataQuality: DataQualityMetrics): ReadinessMetrics {
  const totalServices = services.length;
  const totalCost = services.reduce((sum, s) => sum + (s.estimated_cost || 0), 0);
  const passCount = services.filter(s => s.service_result === 'PASS').length;
  
  // Data readiness components
  const dataCompleteness = dataQuality.completeness.score;
  const dataFreshness = dataQuality.timeliness.score;
  const dataConsistency = dataQuality.consistency.score;
  
  // Operational readiness components
  const operationalEfficiency = totalCost > 0 ? (passCount / totalServices) / (totalCost / totalServices / 1000) * 100 : 0;
  const serviceReliability = totalServices > 0 ? (passCount / totalServices) * 100 : 0;
  const costManagement = totalServices > 10 ? Math.min(100, 100 - (Math.abs(totalCost / totalServices - 50000) / 50000 * 100)) : 50;
  
  // Quality readiness components
  const qualityAssurance = dataQuality.accuracy.score;
  const processMaturity = (dataQuality.validity.score + dataQuality.consistency.score) / 2;
  
  // Calculate overall scores
  const dataReadinessScore = (dataCompleteness + dataFreshness + dataConsistency) / 3;
  const operationalReadinessScore = (operationalEfficiency + serviceReliability + costManagement) / 3;
  const qualityReadinessScore = (qualityAssurance + processMaturity) / 2;
  const overallReadinessScore = (dataReadinessScore + operationalReadinessScore + qualityReadinessScore) / 3;
  
  // Generate recommendations
  const recommendations: ReadinessRecommendation[] = [];
  const criticalIssues: string[] = [];
  const strengths: string[] = [];
  
  // Data recommendations
  if (dataCompleteness < 90) {
    recommendations.push({
      category: 'data',
      priority: 'high',
      issue: 'Data completeness below 90%',
      recommendation: 'Implement mandatory field validation and data entry standards',
      estimatedImpact: 'Improve data reliability by 15-20%'
    });
    criticalIssues.push('Incomplete data records affecting analysis quality');
  } else {
    strengths.push('Excellent data completeness standards');
  }
  
  if (dataFreshness < 70) {
    recommendations.push({
      category: 'data',
      priority: 'medium',
      issue: 'Data freshness below acceptable levels',
      recommendation: 'Increase data collection frequency and implement automated feeds',
      estimatedImpact: 'Improve decision-making timeliness by 25%'
    });
  }
  
  // Operational recommendations
  if (serviceReliability < 80) {
    recommendations.push({
      category: 'operational',
      priority: 'high',
      issue: 'Service pass rate below 80%',
      recommendation: 'Review service delivery processes and implement quality improvements',
      estimatedImpact: 'Increase service success rate by 10-15%'
    });
    criticalIssues.push('Low service success rate indicating operational issues');
  } else if (serviceReliability > 90) {
    strengths.push('Excellent service delivery performance');
  }
  
  // Quality recommendations
  if (qualityAssurance < 95) {
    recommendations.push({
      category: 'quality',
      priority: 'medium',
      issue: 'Data accuracy could be improved',
      recommendation: 'Implement data validation rules and quality monitoring',
      estimatedImpact: 'Reduce data errors by 50%'
    });
  } else {
    strengths.push('High data accuracy and quality standards');
  }
  
  return {
    dataReadinessScore,
    operationalReadinessScore,
    qualityReadinessScore,
    overallReadinessScore,
    breakdown: {
      dataCompleteness,
      dataFreshness,
      dataConsistency,
      operationalEfficiency,
      serviceReliability,
      costManagement,
      qualityAssurance,
      processMaturity
    },
    recommendations,
    criticalIssues,
    strengths
  };
}

// Empty data structure functions
function getEmptyDataQuality(): DataQualityMetrics {
  const emptyDimension: DataQualityDimension = {
    score: 0,
    details: 'No data available',
    issues: ['No services found in date range'],
    recommendations: ['Expand date range or check data source']
  };
  
  return {
    completeness: emptyDimension,
    accuracy: emptyDimension,
    timeliness: emptyDimension,
    consistency: emptyDimension,
    validity: emptyDimension,
    overallScore: 0
  };
}

function getEmptyWardAnalysis(): WardAnalysisData {
  return {
    validWards: [],
    invalidWard66: {
      count: 0,
      totalCost: 0,
      avgCost: 0,
      passRate: 0,
      impactAnalysis: {
        percentageOfTotalServices: 0,
        percentageOfTotalCost: 0,
        comparedToValidWards: {
          avgCostDifference: 0,
          passRateDifference: 0
        }
      },
      recommendations: []
    },
    wardEfficiencyRanking: [],
    totalWardsCovered: 0,
    wardCoveragePercentage: 0
  };
}

function getEmptyReadinessMetrics(): ReadinessMetrics {
  return {
    dataReadinessScore: 0,
    operationalReadinessScore: 0,
    qualityReadinessScore: 0,
    overallReadinessScore: 0,
    breakdown: {
      dataCompleteness: 0,
      dataFreshness: 0,
      dataConsistency: 0,
      operationalEfficiency: 0,
      serviceReliability: 0,
      costManagement: 0,
      qualityAssurance: 0,
      processMaturity: 0
    },
    recommendations: [],
    criticalIssues: ['No data available for analysis'],
    strengths: []
  };
}