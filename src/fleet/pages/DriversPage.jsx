import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Card, Typography, Table, TableBody, TableCell, TableRow, TableHead,
  Chip, IconButton, CircularProgress, Button, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, Avatar, Snackbar, Alert, MenuItem, useTheme, useMediaQuery, Divider, Grid, Tabs, Tab, Checkbox, FormControlLabel,
  Stepper, Step, StepLabel, StepContent
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { ConfirmDialog } from '../components/Common';
import PeopleIcon from '@mui/icons-material/People';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import SearchIcon from '@mui/icons-material/Search';
import PhoneIcon from '@mui/icons-material/Phone';
import BadgeIcon from '@mui/icons-material/Badge';
import HomeIcon from '@mui/icons-material/Home';
import PhoneIphoneIcon from '@mui/icons-material/PhoneIphone';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import EventIcon from '@mui/icons-material/Event';
import WorkOutlineIcon from '@mui/icons-material/WorkOutline';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import DownloadIcon from '@mui/icons-material/Download';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import AssignmentIcon from '@mui/icons-material/Assignment';

import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';



export default function DriversPage() {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [editDriver, setEditDriver] = useState(null);
  const [viewDriver, setViewDriver] = useState(null);
  const [profileTab, setProfileTab] = useState(0);
  const [form, setForm] = useState({ name: '', mobile: '', alternateMobile: '', address: '', emergencyContact: '', licenseNumber: '', licenseExpiry: '', experience: '', status: 'AVAILABLE', userId: '' });
  const [createTab, setCreateTab] = useState(0);
  const [documents, setDocuments] = useState([]);
  const [accountForm, setAccountForm] = useState({ create: false, email: '', username: '', password: '' });
  const [docCategory, setDocCategory] = useState('License');
  const [viewDocuments, setViewDocuments] = useState([]);
  const [error, setError] = useState('');
  const [snack, setSnack] = useState({ open: false, msg: '', severity: 'success' });
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, driver: null });
  const [deleteDocConfirm, setDeleteDocConfirm] = useState({ open: false, doc: null });
  const [viewVehicles, setViewVehicles] = useState([]);
  const [viewProfileLink, setViewProfileLink] = useState(null);
  const [linkForm, setLinkForm] = useState({ mode: 'none', email: '', username: '', password: '', name: '', userId: '' });
  const [users, setUsers] = useState([]);
  const [stepErrors, setStepErrors] = useState({});
  const { hasPermission } = useAuth();
  const { addNotification } = useNotification();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const navigate = useNavigate();

  const validateStep = (step) => {
    const errs = {};
    if (step === 0) {
      if (!form.name.trim()) errs.name = 'Name is required';
      if (!form.mobile.trim()) errs.mobile = 'Mobile is required';
    } else if (step === 1) {
      if (!form.licenseNumber.trim()) errs.licenseNumber = 'License number is required';
      if (!form.licenseExpiry) errs.licenseExpiry = 'License expiry is required';
    } else if (step === 3) {
      if (accountForm.create) {
        if (!accountForm.email.trim()) errs.email = 'Email is required';
        else if (!/\S+@\S+\.\S+/.test(accountForm.email)) errs.email = 'Invalid email format';
        if (!accountForm.password.trim()) errs.password = 'Password is required';
        else if (accountForm.password.length < 6) errs.password = 'Password must be at least 6 characters';
      }
    }
    return errs;
  };

  const handleStepNext = () => {
    const errs = validateStep(createTab);
    setStepErrors(errs);
    if (Object.keys(errs).length === 0) {
      setCreateTab(prev => prev + 1);
    }
  };

  const handleStepBack = () => {
    setStepErrors({});
    setCreateTab(prev => prev - 1);
  };

  const fetchUsers = useCallback(async () => {
    try {
      const res = await api.get('/users');
      setUsers(Array.isArray(res.data) ? res.data : (res.data?.data || []));
    } catch (err) { console.error('Failed to fetch users', err); }
  }, []);

  const checkExistingUserForDriver = async (searchStr, isLinkMode = false) => {
    if (!searchStr) return;
    try {
      const res = await api.get('/users', { params: { search: searchStr } });
      const items = res.data?.data?.items || res.data?.items || [];
      const match = items.find(u =>
        ((isLinkMode ? linkForm.email : accountForm.email) && u.email?.toLowerCase() === (isLinkMode ? linkForm.email : accountForm.email).toLowerCase()) ||
        ((isLinkMode ? linkForm.username : accountForm.username) && u.username?.toLowerCase() === (isLinkMode ? linkForm.username : accountForm.username).toLowerCase())
      );
      if (match) {
        if (isLinkMode) {
          setLinkForm(prev => ({ ...prev, mode: 'link', userId: match.id || match._id }));
        } else {
          setAccountForm(prev => ({ ...prev, create: false }));
          setForm(prev => ({ ...prev, userId: match.id || match._id }));
        }
        setSnack({ open: true, msg: 'Account already exists. Switched to Link mode and loaded details.', severity: 'info' });
        fetchUsers();
      }
    } catch (err) {
      console.error('Failed to check existing user:', err);
    }
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/drivers', { params: { limit: 100 } });
      const items = res.data?.data?.items ?? (Array.isArray(res.data?.data) ? res.data.data : []);
      setDrivers(items || []);
    } catch (err) { console.error(err); setDrivers([]); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); fetchUsers(); }, [fetchData, fetchUsers]);

  useEffect(() => {
    if (viewDriver && (viewDriver.id || viewDriver._id)) {
      const driverId = viewDriver.id || viewDriver._id;
      api.get('/documents', { params: { driverId, limit: 100 } })
        .then(res => {
          const items = res.data?.data?.items ?? (Array.isArray(res.data?.data) ? res.data.data : []);
          setViewDocuments(items || []);
        })
        .catch(err => console.error('Failed to fetch docs:', err));
    } else {
      setViewDocuments([]);
    }
  }, [viewDriver]);

  useEffect(() => {
    if (viewDriver && (viewDriver.id || viewDriver._id)) {
      const driverId = viewDriver.id || viewDriver._id;
      api.get('/vehicles', { params: { limit: 100 } })
        .then(res => {
          const items = res.data?.data?.items ?? (Array.isArray(res.data?.data) ? res.data.data : []);
          const assigned = (items || []).filter(v => v.currentDriverId === driverId);
          setViewVehicles(assigned);
        })
        .catch(() => setViewVehicles([]));
    } else {
      setViewVehicles([]);
    }
  }, [viewDriver]);

  useEffect(() => {
    if (viewDriver && (viewDriver.id || viewDriver._id)) {
      const driverId = viewDriver.id || viewDriver._id;
      api.get('/user-profile-links', { params: { profileId: driverId, limit: 10 } })
        .then(res => {
          const items = res.data?.data?.items ?? (Array.isArray(res.data?.data) ? res.data.data : []);
          const activeLink = (items || []).find(l => l.status === 'ACTIVE' && l.profileType === 'DRIVER');
          setViewProfileLink(activeLink || null);
        })
        .catch(() => setViewProfileLink(null));
    } else {
      setViewProfileLink(null);
    }
    setLinkForm({ mode: 'none', email: '', password: '', name: '', userId: '' });
  }, [viewDriver]);

  const handleSave = async () => {
    setError('');
    if (!form.name || !form.mobile || !form.licenseNumber) {
      setError('Name, Mobile Number, and License Number are mandatory.');
      setCreateTab(form.name ? 1 : 0); // focus on missing tab
      return;
    }
    if (accountForm.create && (!accountForm.email || !accountForm.password)) {
      setError('Email and Password are required to create an account.');
      setCreateTab(3);
      return;
    }

    try {
      let finalUserId = form.userId;

      // 1. Create User if requested
      if (accountForm.create) {
        const rolesRes = await api.get('/roles');
        const allRoles = rolesRes.data?.data?.items ?? (Array.isArray(rolesRes.data?.data) ? rolesRes.data.data : (Array.isArray(rolesRes.data) ? rolesRes.data : []));
        const driverRole = allRoles.find(r => r.key === 'driver' || r.name === 'Driver');
        const usernameSlug = accountForm.username || accountForm.email.split('@')[0].toLowerCase().replace(/[^a-z0-9._-]/g, '');
        const userRes = await api.post('/users', {
          name: form.name,
          email: accountForm.email,
          username: usernameSlug,
          password: accountForm.password,
          roleId: driverRole?.id || '',
          status: 'ACTIVE'
        });
        finalUserId = userRes.data?.data?.id || userRes.data?.id || userRes.data?._id;
      }

      // 2. Prepare Driver Payload
      const payload = {
        name: form.name,
        mobile: form.mobile,
        licenseNumber: form.licenseNumber,
        status: form.status
      };
      if (form.alternateMobile) payload.alternateMobile = form.alternateMobile;
      if (form.address) payload.address = form.address;
      if (form.emergencyContact) payload.emergencyContact = form.emergencyContact;
      if (form.licenseExpiry) payload.licenseExpiry = new Date(form.licenseExpiry).toISOString();
      if (form.experience) payload.experienceYears = Number(form.experience);
      if (finalUserId) { payload.userId = finalUserId; payload.user_id = finalUserId; }

      let driverId;
      if (editDriver) {
        driverId = editDriver.id || editDriver._id;
        await api.patch(`/drivers/${driverId}`, payload);
        setSnack({ open: true, msg: 'Driver updated', severity: 'success' });
      } else {
        const res = await api.post('/drivers', payload);
        driverId = res.data?.data?.id || res.data?.id || res.data?._id;
        setSnack({ open: true, msg: 'Driver created', severity: 'success' });
      }

      // 3. Upload Documents
      if (documents.length > 0 && driverId) {
        const docTypeMap = {
          'License': 'DRIVER_LICENSE',
          'ID Proof': 'ID_PROOF',
          'Medical Certificate': 'MEDICAL_CERTIFICATE',
          'Background Check': 'BACKGROUND_CHECK',
          'Other': 'OTHER',
        };
        for (const doc of documents) {
          const formData = new FormData();
          formData.append('file', doc.file);
          formData.append('title', doc.file.name);
          formData.append('documentType', docTypeMap[doc.category] || doc.category);
          formData.append('documentCategory', 'DRIVER');
          formData.append('driverId', driverId);
          formData.append('linkedEntityType', 'DRIVER');
          formData.append('linkedEntityId', driverId);
          await api.post('/documents/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
        }
      }

      addNotification('Success', 'Driver saved successfully', 'success');
      setOpenDialog(false);
      setEditDriver(null);
      fetchData();
    } catch (err) {
      console.error(err);
      let errMsg = err.response?.data?.message || 'Failed to save driver.';
      if (err.response?.data?.errors) {
        errMsg = Array.isArray(err.response.data.errors)
          ? err.response.data.errors.map(e => e.msg || e.message || JSON.stringify(e)).join(', ')
          : JSON.stringify(err.response.data.errors);
      }
      setError(`Error: ${errMsg}`);
      addNotification('Error', 'Failed to save driver', 'error');
    }
  };

  const handleDeleteClick = (d) => {
    setDeleteConfirm({ open: true, driver: d });
  };

  const handleConfirmDelete = async () => {
    const d = deleteConfirm.driver;
    if (!d) return;
    try {
      await api.delete(`/drivers/${d.id || d._id}`);
      setSnack({ open: true, msg: 'Driver deleted successfully', severity: 'success' });
      addNotification('Deleted', 'Driver deleted successfully', 'warning');
      fetchData();
    } catch (err) {
      console.error(err);
      setSnack({ open: true, msg: err.response?.data?.message || 'Failed to delete driver', severity: 'error' });
      addNotification('Error', 'Failed to delete driver', 'error');
    } finally {
      setDeleteConfirm({ open: false, driver: null });
    }
  };

  const handleEdit = (d) => {
    setEditDriver(d);
    setForm({ name: d.name || '', mobile: d.mobile || d.phone || '', alternateMobile: d.alternateMobile || '', address: d.address || '', emergencyContact: d.emergencyContact || '', licenseNumber: d.licenseNumber || d.license_no || '', licenseExpiry: d.licenseExpiry || d.license_expiry ? (d.licenseExpiry || d.license_expiry).split('T')[0] : '', experience: d.experienceYears || d.experience || '', status: d.status || 'AVAILABLE', userId: d.userId || d.user_id || '' });
    setCreateTab(0);
    setDocuments([]);
    setAccountForm({ create: false, email: '', password: '' });
    setError('');
    setOpenDialog(true);
  };

  const handleDeleteDocument = async () => {
    const doc = deleteDocConfirm.doc;
    if (!doc) return;
    try {
      await api.delete(`/documents/${doc.id || doc._id}`);
      setSnack({ open: true, msg: 'Document deleted successfully', severity: 'success' });
      addNotification('Deleted', 'Document deleted successfully', 'warning');
      setViewDocuments(prev => prev.filter(d => d.id !== doc.id && d._id !== doc._id));
    } catch (err) {
      console.error(err);
      setSnack({ open: true, msg: err.response?.data?.message || 'Failed to delete document', severity: 'error' });
    } finally {
      setDeleteDocConfirm({ open: false, doc: null });
    }
  };

  const handleCreateAndLink = async () => {
    const driverId = viewDriver?.id || viewDriver?._id;
    if (!linkForm.email || !linkForm.password || !linkForm.name) {
      setSnack({ open: true, msg: 'Name, email and password are required', severity: 'warning' });
      return;
    }
    try {
      const rolesRes = await api.get('/roles');
      const allRoles = rolesRes.data?.data?.items ?? (Array.isArray(rolesRes.data?.data) ? rolesRes.data.data : (Array.isArray(rolesRes.data) ? rolesRes.data : []));
      const driverRole = allRoles.find(r => r.key === 'driver' || r.name === 'Driver');
      const usernameSlug = linkForm.username || linkForm.email.split('@')[0].toLowerCase().replace(/[^a-z0-9._-]/g, '');
      const userRes = await api.post('/users', {
        name: linkForm.name,
        email: linkForm.email,
        username: usernameSlug,
        password: linkForm.password,
        roleId: driverRole?.id || '',
        status: 'ACTIVE'
      });
      const userId = userRes.data?.data?.id || userRes.data?.id;
      await api.post('/user-profile-links', {
        userId,
        profileType: 'DRIVER',
        profileId: driverId,
        isPrimary: true
      });
      setSnack({ open: true, msg: 'User account created and linked successfully', severity: 'success' });
      addNotification('Linked', 'Driver account created and linked', 'success');
      const linkRes = await api.get('/user-profile-links', { params: { profileId: driverId, limit: 10 } });
      const items = linkRes.data?.data?.items ?? [];
      const activeLink = items.find(l => l.status === 'ACTIVE' && l.profileType === 'DRIVER');
      setViewProfileLink(activeLink || null);
      setLinkForm({ mode: 'none', email: '', password: '', name: '', userId: '' });
      fetchData();
    } catch (err) {
      console.error(err);
      const errMsg = err.response?.data?.message || err.response?.data?.errors?.join(', ') || 'Failed to create and link account';
      setSnack({ open: true, msg: errMsg, severity: 'error' });
    }
  };

  const handleLinkExisting = async () => {
    const driverId = viewDriver?.id || viewDriver?._id;
    if (!linkForm.userId) {
      setSnack({ open: true, msg: 'Please select a user to link', severity: 'warning' });
      return;
    }
    try {
      await api.post('/user-profile-links', {
        userId: linkForm.userId,
        profileType: 'DRIVER',
        profileId: driverId,
        isPrimary: true
      });
      setSnack({ open: true, msg: 'User linked to driver successfully', severity: 'success' });
      addNotification('Linked', 'User account linked to driver', 'success');
      const linkRes = await api.get('/user-profile-links', { params: { profileId: driverId, limit: 10 } });
      const items = linkRes.data?.data?.items ?? [];
      const activeLink = items.find(l => l.status === 'ACTIVE' && l.profileType === 'DRIVER');
      setViewProfileLink(activeLink || null);
      setLinkForm({ mode: 'none', email: '', password: '', name: '', userId: '' });
    } catch (err) {
      console.error(err);
      const errMsg = err.response?.data?.message || 'Failed to link account';
      setSnack({ open: true, msg: errMsg, severity: 'error' });
    }
  };

  const filtered = drivers.filter(d => {
    const q = search.toLowerCase();
    return (d.name || '').toLowerCase().includes(q) || (d.mobile || d.phone || '').includes(q);
  });

  return (
    <Box>
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: { xs: 'flex-start', sm: 'center' }, justifyContent: 'flex-end', mb: 3, gap: 2 }}>
        <Box sx={{ display: 'flex', gap: 1, width: { xs: '100%', sm: 'auto' } }}>
          <TextField size="small" placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)}
            InputProps={{ startAdornment: <SearchIcon sx={{ fontSize: 18, mr: 0.5, color: 'text.primary' }} /> }}
            sx={{ flex: 1, width: { xs: '100%', sm: 200 }, '& .MuiOutlinedInput-root': { bgcolor: 'background.paper', '& fieldset': { borderColor: '#3a3a42' } } }} />
          {hasPermission('driver_create') && <Button variant="contained" startIcon={<AddIcon />} onClick={() => { setEditDriver(null); setForm({ name: '', mobile: '', alternateMobile: '', address: '', emergencyContact: '', licenseNumber: '', licenseExpiry: '', experience: '', status: 'AVAILABLE', userId: '' }); setCreateTab(0); setDocuments([]); setAccountForm({ create: false, email: '', password: '' }); setError(''); setOpenDialog(true); }}
            sx={{ backgroundColor: '#1976d2', flex: { xs: 1, sm: 'none' } }}>Add Driver</Button>}
        </Box>
      </Box>

      <Card sx={{ p: 0, overflowX: 'auto', maxHeight: 500, overflowY: 'auto', '&::-webkit-scrollbar': { width: 0, height: 0 } }}>
        {loading ? <Box sx={{ p: 4, textAlign: 'center' }}><CircularProgress /></Box> : (
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                {['Driver', 'Mobile', 'License', 'Status', 'Actions'].map(h => (
                  <TableCell key={h} sx={{ fontWeight: 700, color: '#fff', fontSize: '0.85rem', textTransform: 'uppercase', bgcolor: '#1976d2' }}>{h}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.map((d, i) => (
                <TableRow key={i} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Avatar sx={{ width: 32, height: 32, bgcolor: '#1976d2', fontSize: '0.8rem' }}>{(d.name || 'U')[0]}</Avatar>
                      <Typography sx={{ fontWeight: 600, fontSize: '0.85rem' }}>{d.name}</Typography>
                    </Box>
                  </TableCell>
                  <TableCell sx={{ fontSize: '0.85rem' }}>{d.mobile || d.phone || '—'}</TableCell>
                  <TableCell sx={{ fontSize: '0.85rem', color: 'text.primary' }}>{d.licenseNumber || '—'}</TableCell>
                  <TableCell>
                    <Chip label={(d.status || 'AVAILABLE').toUpperCase()} size="small"
                      color={(d.status === 'AVAILABLE' || d.status === 'active' || !d.status) ? 'success' : 'default'}
                      sx={{ fontSize: '0.65rem', fontWeight: 700 }} />
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', flexWrap: 'nowrap', gap: 0.5 }}>
                      <IconButton size="small" onClick={() => setViewDriver(d)} sx={{ bgcolor: '#3b82f615', color: '#3b82f6', '&:hover': { bgcolor: '#3b82f630' } }}><VisibilityIcon sx={{ fontSize: 17 }}  /></IconButton>
                      <IconButton size="small" onClick={() => handleEdit(d)} sx={{ bgcolor: '#3b82f615', color: '#3b82f6', '&:hover': { bgcolor: '#3b82f630' } }}><EditIcon sx={{ fontSize: 17 }}  /></IconButton>
                      <IconButton size="small" onClick={() => handleDeleteClick(d)} sx={{ bgcolor: '#ef444415', color: '#ef4444', '&:hover': { bgcolor: '#ef444430' } }}><DeleteIcon sx={{ fontSize: 17 }}  /></IconButton>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && <TableRow><TableCell colSpan={7} align="center" sx={{ py: 4, color: 'text.primary' }}>No drivers found</TableCell></TableRow>}
            </TableBody>
          </Table>
        )}
      </Card>

      {/* ── Add Driver Dialog (Stepper Wizard) ── */}
      <Dialog open={openDialog && !editDriver} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth fullScreen={isMobile}>
        <DialogTitle sx={{ bgcolor: 'background.paper', color: 'text.primary' }}>Add New Driver</DialogTitle>
        <DialogContent sx={{ bgcolor: 'background.paper', p: 3, minHeight: 450 }}>
          <Stepper activeStep={createTab} orientation="vertical" sx={{ mt: 1 }}>
            <Step>
              <StepLabel error={Boolean(stepErrors.name || stepErrors.mobile)}>Personal Info</StepLabel>
              <StepContent>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField label="Full Name *" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                      fullWidth size="small" error={Boolean(stepErrors.name)} helperText={stepErrors.name} />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField label="Mobile Number *" value={form.mobile} onChange={e => setForm({ ...form, mobile: e.target.value })}
                      fullWidth size="small" error={Boolean(stepErrors.mobile)} helperText={stepErrors.mobile} />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField label="Alternate Mobile" value={form.alternateMobile} onChange={e => setForm({ ...form, alternateMobile: e.target.value })} fullWidth size="small" />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField label="Emergency Contact" value={form.emergencyContact} onChange={e => setForm({ ...form, emergencyContact: e.target.value })} fullWidth size="small" />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField label="Address" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} fullWidth size="small" multiline rows={2} />
                  </Grid>
                </Grid>
              </StepContent>
            </Step>

            <Step>
              <StepLabel error={Boolean(stepErrors.licenseNumber || stepErrors.licenseExpiry)}>License Details</StepLabel>
              <StepContent>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField label="License Number *" value={form.licenseNumber} onChange={e => setForm({ ...form, licenseNumber: e.target.value })}
                      fullWidth size="small" error={Boolean(stepErrors.licenseNumber)} helperText={stepErrors.licenseNumber} />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField label="License Expiry *" type="date" InputLabelProps={{ shrink: true }} value={form.licenseExpiry} onChange={e => setForm({ ...form, licenseExpiry: e.target.value })}
                      fullWidth size="small" error={Boolean(stepErrors.licenseExpiry)} helperText={stepErrors.licenseExpiry} />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField label="Experience (Years)" type="number" value={form.experience} onChange={e => setForm({ ...form, experience: e.target.value })} fullWidth size="small" />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField label="Status" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} fullWidth size="small" select>
                      {['AVAILABLE', 'ON_TRIP', 'ON_LEAVE', 'SUSPENDED', 'INACTIVE'].map(s => (
                        <MenuItem key={s} value={s}>{s}</MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                </Grid>
              </StepContent>
            </Step>

            <Step>
              <StepLabel>Documents</StepLabel>
              <StepContent>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" gutterBottom sx={{ color: 'text.secondary' }}>Upload Documents</Typography>
                    <TextField label="Document Type" select value={docCategory} onChange={e => setDocCategory(e.target.value)} fullWidth size="small" sx={{ mb: 2 }}>
                      {['License', 'ID Proof', 'Medical Certificate', 'Background Check', 'Other'].map(c => (
                        <MenuItem key={c} value={c}>{c}</MenuItem>
                      ))}
                    </TextField>
                    <Box sx={{ border: '1px dashed', borderColor: 'divider', borderRadius: 2, p: 3, textAlign: 'center', bgcolor: '#f9fafb' }}>
                      <Button variant="outlined" startIcon={<FileUploadIcon />} component="label">
                        Select File
                        <input type="file" hidden accept="image/*,.pdf" onChange={e => {
                          if (e.target.files[0]) {
                            setDocuments([...documents, { category: docCategory, file: e.target.files[0] }]);
                            e.target.value = null;
                          }
                        }} />
                      </Button>
                    </Box>
                    {documents.length > 0 && (
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="body2" color="text.secondary" gutterBottom>Selected Files:</Typography>
                        {documents.map((d, i) => (
                          <Chip key={i} label={`${d.category}: ${d.file.name}`} onDelete={() => setDocuments(documents.filter((_, idx) => idx !== i))} sx={{ m: 0.5 }} />
                        ))}
                      </Box>
                    )}
                  </Grid>
                </Grid>
              </StepContent>
            </Step>

            <Step>
              <StepLabel error={Boolean(stepErrors.email || stepErrors.password)}>Account Setup</StepLabel>
              <StepContent>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <FormControlLabel
                      control={<Checkbox checked={accountForm.create} onChange={e => setAccountForm({ ...accountForm, create: e.target.checked })} />}
                      label="Create User Account for this Driver"
                    />
                    <Typography variant="caption" display="block" color="text.secondary">
                      If checked, an account will be created so the driver can log into the system.
                    </Typography>
                  </Grid>
                  {accountForm.create && (
                    <>
                      <Grid item xs={12} sm={4}>
                        <TextField label="Username" value={accountForm.username} onChange={e => setAccountForm({ ...accountForm, username: e.target.value })}
                          onBlur={() => checkExistingUserForDriver(accountForm.username)}
                          fullWidth size="small" />
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <TextField label="Email *" value={accountForm.email} onChange={e => setAccountForm({ ...accountForm, email: e.target.value })}
                          onBlur={() => checkExistingUserForDriver(accountForm.email)}
                          fullWidth size="small" error={Boolean(stepErrors.email)} helperText={stepErrors.email} />
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <TextField label="Password *" type="password" value={accountForm.password} onChange={e => setAccountForm({ ...accountForm, password: e.target.value })}
                          fullWidth size="small" error={Boolean(stepErrors.password)} helperText={stepErrors.password} />
                      </Grid>
                    </>
                  )}
                  {!accountForm.create && (
                    <Grid item xs={12} sx={{ mt: 2 }}>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>Or Link Existing User</Typography>
                      <TextField label="Linked User" value={form.userId || ''} onChange={e => setForm({ ...form, userId: e.target.value })} fullWidth size="small" select>
                        <MenuItem value=""><em>None</em></MenuItem>
                        {users.map(u => (
                          <MenuItem key={u.id || u._id} value={u.id || u._id}>{u.name} ({u.email || u.username})</MenuItem>
                        ))}
                      </TextField>
                    </Grid>
                  )}
                </Grid>
              </StepContent>
            </Step>
          </Stepper>
        </DialogContent>
        <DialogActions sx={{ bgcolor: 'background.paper', p: 2 }}>
          <Button onClick={() => setOpenDialog(false)} sx={{ color: 'text.primary' }}>Cancel</Button>
          {createTab > 0 && <Button onClick={handleStepBack}>Back</Button>}
          {createTab < 3 ? (
            <Button variant="contained" onClick={handleStepNext} sx={{ backgroundColor: '#1976d2' }}>Next</Button>
          ) : (
            <Button variant="contained" onClick={handleSave} sx={{ backgroundColor: '#1976d2' }}>Add</Button>
          )}
        </DialogActions>
      </Dialog>

      {/* ── Edit Driver Dialog (Tabs) ── */}
      <Dialog open={openDialog && Boolean(editDriver)} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth fullScreen={isMobile}>
        <DialogTitle sx={{ bgcolor: 'background.paper', color: 'text.primary' }}>Edit Driver</DialogTitle>
        <DialogContent sx={{ bgcolor: 'background.paper', p: 0, display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, minHeight: 450 }}>
          <Tabs
            orientation={isMobile ? "horizontal" : "vertical"}
            variant="scrollable"
            value={createTab}
            onChange={(e, v) => setCreateTab(v)}
            sx={{ borderRight: { xs: 0, sm: 1 }, borderBottom: { xs: 1, sm: 0 }, borderColor: 'divider', minWidth: 200 }}
          >
            <Tab label="Personal Info" />
            <Tab label="License Details" />
            <Tab label="Documents" />
            <Tab label="Account Setup" />
          </Tabs>

          <Box sx={{ flex: 1, p: 3, overflowY: 'auto' }}>
            {createTab === 0 && (
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField label="Full Name *" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} fullWidth size="small" />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField label="Mobile Number *" value={form.mobile} onChange={e => setForm({ ...form, mobile: e.target.value })} fullWidth size="small" />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField label="Alternate Mobile" value={form.alternateMobile} onChange={e => setForm({ ...form, alternateMobile: e.target.value })} fullWidth size="small" />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField label="Emergency Contact" value={form.emergencyContact} onChange={e => setForm({ ...form, emergencyContact: e.target.value })} fullWidth size="small" />
                </Grid>
                <Grid item xs={12}>
                  <TextField label="Address" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} fullWidth size="small" multiline rows={2} />
                </Grid>
              </Grid>
            )}

            {createTab === 1 && (
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField label="License Number *" value={form.licenseNumber} onChange={e => setForm({ ...form, licenseNumber: e.target.value })} fullWidth size="small" />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField label="License Expiry *" type="date" InputLabelProps={{ shrink: true }} value={form.licenseExpiry} onChange={e => setForm({ ...form, licenseExpiry: e.target.value })} fullWidth size="small" />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField label="Experience (Years)" type="number" value={form.experience} onChange={e => setForm({ ...form, experience: e.target.value })} fullWidth size="small" />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField label="Status" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} fullWidth size="small" select>
                    {['AVAILABLE', 'ON_TRIP', 'ON_LEAVE', 'SUSPENDED', 'INACTIVE'].map(s => (
                      <MenuItem key={s} value={s}>{s}</MenuItem>
                    ))}
                  </TextField>
                </Grid>
              </Grid>
            )}

            {createTab === 2 && (
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" gutterBottom sx={{ color: 'text.secondary' }}>Upload Documents</Typography>
                  <TextField label="Document Type" select value={docCategory} onChange={e => setDocCategory(e.target.value)} fullWidth size="small" sx={{ mb: 2 }}>
                    {['License', 'ID Proof', 'Medical Certificate', 'Background Check', 'Other'].map(c => (
                      <MenuItem key={c} value={c}>{c}</MenuItem>
                    ))}
                  </TextField>
                  <Box sx={{ border: '1px dashed', borderColor: 'divider', borderRadius: 2, p: 3, textAlign: 'center', bgcolor: '#f9fafb' }}>
                    <Button variant="outlined" startIcon={<FileUploadIcon />} component="label">
                      Select File
                      <input type="file" hidden accept="image/*,.pdf" onChange={e => {
                        if (e.target.files[0]) {
                          setDocuments([...documents, { category: docCategory, file: e.target.files[0] }]);
                          e.target.value = null;
                        }
                      }} />
                    </Button>
                  </Box>
                  {documents.length > 0 && (
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="body2" color="text.secondary" gutterBottom>Selected Files:</Typography>
                      {documents.map((d, i) => (
                        <Chip key={i} label={`${d.category}: ${d.file.name}`} onDelete={() => setDocuments(documents.filter((_, idx) => idx !== i))} sx={{ m: 0.5 }} />
                      ))}
                    </Box>
                  )}
                </Grid>
              </Grid>
            )}

            {createTab === 3 && (
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <FormControlLabel
                    control={<Checkbox checked={accountForm.create} onChange={e => setAccountForm({ ...accountForm, create: e.target.checked })} />}
                    label="Create User Account for this Driver"
                  />
                  <Typography variant="caption" display="block" color="text.secondary">
                    If checked, an account will be created so the driver can log into the system.
                  </Typography>
                </Grid>
                {accountForm.create && (
                  <>
                    <Grid item xs={12} sm={6}>
                      <TextField label="Email *" value={accountForm.email} onChange={e => setAccountForm({ ...accountForm, email: e.target.value })} fullWidth size="small" />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField label="Password *" type="password" value={accountForm.password} onChange={e => setAccountForm({ ...accountForm, password: e.target.value })} fullWidth size="small" />
                    </Grid>
                  </>
                )}
                {!accountForm.create && (
                  <Grid item xs={12} sx={{ mt: 2 }}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>Or Link Existing User</Typography>
                    <TextField label="Linked User" value={form.userId || ''} onChange={e => setForm({ ...form, userId: e.target.value })} fullWidth size="small" select>
                      <MenuItem value=""><em>None</em></MenuItem>
                      {users.map(u => (
                        <MenuItem key={u.id || u._id} value={u.id || u._id}>{u.name} ({u.email || u.username})</MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                )}
              </Grid>
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ bgcolor: 'background.paper', p: 2 }}>
          <Button onClick={() => setOpenDialog(false)} sx={{ color: 'text.primary' }}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} sx={{ backgroundColor: '#1976d2' }}>Update</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={Boolean(viewDriver)} onClose={() => { setViewDriver(null); setProfileTab(0); }} maxWidth="md" fullWidth fullScreen={isMobile}>
        <DialogTitle sx={{ bgcolor: 'background.paper', color: 'text.primary', borderBottom: 1, borderColor: 'divider' }}>
          Driver Profile
        </DialogTitle>
        <DialogContent sx={{ bgcolor: 'background.paper', p: 0, display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, minHeight: 400 }}>
          {viewDriver && (
            <>
              <Tabs
                orientation={isMobile ? "horizontal" : "vertical"}
                variant="scrollable"
                value={profileTab}
                onChange={(e, v) => setProfileTab(v)}
                sx={{ borderRight: { xs: 0, sm: 1 }, borderBottom: { xs: 1, sm: 0 }, borderColor: 'divider', minWidth: 200 }}
              >
                <Tab label="Personal Info" sx={{ alignItems: { xs: 'center', sm: 'flex-start' }, textAlign: 'left', fontWeight: 600 }} />
                <Tab label="License" sx={{ alignItems: { xs: 'center', sm: 'flex-start' }, textAlign: 'left', fontWeight: 600 }} />
                <Tab label="Documents" sx={{ alignItems: { xs: 'center', sm: 'flex-start' }, textAlign: 'left', fontWeight: 600 }} />
                <Tab label="Linked Account" sx={{ alignItems: { xs: 'center', sm: 'flex-start' }, textAlign: 'left', fontWeight: 600 }} />
                <Tab label="Vehicle" sx={{ alignItems: { xs: 'center', sm: 'flex-start' }, textAlign: 'left', fontWeight: 600 }} />
              </Tabs>

              <Box sx={{ flex: 1, p: 3, overflowY: 'auto' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
                  <Avatar sx={{ width: 64, height: 64, bgcolor: '#1976d2', fontSize: '1.5rem' }}>
                    {(viewDriver.name || 'U')[0]}
                  </Avatar>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>{viewDriver.name}</Typography>
                    <Chip
                      label={(viewDriver.status || 'AVAILABLE').toUpperCase()}
                      size="small"
                      color={(viewDriver.status === 'AVAILABLE' || viewDriver.status === 'active' || !viewDriver.status) ? 'success' : 'default'}
                      sx={{ mt: 0.5, fontSize: '0.7rem', fontWeight: 700 }}
                    />
                  </Box>
                </Box>

                {profileTab === 0 && (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Card sx={{ p: 2, boxShadow: 3, borderRadius: 2 }}>
                      <Typography variant="subtitle2" sx={{ color: 'text.secondary', fontWeight: 600, textTransform: 'uppercase', mb: 2 }}>Personal Information</Typography>
                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Box sx={{ p: 1, borderRadius: 1, bgcolor: '#f3f4f6', display: 'flex' }}>
                              <PhoneIcon sx={{ color: '#6b7280', fontSize: 20 }} />
                            </Box>
                            <Box>
                              <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', lineHeight: 1.2 }}>Mobile Number *</Typography>
                              <Typography variant="body1" sx={{ fontWeight: 500, color: 'text.primary' }}>{viewDriver.mobile || viewDriver.phone || '—'}</Typography>
                            </Box>
                          </Box>
                        </Grid>

                        <Grid item xs={12} sm={6}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Box sx={{ p: 1, borderRadius: 1, bgcolor: '#f3f4f6', display: 'flex' }}>
                              <PhoneIphoneIcon sx={{ color: '#6b7280', fontSize: 20 }} />
                            </Box>
                            <Box>
                              <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', lineHeight: 1.2 }}>Alternate Mobile</Typography>
                              <Typography variant="body1" sx={{ fontWeight: 500, color: 'text.primary' }}>{viewDriver.alternateMobile || '—'}</Typography>
                            </Box>
                          </Box>
                        </Grid>

                        <Grid item xs={12} sm={6}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Box sx={{ p: 1, borderRadius: 1, bgcolor: '#f3f4f6', display: 'flex' }}>
                              <HomeIcon sx={{ color: '#6b7280', fontSize: 20 }} />
                            </Box>
                            <Box>
                              <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', lineHeight: 1.2 }}>Address</Typography>
                              <Typography variant="body1" sx={{ fontWeight: 500, color: 'text.primary' }}>{viewDriver.address || '—'}</Typography>
                            </Box>
                          </Box>
                        </Grid>

                        <Grid item xs={12} sm={6}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Box sx={{ p: 1, borderRadius: 1, bgcolor: '#f3f4f6', display: 'flex' }}>
                              <WarningAmberIcon sx={{ color: '#6b7280', fontSize: 20 }} />
                            </Box>
                            <Box>
                              <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', lineHeight: 1.2 }}>Emergency Contact</Typography>
                              <Typography variant="body1" sx={{ fontWeight: 500, color: 'text.primary' }}>{viewDriver.emergencyContact || '—'}</Typography>
                            </Box>
                          </Box>
                        </Grid>
                      </Grid>
                    </Card>
                  </Box>
                )}

                {profileTab === 1 && (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Card sx={{ p: 2, boxShadow: 3, borderRadius: 2 }}>
                      <Typography variant="subtitle2" sx={{ color: 'text.secondary', fontWeight: 600, textTransform: 'uppercase', mb: 2 }}>License Information</Typography>
                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Box sx={{ p: 1, borderRadius: 1, bgcolor: '#f3f4f6', display: 'flex' }}>
                              <BadgeIcon sx={{ color: '#6b7280', fontSize: 20 }} />
                            </Box>
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                              <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', lineHeight: 1.2 }}>License Number *</Typography>
                              <Typography variant="body1" sx={{ fontWeight: 500, color: 'text.primary', wordBreak: 'break-all' }}>{viewDriver.licenseNumber || viewDriver.license_no || '—'}</Typography>
                            </Box>
                          </Box>
                        </Grid>

                        <Grid item xs={12} sm={6}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Box sx={{ p: 1, borderRadius: 1, bgcolor: '#f3f4f6', display: 'flex' }}>
                              <EventIcon sx={{ color: '#6b7280', fontSize: 20 }} />
                            </Box>
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                              <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', lineHeight: 1.2 }}>License Expiry *</Typography>
                              <Typography variant="body1" sx={{ fontWeight: 500, color: 'text.primary', wordBreak: 'break-word' }}>{viewDriver.licenseExpiry || viewDriver.license_expiry ? new Date(viewDriver.licenseExpiry || viewDriver.license_expiry).toLocaleDateString() : '—'}</Typography>
                            </Box>
                          </Box>
                        </Grid>

                        <Grid item xs={12} sm={6}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Box sx={{ p: 1, borderRadius: 1, bgcolor: '#f3f4f6', display: 'flex' }}>
                              <WorkOutlineIcon sx={{ color: '#6b7280', fontSize: 20 }} />
                            </Box>
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                              <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', lineHeight: 1.2 }}>Experience (Years)</Typography>
                              <Typography variant="body1" sx={{ fontWeight: 500, color: 'text.primary', wordBreak: 'break-word' }}>{viewDriver.experienceYears != null ? `${viewDriver.experienceYears} Years` : (viewDriver.experience != null ? `${viewDriver.experience} Years` : '—')}</Typography>
                            </Box>
                          </Box>
                        </Grid>
                      </Grid>
                    </Card>
                  </Box>
                )}

                {profileTab === 2 && (
                  <Card sx={{ p: 4, boxShadow: 3, borderRadius: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                      <Typography variant="subtitle2" sx={{ color: 'text.secondary', fontWeight: 600, textTransform: 'uppercase' }}>
                        Uploaded Documents ({viewDocuments.length})
                      </Typography>
                    </Box>
                    {viewDocuments.length === 0 ? (
                      <Box sx={{ textAlign: 'center', py: 4 }}>
                        <FileUploadIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
                        <Typography variant="h6" gutterBottom>No documents uploaded</Typography>
                        <Typography color="text.secondary">
                          Upload driver's license, ID proof, or other related documents here.
                        </Typography>
                      </Box>
                    ) : (
                      <Grid container spacing={2}>
                        {viewDocuments.map(doc => (
                          <Grid item xs={12} sm={6} key={doc.id || doc._id}>
                            <Card variant="outlined" sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
                              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                                <AssignmentIcon sx={{ color: '#1976d2', mt: 0.5 }} />
                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                  <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>{doc.documentType || 'Document'}</Typography>
                                  <Typography variant="body2" sx={{ fontSize: '0.8rem', color: 'text.secondary', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {doc.title || doc.originalFileName || ''}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    {doc.createdAt ? new Date(doc.createdAt).toLocaleDateString() : '—'}
                                    {doc.expiryDate ? ` · Expires: ${new Date(doc.expiryDate).toLocaleDateString()}` : ''}
                                  </Typography>
                                </Box>
                                <Chip
                                  label={doc.verificationStatus || 'PENDING'}
                                  size="small"
                                  color={doc.verificationStatus === 'VERIFIED' ? 'success' : doc.verificationStatus === 'REJECTED' ? 'error' : 'warning'}
                                  sx={{ fontSize: '0.6rem', fontWeight: 700 }}
                                />
                              </Box>
                              <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end', mt: 1 }}>
                                <Button
                                  size="small"
                                  variant="outlined"
                                  startIcon={<VisibilityIcon sx={{ fontSize: 14 }} />}
                                  onClick={async () => {
                                    try {
                                      const res = await api.get(`/documents/${doc.id || doc._id}/download`);
                                      const url = res.data?.data?.url;
                                      if (url) window.open(url, '_blank');
                                    } catch (err) { console.error('View failed:', err); }
                                  }}
                                >View</Button>
                                <Button
                                  size="small"
                                  variant="outlined"
                                  startIcon={<DownloadIcon sx={{ fontSize: 14 }} />}
                                  onClick={async () => {
                                    try {
                                      const res = await api.get(`/documents/${doc.id || doc._id}/download`);
                                      const url = res.data?.data?.url;
                                      if (url) {
                                        const link = document.createElement('a');
                                        link.href = url;
                                        link.download = doc.originalFileName || doc.title || 'document';
                                        link.setAttribute('target', '_blank');
                                        document.body.appendChild(link);
                                        link.click();
                                        document.body.removeChild(link);
                                      }
                                    } catch (err) { console.error('Download failed:', err); }
                                  }}
                                >Download</Button>
                                {hasPermission('documents_delete') && (
                                  <Button
                                    size="small"
                                    variant="outlined"
                                    color="error"
                                    startIcon={<DeleteIcon sx={{ fontSize: 14 }} />}
                                    onClick={() => setDeleteDocConfirm({ open: true, doc })}
                                  >Delete</Button>
                                )}
                              </Box>
                            </Card>
                          </Grid>
                        ))}
                      </Grid>
                    )}
                  </Card>
                )}

                {profileTab === 3 && (
                  <Card sx={{ p: 4, boxShadow: 3, borderRadius: 2 }}>
                    <Typography variant="subtitle2" sx={{ color: 'text.secondary', fontWeight: 600, textTransform: 'uppercase', mb: 2 }}>Linked Account</Typography>
                    {viewProfileLink ? (
                      <Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                          <PeopleIcon sx={{ fontSize: 48, color: '#10b981', opacity: 0.8 }} />
                          <Box>
                            <Typography variant="h6" sx={{ fontWeight: 600, wordBreak: 'break-all' }}>{viewProfileLink.user?.name || 'Linked User'}</Typography>
                            <Chip label="Account Linked" size="small" color="success" sx={{ mt: 0.5, fontSize: '0.65rem', fontWeight: 700 }} />
                          </Box>
                        </Box>
                        <Grid container spacing={2}>
                          <Grid item xs={12} sm={6}>
                            <Typography variant="caption" color="text.secondary">Email</Typography>
                            <Typography variant="body2" sx={{ fontWeight: 500, wordBreak: 'break-all' }}>{viewProfileLink.user?.email || '—'}</Typography>
                          </Grid>
                          <Grid item xs={12} sm={6}>
                            <Typography variant="caption" color="text.secondary">User ID</Typography>
                            <Typography variant="body2" sx={{ fontWeight: 500, fontFamily: 'monospace', fontSize: '0.8rem', wordBreak: 'break-all' }}>{viewProfileLink.userId}</Typography>
                          </Grid>
                          <Grid item xs={12} sm={6}>
                            <Typography variant="caption" color="text.secondary">Linked On</Typography>
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>{viewProfileLink.linkedAt ? new Date(viewProfileLink.linkedAt).toLocaleDateString() : '—'}</Typography>
                          </Grid>
                          <Grid item xs={12} sm={6}>
                            <Typography variant="caption" color="text.secondary">Status</Typography>
                            <Box><Chip label={viewProfileLink.status || 'ACTIVE'} size="small" color={viewProfileLink.status === 'ACTIVE' ? 'success' : 'default'} sx={{ fontSize: '0.65rem', fontWeight: 700 }} /></Box>
                          </Grid>
                          {viewProfileLink.linkedBy && (
                            <Grid item xs={12}>
                              <Typography variant="caption" color="text.secondary">Linked By</Typography>
                              <Typography variant="body2" sx={{ fontWeight: 500 }}>{viewProfileLink.linkedBy.name} ({viewProfileLink.linkedBy.email})</Typography>
                            </Grid>
                          )}
                        </Grid>
                      </Box>
                    ) : (
                      <Box sx={{ textAlign: 'center', py: 2 }}>
                        <PeopleIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
                        <Typography variant="h6" gutterBottom>No Linked Account</Typography>
                        <Typography color="text.secondary" mb={3}>
                          This driver does not currently have a user account to log in.
                        </Typography>

                        {linkForm.mode === 'none' && (
                          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
                            <Button variant="contained" onClick={() => setLinkForm({ mode: 'create', email: `${(viewDriver?.name || 'driver').toLowerCase().replace(/\s+/g, '.')}@fleet.local`, password: '', name: viewDriver?.name || '', userId: '' })} sx={{ bgcolor: '#1976d2', borderRadius: 2 }}>
                              Create New Account
                            </Button>
                            <Button variant="outlined" onClick={() => { fetchUsers(); setLinkForm({ ...linkForm, mode: 'link' }); }} sx={{ borderRadius: 2 }}>
                              Link Existing User
                            </Button>
                          </Box>
                        )}

                        {linkForm.mode === 'create' && (
                          <Card variant="outlined" sx={{ p: 3, mt: 2, maxWidth: 500, mx: 'auto', textAlign: 'left' }}>
                            <Typography variant="subtitle2" sx={{ mb: 2 }}>Create User Account</Typography>
                            <Grid container spacing={2}>
                              <Grid item xs={12}>
                                <TextField label="Full Name" value={linkForm.name} onChange={e => setLinkForm({ ...linkForm, name: e.target.value })} fullWidth size="small" />
                              </Grid>
                              <Grid item xs={12} sm={6}>
                                <TextField label="Username" value={linkForm.username} onChange={e => setLinkForm({ ...linkForm, username: e.target.value })} onBlur={() => checkExistingUserForDriver(linkForm.username, true)} fullWidth size="small" />
                              </Grid>
                              <Grid item xs={12} sm={6}>
                                <TextField label="Email" value={linkForm.email} onChange={e => setLinkForm({ ...linkForm, email: e.target.value })} onBlur={() => checkExistingUserForDriver(linkForm.email, true)} fullWidth size="small" />
                              </Grid>
                              <Grid item xs={12}>
                                <TextField label="Password" type="password" value={linkForm.password} onChange={e => setLinkForm({ ...linkForm, password: e.target.value })} fullWidth size="small" />
                              </Grid>
                            </Grid>
                            <Box sx={{ display: 'flex', gap: 1, mt: 2, justifyContent: 'flex-end' }}>
                              <Button size="small" onClick={() => setLinkForm({ mode: 'none', email: '', username: '', password: '', name: '', userId: '' })}>Cancel</Button>
                              <Button size="small" variant="contained" onClick={handleCreateAndLink} sx={{ bgcolor: '#1976d2' }}>Create & Link</Button>
                            </Box>
                          </Card>
                        )}

                        {linkForm.mode === 'link' && (
                          <Card variant="outlined" sx={{ p: 3, mt: 2, maxWidth: 400, mx: 'auto', textAlign: 'left' }}>
                            <Typography variant="subtitle2" sx={{ mb: 2 }}>Link Existing User</Typography>
                            <TextField
                              label="Select User"
                              value={linkForm.userId || ''}
                              onChange={e => setLinkForm({ ...linkForm, userId: e.target.value })}
                              fullWidth size="small" select
                            >
                              <MenuItem value=""><em>None</em></MenuItem>
                              {users.filter(u => u.status === 'ACTIVE').map(u => (
                                <MenuItem key={u.id || u._id} value={u.id || u._id}>{u.name} ({u.email || u.username})</MenuItem>
                              ))}
                            </TextField>
                            <Box sx={{ display: 'flex', gap: 1, mt: 2, justifyContent: 'flex-end' }}>
                              <Button size="small" onClick={() => setLinkForm({ mode: 'none', email: '', password: '', name: '', userId: '' })}>Cancel</Button>
                              <Button size="small" variant="contained" onClick={handleLinkExisting} disabled={!linkForm.userId} sx={{ bgcolor: '#1976d2' }}>Link User</Button>
                            </Box>
                          </Card>
                        )}
                      </Box>
                    )}
                  </Card>
                )}

                {profileTab === 4 && (
                  <Card sx={{ p: 4, boxShadow: 3, borderRadius: 2 }}>
                    <Typography variant="subtitle2" sx={{ color: 'text.secondary', fontWeight: 600, textTransform: 'uppercase', mb: 2 }}>Assigned Vehicle</Typography>
                    {viewVehicles.length === 0 ? (
                      <Box sx={{ textAlign: 'center', py: 4 }}>
                        <DirectionsCarIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
                        <Typography variant="h6" gutterBottom>No vehicle assigned</Typography>
                        <Typography color="text.secondary">This driver does not have a vehicle currently assigned.</Typography>
                      </Box>
                    ) : (
                      <Grid container spacing={2}>
                        {viewVehicles.map(v => (
                          <Grid item xs={12} sm={6} key={v.id || v._id}>
                            <Card variant="outlined" sx={{ p: 2 }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                                <DirectionsCarIcon sx={{ color: '#1976d2' }} />
                                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>{v.vehicleNumber || '—'}</Typography>
                                <Chip label={(v.status || 'UNKNOWN').toUpperCase()} size="small"
                                  color={v.status === 'AVAILABLE' ? 'success' : v.status === 'ON_TRIP' ? 'info' : 'default'}
                                  sx={{ fontSize: '0.6rem', fontWeight: 700 }} />
                              </Box>
                              <Grid container spacing={1}>
                                {v.vehicleType && <Grid item xs={6}><Typography variant="caption" color="text.secondary">Type</Typography><Typography variant="body2">{v.vehicleType}</Typography></Grid>}
                                {v.brand && <Grid item xs={6}><Typography variant="caption" color="text.secondary">Brand</Typography><Typography variant="body2">{v.brand}</Typography></Grid>}
                                {v.model && <Grid item xs={6}><Typography variant="caption" color="text.secondary">Model</Typography><Typography variant="body2">{v.model}</Typography></Grid>}
                                {v.fuelType && <Grid item xs={6}><Typography variant="caption" color="text.secondary">Fuel</Typography><Typography variant="body2">{v.fuelType}</Typography></Grid>}
                              </Grid>
                            </Card>
                          </Grid>
                        ))}
                      </Grid>
                    )}
                  </Card>
                )}
              </Box>
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ bgcolor: 'background.paper', p: 2, borderTop: '1px solid', borderColor: 'divider' }}>
          <Button variant="contained" onClick={() => { setViewDriver(null); setProfileTab(0); }} sx={{ backgroundColor: '#1976d2', borderRadius: 2 }}>Close</Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={deleteConfirm.open}
        title="Confirm Delete"
        message={`Are you sure you want to delete driver ${deleteConfirm.driver?.name}?`}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteConfirm({ open: false, driver: null })}
      />

      <ConfirmDialog
        open={deleteDocConfirm.open}
        title="Delete Document"
        message={`Are you sure you want to delete "${deleteDocConfirm.doc?.title || deleteDocConfirm.doc?.documentType || 'this document'}"?`}
        onConfirm={handleDeleteDocument}
        onCancel={() => setDeleteDocConfirm({ open: false, doc: null })}
      />

      <Snackbar open={snack.open} autoHideDuration={3000} onClose={() => setSnack(s => ({ ...s, open: false }))} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <Alert severity={snack.severity} variant="filled" onClose={() => setSnack(s => ({ ...s, open: false }))} sx={{ borderRadius: 2 }}>{snack.msg}</Alert>
      </Snackbar>
    </Box>
  );
}
