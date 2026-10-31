import axios from 'axios';
import { ADMIN_ROUTES } from './adminConfig.js';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const TOKEN_KEY = 'qndx_token';
const USER_KEY = 'qndx_user';

const cachedRole = () => {
  try {
    return JSON.parse(localStorage.getItem(USER_KEY))?.role || null;
  } catch {
    return null;
  }
};

const clearSession = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};

const loginPathFor = () => (cachedRole() === 'admin' ? ADMIN_ROUTES.LOGIN : '/login');

const api = axios.create({ baseURL: API_URL });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      clearSession();
      if (window.location.pathname !== loginPathFor()) {
        window.location.assign(loginPathFor());
      }
    }
    return Promise.reject(error);
  }
);

export default api;
