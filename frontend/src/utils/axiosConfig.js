import axios from 'axios';

// Base URL points to backend port 5000 in dev, or can use relative path in prod (if static server is co-located)
const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
});

// Interceptor to inject JWT token in every request
API.interceptors.request.use(
  (config) => {
    const userInfo = localStorage.getItem('userInfo')
      ? JSON.parse(localStorage.getItem('userInfo'))
      : null;

    if (userInfo && userInfo.token) {
      config.headers.Authorization = `Bearer ${userInfo.token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor to handle global response errors, e.g., 401 Unauthorized
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear user info and redirect to login if unauthorized
      localStorage.removeItem('userInfo');
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Global In-Memory Cache for GET requests to instantly load sections on continuous use
const apiCache = new Map();
const CACHE_TTL = 60 * 1000; // 60 seconds TTL

// Override GET to use cache
const originalGet = API.get;
API.get = async (url, config = {}) => {
  const cacheKey = url + JSON.stringify(config.params || {});
  
  const cached = apiCache.get(cacheKey);
  if (cached && (Date.now() - cached.timestamp < CACHE_TTL)) {
    return Promise.resolve({ data: cached.data, status: 200, fromCache: true });
  }

  const response = await originalGet.call(API, url, config);
  apiCache.set(cacheKey, { data: response.data, timestamp: Date.now() });
  return response;
};

// Clear cache on any mutation to ensure data stays perfectly fresh
const clearCacheMethods = ['post', 'put', 'patch', 'delete'];
clearCacheMethods.forEach((method) => {
  const originalMethod = API[method];
  API[method] = async (...args) => {
    apiCache.clear();
    return originalMethod.apply(API, args);
  };
});

export default API;
