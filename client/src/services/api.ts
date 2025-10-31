import axios, { type AxiosError, type InternalAxiosRequestConfig, type AxiosResponse } from 'axios';

export const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
});

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = localStorage.getItem('ams:accessToken');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    const status = error.response?.status;
    if (status === 401) {
      localStorage.removeItem('ams:accessToken');
      localStorage.removeItem('ams:user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  },
);
