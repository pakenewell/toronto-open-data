# Toronto Open Data Dashboard

## Project Overview
A Next.js dashboard for visualizing Toronto city service results data from the `city_of_toronto.service_results` table in Supabase.

## Database Schema
```sql
city_of_toronto.service_results:
  - id: bigint (primary key)
  - start_date: date
  - end_date: date
  - service_division_owner: text
  - service_result: text ('PASS', 'FAIL', or empty)
  - ward: bigint
  - estimated_cost: double precision
  - notes: text
```

## Key Features
- **KPI Cards**: Total services, total cost, pass rate, average cost
- **Service Breakdown**: Results by PASS/FAIL/UNKNOWN status
- **Top Lists**: Highest cost divisions and wards
- **Filters**: Date range, division, ward, service result

## Tech Stack
- **Frontend**: Next.js 14, React, TypeScript
- **Styling**: Tailwind CSS
- **State**: React useState (no Redux)
- **Data Fetching**: SWR
- **Database**: PostgreSQL via Supabase (city_of_toronto schema)
- **Charts**: Ready for ECharts integration

## Project Structure
```
/
├── pages/
│   ├── index.tsx          # Main dashboard page
│   └── api/
│       └── toronto-dashboard.ts  # API endpoint
├── src/
│   ├── components/        # UI components
│   ├── hooks/            # Custom hooks (useTorontoFilters)
│   ├── lib/              # Utilities and DB connection
│   └── types/            # TypeScript types
└── styles/               # Global styles
```

## Development
```bash
npm install
npm run dev     # http://localhost:3000
npm run build   # Production build
npm run lint    # Run ESLint
```

## Environment Variables
Required in `.env.local`:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `POSTGRES_URL`

## API Endpoints
- `GET /api/toronto-dashboard`: Main dashboard data
  - Query params: `start`, `end`, `division`, `ward`, `result`

## Team Agent Context
This project was extracted from the OnOurDime platform. Key agents for specialized assistance:

### **frontend-lead** - UI/UX and React Development
*"The user's experience is the ultimate feature. Performance and accessibility are its foundations."*
- React components and Next.js optimization
- State management and filtering system
- Accessibility compliance (WCAG 2.1 AA)
- Performance optimization (<300ms API responses)

### **data-lead** - Database and API Architecture
*"The data must be fast, accurate, and tell a story."*
- PostgreSQL query optimization
- Database schema design
- API endpoint performance
- Data aggregation and materialized views

### **typescript-specialist** - Type Safety and Code Quality
- TypeScript type definitions and interfaces
- Code quality and maintainability
- Build configuration and tooling
- Error handling and validation

### **visualization-specialist** - Charts and Data Visualization
- ECharts integration for Toronto service data
- Interactive dashboards and data storytelling
- Chart performance and accessibility
- Data transformation for visualization

## Next Steps
- Add data visualization charts (line chart for trends, pie chart for results)
- Implement data export functionality
- Add more detailed filtering options
- Create detail views for divisions and wards
- Integrate with city of Toronto open data APIs for real-time updates