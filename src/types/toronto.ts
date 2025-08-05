// Toronto Service Results specific types
// Based on actual city_of_toronto.service_results table schema
export interface ServiceResult {
  id: number;
  start_date: string | null;
  end_date: string | null;
  service_division_owner: string | null;
  service_result: 'PASS' | 'FAIL' | '' | null;
  ward: number | null;
  estimated_cost: number | null;
  notes: string | null;
}

export interface ServiceFilters {
  startDate: string;
  endDate: string;
  serviceDivisionOwner: string;
  ward: string;
  serviceResult: 'PASS' | 'FAIL' | '' | 'UNKNOWN' | 'all';
}

export interface ServiceAggregation {
  division: string;
  count: number;
  total_cost: number;
  avg_cost: number;
  pass_count: number;
  fail_count: number;
  pass_rate: number;
}

export interface WardAggregation {
  ward: number;
  ward_name?: string;
  count: number;
  total_cost: number;
  avg_cost: number;
  pass_count: number;
  fail_count: number;
  pass_rate: number;
}

// Available service divisions from the database
export const SERVICE_DIVISIONS = [
  'Transportation Services',
  'Toronto Water',
  'Parks, Forestry & Recreation',
  'Solid Waste Management',
  'Municipal Licensing & Standards',
  'Water'
] as const;

export type ServiceDivision = typeof SERVICE_DIVISIONS[number];