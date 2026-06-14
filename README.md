# FleetOS — Fleet Management Frontend

A complete React + Vite + Material UI frontend for the Fleet Management API.

## Tech Stack

- **React 18** + **Vite 5**
- **MUI v6** (Material UI)
- **React Router v6**
- **Axios** (API calls with interceptors)
- **Recharts** (dashboard charts)
- **Notistack** (toast notifications)
- **Day.js** (date formatting)

## Project Structure

```
src/
├── components/
│   ├── Common.jsx          # Shared: StatusChip, StatCard, ConfirmDialog, PageHeader
│   ├── Layout.jsx          # Main app shell
│   ├── Sidebar.jsx         # Navigation drawer
│   ├── TopBar.jsx          # App bar
│   └── ProtectedRoute.jsx  # Auth guard
├── context/
│   └── AuthContext.jsx     # Global auth state
├── hooks/
│   └── useApi.js           # useApi / useMutation hooks
├── pages/
│   ├── LoginPage.jsx
│   ├── DashboardPage.jsx
│   ├── VehiclesPage.jsx
│   ├── DriversPage.jsx
│   ├── TripsPage.jsx
│   ├── MaintenancePage.jsx
│   ├── FuelPage.jsx
│   └── UsersPage.jsx
├── services/
│   └── api.js              # Axios instance + all service functions
└── theme/
    └── index.js            # MUI theme + PALETTE tokens
```

## Quick Start

```bash
npm install
npm run dev
```

Open http://localhost:5173

## API Base URL

Configured to connect to:
`https://fleet-management-backend-staging.vercel.app/api/v1`

For local dev, the Vite proxy in `vite.config.js` routes `/api` requests.

## Features

| Module      | Actions                                     |
|-------------|---------------------------------------------|
| Dashboard   | KPI cards, trip area chart, vehicle pie chart, fuel bar chart, recent trips |
| Vehicles    | List, add, edit, delete, search, paginate   |
| Drivers     | List, add, edit, delete, search, paginate   |
| Trips       | List, add, edit, delete, start, end, search |
| Maintenance | List, schedule, edit, delete, search        |
| Fuel Logs   | List, add, edit, delete, search, auto-total |
| Users       | List, edit, delete, search                  |

## Environment

Create `.env.local` to override the API URL:
```
VITE_API_BASE_URL=https://your-api-url.com/api/v1
```

Then update `src/services/api.js` to use `import.meta.env.VITE_API_BASE_URL`.
