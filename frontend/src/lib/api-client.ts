import axios from 'axios';

export const apiClient = axios.create({
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  let apiBase = process.env.NEXT_PUBLIC_API_URL;

  if (!apiBase) {
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname;
      if (hostname === 'localhost' || hostname === '127.0.0.1' || /^192\.168\.\d+\.\d+$/.test(hostname)) {
        apiBase = `http://${hostname}:4000/api/v1`;
      } else {
        apiBase = `${window.location.origin}/api/v1`;
      }
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
