import axios from 'axios';

const isProd = process.env.NODE_ENV === 'production';

// Production error sanitization
const safeLog = (prefix: string, ...args: any[]) => {
  if (isProd) {
    const sanitized = args.map(arg => {
      if (typeof arg === 'string') return arg.slice(0, 200);
      if (arg instanceof Error) return arg.message.slice(0, 200);
      if (typeof arg === 'object' && arg !== null) return JSON.stringify(arg).slice(0, 200);
      return String(arg).slice(0, 200);
    });
    console.log(`[API ${prefix}]`, ...sanitized);
  } else {
    console.log(`[API ${prefix}]`, ...args);
  }
};

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

apiClient.interceptors.response.use(
  (response) => {
    if (isProd) {
      safeLog('Response', `${response.config.method?.toUpperCase()} ${response.config.url}`, response.status);
    }
    return response;
  },
  (error) => {
    if (error.response && error.response.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
    }

    // Sanitized error logging
    if (isProd) {
      const status = error.response?.status;
      const url = error.config?.url;
      safeLog('Error', `${error.config?.method?.toUpperCase()} ${url}`, status || 'Network Error');
    } else {
      console.error('API Error:', error);
    }

    return Promise.reject(error);
  }
);

