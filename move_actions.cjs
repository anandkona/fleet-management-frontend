const fs = require('fs');

const pages = [
  'FinancePage.jsx',
  'DriverAdvancesPage.jsx',
  'DriverSettlementsPage.jsx',
  'FinanceTransactionsPage.jsx',
  'AccountsPage.jsx',
  'FinanceCategoriesPage.jsx',
  'VendorsPage.jsx',
  'CustomersPage.jsx',
  'PODBillingChainPage.jsx',
  'TripBillingPage.jsx',
  'PaymentsPage.jsx'
];

pages.forEach(f => {
  const p = 'd:/fleet-management1/src/fleet/pages/' + f;
  if (!fs.existsSync(p)) return;
  let text = fs.readFileSync(p, 'utf8');

  // We are looking for:
  //   action={
  //     <something>
  //   }
  // />
  // <FinanceTabs />
  // 
  // And we want to change it to:
  // />
  // <FinanceTabs action={
  //   <something>
  // } />
  
  const regex = /action=\{([\s\S]*?)\}\s*\/>\s*<FinanceTabs \/>/;
  if (regex.test(text)) {
    text = text.replace(regex, '/>\n      <FinanceTabs action={$1} />');
    fs.writeFileSync(p, text);
    console.log('Fixed', f);
  } else {
    // maybe single line action={...} /> <FinanceTabs />
    const regex2 = /action=(\{.*?\})\s*\/>\s*<FinanceTabs \/>/;
    if (regex2.test(text)) {
      text = text.replace(regex2, '/>\n      <FinanceTabs action=$1 />');
      fs.writeFileSync(p, text);
      console.log('Fixed', f);
    } else {
      console.log('No match in', f);
    }
  }
});
