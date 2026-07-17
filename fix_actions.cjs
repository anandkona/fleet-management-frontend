const fs = require('fs');

const files = [
  'AccountsPage.jsx',
  'CustomersPage.jsx',
  'DriverAdvancesPage.jsx',
  'DriverSettlementsPage.jsx',
  'FinanceCategoriesPage.jsx',
  'FinanceTransactionsPage.jsx',
  'PaymentsPage.jsx',
  'TripBillingPage.jsx',
  'VendorsPage.jsx'
];

files.forEach(f => {
  const p = 'd:/fleet-management1/src/fleet/pages/' + f;
  if (!fs.existsSync(p)) return;
  let text = fs.readFileSync(p, 'utf8');

  // Look for the broken pattern:
  // />
  // <FinanceTabs />
  //   action={ ... }
  // />
  
  const badPattern = /\/>\s*<FinanceTabs \/>\s*(action=\{[\s\S]*?\})\s*\/>/;
  
  if (badPattern.test(text)) {
    text = text.replace(badPattern, '$1\n      />\n      <FinanceTabs />');
    fs.writeFileSync(p, text);
    console.log('Fixed', f);
  } else {
    console.log('No broken pattern in', f);
  }
});
