import type { NextApiRequest, NextApiResponse } from 'next';
import dataDictionary from '../../src/data/data-dictionary.json';

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Set cache headers for performance (cache for 1 hour)
    res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=3600');
    
    // Support different response formats
    const format = req.query.format as string;
    
    if (format === 'csv') {
      // Generate CSV format
      const headers = [
        'Field Name',
        'Display Name', 
        'Data Type',
        'Required',
        'Primary Key',
        'Description',
        'Valid Values',
        'Example',
        'Completeness %'
      ];

      const rows = dataDictionary.fields.map(field => [
        field.fieldName,
        field.displayName,
        field.dataType,
        field.nullable ? 'No' : 'Yes',
        field.primaryKey ? 'Yes' : 'No',
        field.description,
        Array.isArray(field.validValues) ? field.validValues.join(', ') : field.validValues,
        field.example || '',
        field.dataQuality.completeness !== null ? field.dataQuality.completeness.toString() : 'N/A'
      ]);

      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      ].join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="toronto-service-results-dictionary.csv"');
      return res.status(200).send(csvContent);
    }

    // Default to JSON format
    res.status(200).json({
      success: true,
      data: dataDictionary,
      generated: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error serving data dictionary:', error);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
}