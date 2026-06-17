// import React, { useEffect, useState, useCallback } from 'react';
// import {
//   Table, TableBody, TableCell, TableHead, TableRow, Box, IconButton,
//   Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField,
//   MenuItem, Stack, TableContainer, Avatar, Typography, Grid, Chip,
// } from '@mui/material';
// import { Add, Edit } from '@mui/icons-material';
// import { driverService } from '../services/api';
// import { StatusChip, PageHeader, EmptyState } from '../components/Common';
// import { useAuth } from '../context/AuthContext';

// const statuses = ['AVAILABLE', 'ON_TRIP', 'ON_LEAVE', 'SUSPENDED', 'INACTIVE'];
// const emptyForm = {
//   name: '', mobile: '', alternateMobile: '', licenseNumber: '',
//   licenseExpiry: '', address: '', emergencyContact: '',
//   experienceYears: '', status: 'AVAILABLE',
// };

// export default function DriversPage() {
//   const { hasPermission } = useAuth();
//   const [drivers, setDrivers] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [dialogOpen, setDialogOpen] = useState(false);
//   const [selected, setSelected] = useState(null);
//   const [form, setForm] = useState(emptyForm);
//   const [saving, setSaving] = useState(false);
//   const [error, setError] = useState('');

//   const fetchDrivers = useCallback(async () => {
//     setLoading(true);
//     try {
//       const res = await driverService.getAll({ limit: 100 });
//       const d = res.data?.data ?? res.data;
//       setDrivers(d?.items ?? (Array.isArray(d) ? d : []));
//     } catch {}
//     setLoading(false);
//   }, []);

//   useEffect(() => { fetchDrivers(); }, [fetchDrivers]);

//   const openCreate = () => {
//     setSelected(null);
//     setForm(emptyForm);
//     setError('');
//     setDialogOpen(true);
//   };

//   const openEdit = (driver) => {
//     setSelected(driver);
//     setForm({
//       name: driver.name || '',
//       mobile: driver.mobile || '',
//       alternateMobile: driver.alternateMobile || '',
//       licenseNumber: driver.licenseNumber || '',
//       licenseExpiry: driver.licenseExpiry ? driver.licenseExpiry.split('T')[0] : '',
//       address: driver.address || '',
//       emergencyContact: driver.emergencyContact || '',
//       experienceYears: driver.experienceYears ?? '',
//       status: driver.status || 'AVAILABLE',
//     });
//     setError('');
//     setDialogOpen(true);
//   };

//   const handleSave = async () => {
//     if (!form.name || !form.mobile || !form.licenseNumber) {
//       setError('Name, Mobile, and License Number are required');
//       return;
//     }
//     setSaving(true);
//     setError('');
//     try {
//       const payload = {
//         ...form,
//         experienceYears: form.experienceYears !== '' ? Number(form.experienceYears) : undefined,
//         licenseExpiry: form.licenseExpiry || undefined,
//         alternateMobile: form.alternateMobile || undefined,
//         address: form.address || undefined,
//         emergencyContact: form.emergencyContact || undefined,
//       };
//       if (selected) {
//         await driverService.update(selected.id, payload);
//       } else {
//         await driverService.create(payload);
//       }
//       setDialogOpen(false);
//       fetchDrivers();
//     } catch (err) {
//       setError(err.response?.data?.message || 'Failed to save driver');
//     }
//     setSaving(false);
//   };

//   return (
//     <Box>
//       <PageHeader
//         title="Drivers"
//         subtitle="Manage your drivers"
//         action={hasPermission('driver_create') ? (
//           <Button variant="contained" startIcon={<Add />} onClick={openCreate}>Add Driver</Button>
//         ) : null}
//       />
//       <TableContainer>
//         <Table>
//           <TableHead>
//             <TableRow>
//               {['Name', 'Mobile', 'License', 'Experience', 'Status', ''].map((h) => <TableCell key={h}>{h}</TableCell>)}
//             </TableRow>
//           </TableHead>
//           <TableBody>
//             {loading ? (
//               <TableRow><TableCell colSpan={6} align="center" sx={{ py: 6, color: 'text.secondary' }}>Loading...</TableCell></TableRow>
//             ) : drivers.length === 0 ? (
//               <TableRow><TableCell colSpan={6}><EmptyState icon="👤" title="No drivers" description="Add your first driver to get started" action={<Button variant="contained" startIcon={<Add />} onClick={openCreate}>Add Driver</Button>} /></TableCell></TableRow>
//             ) : drivers.map((d) => (
//               <TableRow key={d.id} hover>
//                 <TableCell>
//                   <Stack direction="row" alignItems="center" spacing={1.5}>
//                     <Avatar sx={{ width: 32, height: 32, bgcolor: '#7C6FF718', color: '#7C6FF7', fontSize: '0.75rem' }}>
//                       {(d.name || '?')[0].toUpperCase()}
//                     </Avatar>
//                     <Box>
//                       <Typography variant="body2" sx={{ fontWeight: 600 }}>{d.name}</Typography>
//                       {d.address && <Typography variant="caption" color="text.secondary">{d.address}</Typography>}
//                     </Box>
//                   </Stack>
//                 </TableCell>
//                 <TableCell>
//                   <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>{d.mobile}</Typography>
//                   {d.alternateMobile && <Typography variant="caption" color="text.secondary" display="block">{d.alternateMobile}</Typography>}
//                 </TableCell>
//                 <TableCell>
//                   <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.82rem' }}>{d.licenseNumber}</Typography>
//                   {d.licenseExpiry && <Typography variant="caption" color="text.secondary" display="block">Exp: {new Date(d.licenseExpiry).toLocaleDateString()}</Typography>}
//                 </TableCell>
//                 <TableCell>{d.experienceYears ? `${d.experienceYears} yrs` : '—'}</TableCell>
//                 <TableCell><StatusChip status={d.status} /></TableCell>
//                 <TableCell>
//                   {hasPermission('driver_update') && (
//                     <IconButton size="small" onClick={() => openEdit(d)}><Edit fontSize="small" /></IconButton>
//                   )}
//                 </TableCell>
//               </TableRow>
//             ))}
//           </TableBody>
//         </Table>
//       </TableContainer>

//       <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
//         <DialogTitle>{selected ? 'Edit Driver' : 'Add Driver'}</DialogTitle>
//         <DialogContent>
//           {error && <Typography color="error" variant="body2" sx={{ mb: 2, mt: 1 }}>{error}</Typography>}
//           <Stack spacing={2.5} mt={1}>
//             <TextField label="Full Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} fullWidth required />
//             <Grid container spacing={2}>
//               <Grid item xs={6}>
//                 <TextField label="Mobile *" value={form.mobile} onChange={(e) => setForm({ ...form, mobile: e.target.value })} fullWidth required />
//               </Grid>
//               <Grid item xs={6}>
//                 <TextField label="Alternate Mobile" value={form.alternateMobile} onChange={(e) => setForm({ ...form, alternateMobile: e.target.value })} fullWidth />
//               </Grid>
//             </Grid>
//             <Grid container spacing={2}>
//               <Grid item xs={6}>
//                 <TextField label="License Number *" value={form.licenseNumber} onChange={(e) => setForm({ ...form, licenseNumber: e.target.value })} fullWidth required />
//               </Grid>
//               <Grid item xs={6}>
//                 <TextField label="License Expiry" value={form.licenseExpiry} onChange={(e) => setForm({ ...form, licenseExpiry: e.target.value })} type="date" InputLabelProps={{ shrink: true }} fullWidth />
//               </Grid>
//             </Grid>
//             <TextField label="Experience (years)" value={form.experienceYears} onChange={(e) => setForm({ ...form, experienceYears: e.target.value })} type="number" fullWidth />
//             <TextField label="Address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} fullWidth multiline rows={2} />
//             <TextField label="Emergency Contact" value={form.emergencyContact} onChange={(e) => setForm({ ...form, emergencyContact: e.target.value })} fullWidth />
//             <TextField label="Status" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} select fullWidth>
//               {statuses.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
//             </TextField>
//           </Stack>
//         </DialogContent>
//         <DialogActions sx={{ px: 3, pb: 2 }}>
//           <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
//           <Button variant="contained" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save'}</Button>
//         </DialogActions>
//       </Dialog>
//     </Box>
//   );
// }



import React, { useEffect, useState, useCallback } from 'react';
import {
  Table, TableBody, TableCell, TableHead, TableRow, Box, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField,
  MenuItem, Stack, TableContainer, Avatar, Typography, Grid, Chip,
} from '@mui/material';
import { Add, Edit } from '@mui/icons-material';
import { driverService } from '../services/api';
import { StatusChip, PageHeader, EmptyState } from '../components/Common';
import { useAuth } from '../context/AuthContext';

const statuses = ['AVAILABLE', 'ON_TRIP', 'ON_LEAVE', 'SUSPENDED', 'INACTIVE'];
const emptyForm = {
  name: '', mobile: '', alternateMobile: '', licenseNumber: '',
  licenseExpiry: '', address: '', emergencyContact: '',
  experienceYears: '', status: 'AVAILABLE',
};

export default function DriversPage() {
  const { hasPermission } = useAuth();
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const fetchDrivers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await driverService.getAll({ limit: 100 });
      const d = res.data?.data ?? res.data;
      setDrivers(d?.items ?? (Array.isArray(d) ? d : []));
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { fetchDrivers(); }, [fetchDrivers]);

  const openCreate = () => {
    setSelected(null);
    setForm(emptyForm);
    setError('');
    setDialogOpen(true);
  };

  const openEdit = (driver) => {
    setSelected(driver);
    setForm({
      name: driver.name || '',
      mobile: driver.mobile || '',
      alternateMobile: driver.alternateMobile || '',
      licenseNumber: driver.licenseNumber || '',
      licenseExpiry: driver.licenseExpiry ? driver.licenseExpiry.split('T')[0] : '',
      address: driver.address || '',
      emergencyContact: driver.emergencyContact || '',
      experienceYears: driver.experienceYears ?? '',
      status: driver.status || 'AVAILABLE',
    });
    setError('');
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.mobile || !form.licenseNumber) {
      setError('Name, Mobile, and License Number are required');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const payload = {
        ...form,
        experienceYears: form.experienceYears !== '' ? Number(form.experienceYears) : undefined,
        licenseExpiry: form.licenseExpiry || undefined,
        alternateMobile: form.alternateMobile || undefined,
        address: form.address || undefined,
        emergencyContact: form.emergencyContact || undefined,
      };
      if (selected) {
        await driverService.update(selected.id, payload);
      } else {
        await driverService.create(payload);
      }
      setDialogOpen(false);
      fetchDrivers();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save driver');
    }
    setSaving(false);
  };

  return (
    <Box
      sx={{
        fontFamily: "'Nunito', sans-serif",
        "& .MuiTypography-root": { fontFamily: "'Nunito', sans-serif" },
        "& .MuiButton-root": { fontFamily: "'Nunito', sans-serif" },
        "& .MuiInputBase-input": { fontFamily: "'Nunito', sans-serif" },
        "& .MuiInputLabel-root": { fontFamily: "'Nunito', sans-serif" },
        "& .MuiTableCell-root": { fontFamily: "'Nunito', sans-serif" },
        "& .MuiMenuItem-root": { fontFamily: "'Nunito', sans-serif" },
        "& .MuiChip-label": { fontFamily: "'Nunito', sans-serif" },
        "& *": { fontFamily: "'Nunito', sans-serif" }
      }}
    >
      <PageHeader
        title="Drivers"
        subtitle="Manage your drivers"
        action={hasPermission('driver_create') ? (
          <Button variant="contained" startIcon={<Add />} onClick={openCreate}>Add Driver</Button>
        ) : null}
      />
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              {['Name', 'Mobile', 'License', 'Experience', 'Status', ''].map((h) => <TableCell key={h}>{h}</TableCell>)}
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={6} align="center" sx={{ py: 6, color: 'text.secondary' }}>Loading...</TableCell></TableRow>
            ) : drivers.length === 0 ? (
              <TableRow><TableCell colSpan={6}><EmptyState icon="👤" title="No drivers" description="Add your first driver to get started" action={<Button variant="contained" startIcon={<Add />} onClick={openCreate}>Add Driver</Button>} /></TableCell></TableRow>
            ) : drivers.map((d) => (
              <TableRow key={d.id} hover>
                <TableCell>
                  <Stack direction="row" alignItems="center" spacing={1.5}>
                    <Avatar sx={{ width: 32, height: 32, bgcolor: '#7C6FF718', color: '#7C6FF7', fontSize: '0.75rem' }}>
                      {(d.name || '?')[0].toUpperCase()}
                    </Avatar>
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>{d.name}</Typography>
                      {d.address && <Typography variant="caption" color="text.secondary">{d.address}</Typography>}
                    </Box>
                  </Stack>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>{d.mobile}</Typography>
                  {d.alternateMobile && <Typography variant="caption" color="text.secondary" display="block">{d.alternateMobile}</Typography>}
                </TableCell>
                <TableCell>
                  <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.82rem' }}>{d.licenseNumber}</Typography>
                  {d.licenseExpiry && <Typography variant="caption" color="text.secondary" display="block">Exp: {new Date(d.licenseExpiry).toLocaleDateString()}</Typography>}
                </TableCell>
                <TableCell>{d.experienceYears ? `${d.experienceYears} yrs` : '—'}</TableCell>
                <TableCell><StatusChip status={d.status} /></TableCell>
                <TableCell>
                  {hasPermission('driver_update') && (
                    <IconButton size="small" onClick={() => openEdit(d)}><Edit fontSize="small" /></IconButton>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog 
        open={dialogOpen} 
        onClose={() => setDialogOpen(false)} 
        maxWidth="sm" 
        fullWidth
        PaperProps={{
          sx: {
            "& .MuiDialogTitle-root": { fontFamily: "'Nunito', sans-serif" },
            "& .MuiTypography-root": { fontFamily: "'Nunito', sans-serif" },
            "& .MuiButton-root": { fontFamily: "'Nunito', sans-serif" },
            "& .MuiInputBase-input": { fontFamily: "'Nunito', sans-serif" },
            "& .MuiInputLabel-root": { fontFamily: "'Nunito', sans-serif" },
            "& .MuiMenuItem-root": { fontFamily: "'Nunito', sans-serif" },
          }
        }}
      >
        <DialogTitle>{selected ? 'Edit Driver' : 'Add Driver'}</DialogTitle>
        <DialogContent>
          {error && <Typography color="error" variant="body2" sx={{ mb: 2, mt: 1 }}>{error}</Typography>}
          <Stack spacing={2.5} mt={1}>
            <TextField label="Full Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} fullWidth required />
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField label="Mobile *" value={form.mobile} onChange={(e) => setForm({ ...form, mobile: e.target.value })} fullWidth required />
              </Grid>
              <Grid item xs={6}>
                <TextField label="Alternate Mobile" value={form.alternateMobile} onChange={(e) => setForm({ ...form, alternateMobile: e.target.value })} fullWidth />
              </Grid>
            </Grid>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField label="License Number *" value={form.licenseNumber} onChange={(e) => setForm({ ...form, licenseNumber: e.target.value })} fullWidth required />
              </Grid>
              <Grid item xs={6}>
                <TextField label="License Expiry" value={form.licenseExpiry} onChange={(e) => setForm({ ...form, licenseExpiry: e.target.value })} type="date" InputLabelProps={{ shrink: true }} fullWidth />
              </Grid>
            </Grid>
            <TextField label="Experience (years)" value={form.experienceYears} onChange={(e) => setForm({ ...form, experienceYears: e.target.value })} type="number" fullWidth />
            <TextField label="Address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} fullWidth multiline rows={2} />
            <TextField label="Emergency Contact" value={form.emergencyContact} onChange={(e) => setForm({ ...form, emergencyContact: e.target.value })} fullWidth />
            <TextField label="Status" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} select fullWidth>
              {statuses.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
            </TextField>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save'}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
