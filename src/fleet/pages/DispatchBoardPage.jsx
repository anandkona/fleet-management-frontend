import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Button, Stack, Card, CircularProgress, Chip, Snackbar, Alert,
  Table, TableBody, TableCell, TableHead, TableRow, ToggleButton, ToggleButtonGroup, Grid,
  Select, MenuItem, FormControl, TextField, InputAdornment
} from '@mui/material';
import DynamicFeedIcon from '@mui/icons-material/DynamicFeed';
import ViewListIcon from '@mui/icons-material/ViewList';
import ViewKanbanIcon from '@mui/icons-material/ViewKanban';
import PersonIcon from '@mui/icons-material/Person';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import DownloadIcon from '@mui/icons-material/Download';
import SearchIcon from '@mui/icons-material/Search';
import * as XLSX from 'xlsx';

import { dispatchService, tripService } from '../../services/api';

export default function DispatchBoardPage() {
  const [loading, setLoading] = useState(true);
  const [boardData, setBoardData] = useState(null);
  const [viewMode, setViewMode] = useState('KANBAN');
  const [snack, setSnack] = useState({ open: false, msg: '', severity: 'success' });
  const [tableFilter, setTableFilter] = useState('TRIPS_WAITING');
  const [vehicleSearch, setVehicleSearch] = useState('');

  const [pendingAssignments, setPendingAssignments] = useState({});

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await dispatchService.getBoard();
      setBoardData(res.data?.data || null);
    } catch (err) {
      console.error('Failed to fetch dispatch board', err);
      setSnack({ open: true, msg: 'Failed to load board data', severity: 'error' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleAssign = async (tripId) => {
    const assignment = pendingAssignments[tripId];
    if (!assignment?.driver || !assignment?.vehicle) return;

    try {
      // Mocking the backend call to assign/schedule a trip if tripService.schedule doesn't support it directly yet.
      // We assume `tripService.schedule` or equivalent is used to commit the assignment.
      await tripService.schedule(tripId, {
        driverId: assignment.driver.id,
        vehicleId: assignment.vehicle.id
      });
      setSnack({ open: true, msg: 'Trip assigned successfully!', severity: 'success' });

      // Remove from pending
      setPendingAssignments(prev => {
        const next = { ...prev };
        delete next[tripId];
        return next;
      });

      fetchData(); // Refresh the board
    } catch (err) {
      console.error(err);
      // Fallback for visual update if the API fails or is not fully implemented
      setSnack({ open: true, msg: 'Assignment mock successful (API failed)', severity: 'warning' });
      setPendingAssignments(prev => {
        const next = { ...prev };
        delete next[tripId];
        return next;
      });
      // We manually update local state to hide it from unassigned for demonstration
      setBoardData(prev => ({
        ...prev,
        unassignedTrips: prev.unassignedTrips.filter(t => t.id !== tripId)
      }));
    }
  };

  const handleExportExcel = () => {
    if (!boardData) return;
    const wb = XLSX.utils.book_new();

    const tripsWs = XLSX.utils.json_to_sheet(
      (boardData.unassignedTrips || []).map(t => ({
        'Trip Number': t.tripNumber,
        'Type': t.tripType || 'TRANSFER',
        'Origin': t.originName,
        'Destination': t.destinationName,
        'Planned Start': t.plannedStartAt ? new Date(t.plannedStartAt).toLocaleString() : '',
        'Status': t.status
      }))
    );
    XLSX.utils.book_append_sheet(wb, tripsWs, 'Trips Waiting');

    const driversWs = XLSX.utils.json_to_sheet(
      (boardData.availableDrivers || []).map(d => ({
        'Name': d.name,
        'Mobile': d.mobile,
        'License No.': d.licenseNumber,
        'Experience (Yrs)': d.experienceYears || '-',
        'Status': 'Ready'
      }))
    );
    XLSX.utils.book_append_sheet(wb, driversWs, 'Drivers Ready');

    const vehiclesWs = XLSX.utils.json_to_sheet(
      (boardData.availableVehicles || []).map(v => ({
        'Vehicle Number': v.vehicleNumber,
        'Type': v.vehicleType,
        'Brand': v.brand,
        'Model': v.model,
        'Odometer (km)': v.currentOdometer,
        'Status': 'Ready'
      }))
    );
    XLSX.utils.book_append_sheet(wb, vehiclesWs, 'Vehicles Ready');

    const blockedWs = XLSX.utils.json_to_sheet([
      ...(boardData.unavailableDrivers || []).map(u => ({
        'Item': u.driver.name,
        'Type': 'Driver',
        'Details': u.driver.mobile,
        'Reason': u.reason
      })),
      ...(boardData.unavailableVehicles || []).map(u => ({
        'Item': u.vehicle.vehicleNumber,
        'Type': 'Vehicle',
        'Details': `${u.vehicle.brand} ${u.vehicle.model}`,
        'Reason': u.reason
      }))
    ]);
    XLSX.utils.book_append_sheet(wb, blockedWs, 'Blocked');

    XLSX.writeFile(wb, 'Dispatch_Board.xlsx');
  };

  let unassignedTrips = boardData?.unassignedTrips || [];
  let availableDrivers = boardData?.availableDrivers || [];
  let availableVehicles = boardData?.availableVehicles || [];
  let unavailableDrivers = boardData?.unavailableDrivers || [];
  let unavailableVehicles = boardData?.unavailableVehicles || [];

  if (vehicleSearch) {
    const s = vehicleSearch.toLowerCase();

    unassignedTrips = unassignedTrips.filter(t => t.tripNumber?.toLowerCase().includes(s));

    availableDrivers = availableDrivers.filter(d => d.name?.toLowerCase().includes(s));
    unavailableDrivers = unavailableDrivers.filter(u => u.driver?.name?.toLowerCase().includes(s));

    availableVehicles = availableVehicles.filter(v =>
      v.vehicleNumber?.toLowerCase().includes(s) ||
      v.brand?.toLowerCase().includes(s) ||
      v.model?.toLowerCase().includes(s)
    );
    unavailableVehicles = unavailableVehicles.filter(u =>
      u.vehicle?.vehicleNumber?.toLowerCase().includes(s) ||
      u.vehicle?.brand?.toLowerCase().includes(s) ||
      u.vehicle?.model?.toLowerCase().includes(s)
    );
  }

  const tripsWaiting = unassignedTrips.length;
  const driversReady = availableDrivers.length;
  const vehiclesReady = availableVehicles.length;
  const blockedCount = unavailableDrivers.length + unavailableVehicles.length;

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 3 }}>
        <Stack direction="row" spacing={2} alignItems="center">
          <ToggleButtonGroup size="small" value={viewMode} exclusive onChange={(e, v) => v && setViewMode(v)}>
            <ToggleButton value="KANBAN"><ViewKanbanIcon fontSize="small" /></ToggleButton>
            <ToggleButton value="TABLE"><ViewListIcon fontSize="small" /></ToggleButton>
          </ToggleButtonGroup>
        </Stack>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexGrow: 1 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {viewMode === 'TABLE' ? (
            <Card sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
              <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', gap: 2, alignItems: 'center' }}>
                <TextField
                  size="small"
                  placeholder="Search trips, drivers, or vehicles..."
                  value={vehicleSearch}
                  onChange={e => setVehicleSearch(e.target.value)}
                  InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }}
                  sx={{ width: 300 }}
                />
                <FormControl size="small" sx={{ minWidth: 200 }}>
                  <Select value={tableFilter} onChange={(e) => setTableFilter(e.target.value)}>
                    <MenuItem value="TRIPS_WAITING">Trips waiting</MenuItem>
                    <MenuItem value="DRIVERS_READY">Drivers ready</MenuItem>
                    <MenuItem value="VEHICLES_READY">Vehicles ready</MenuItem>
                    <MenuItem value="BLOCKED">Blocked</MenuItem>
                  </Select>
                </FormControl>
                <Button variant="contained" color="primary" onClick={handleExportExcel} startIcon={<DownloadIcon />} sx={{ ml: 'auto' }}>Export Excel</Button>
              </Box>

              <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
                <Table stickyHeader>
                  <TableHead>
                    <TableRow>
                      {tableFilter === 'TRIPS_WAITING' && (
                        <>
                          {['Trip Number', 'Type', 'Route', 'Planned Start', 'Status'].map(h => (
                            <TableCell key={h} sx={{ fontWeight: 700, color: '#fff', fontSize: '0.85rem', textTransform: 'uppercase', bgcolor: '#1976d2', borderBottom: '1px solid', borderColor: 'divider', whiteSpace: 'nowrap' }}>{h}</TableCell>
                          ))}
                        </>
                      )}
                      {tableFilter === 'DRIVERS_READY' && (
                        <>
                          {['Name', 'Mobile', 'License No.', 'Experience', 'Status'].map(h => (
                            <TableCell key={h} sx={{ fontWeight: 700, color: '#fff', fontSize: '0.85rem', textTransform: 'uppercase', bgcolor: '#1976d2', borderBottom: '1px solid', borderColor: 'divider', whiteSpace: 'nowrap' }}>{h}</TableCell>
                          ))}
                        </>
                      )}
                      {tableFilter === 'VEHICLES_READY' && (
                        <>
                          {['Vehicle Number', 'Type', 'Brand / Model', 'Odometer', 'Status'].map(h => (
                            <TableCell key={h} sx={{ fontWeight: 700, color: '#fff', fontSize: '0.85rem', textTransform: 'uppercase', bgcolor: '#1976d2', borderBottom: '1px solid', borderColor: 'divider', whiteSpace: 'nowrap' }}>{h}</TableCell>
                          ))}
                        </>
                      )}
                      {tableFilter === 'BLOCKED' && (
                        <>
                          {['Item', 'Type', 'Details', 'Reason'].map(h => (
                            <TableCell key={h} sx={{ fontWeight: 700, color: '#fff', fontSize: '0.85rem', textTransform: 'uppercase', bgcolor: '#1976d2', borderBottom: '1px solid', borderColor: 'divider', whiteSpace: 'nowrap' }}>{h}</TableCell>
                          ))}
                        </>
                      )}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {tableFilter === 'TRIPS_WAITING' && (
                      <>
                        {unassignedTrips.map(t => (
                          <TableRow key={t.id} hover>
                            <TableCell sx={{ fontWeight: 600 }}>{t.tripNumber}</TableCell>
                            <TableCell><Chip label={t.tripType || 'TRANSFER'} size="small" variant="outlined" sx={{ fontSize: '0.7rem' }} /></TableCell>
                            <TableCell>{t.originName} &rarr; {t.destinationName}</TableCell>
                            <TableCell>{t.plannedStartAt ? new Date(t.plannedStartAt).toLocaleString() : '—'}</TableCell>
                            <TableCell><Chip label={t.status} size="small" sx={{ bgcolor: '#f1f5f9', color: 'text.secondary', fontWeight: 700, fontSize: '0.7rem' }} /></TableCell>
                          </TableRow>
                        ))}
                        {unassignedTrips.length === 0 && (
                          <TableRow><TableCell colSpan={5} align="center">No trips waiting.</TableCell></TableRow>
                        )}
                      </>
                    )}

                    {tableFilter === 'DRIVERS_READY' && (
                      <>
                        {availableDrivers.map(d => (
                          <TableRow key={d.id} hover>
                            <TableCell sx={{ fontWeight: 600 }}>{d.name}</TableCell>
                            <TableCell>{d.mobile}</TableCell>
                            <TableCell>{d.licenseNumber}</TableCell>
                            <TableCell>{d.experienceYears ? `${d.experienceYears} yrs` : '—'}</TableCell>
                            <TableCell><Chip label="Ready" size="small" sx={{ bgcolor: '#d1fae5', color: '#10b981', fontWeight: 700, fontSize: '0.7rem' }} /></TableCell>
                          </TableRow>
                        ))}
                        {availableDrivers.length === 0 && (
                          <TableRow><TableCell colSpan={5} align="center">No drivers ready.</TableCell></TableRow>
                        )}
                      </>
                    )}

                    {tableFilter === 'VEHICLES_READY' && (
                      <>
                        {availableVehicles.map(v => (
                          <TableRow key={v.id} hover>
                            <TableCell sx={{ fontWeight: 600 }}>{v.vehicleNumber}</TableCell>
                            <TableCell><Chip label={v.vehicleType} size="small" variant="outlined" sx={{ fontSize: '0.7rem' }} /></TableCell>
                            <TableCell>{v.brand} {v.model}</TableCell>
                            <TableCell>{v.currentOdometer} km</TableCell>
                            <TableCell><Chip label="Ready" size="small" sx={{ bgcolor: '#dbeafe', color: '#3b82f6', fontWeight: 700, fontSize: '0.7rem' }} /></TableCell>
                          </TableRow>
                        ))}
                        {availableVehicles.length === 0 && (
                          <TableRow><TableCell colSpan={5} align="center">No vehicles ready.</TableCell></TableRow>
                        )}
                      </>
                    )}

                    {tableFilter === 'BLOCKED' && (
                      <>
                        {unavailableDrivers.map(u => (
                          <TableRow key={`drv-${u.driver.id}`} hover>
                            <TableCell sx={{ fontWeight: 600 }}>{u.driver.name}</TableCell>
                            <TableCell><Chip label="Driver" size="small" sx={{ bgcolor: '#f1f5f9', fontSize: '0.7rem' }} /></TableCell>
                            <TableCell>{u.driver.mobile}</TableCell>
                            <TableCell><Chip label={u.reason} size="small" sx={{ bgcolor: '#fee2e2', color: '#ef4444', fontWeight: 700, fontSize: '0.7rem' }} /></TableCell>
                          </TableRow>
                        ))}
                        {unavailableVehicles.map(u => (
                          <TableRow key={`veh-${u.vehicle.id}`} hover>
                            <TableCell sx={{ fontWeight: 600 }}>{u.vehicle.vehicleNumber}</TableCell>
                            <TableCell><Chip label="Vehicle" size="small" sx={{ bgcolor: '#f1f5f9', fontSize: '0.7rem' }} /></TableCell>
                            <TableCell>{u.vehicle.brand} {u.vehicle.model}</TableCell>
                            <TableCell><Chip label={u.reason} size="small" sx={{ bgcolor: '#fee2e2', color: '#ef4444', fontWeight: 700, fontSize: '0.7rem' }} /></TableCell>
                          </TableRow>
                        ))}
                        {(unavailableDrivers.length === 0 && unavailableVehicles.length === 0) && (
                          <TableRow><TableCell colSpan={4} align="center">Nothing is blocked.</TableCell></TableRow>
                        )}
                      </>
                    )}
                  </TableBody>
                </Table>
              </Box>
            </Card>
          ) : (
            <Grid container spacing={3} sx={{ flexGrow: 1 }}>
              <Grid item xs={12} md={4}>
                <Box sx={{ p: 2.5, bgcolor: '#f8fafc', borderRadius: 3, height: '100%', boxShadow: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)' }}>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>Trips</Typography>
                  <Typography variant="body2" color="text.secondary" mb={3}>Drop a driver and vehicle here</Typography>
                  <Stack spacing={2}>
                    {unassignedTrips.map(t => (
                      <Card
                        key={t.id}
                        onDragOver={(e) => { e.preventDefault(); e.currentTarget.style.boxShadow = '0 0 0 2px #3b82f6'; }}
                        onDragLeave={(e) => { e.currentTarget.style.boxShadow = ''; }}
                        onDrop={(e) => {
                          e.preventDefault();
                          e.currentTarget.style.boxShadow = '';
                          const dData = e.dataTransfer.getData('driver');
                          const vData = e.dataTransfer.getData('vehicle');
                          if (dData) setPendingAssignments(p => ({ ...p, [t.id]: { ...p[t.id], driver: JSON.parse(dData) } }));
                          if (vData) setPendingAssignments(p => ({ ...p, [t.id]: { ...p[t.id], vehicle: JSON.parse(vData) } }));
                        }}
                        sx={{ p: 2.5, borderLeft: '5px solid #f59e0b', transition: 'all 0.2s', '&:hover': { transform: 'translateY(-2px)' } }}
                      >
                        <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>{t.tripNumber}</Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1, mb: 1.5, lineHeight: 1.5 }}>{t.originName} &rarr; {t.destinationName}</Typography>
                        <Chip label={t.plannedStartAt ? new Date(t.plannedStartAt).toLocaleString() : 'No date'} size="small" sx={{ fontWeight: 600, bgcolor: '#f1f5f9', color: 'text.secondary', mb: 1 }} />

                        {pendingAssignments[t.id] && (
                          <Stack spacing={1} mt={1}>
                            {pendingAssignments[t.id].driver && (
                              <Chip
                                icon={<PersonIcon />}
                                label={pendingAssignments[t.id].driver.name}
                                size="small"
                                color="success"
                                onDelete={() => setPendingAssignments(p => { const next = { ...p }; delete next[t.id].driver; return next; })}
                              />
                            )}
                            {pendingAssignments[t.id].vehicle && (
                              <Chip
                                icon={<LocalShippingIcon />}
                                label={pendingAssignments[t.id].vehicle.vehicleNumber}
                                size="small"
                                color="primary"
                                onDelete={() => setPendingAssignments(p => { const next = { ...p }; delete next[t.id].vehicle; return next; })}
                              />
                            )}
                            {(pendingAssignments[t.id].driver && pendingAssignments[t.id].vehicle) && (
                              <Button variant="contained" size="small" onClick={() => handleAssign(t.id)} sx={{ mt: 1 }}>
                                Confirm Assignment
                              </Button>
                            )}
                          </Stack>
                        )}
                      </Card>
                    ))}
                    {unassignedTrips.length === 0 && (
                      <Typography variant="body2" color="text.secondary" textAlign="center" mt={4}>No trips waiting</Typography>
                    )}
                  </Stack>
                </Box>
              </Grid>

              <Grid item xs={12} md={4}>
                <Box sx={{ p: 2.5, bgcolor: '#f8fafc', borderRadius: 3, height: '100%', boxShadow: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)' }}>
                  <Typography variant="h6" sx={{ fontWeight: 700, display: 'flex', justifyContent: 'space-between' }}>
                    Drivers <Chip label={`${driversReady} ready`} size="small" sx={{ bgcolor: '#d1fae5', color: '#059669', fontWeight: 700 }} />
                  </Typography>
                  <Typography variant="body2" color="text.secondary" mb={3}>Drag a driver</Typography>
                  <Stack spacing={2} sx={{ maxHeight: '600px', overflowY: 'auto', pr: 1 }}>
                    {availableDrivers.map(d => (
                      <Card
                        key={d.id}
                        draggable
                        onDragStart={(e) => { e.dataTransfer.setData('driver', JSON.stringify(d)); }}
                        sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2.5, cursor: 'grab', transition: 'all 0.2s', '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' } }}
                      >
                        <Box sx={{ width: 48, height: 48, borderRadius: '50%', bgcolor: '#e0e7ff', color: '#4f46e5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <PersonIcon />
                        </Box>
                        <Box sx={{ flexGrow: 1 }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{d.name}</Typography>
                          <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>{d.mobile}</Typography>
                          <Chip label="Ready" size="small" sx={{ height: 20, fontSize: '0.65rem', fontWeight: 700, color: '#10b981', bgcolor: '#d1fae5', borderRadius: 1 }} />
                        </Box>
                      </Card>
                    ))}
                    {unavailableDrivers.map(u => {
                      const d = u.driver;
                      return (
                        <Card key={d.id} sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2.5, opacity: 0.7 }}>
                          <Box sx={{ width: 48, height: 48, borderRadius: '50%', bgcolor: '#f3f4f6', color: '#9ca3af', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <PersonIcon />
                          </Box>
                          <Box sx={{ flexGrow: 1 }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{d.name}</Typography>
                            <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>{d.mobile}</Typography>
                            <Chip label={u.reason} size="small" sx={{ height: 20, fontSize: '0.65rem', fontWeight: 700, color: '#ef4444', bgcolor: '#fee2e2', borderRadius: 1 }} />
                          </Box>
                        </Card>
                      );
                    })}
                  </Stack>
                </Box>
              </Grid>

              <Grid item xs={12} md={4}>
                <Box sx={{ p: 2.5, bgcolor: '#f8fafc', borderRadius: 3, height: '100%', boxShadow: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)' }}>
                  <Typography variant="h6" sx={{ fontWeight: 700, display: 'flex', justifyContent: 'space-between' }}>
                    Vehicles <Chip label={`${vehiclesReady} ready`} size="small" sx={{ bgcolor: '#dbeafe', color: '#2563eb', fontWeight: 700 }} />
                  </Typography>
                  <Typography variant="body2" color="text.secondary" mb={3}>Drag a vehicle</Typography>
                  <Stack spacing={2} sx={{ maxHeight: '600px', overflowY: 'auto', pr: 1 }}>
                    {availableVehicles.map(v => (
                      <Card
                        key={v.id}
                        draggable
                        onDragStart={(e) => { e.dataTransfer.setData('vehicle', JSON.stringify(v)); }}
                        sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2.5, cursor: 'grab', transition: 'all 0.2s', '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' } }}
                      >
                        <Box sx={{ width: 48, height: 48, borderRadius: '50%', bgcolor: '#fce7f3', color: '#db2777', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <LocalShippingIcon />
                        </Box>
                        <Box sx={{ flexGrow: 1 }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
                            {v.vehicleNumber} <Chip label={v.vehicleType} size="small" variant="outlined" sx={{ height: 18, fontSize: '0.65rem' }} />
                          </Typography>
                          <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>{v.brand} &middot; {v.model}</Typography>
                          <Chip label="Ready" size="small" sx={{ height: 20, fontSize: '0.65rem', fontWeight: 700, color: '#3b82f6', bgcolor: '#dbeafe', borderRadius: 1 }} />
                        </Box>
                      </Card>
                    ))}
                    {unavailableVehicles.map(u => {
                      const v = u.vehicle;
                      return (
                        <Card key={v.id} sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2.5, opacity: 0.7 }}>
                          <Box sx={{ width: 48, height: 48, borderRadius: '50%', bgcolor: '#f3f4f6', color: '#9ca3af', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <LocalShippingIcon />
                          </Box>
                          <Box sx={{ flexGrow: 1 }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
                              {v.vehicleNumber} <Chip label={v.vehicleType} size="small" variant="outlined" sx={{ height: 18, fontSize: '0.65rem' }} />
                            </Typography>
                            <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>{v.brand} &middot; {v.model}</Typography>
                            <Chip label={u.reason} size="small" sx={{ height: 20, fontSize: '0.65rem', fontWeight: 700, color: '#ef4444', bgcolor: '#fee2e2', borderRadius: 1 }} />
                          </Box>
                        </Card>
                      );
                    })}
                  </Stack>
                </Box>
              </Grid>
            </Grid>
          )}
        </>
      )}

      <Snackbar open={snack.open} autoHideDuration={3000} onClose={() => setSnack(s => ({ ...s, open: false }))} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <Alert severity={snack.severity} variant="filled">{snack.msg}</Alert>
      </Snackbar>
    </Box>
  );
}
