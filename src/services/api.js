import axios from 'axios';
import Cookies from 'js-cookie';

const BASE_URL = import.meta.env.VITE_API_BASE_URL
  ? `${import.meta.env.VITE_API_BASE_URL}/api/v1`
  : '/api/v1';

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
});

const COOKIE_OPTIONS = {
  secure: window.location.protocol === 'https:',
  sameSite: 'Strict',
  path: '/',
};

api.interceptors.request.use((config) => {
  const token = Cookies.get('fleet_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
}, (error) => Promise.reject(error));

api.interceptors.response.use((response) => response, (error) => {
  if (error.response?.status === 401) {
    Cookies.remove('fleet_token', COOKIE_OPTIONS);
    Cookies.remove('fleet_refresh_token', COOKIE_OPTIONS);
    localStorage.removeItem('fleet_user');
    localStorage.removeItem('fleet_permissions');
  }
  return Promise.reject(error);
});

// ─── AUTH ────────────────────────────────────────────────────────────────────
export const authService = {
  login: (identifier, password) =>
    api.post('/auth/login', { identifier, password }),
  register: (firstName, lastName, email, phoneNumber, password) =>
    api.post('/auth/register', { firstName, lastName, email, phoneNumber, password }),
  me: () => api.get('/auth/me'),
  logout: (refreshToken) => api.post('/auth/logout', { refreshToken }),
  refresh: (refreshToken) => api.post('/auth/refresh', { refreshToken }),
  requestPasswordReset: (email) =>
    api.post('/auth/forgot-password', { email }),
  verifyPasswordResetOtp: (email, otp) =>
    api.post('/auth/verify-otp', { email, otp }),
  resetPassword: (email, otp, newPassword) =>
    api.post('/auth/reset-password', { email, otp, newPassword }),
};

// ─── NOTIFICATIONS ───────────────────────────────────────────────────────
export const notificationService = {
  getAll: (params) => api.get('/me/notifications', { params }),
  getUnreadCount: () => api.get('/me/notifications/unread-count'),
  markAsRead: (id) => api.get(`/me/notifications/${id}/ack`),
  markAllAsRead: () => api.get('/me/notifications-ack-all'),
};

// ─── VEHICLES ────────────────────────────────────────────────────────────────
export const vehicleService = {
  getAll: (params) => api.get('/vehicles', { params }),
  getById: (id) => api.get(`/vehicles/${id}`),
  create: (data) => api.post('/vehicles', data),
  update: (id, data) => api.patch(`/vehicles/${id}`, data),
  updateStatus: (id, status) => api.patch(`/vehicles/${id}/status`, { status }),
};

// ─── VEHICLE COMPLIANCE ────────────────────────────────────────────────────────
export const vehicleComplianceService = {
  getDocuments: (vehicleId) => api.get(`/vehicle/${vehicleId}/compliance/documents`),
  getHistory: (vehicleId) => api.get(`/vehicle/${vehicleId}/compliance/history`),
  updateFastag: (vehicleId, data) => api.post(`/vehicle/${vehicleId}/compliance/fastag`, data),
  updateFitness: (vehicleId, data) => api.post(`/vehicle/${vehicleId}/compliance/fitness`, data),
  updateInsurance: (vehicleId, data) => api.post(`/vehicle/${vehicleId}/compliance/insurance`, data),
  updatePermits: (vehicleId, data) => api.post(`/vehicle/${vehicleId}/compliance/permits`, data),
  updatePuc: (vehicleId, data) => api.post(`/vehicle/${vehicleId}/compliance/puc`, data),
  updateRegistration: (vehicleId, data) => api.post(`/vehicle/${vehicleId}/compliance/registration`, data),
  updateRoadTax: (vehicleId, data) => api.post(`/vehicle/${vehicleId}/compliance/road-tax`, data),
  updateGpsDevice: (vehicleId, data) => api.post(`/vehicle/${vehicleId}/compliance/gps-device`, data),
};

export const complianceAlertsService = {
  getExpiring: () => api.get('/compliance/alerts/expiring'),
  getExpired: () => api.get('/compliance/alerts/expired'),
  getDashboard: () => api.get('/compliance/dashboard'),
};

// ─── DRIVERS ─────────────────────────────────────────────────────────────────
export const driverService = {
  getAll: (params) => api.get('/drivers', { params }),
  getById: (id) => api.get(`/drivers/${id}`),
  create: (data) => api.post('/drivers', data),
  update: (id, data) => api.patch(`/drivers/${id}`, data),
  updateStatus: (id, status) => api.patch(`/drivers/${id}/status`, { status }),
};

// ─── USERS ───────────────────────────────────────────────────────────────────
export const userService = {
  getAll: (params) => api.get('/users', { params }),
  getById: (id) => api.get(`/users/${id}`),
  create: (data) => api.post('/users', data),
  update: (id, data) => api.patch(`/users/${id}`, data),
  updateStatus: (id, status) => api.patch(`/users/${id}/status`, { status }),
  updatePassword: (id, password) => api.patch(`/users/${id}/password`, { password }),
};

// ─── ROLES ───────────────────────────────────────────────────────────────────
export const roleService = {
  getAll: () => api.get('/roles'),
  create: (data) => api.post('/roles', data),
  update: (id, data) => api.patch(`/roles/${id}`, data),
  assignPermissions: (id, permissionKeys) =>
    api.patch(`/roles/${id}/permissions`, { permissionKeys }),
};

// ─── PERMISSIONS ─────────────────────────────────────────────────────────────
export const permissionService = {
  getAll: () => api.get('/permissions'),
  create: (data) => api.post('/permissions', data),
  update: (id, data) => api.patch(`/permissions/${id}`, data),
};

// ─── ASSETS ──────────────────────────────────────────────────────────────────
export const assetService = {
  getAll: (params) => api.get('/assets', { params }),
  getById: (id) => api.get(`/assets/${id}`),
  create: (data) => api.post('/assets', data),
  update: (id, data) => api.patch(`/assets/${id}`, data),
  updateStatus: (id, currentStatus) => api.patch(`/assets/${id}/status`, { currentStatus }),
  assign: (id, data) => api.post(`/assets/${id}/assign`, data),
  returnAsset: (id, data) => api.post(`/assets/${id}/return`, data),
  transfer: (id, data) => api.post(`/assets/${id}/transfer`, data),
  markDamaged: (id, data) => api.post(`/assets/${id}/mark-damaged`, data),
  markLost: (id, data) => api.post(`/assets/${id}/mark-lost`, data),
  history: (id) => api.get(`/assets/${id}/history`),
};

// ─── FUEL ─────────────────────────────────────────────────────────────────────
export const fuelService = {
  getAll: (params) => api.get('/fuel', { params }),
  getById: (id) => api.get(`/fuel/${id}`),
  create: (data) => api.post('/fuel', data),
  update: (id, data) => api.patch(`/fuel/${id}`, data),
  delete: (id) => api.delete(`/fuel/${id}`),
  extractReceipt: (data) => api.post('/fuel/extract-receipt', data),
  submit: (id) => api.post(`/fuel/${id}/submit`),
  approve: (id) => api.post(`/fuel/${id}/approve`),
  reject: (id) => api.post(`/fuel/${id}/reject`),
  cancel: (id) => api.post(`/fuel/${id}/cancel`),
};

// ─── TRIPS ────────────────────────────────────────────────────────────────────
export const tripService = {
  getAll: (params) => api.get('/trips', { params }),
  getById: (id) => api.get(`/trips/${id}`),
  create: (data) => api.post('/trips', data),
  update: (id, data) => api.patch(`/trips/${id}`, data),
  schedule: (id, data) => api.post(`/trips/${id}/schedule`, data),
  start: (id, data) => api.post(`/trips/${id}/start`, data),
  complete: (id, data) => api.post(`/trips/${id}/complete`, data),
  cancel: (id, data) => api.post(`/trips/${id}/cancel`, data),
  history: (id) => api.get(`/trips/${id}/history`),
};

// ─── DISPATCH ─────────────────────────────────────────────────────────────────
export const dispatchService = {
  getBoard: () => api.get('/dispatch/board'),
};

// ─── REPAIRS ────────────────────────────────────────────────────────────────
export const repairService = {
  getAll: (params) => api.get('/repairs', { params }),
  getById: (id) => api.get(`/repairs/${id}`),
  create: (data) => api.post('/repairs', data),
  update: (id, data) => api.patch(`/repairs/${id}`, data),
  delete: (id) => api.delete(`/repairs/${id}`),
  start: (id) => api.post(`/repairs/${id}/start`),
  complete: (id) => api.post(`/repairs/${id}/complete`),
  cancel: (id) => api.post(`/repairs/${id}/cancel`),
};

// ─── MAINTENANCE ────────────────────────────────────────────────────────────
export const maintenanceService = {
  getAll: (params) => api.get('/maintenance', { params }),
  getById: (id) => api.get(`/maintenance/${id}`),
  create: (data) => api.post('/maintenance', data),
  update: (id, data) => api.patch(`/maintenance/${id}`, data),
  delete: (id) => api.delete(`/maintenance/${id}`),
  submit: (id) => api.post(`/maintenance/${id}/submit`),
  approve: (id) => api.post(`/maintenance/${id}/approve`),
  reject: (id) => api.post(`/maintenance/${id}/reject`),
  cancel: (id) => api.post(`/maintenance/${id}/cancel`),
};

// ─── ASSET CATEGORIES ────────────────────────────────────────────────────────
export const assetCategoryService = {
  getAll: () => api.get('/assets/categories'),
  create: (data) => api.post('/assets/categories', data),
  update: (id, data) => api.patch(`/assets/categories/${id}`, data),
};



// ─── FINANCE ──────────────────────────────────────────────────────────────────
export const financeService = {
  getPnL: (params) => api.get('/finance/pnl', { params }),
  getTransactions: (params) => api.get('/finance/transactions', { params }),
  getTransactionById: (id) => api.get(`/finance/transactions/${id}`),
  createTransaction: (data) => api.post('/finance/transactions', data),
  updateTransaction: (id, data) => api.put(`/finance/transactions/${id}`, data),
  deleteTransaction: (id) => api.delete(`/finance/transactions/${id}`),
  updateTransactionStatus: (id, status) => api.patch(`/finance/transactions/${id}/status`, { status }),
  getVendors: (params) => api.get('/finance/vendors', { params }),
  getVendorById: (id) => api.get(`/finance/vendors/${id}`),
  createVendor: (data) => api.post('/finance/vendors', data),
  updateVendor: (id, data) => api.put(`/finance/vendors/${id}`, data),
  deleteVendor: (id) => api.delete(`/finance/vendors/${id}`),
  getPayments: (params) => api.get('/finance/payments', { params }),
  createPayment: (data) => api.post('/finance/payments', data),
  getTripBillings: (params) => api.get('/finance/trip-billings', { params }),
  getTripBillingById: (id) => api.get(`/finance/trip-billings/${id}`),
  createTripBilling: (data) => api.post('/finance/trip-billings', data),
  updateTripBilling: (id, data) => api.put(`/finance/trip-billings/${id}`, data),
  deleteTripBilling: (id) => api.delete(`/finance/trip-billings/${id}`),
};

// ─── DRIVER ADVANCES ──────────────────────────────────────────────────────────
export const driverAdvanceService = {
  getAll: (params) => api.get('/driver-advances', { params }),
  getById: (id) => api.get(`/driver-advances/${id}`),
  create: (data) => api.post('/driver-advances', data),
  update: (id, data) => api.patch(`/driver-advances/${id}`, data),
  submit: (id, notes) => api.patch(`/driver-advances/${id}/submit`, { notes }),
  approve: (id, notes) => api.patch(`/driver-advances/${id}/approve`, { notes }),
  reject: (id, notes) => api.patch(`/driver-advances/${id}/reject`, { notes }),
  requestChanges: (id, notes) => api.patch(`/driver-advances/${id}/request-changes`, { notes }),
  issue: (id, data) => api.patch(`/driver-advances/${id}/issue`, data),
  cancel: (id, notes) => api.patch(`/driver-advances/${id}/cancel`, { notes }),
  getSettlements: (id, params) => api.get(`/driver-advances/${id}/settlements`, { params }),
  createSettlement: (id, data) => api.post(`/driver-advances/${id}/settlements`, data),
  getSummary: (params) => api.get('/driver-advances/reports/summary', { params }),
};

// ─── DRIVER SETTLEMENTS ───────────────────────────────────────────────────────
export const driverSettlementService = {
  getAll: (params) => api.get('/driver-settlements', { params }),
  getById: (id) => api.get(`/driver-settlements/${id}`),
  getSummary: (id) => api.get(`/driver-settlements/${id}/summary`),
  submit: (id, notes) => api.patch(`/driver-settlements/${id}/submit`, { notes }),
  review: (id, notes) => api.patch(`/driver-settlements/${id}/review`, { notes }),
  approve: (id, notes) => api.patch(`/driver-settlements/${id}/approve`, { notes }),
  settle: (id, data) => api.patch(`/driver-settlements/${id}/settle`, data),
  reject: (id, notes) => api.patch(`/driver-settlements/${id}/reject`, { notes }),
  requestChanges: (id, notes) => api.patch(`/driver-settlements/${id}/request-changes`, { notes }),
  cancel: (id, notes) => api.patch(`/driver-settlements/${id}/cancel`, { notes }),
};

// ─── ROLES (standalone functions) ───────────────────────────────────────────
export const getRoles = (token) =>
  api.get('/roles', { headers: { Authorization: `Bearer ${token}` } });

export const createRole = (token, data) =>
  api.post('/roles', data, { headers: { Authorization: `Bearer ${token}` } });

export const updateRole = (token, id, data) =>
  api.patch(`/roles/${id}`, data, { headers: { Authorization: `Bearer ${token}` } });

export const updateRolePermissions = (token, id, permissionKeys) =>
  api.patch(`/roles/${id}/permissions`, { permissionKeys }, { headers: { Authorization: `Bearer ${token}` } });

// ─── DOCUMENTS ────────────────────────────────────────────────────────────────
export const documentService = {
  getAll: (params) => api.get('/documents', { params }),
  getById: (id) => api.get(`/documents/${id}`),
  upload: (formData) => api.post('/documents/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  update: (id, data) => api.put(`/documents/${id}`, data),
  delete: (id) => api.delete(`/documents/${id}`),
  getViewUrl: (id) => api.get(`/documents/${id}/view`),
  getDownloadUrl: (id) => api.get(`/documents/${id}/download`),
  verify: (id, data) => api.post(`/documents/${id}/verify`, data),
  archive: (id) => api.post(`/documents/${id}/archive`),
};

// ─── PERMISSIONS (standalone functions) ─────────────────────────────────────
export const getPermissions = (token) =>
  api.get('/permissions', { headers: { Authorization: `Bearer ${token}` } });

// ─── DRIVER PORTAL ────────────────────────────────────────────────────────────
export const driverPortalService = {
  getProfile: () => api.get('/me/driver-profile'),
  updateProfile: (data) => api.put('/me/driver-profile', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  getTrips: (params) => api.get('/me/driver-trips', { params }),
  startTrip: (id, data) => api.post(`/me/driver-trips/${id}/start`, data),
  endTrip: (id, data) => api.post(`/me/driver-trips/${id}/end`, data),
  uploadPod: (id, formData) => api.post(`/me/driver-trips/${id}/pod`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  getDocuments: () => api.get('/me/driver-documents'),
  uploadDocument: (formData) => api.post('/me/driver-documents', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  getAdvances: () => api.get('/me/driver-advances'),
  getSettlements: () => api.get('/me/driver-settlements'),
  getVehicles: () => api.get('/me/driver-vehicles'),
};

// ─── DRIVER SUBMISSIONS ───────────────────────────────────────────────────────
export const driverSubmissionService = {
  getOverview: (params) => api.get('/driver-submissions', { params }),

  getFuel: (params) => api.get('/driver-submissions/fuel', { params }),
  approveFuel: (id, data) => api.patch(`/driver-submissions/fuel/${id}/approve`, data),
  rejectFuel: (id, data) => api.patch(`/driver-submissions/fuel/${id}/reject`, data),
  requestFuelChanges: (id, data) => api.patch(`/driver-submissions/fuel/${id}/request-changes`, data),

  getExpenses: (params) => api.get('/driver-submissions/expenses', { params }),
  approveExpense: (id, data) => api.patch(`/driver-submissions/expenses/${id}/approve`, data),
  rejectExpense: (id, data) => api.patch(`/driver-submissions/expenses/${id}/reject`, data),
  requestExpenseChanges: (id, data) => api.patch(`/driver-submissions/expenses/${id}/request-changes`, data),

  getDocuments: (params) => api.get('/driver-submissions/documents', { params }),
  verifyDocument: (id, data) => api.patch(`/driver-submissions/documents/${id}/verify`, data),
  rejectDocument: (id, data) => api.patch(`/driver-submissions/documents/${id}/reject`, data),
  requestDocumentChanges: (id, data) => api.patch(`/driver-submissions/documents/${id}/request-changes`, data),

  getIssues: (params) => api.get('/driver-submissions/issues', { params }),
  acknowledgeIssue: (id, data) => api.patch(`/driver-submissions/issues/${id}/acknowledge`, data),
  resolveIssue: (id, data) => api.patch(`/driver-submissions/issues/${id}/resolve`, data),
  rejectIssue: (id, data) => api.patch(`/driver-submissions/issues/${id}/reject`, data),

  getInspections: (params) => api.get('/driver-submissions/inspections', { params }),
  reviewInspection: (id, data) => api.patch(`/driver-submissions/inspections/${id}/review`, data),
  rejectInspection: (id, data) => api.patch(`/driver-submissions/inspections/${id}/reject`, data),
  requestInspectionChanges: (id, data) => api.patch(`/driver-submissions/inspections/${id}/request-changes`, data),
};

export default api;
