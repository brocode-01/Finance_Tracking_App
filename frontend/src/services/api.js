import axios from 'axios';

const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  timeout: 10000,
});


API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});


API.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);


export const authAPI = {
  register: (data) => API.post('/auth/register', data),
  login: (data) => API.post('/auth/login', data),
  getMe: () => API.get('/auth/me'),
  changePassword: (data) => API.put('/auth/change-password', data),
};


export const transactionsAPI = {
  getAll: (params) => API.get('/transactions', { params }),
  getOne: (id) => API.get(`/transactions/${id}`),
  create: (data) => API.post('/transactions', data),
  update: (id, data) => API.put(`/transactions/${id}`, data),
  delete: (id) => API.delete(`/transactions/${id}`),
  getCategories: () => API.get('/transactions/categories'),
};


export const analyticsAPI = {
  getSummary: (params) => API.get('/analytics/summary', { params }),
  getCategoryBreakdown: (params) => API.get('/analytics/category-breakdown', { params }),
  getMonthlyTrends: (params) => API.get('/analytics/monthly-trends', { params }),
  getIncomeVsExpense: (params) => API.get('/analytics/income-vs-expense', { params }),
  getRecent: (params) => API.get('/analytics/recent', { params }),
};


export const usersAPI = {
  getAll: (params) => API.get('/users', { params }),
  updateRole: (id, role) => API.put(`/users/${id}/role`, { role }),
  delete: (id) => API.delete(`/users/${id}`),
};

export default API;
