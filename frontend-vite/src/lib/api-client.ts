import axios from 'axios';

export const apiClient = axios.create({
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  let apiBase = (import.meta as any).env?.VITE_API_URL || (import.meta as any).env?.NEXT_PUBLIC_API_URL;

  if (!apiBase) {
    if (typeof window !== 'undefined') {
      apiBase = `${window.location.origin}/api/v1`;
    } else {
      apiBase = 'http://localhost:4000/api/v1';
    }
  }

  if (config.url) {
    if (!config.url.startsWith('http://') && !config.url.startsWith('https://')) {
      const path = config.url.startsWith('/') ? config.url : `/${config.url}`;
      config.url = `${apiBase.replace(/\/+$/, '')}${path}`;
      config.baseURL = undefined;
    }
  }

  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('access_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }

  return config;
});
