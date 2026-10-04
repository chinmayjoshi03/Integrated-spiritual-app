import axios from 'axios';

export const resolveApiBaseUrl = (): string => {
  const envUrl = (import.meta.env.VITE_API_BASE_URL || '/api').trim();
  if (!envUrl || envUrl === '/' || envUrl === '/api') {
    return '/api';
  }
  const clean = envUrl.replace(/\/+$/, '');
  if (clean.endsWith('/api')) {
    return clean;
  }
  return `${clean}/api`;
};

export const API_BASE_URL = resolveApiBaseUrl();

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export default axiosInstance;