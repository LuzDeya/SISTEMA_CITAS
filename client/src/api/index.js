import http from './http';

const data = (p) => p.then((r) => r.data);

export const authApi = {
  register: (body) => data(http.post('/auth/register', body)),
  login: (body) => data(http.post('/auth/login', body)),
  me: () => data(http.get('/auth/me')),
};
export const usersApi = {
  list: () => data(http.get('/users')),
  create: (body) => data(http.post('/users', body)),
  changeRole: (id, role) => data(http.patch(`/users/${id}/role`, { role })),
};
export const clientsApi = {
  list: (search = '') => data(http.get('/clients', { params: { search } })),
  create: (body) => data(http.post('/clients', body)),
  update: (id, body) => data(http.put(`/clients/${id}`, body)),
  remove: (id) => data(http.delete(`/clients/${id}`)),
};
export const servicesApi = {
  list: (params = {}) => data(http.get('/services', { params })),
  create: (body) => data(http.post('/services', body)),
  update: (id, body) => data(http.put(`/services/${id}`, body)),
};
export const employeesApi = {
  list: (params = {}) => data(http.get('/employees', { params })),
  create: (body) => data(http.post('/employees', body)),
  update: (id, body) => data(http.put(`/employees/${id}`, body)),
  setSchedule: (id, schedule) => data(http.put(`/employees/${id}/schedule`, { schedule })),
};
export const availabilityApi = {
  get: (params) => data(http.get('/availability', { params })),
};
export const appointmentsApi = {
  search: (params = {}) => data(http.get('/appointments', { params })),
  mine: () => data(http.get('/appointments/mine')),
  calendar: (params) => data(http.get('/appointments/calendar', { params })),
  get: (id) => data(http.get(`/appointments/${id}`)),
  create: (body) => data(http.post('/appointments', body)),
  update: (id, body) => data(http.put(`/appointments/${id}`, body)),
  cancel: (id, reason) => data(http.patch(`/appointments/${id}/cancel`, { reason })),
  status: (id, status) => data(http.patch(`/appointments/${id}/status`, { status })),
};
export const dashboardApi = {
  get: (params) => data(http.get('/dashboard', { params })),
};
