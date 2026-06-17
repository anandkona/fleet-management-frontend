import axios from 'axios';

const BASE_URL = `${import.meta.env.VITE_API_BASE_URL}/api/v1`;

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('fleet_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
}, (error) => Promise.reject(error));

api.interceptors.response.use((response) => response, (error) => {
  if (error.response?.status === 401) {
    localStorage.removeItem('fleet_token');
    localStorage.removeItem('fleet_user');
    localStorage.removeItem('fleet_refresh_token');
    window.location.href = '/login';
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

// ─── VEHICLES ────────────────────────────────────────────────────────────────
export const vehicleService = {
  getAll: (params) => api.get('/vehicles', { params }),
  getById: (id) => api.get(`/vehicles/${id}`),
  create: (data) => api.post('/vehicles', data),
  update: (id, data) => api.patch(`/vehicles/${id}`, data),
  updateStatus: (id, status) => api.patch(`/vehicles/${id}/status`, { status }),
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
};

// ─── FUEL ─────────────────────────────────────────────────────────────────────
export const fuelService = {
  getAll: (params) => api.get('/fuel', { params }),
  getById: (id) => api.get(`/fuel/${id}`),
  create: (data) => api.post('/fuel', data),
  update: (id, data) => api.patch(`/fuel/${id}`, data),
  delete: (id) => api.delete(`/fuel/${id}`),
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

// ─── ASSET CATEGORIES ────────────────────────────────────────────────────────
export const assetCategoryService = {
  getAll: () => api.get('/assets/categories'),
  create: (data) => api.post('/assets/categories', data),
  update: (id, data) => api.patch(`/assets/categories/${id}`, data),
};

// ─── DOCUMENTS ───────────────────────────────────────────────────────────────
export const documentService = {
  getAll: (params) => api.get('/documents', { params }),
  create: (data) => api.post('/documents', data),
  update: (id, data) => api.patch(`/documents/${id}`, data),
  delete: (id) => api.delete(`/documents/${id}`),
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

// ─── PERMISSIONS (standalone functions) ─────────────────────────────────────
export const getPermissions = (token) =>
  api.get('/permissions', { headers: { Authorization: `Bearer ${token}` } });

export default api;
