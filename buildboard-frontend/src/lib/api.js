import axios from 'axios';

const envApiUrl = import.meta.env.VITE_API_URL;
const fallbackOrigin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5000';
const defaultBaseUrl = import.meta.env.DEV ? 'http://localhost:5000/api' : `${fallbackOrigin}/api`;
export const API_BASE_URL = envApiUrl || defaultBaseUrl;

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

// Interceptor to add access token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor to handle token refresh
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Do not intercept 401s for login or refresh requests
    const isAuthRoute = originalRequest.url?.includes('/auth/login') || originalRequest.url?.includes('/auth/refresh');

    if (error.response?.status === 401 && !originalRequest._retry && !isAuthRoute) {
      if (isRefreshing) {
        return new Promise(function (resolve, reject) {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = localStorage.getItem('refreshToken');

      if (!refreshToken) {
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }

      try {
        const { data } = await axios.post(
          `${api.defaults.baseURL}/auth/refresh`,
          { refreshToken },
          { withCredentials: true }
        );

        localStorage.setItem('token', data.token);
        localStorage.setItem('refreshToken', data.refreshToken);
        
        api.defaults.headers.common.Authorization = `Bearer ${data.token}`;
        originalRequest.headers.Authorization = `Bearer ${data.token}`;
        
        processQueue(null, data.token);
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;
