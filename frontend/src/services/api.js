import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('krishi_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authAPI = {
  login: (phone) => api.post('/auth/login', { phone }),
  register: (userData) => api.post('/auth/register', userData),
  getMe: () => api.get('/auth/me'),
};

export const mlAPI = {
  predictCrop: (data) => api.post('/ml/predict/crop', data),
  predictYield: (data) => api.post('/ml/predict/yield', data),
  predictNPK: (lat, lon) => api.post('/ml/predict/npk', { lat, lon }),
  getDetails: (data) => api.post('/ml/predict/explain', data)
};

export const recommendationsAPI = {
  save: (data) => api.post('/recommendations', data),
  getHistory: () => api.get('/recommendations'),
};

export const analysisAPI = {
  save: (data) => api.post('/analysis', data),
  getHistory: () => api.get('/analysis'),
  getStats: () => api.get('/analysis/stats'),
};

export const profileAPI = {
  get: () => api.get('/profile'),
  update: (data) => api.put('/profile', data),
};

export default api;
