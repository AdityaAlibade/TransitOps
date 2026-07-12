import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('transitops_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors globally
api.interceptors.response.use(
  (response) => {
    // Standard backend format is { data: ... } or message response
    return response;
  },
  (error) => {
    if (error.response) {
      const status = error.response.status;
      const data = error.response.data;

      // Handle 401 Unauthorized globally
      if (status === 401) {
        localStorage.removeItem('transitops_token');
        // Avoid infinite loop if already on login page
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }
      }

      // Return user-friendly error object from backend structure
      return Promise.reject({
        status,
        message: data.message || data.error || 'An error occurred',
        errors: data.errors || null,
        raw: error,
      });
    }

    return Promise.reject({
      status: 500,
      message: error.message || 'Network error, please check if backend is running',
      errors: null,
      raw: error,
    });
  }
);
