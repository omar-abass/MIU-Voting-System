import { api } from './api.js';

const data = async (promise) => (await promise).data;
const withMeta = async (promise) => {
  const { data: d, meta } = await promise;
  return { items: d, meta };
};

export const authApi = {
  register: (body) => data(api.post('/auth/register', body)),
  verifyPhone: (body) => data(api.post('/auth/verify-phone', body)),
  resendOtp: (challengeId) => data(api.post('/auth/resend-otp', { challengeId })),
  login: (body) => data(api.post('/auth/login', body)),
  logout: () => data(api.post('/auth/logout')),
  me: () => data(api.get('/auth/me')),
  forgotPassword: (identifier) => data(api.post('/auth/forgot-password', { identifier })),
  resetPassword: (body) => data(api.post('/auth/reset-password', body)),
  requestPasswordChange: (body) => data(api.post('/auth/change-password', body)),
  confirmPasswordChange: (body) => data(api.post('/auth/change-password/verify', body))
};

export const referenceApi = {
  faculties: () => data(api.get('/faculties'))
};

export const userApi = {
  me: () => data(api.get('/users/me')),
  update: (body) => data(api.patch('/users/me', body)),
  clubs: () => data(api.get('/users/me/clubs')),
  uploadAvatar: (file) => data(api.upload('/users/me/avatar', file))
};

export const clubApi = {
  list: () => data(api.get('/clubs')),
  get: (id) => data(api.get(`/clubs/${id}`)),
  subscribe: (id) => data(api.post(`/clubs/${id}/subscribe`)),
  unsubscribe: (id) => data(api.delete(`/clubs/${id}/subscribe`))
};

export const eventApi = {
  university: (query) => data(api.get('/events/university', query)),
  clubs: (query) => data(api.get('/events/clubs', query)),
  get: (id) => data(api.get(`/events/${id}`)),
  requestVerification: (id) => data(api.post(`/events/${id}/voting-verification`)),
  vote: (id, body) => data(api.post(`/events/${id}/votes`, body))
};

export const resultApi = {
  university: () => data(api.get('/results/university')),
  clubs: () => data(api.get('/results/clubs')),
  competitions: () => data(api.get('/results/competitions')),
  get: (id) => data(api.get(`/results/${id}`))
};

export const competitionApi = {
  list: () => data(api.get('/competitions')),
  get: (id) => data(api.get(`/competitions/${id}`)),
  requestVerification: (id) => data(api.post(`/competitions/${id}/voting-verification`)),
  vote: (id, body) => data(api.post(`/competitions/${id}/votes`, body))
};

export const managerApi = {
  clubs: () => data(api.get('/manager/clubs')),
  clubStats: (id) => data(api.get(`/manager/clubs/${id}/stats`)),
  clubEvents: (id) => data(api.get(`/manager/clubs/${id}/events`)),
  event: (id) => data(api.get(`/manager/events/${id}`)),
  createEvent: (body) => data(api.post('/manager/events', body)),
  updateEvent: (id, body) => data(api.patch(`/manager/events/${id}`, body)),
  eventAction: (id, action) => data(api.post(`/manager/events/${id}/${action}`)),
  eligibleVoters: (id, search) => data(api.get(`/manager/events/${id}/eligible-voters`, { search })),
  delegatedVote: (id, body) => data(api.post(`/manager/events/${id}/delegated-votes`, body)),
  uploadImage: (file) => data(api.upload('/manager/uploads/options', file))
};

export const adminApi = {
  dashboard: () => data(api.get('/admin/dashboard')),
  users: (query) => withMeta(api.get('/admin/users', query)),
  user: (id) => data(api.get(`/admin/users/${id}`)),
  createUser: (body) => data(api.post('/admin/users', body)),
  updateUser: (id, body) => data(api.patch(`/admin/users/${id}`, body)),
  removeUser: (id) => data(api.delete(`/admin/users/${id}`)),
  faculties: () => data(api.get('/admin/faculties')),
  createFaculty: (body) => data(api.post('/admin/faculties', body)),
  updateFaculty: (id, body) => data(api.patch(`/admin/faculties/${id}`, body)),
  deleteFaculty: (id) => data(api.delete(`/admin/faculties/${id}`)),
  clubs: () => data(api.get('/admin/clubs')),
  createClub: (body) => data(api.post('/admin/clubs', body)),
  updateClub: (id, body) => data(api.patch(`/admin/clubs/${id}`, body)),
  assignManager: (clubId, userId, body) => data(api.put(`/admin/clubs/${clubId}/managers/${userId}`, body)),
  revokeManager: (clubId, userId) => data(api.delete(`/admin/clubs/${clubId}/managers/${userId}`)),
  events: (query) => data(api.get('/admin/events', query)),
  event: (id) => data(api.get(`/admin/events/${id}`)),
  createEvent: (body) => data(api.post('/admin/events', body)),
  updateEvent: (id, body) => data(api.patch(`/admin/events/${id}`, body)),
  deleteEvent: (id) => data(api.delete(`/admin/events/${id}`)),
  eventAction: (id, action) => data(api.post(`/admin/events/${id}/${action}`)),
  competitions: () => data(api.get('/admin/competitions')),
  competition: (id) => data(api.get(`/admin/competitions/${id}`)),
  createCompetition: (body) => data(api.post('/admin/competitions', body)),
  updateCompetition: (id, body) => data(api.patch(`/admin/competitions/${id}`, body)),
  deleteCompetition: (id) => data(api.delete(`/admin/competitions/${id}`)),
  competitionAction: (id, action) => data(api.post(`/admin/competitions/${id}/${action}`)),
  settings: () => data(api.get('/admin/settings')),
  updateSettings: (body) => data(api.patch('/admin/settings', body)),
  auditLogs: (query) => withMeta(api.get('/admin/audit-logs', query)),
  verifyAudit: () => data(api.get('/admin/audit-logs/verify')),
  uploadImage: (kind, file) => data(api.upload(`/admin/uploads/${kind}`, file))
};
