const fs = require('fs');
const pages = {
  'FinanceTransactionsPage.jsx': 'ReceiptLong',
  'DriverAdvancesPage.jsx': 'RequestQuote',
  'DriverSettlementsPage.jsx': 'Handshake',
  'AccountsPage.jsx': 'AccountBalance',
  'CustomersPage.jsx': 'People',
  'VendorsPage.jsx': 'Business',
  'PaymentsPage.jsx': 'Payments',
  'FinanceCategoriesPage.jsx': 'Category',
  'TripBillingPage.jsx': 'LocalShipping'
};

Object.keys(pages).forEach(f => {
  const p = 'd:/fleet-management1/src/fleet/pages/' + f;
  if (!fs.existsSync(p)) return;
  let text = fs.readFileSync(p, 'utf8');
  const icon = pages[f];
  
  if (!text.match(new RegExp(`import\\s+.*?\\b${icon}\\b.*?'@mui/icons-material'`))) {
    text = `import { ${icon} } from '@mui/icons-material';\n` + text;
    fs.writeFileSync(p, text);
    console.log('Added import to', f);
  } else {
    console.log('Already imported in', f);
  }
});
