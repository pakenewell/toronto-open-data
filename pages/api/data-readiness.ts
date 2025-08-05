import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseCity } from '@/src/lib/supabase';
import type { 
  DashboardApiResponse, 
  DashboardData, 
  DataQualityMetrics,
  DataQualityDimension,
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

  try {
    // Fetch ALL data without any filters for data readiness assessment
    const { data: services, error } = await supabaseCity
      .from('service_results')
      .select('*');
    
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
              earliestService: new Date().toISOString().split('T')[0],
              latestService: new Date().toISOString().split('T')[0],
              timeSpan: '0 days'
            }
          },
          servicesByDivision: [],
          servicesOverTime: [],
          servicesByResult: [],
          topDivisions: [],
          topWards: [],
          heatmapData: [],
          
          // Enhanced data for readiness assessment
          dataQuality: getEmptyDataQuality(),
          timeSeriesData: [],
          costDistribution: [],
          highestExpenses: [],
          wardAnalysis: getEmptyWardAnalysis(),
          readinessMetrics: getEmptyReadinessMetrics()
        },
        links: {
          self: `/api/data-readiness`
        }
      };
      
      return res.status(200).json(emptyResponse);
    }
    
    // Calculate basic KPI data from full dataset
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
    const earliestDate = dates.length > 0 ? new Date(Math.min(...dates.map(d => d.getTime()))) : new Date();
    
    const endDates = services
      .filter(s => s.end_date)
      .map(s => new Date(s.end_date!))
      .filter(d => !isNaN(d.getTime()));
    const latestServiceDate = endDates.length > 0 ? new Date(Math.max(...endDates.map(d => d.getTime()))) : new Date();
    
    // Calculate enhanced data quality metrics based on the audit documentation
    const dataQuality = calculateAuditAlignedDataQuality(services);
    
    // Calculate readiness metrics aligned with ODRA framework
    const readinessMetrics = calculateODRAReadinessMetrics(services, dataQuality);
    
    // Calculate field completeness data for the completeness chart
    const fieldCompletenessData = calculateFieldCompleteness(services);
    
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
      servicesByDivision: [],
      servicesOverTime: [],
      servicesByResult: [],
      topDivisions: [],
      topWards: [],
      heatmapData: [],
      
      // Enhanced data specifically for readiness assessment
      dataQuality,
      timeSeriesData: [],
      costDistribution: [],
      highestExpenses: [],
      wardAnalysis: getEmptyWardAnalysis(),
      readinessMetrics,
      
      // Add field completeness data for the chart
      fieldCompleteness: fieldCompletenessData
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
        self: `/api/data-readiness`
      }
    };
    
    // Add caching headers for performance
    res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');
    res.status(200).json(response);
    
  } catch (error) {
    console.error('API error:', error);
    res.status(500).json({ error: 'Failed to fetch data readiness data' });
  }
}

// Individual data quality dimension calculations
function calculateAccuracy(services: ServiceResult[]): number {
  const totalRecords = services.length;
  if (totalRecords === 0) return 100;
  
  let invalidRecords = 0;
  
  services.forEach(service => {
    // Check ward validity (Toronto has wards 1-25)
    if (service.ward !== null && (service.ward < 1 || service.ward > 25)) {
      invalidRecords++;
      return;
    }
    
    // Check date validity - allow historical data up to 50 years
    const currentDate = new Date();
    const oneYearFuture = new Date();
    oneYearFuture.setFullYear(currentDate.getFullYear() + 1);
    const fiftyYearsPast = new Date();
    fiftyYearsPast.setFullYear(currentDate.getFullYear() - 50);
    
    if (service.start_date) {
      const startDate = new Date(service.start_date);
      if (startDate > oneYearFuture || startDate < fiftyYearsPast) {
        invalidRecords++;
        return;
      }
    }
    
    if (service.end_date) {
      const endDate = new Date(service.end_date);
      if (endDate > oneYearFuture || endDate < fiftyYearsPast) {
        invalidRecords++;
        return;
      }
      
      // End date should not be before start date
      if (service.start_date && endDate < new Date(service.start_date)) {
        invalidRecords++;
        return;
      }
    }
    
    // Check cost validity (should not be negative)
    if (service.estimated_cost !== null && service.estimated_cost < 0) {
      invalidRecords++;
      return;
    }
    
    // Check service_result validity (PASS/FAIL are valid, UNKNOWN suggests data quality issue)
    if (service.service_result) {
      if (service.service_result !== 'PASS' && 
          service.service_result !== 'FAIL' && 
          service.service_result !== 'UNKNOWN') {
        invalidRecords++;
        return;
      }
      // Count UNKNOWN as partial accuracy issue (suggests missing/unclear data)
      if (service.service_result === 'UNKNOWN') {
        invalidRecords += 0.5; // Half penalty for UNKNOWN values
        return;
      }
    }
  });
  
  const validRecords = totalRecords - invalidRecords;
  return (validRecords / totalRecords) * 100;
}

function calculateConsistency(services: ServiceResult[]): number {
  const totalRecords = services.length;
  if (totalRecords === 0) return 100;
  
  let inconsistentRecords = 0;
  
  services.forEach(service => {
    // Records with PASS/FAIL should have a division owner
    if (service.service_result && service.service_result !== 'UNKNOWN' && !service.service_division_owner) {
      inconsistentRecords++;
      return;
    }
    
    // Records with costs should have division and dates
    if (service.estimated_cost && service.estimated_cost > 0) {
      if (!service.service_division_owner || !service.start_date || !service.end_date) {
        inconsistentRecords++;
        return;
      }
    }
    
    // Records with UNKNOWN result shouldn't have high costs (suggests missing data)
    if (service.service_result === 'UNKNOWN' && service.estimated_cost && service.estimated_cost > 100000) {
      inconsistentRecords++;
      return;
    }
    
    // Records with division should have at least one other field populated
    if (service.service_division_owner) {
      const hasOtherData = service.service_result || 
                          service.estimated_cost !== null || 
                          service.ward !== null ||
                          service.start_date ||
                          service.end_date;
      if (!hasOtherData) {
        inconsistentRecords++;
        return;
      }
    }
    
    // Check format consistency (e.g., division names should follow patterns)
    if (service.service_division_owner) {
      // Check if division name follows expected format (not all caps, not all lowercase)
      const divName = service.service_division_owner;
      if (divName && divName.length > 3 && (divName === divName.toUpperCase() || divName === divName.toLowerCase())) {
        inconsistentRecords++;
        return;
      }
    }
  });
  
  const consistentRecords = totalRecords - inconsistentRecords;
  return (consistentRecords / totalRecords) * 100;
}

function calculateCompleteness(services: ServiceResult[]): number {
  const totalRecords = services.length;
  if (totalRecords === 0) return 100;
  
  // Count records with ALL required fields
  let completeRecords = 0;
  
  services.forEach(service => {
    // ALL fields are required: division, dates, cost, ward, and valid result
    const hasAllRequiredFields = 
      service.service_division_owner && 
      service.start_date && 
      service.end_date &&
      service.estimated_cost !== null && 
      service.estimated_cost !== undefined &&
      service.ward !== null && 
      service.ward !== undefined &&
      service.service_result && 
      service.service_result !== 'UNKNOWN';
    
    if (hasAllRequiredFields) completeRecords++;
  });
  
  // Simple percentage of records with all required fields
  return (completeRecords / totalRecords) * 100;
}

function calculateTimeliness(services: ServiceResult[]): number {
  const currentDate = new Date();
  
  // Find the most recent record
  const endDates = services
    .filter(s => s.end_date)
    .map(s => new Date(s.end_date!));
    
  if (endDates.length === 0) return 0;
  
  const mostRecentDate = endDates.reduce((latest, date) => 
    date > latest ? date : latest, new Date(0));
  
  // Calculate age of most recent data
  const daysSinceUpdate = Math.floor(
    (currentDate.getTime() - mostRecentDate.getTime()) / (1000 * 60 * 60 * 24)
  );
  
  // Calculate update frequency by looking at date ranges in the data
  const dateRanges = services
    .filter(s => s.start_date && s.end_date)
    .map(s => ({
      start: new Date(s.start_date!),
      end: new Date(s.end_date!)
    }))
    .sort((a, b) => a.end.getTime() - b.end.getTime());
  
  // Check for gaps in coverage
  let totalGapDays = 0;
  for (let i = 1; i < dateRanges.length; i++) {
    const gap = dateRanges[i].start.getTime() - dateRanges[i-1].end.getTime();
    if (gap > 0) {
      totalGapDays += Math.floor(gap / (1000 * 60 * 60 * 24));
    }
  }
  
  // Score components:
  // 1. Recency (60% weight): 100% if current, 0% if >365 days old
  const recencyScore = Math.max(0, Math.min(100, (1 - daysSinceUpdate / 365) * 100));
  
  // 2. Coverage (40% weight): Penalize for gaps in data
  const coverageScore = dateRanges.length > 1 ? 
    Math.max(0, 100 - (totalGapDays / 30)) : 50; // Default 50% if can't calculate
  
  return (recencyScore * 0.6) + (coverageScore * 0.4);
}

function calculateMetadataQuality(services: ServiceResult[]): number {
  const totalRecords = services.length;
  if (totalRecords === 0) return 100;
  
  let metadataScore = 0;
  
  // 1. Field population patterns (25%)
  const fieldsWithData = new Set<string>();
  const divisions = new Set<string>();
  const wards = new Set<number>();
  
  services.forEach(service => {
    if (service.service_division_owner) {
      fieldsWithData.add('division');
      divisions.add(service.service_division_owner);
    }
    if (service.service_result) fieldsWithData.add('result');
    if (service.ward !== null) {
      fieldsWithData.add('ward');
      wards.add(service.ward);
    }
    if (service.estimated_cost !== null) fieldsWithData.add('cost');
    if (service.notes) fieldsWithData.add('notes');
  });
  
  // Score based on field diversity
  const fieldDiversityScore = (fieldsWithData.size / 6) * 100;
  metadataScore += fieldDiversityScore * 0.25;
  
  // 2. Value diversity (25%) - Are there meaningful variations in the data?
  const divisionDiversity = Math.min(100, (divisions.size / Math.max(1, totalRecords * 0.01)) * 100);
  const wardDiversity = Math.min(100, (wards.size / 25) * 100); // 25 total wards
  metadataScore += ((divisionDiversity + wardDiversity) / 2) * 0.25;
  
  // 3. Notes field quality (25%) - Do records have descriptive notes?
  const recordsWithNotes = services.filter(s => s.notes && s.notes.trim().length > 10).length;
  const recordsWithAnyNotes = services.filter(s => s.notes && s.notes.trim().length > 0).length;
  // Give partial credit for having any notes, full credit for meaningful notes
  const notesScore = ((recordsWithAnyNotes / totalRecords) * 30) + ((recordsWithNotes / totalRecords) * 70);
  metadataScore += notesScore * 0.25;
  
  // 4. Identifiability (25%) - Can records be uniquely identified?
  const uniqueKeys = new Set();
  let duplicates = 0;
  services.forEach(service => {
    const key = `${service.start_date}-${service.end_date}-${service.service_division_owner}-${service.ward}`;
    if (uniqueKeys.has(key)) {
      duplicates++;
    } else {
      uniqueKeys.add(key);
    }
  });
  const uniquenessScore = totalRecords > 0 ? ((totalRecords - duplicates) / totalRecords) * 100 : 100;
  metadataScore += uniquenessScore * 0.25;
  
  return metadataScore;
}

// Calculate data quality metrics using comprehensive calculations
function calculateAuditAlignedDataQuality(services: ServiceResult[]): DataQualityMetrics {
  const totalServices = services.length;
  
  // Use the new calculation functions
  const accuracyScore = calculateAccuracy(services);
  const completenessScore = calculateCompleteness(services);
  const timelinessScore = calculateTimeliness(services);
  const consistencyScore = calculateConsistency(services);
  const metadataScore = calculateMetadataQuality(services);
  
  // Overall score is average of all 5 dimensions
  const overallScore = (accuracyScore + completenessScore + timelinessScore + consistencyScore + metadataScore) / 5;
  
  // Detailed analysis for accuracy issues
  const invalidWards = services.filter(s => s.ward !== null && (s.ward < 1 || s.ward > 25));
  const invalidDates = services.filter(s => {
    if (!s.start_date && !s.end_date) return false;
    const currentDate = new Date();
    const oneYearFuture = new Date();
    oneYearFuture.setFullYear(currentDate.getFullYear() + 1);
    const fiftyYearsPast = new Date();
    fiftyYearsPast.setFullYear(currentDate.getFullYear() - 50);
    
    if (s.start_date) {
      const startDate = new Date(s.start_date);
      if (startDate > oneYearFuture || startDate < fiftyYearsPast) return true;
    }
    if (s.end_date) {
      const endDate = new Date(s.end_date);
      if (endDate > oneYearFuture || endDate < fiftyYearsPast) return true;
      if (s.start_date && endDate < new Date(s.start_date)) return true;
    }
    return false;
  });
  const negativeCosts = services.filter(s => s.estimated_cost !== null && s.estimated_cost < 0);
  
  // Calculate most recent date for timeliness details
  const endDates = services.filter(s => s.end_date).map(s => new Date(s.end_date!));
  const mostRecentDate = endDates.length > 0 ? 
    endDates.reduce((latest, date) => date > latest ? date : latest, new Date(0)) : new Date(0);
  const daysSinceUpdate = Math.floor((new Date().getTime() - mostRecentDate.getTime()) / (1000 * 60 * 60 * 24));
  
  return {
    completeness: {
      score: completenessScore,
      details: `${completenessScore.toFixed(2)}% of records have ALL required fields: division, start date, end date, cost, ward, and valid result (not UNKNOWN)`,
      issues: completenessScore < 70 ? [
        'Many records have UNKNOWN service results (21.6% of data)',
        'Missing cost data in 18.69% of records',
        'Some records missing dates or ward information'
      ] : [],
      recommendations: completenessScore < 70 ? [
        'Convert UNKNOWN results to actual PASS/FAIL values',
        'Populate all missing cost estimates',
        'Ensure all records have complete date and location data'
      ] : ['Continue efforts to maintain data completeness']
    },
    accuracy: {
      score: accuracyScore,
      details: `${accuracyScore.toFixed(2)}% accurate - checking wards, dates, costs, and result values`,
      issues: [
        ...(invalidWards.length > 0 ? [`${invalidWards.length} records with invalid ward numbers`] : []),
        ...(invalidDates.length > 0 ? [`${invalidDates.length} records with invalid or illogical dates`] : []),
        ...(negativeCosts.length > 0 ? [`${negativeCosts.length} records with negative costs`] : [])
      ],
      recommendations: accuracyScore < 95 ? [
        'Implement ward validation (1-25 only)',
        'Add date range validation (50 years past to 1 year future)',
        'Ensure costs are non-negative'
      ] : ['Data accuracy meets standards']
    },
    timeliness: {
      score: timelinessScore,
      details: `Data is ${daysSinceUpdate} days old (last update: ${mostRecentDate.toISOString().split('T')[0]})`,
      issues: daysSinceUpdate > 90 ? [
        'Data freshness below acceptable threshold',
        'Coverage gaps may exist in recent periods'
      ] : [],
      recommendations: daysSinceUpdate > 90 ? [
        'Establish automated data refresh pipeline',
        'Set target update frequency (e.g., monthly)',
        'Monitor and alert on data staleness'
      ] : ['Data timeliness is acceptable']
    },
    consistency: {
      score: consistencyScore,
      details: `${consistencyScore.toFixed(2)}% consistent - checking business rules and data patterns`,
      issues: consistencyScore < 90 ? [
        'Records with results missing division owners',
        'Costs without associated dates or divisions',
        'Inconsistent formatting in text fields'
      ] : [],
      recommendations: consistencyScore < 90 ? [
        'Enforce business rules at data entry',
        'Standardize text field formatting',
        'Implement cross-field validation'
      ] : ['Data consistency is good']
    },
    validity: {
      score: metadataScore,
      details: `${metadataScore.toFixed(2)}% metadata quality - based on documentation, diversity, and uniqueness`,
      issues: metadataScore < 80 ? [
        'Limited field diversity in dataset',
        'Lack of descriptive notes for context',
        'Potential duplicate records'
      ] : [],
      recommendations: metadataScore < 80 ? [
        'Add descriptive notes to provide context',
        'Ensure all relevant fields are populated',
        'Implement unique record identifiers'
      ] : ['Metadata quality is acceptable']
    },
    overallScore
  };
}

// Calculate readiness metrics aligned with ODRA framework
function calculateODRAReadinessMetrics(services: ServiceResult[], dataQuality: DataQualityMetrics): ReadinessMetrics {
  const totalServices = services.length;
  
  // Use the actual calculated scores from our 5 dimensions
  const finalAccuracy = dataQuality.accuracy.score;
  const finalCompleteness = dataQuality.completeness.score;
  const finalTimeliness = dataQuality.timeliness.score;
  const finalConsistency = dataQuality.consistency.score;
  const finalMetadata = dataQuality.validity.score; // Note: validity contains metadata score
  
  // Overall readiness score is average of 5 dimensions
  const overallReadinessScore = (
    finalAccuracy +
    finalConsistency +
    finalCompleteness +
    finalTimeliness +
    finalMetadata
  ) / 5;
  
  // Generate recommendations based on audit findings
  const recommendations: ReadinessRecommendation[] = [];
  const criticalIssues: string[] = [];
  const strengths: string[] = [];
  
  // Critical issues from audit
  const invalidWard66Count = services.filter(s => s.ward === 66).length;
  if (invalidWard66Count > 0) {
    criticalIssues.push(`${invalidWard66Count} records with invalid ward numbers (Ward 66 doesn't exist)`);
    recommendations.push({
      category: 'data',
      priority: 'high',
      issue: 'Invalid ward numbers detected',
      recommendation: 'Investigate and correct Ward 66 assignments, implement ward validation',
      estimatedImpact: 'Resolve data accuracy issues affecting geographic analysis'
    });
  }
  
  if (dataQuality.timeliness.score < 10) {
    criticalIssues.push('Data staleness: dataset is significantly outdated');
    recommendations.push({
      category: 'operational',
      priority: 'high', 
      issue: 'Data freshness below acceptable levels',
      recommendation: 'Refresh data from source systems and establish automated update pipeline',
      estimatedImpact: 'Improve data currency and user trust'
    });
  }
  
  // Strengths based on calculated scores
  if (dataQuality.accuracy.score > 95) {
    strengths.push(`Excellent data accuracy (${dataQuality.accuracy.score.toFixed(1)}%) with minimal validation errors`);
  }
  
  if (dataQuality.completeness.score > 90) {
    strengths.push(`High data completeness (${dataQuality.completeness.score.toFixed(1)}%) across required and important fields`);
  }
  
  if (dataQuality.consistency.score > 90) {
    strengths.push(`Strong data consistency (${dataQuality.consistency.score.toFixed(1)}%) following business rules`);
  }
  
  if (dataQuality.validity.score > 80) {
    strengths.push(`Good metadata quality (${dataQuality.validity.score.toFixed(1)}%) with strong documentation`);
  }
  
  return {
    dataReadinessScore: overallReadinessScore,
    operationalReadinessScore: finalTimeliness,
    qualityReadinessScore: (finalAccuracy + finalConsistency + finalCompleteness) / 3,
    overallReadinessScore,
    breakdown: {
      dataCompleteness: finalCompleteness,
      dataFreshness: finalTimeliness,
      dataConsistency: finalConsistency,
      operationalEfficiency: finalMetadata,
      serviceReliability: finalAccuracy,
      costManagement: finalMetadata,
      qualityAssurance: finalAccuracy,
      processMaturity: finalConsistency
    },
    recommendations,
    criticalIssues,
    strengths,
    // Add the 5 consolidated dimensions for the UI
    consolidatedDimensions: {
      accuracy: finalAccuracy,
      consistency: finalConsistency,
      completeness: finalCompleteness,
      timeliness: finalTimeliness,
      metadata: finalMetadata
    }
  };
}

// Calculate field completeness for the data completeness chart
function calculateFieldCompleteness(services: ServiceResult[]) {
  const totalRecords = services.length;
  
  if (totalRecords === 0) return [];
  
  return [
    {
      field: 'service_division_owner',
      completeness: (services.filter(s => s.service_division_owner).length / totalRecords) * 100,
      totalRecords,
      completeRecords: services.filter(s => s.service_division_owner).length,
      missingRecords: services.filter(s => !s.service_division_owner).length,
      description: 'Division responsible for the service'
    },
    {
      field: 'service_result',
      completeness: (services.filter(s => s.service_result).length / totalRecords) * 100,
      totalRecords,
      completeRecords: services.filter(s => s.service_result).length,
      missingRecords: services.filter(s => !s.service_result).length,
      description: 'Result of the service (PASS/FAIL)'
    },
    {
      field: 'estimated_cost',
      completeness: (services.filter(s => s.estimated_cost !== null && s.estimated_cost !== undefined).length / totalRecords) * 100,
      totalRecords,
      completeRecords: services.filter(s => s.estimated_cost !== null && s.estimated_cost !== undefined).length,
      missingRecords: services.filter(s => s.estimated_cost === null || s.estimated_cost === undefined).length,
      description: 'Estimated cost of the service'
    },
    {
      field: 'ward',
      completeness: (services.filter(s => s.ward !== null && s.ward !== undefined).length / totalRecords) * 100,
      totalRecords,
      completeRecords: services.filter(s => s.ward !== null && s.ward !== undefined).length,
      missingRecords: services.filter(s => s.ward === null || s.ward === undefined).length,
      description: 'Ward where the service was provided'
    },
    {
      field: 'start_date',
      completeness: (services.filter(s => s.start_date).length / totalRecords) * 100,
      totalRecords,
      completeRecords: services.filter(s => s.start_date).length,
      missingRecords: services.filter(s => !s.start_date).length,
      description: 'Start date of the service'
    },
    {
      field: 'end_date',
      completeness: (services.filter(s => s.end_date).length / totalRecords) * 100,
      totalRecords,
      completeRecords: services.filter(s => s.end_date).length,
      missingRecords: services.filter(s => !s.end_date).length,
      description: 'End date of the service'
    }
  ];
}

// Empty data structure functions
function getEmptyDataQuality(): DataQualityMetrics {
  const emptyDimension: DataQualityDimension = {
    score: 0,
    details: 'No data available',
    issues: ['No services found'],
    recommendations: ['Check data source']
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

function getEmptyWardAnalysis() {
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