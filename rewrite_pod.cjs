const fs = require('fs');
const oldCode = fs.readFileSync('old_finance.jsx', 'utf8');
const match = oldCode.match(/<TabPanel value=\{tab\} index=\{6\}>([\s\S]*?)<\/TabPanel>/);
let content = match[1];
content = content.replace(/<Box sx=\{\{ mb: 4, display: 'flex', alignItems: 'center', gap: 2 \}\}>[\s\S]*?<\/Box>\s*<\/Box>/, '');

const finalCode = `import React from 'react';
import { Box, Card, Typography, Grid, TextField, Stack, Chip } from '@mui/material';
import { FactCheck } from '@mui/icons-material';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import FactCheckIcon from '@mui/icons-material/FactCheck';
import { PageHeader } from '../components/Common';
import FinanceTabs from '../components/FinanceTabs';

export default function PODBillingChainPage() {
  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
      <PageHeader 
        title="POD & Billing Chain" 
        subtitle="Verify delivery proof, auto-create billing drafts, and complete finance approval."
        icon={<FactCheck color="primary" sx={{ fontSize: 40 }} />}
      />
      <FinanceTabs />
      ${content.trim()}
    </Box>
  );
}
`;

fs.writeFileSync('src/fleet/pages/PODBillingChainPage.jsx', finalCode);
console.log('Rewrote PODBillingChainPage');
