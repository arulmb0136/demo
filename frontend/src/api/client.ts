import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export const apiClient = axios.create({
  baseURL: `${API_BASE_URL}/api/v1`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach JWT Bearer token and Correlation ID
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('ironclad_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Attach or generate client-side correlation ID trace
    if (!config.headers['X-Correlation-ID']) {
      config.headers['X-Correlation-ID'] = `fe-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handle 401 Unauthorized
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Avoid looping if already on /signin
      if (!window.location.pathname.includes('/signin')) {
        localStorage.removeItem('ironclad_token');
        localStorage.removeItem('ironclad_user');
        window.location.href = '/signin';
      }
    }
    return Promise.reject(error);
  }
);
