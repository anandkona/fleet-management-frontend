const fs = require('fs');
const path = require('path');
const dir = 'd:/fleet-management1/src/fleet/pages/dashboards';
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

const dashboards = [
  'SuperAdminDashboard',
  'FleetManagerDashboard',
  'MaintenanceManagerDashboard',
  'FuelManagerDashboard',
  'DispatcherDashboard',
  'AccountantDashboard',
  'InventoryManagerDashboard',
  'HrManagerDashboard'
];

dashboards.forEach(name => {
  const content = `import React from 'react';\nimport { Box, Typography } from '@mui/material';\n\nexport default function ${name}() {\n  return (\n    <Box sx={{ p: 3 }}>\n      <Typography variant="h4">${name}</Typography>\n      <Typography>This dashboard is under construction.</Typography>\n    </Box>\n  );\n}\n`;
  fs.writeFileSync(path.join(dir, `${name}.jsx`), content);
});
console.log('Created basic dashboard components.');
