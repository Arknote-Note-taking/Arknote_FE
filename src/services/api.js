import axios from 'axios';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
});

API.interceptors.request.use(
  (config) => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user?.token) {
      config.headers.Authorization = `Bearer ${user.token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

const forgotPassword = (email) => API.post('/auth/forgot-password', { email });
const resetPassword = (email, code, newPassword, confirmPassword) => 
  API.post('/auth/reset-password', { email, code, newPassword, confirmPassword });

export default {
  ...API,
  forgotPassword,
  resetPassword,
  get: API.get,
  post: API.post,
  put: API.put,
  delete: API.delete
};
