const fs = require('fs');
const pages = {
  'FinanceTransactionsPage.jsx': { t: 'Transactions', s: 'Manage all cash flows, income, and expenses.', i: 'ReceiptLong' },
  'DriverAdvancesPage.jsx': { t: 'Driver Advances', s: 'Manage driver advances and outstanding balances.', i: 'RequestQuote' },
  'DriverSettlementsPage.jsx': { t: 'Driver Settlements', s: 'Manage driver settlements and payments.', i: 'Handshake' },
  'AccountsPage.jsx': { t: 'Accounts', s: 'Manage bank accounts, cash registers, and current balances.', i: 'AccountBalance' },
  'CustomersPage.jsx': { t: 'Customers', s: 'Manage customer accounts and billing information.', i: 'People' },
  'VendorsPage.jsx': { t: 'Vendors', s: 'Manage vendor accounts, payables, and transactions.', i: 'Business' },
  'PaymentsPage.jsx': { t: 'Payments', s: 'Record payments made or received.', i: 'Payments' },
  'FinanceCategoriesPage.jsx': { t: 'Finance Categories', s: 'Configure categories for income and expenses.', i: 'Category' },
  'TripBillingPage.jsx': { t: 'Trip Billing', s: 'Bill trips to customers and generate invoices.', i: 'LocalShipping' }
};

Object.keys(pages).forEach(f => {
  const p = 'd:/fleet-management1/src/fleet/pages/' + f;
  if (!fs.existsSync(p)) return;
  let text = fs.readFileSync(p, 'utf8');

  // Try to match the exact broken string pattern
  const brokenSyntaxIndex = text.indexOf('\\n      <FinanceTabs />');
  if (brokenSyntaxIndex !== -1) {
    const endCurlyIndex = text.indexOf('}', brokenSyntaxIndex);
    if (endCurlyIndex !== -1) {
      const info = pages[f];
      const newHeader = `<PageHeader 
        title="${info.t}" 
        subtitle="${info.s}" 
        icon={<${info.i} color="primary" sx={{ fontSize: 40 }} />}
      />
      <FinanceTabs />`;
      
      text = text.substring(0, brokenSyntaxIndex) + newHeader + text.substring(endCurlyIndex + 1);
      
      // Also fix any missing icons in the imports
      if (!text.includes(info.i)) {
        text = text.replace("from '@mui/icons-material';", `, ${info.i} } from '@mui/icons-material';`);
        // if not grouped import:
        if (!text.includes(`} from '@mui/icons-material';`)) {
            text = `import { ${info.i} } from '@mui/icons-material';\n` + text;
        }
      }
      
      fs.writeFileSync(p, text);
      console.log('Fixed', f);
    }
  } else {
    console.log('No bad match in', f);
  }
});
