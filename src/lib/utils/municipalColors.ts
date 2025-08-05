/**
 * Toronto-inspired municipal color palette for charts and data visualization
 */

// Core municipal colors in RGBA format
export const getMunicipalColors = () => ({
  primary: 'rgba(10, 48, 119, 1)',      // Deep municipal blue
  accent: 'rgba(22, 139, 156, 1)',      // Teal
  success: 'rgba(31, 148, 72, 1)',      // Green for PASS results
  warning: 'rgba(212, 110, 17, 1)',     // Orange for UNKNOWN results  
  destructive: 'rgba(201, 29, 29, 1)',  // Red for FAIL results
  secondary: 'rgba(218, 222, 238, 1)',  // Light gray
  muted: 'rgba(235, 237, 245, 1)',     // Very light gray
});

// Chart color palette inspired by Toronto municipal design
export const municipalChartPalette = [
  'rgba(10, 48, 119, 1)',    // Primary blue
  'rgba(22, 139, 156, 1)',   // Teal
  'rgba(31, 148, 72, 1)',    // Green
  'rgba(212, 110, 17, 1)',   // Orange
  'rgba(133, 51, 153, 1)',   // Purple
  'rgba(26, 133, 204, 1)',   // Light blue
  'rgba(41, 128, 102, 1)',   // Emerald
  'rgba(217, 92, 26, 1)',    // Warm orange
];

// Service result specific colors
export const serviceResultColors = {
  PASS: 'rgba(31, 148, 72, 1)',      // Green
  FAIL: 'rgba(201, 29, 29, 1)',      // Red  
  UNKNOWN: 'rgba(212, 110, 17, 1)',  // Orange
};

// Data completeness quality colors
export const dataQualityColors = {
  excellent: 'rgba(31, 148, 72, 1)',   // Green (95%+)
  good: 'rgba(212, 110, 17, 1)',       // Orange (85-94%)
  fair: 'rgba(217, 77, 26, 1)',        // Orange-red (70-84%)
  poor: 'rgba(201, 29, 29, 1)',        // Red (<70%)
};

/**
 * Get color based on service result status
 */
export const getServiceResultColor = (result: string): string => {
  const normalizedResult = result?.toUpperCase();
  return serviceResultColors[normalizedResult as keyof typeof serviceResultColors] || serviceResultColors.UNKNOWN;
};

/**
 * Get color based on data completeness percentage
 */
export const getDataQualityColor = (percentage: number): string => {
  if (percentage >= 95) return dataQualityColors.excellent;
  if (percentage >= 85) return dataQualityColors.good;
  if (percentage >= 70) return dataQualityColors.fair;
  return dataQualityColors.poor;
};

/**
 * Generate theme-aware colors for charts
 */
export const getThemeColors = (isDark: boolean) => ({
  background: isDark ? 'rgba(15, 20, 31, 1)' : 'rgba(255, 255, 255, 1)',
  foreground: isDark ? 'rgba(226, 232, 240, 1)' : 'rgba(38, 58, 94, 1)',
  border: isDark ? 'rgba(38, 58, 94, 1)' : 'rgba(207, 216, 235, 1)',
  muted: isDark ? 'rgba(148, 163, 184, 1)' : 'rgba(94, 113, 145, 1)',
  tooltip: {
    background: isDark ? 'rgba(33, 41, 54, 0.95)' : 'rgba(255, 255, 255, 0.95)',
    border: isDark ? 'rgba(56, 76, 115, 1)' : 'rgba(207, 216, 235, 1)',
    text: isDark ? 'rgba(226, 232, 240, 1)' : 'rgba(38, 58, 94, 1)',
  }
});