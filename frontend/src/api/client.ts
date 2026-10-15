import axios, { AxiosError } from 'axios';
import {
  notifyRequestStart,
  notifyRequestEnd,
  notifyApiError,
} from '../context/LoadingContext';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export const apiClient = axios.create({
  baseURL: `${API_BASE_URL}/api/v1`,
  timeout: 20000, // 20 seconds timeout limit per user requirement
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach JWT Bearer token and trigger loader start
apiClient.interceptors.request.use(
  (config) => {
    // Notify loader that an API call started
    notifyRequestStart();

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
  (error) => {
    notifyRequestEnd();
    return Promise.reject(error);
  }
);

// Response Interceptor: Dismiss loader, handle 20s timeout and errors gracefully
apiClient.interceptors.response.use(
  (response) => {
    notifyRequestEnd();
    return response;
  },
  (error: AxiosError<any>) => {
    // Always dismiss active request loader immediately
    notifyRequestEnd();

    // Check for 20-second Timeout
    if (error.code === 'ECONNABORTED' || (error.message && error.message.toLowerCase().includes('timeout'))) {
      const endpoint = error.config?.url || 'Requested endpoint';
      notifyApiError(
        'Request took more than 20 seconds to respond. The operation was cancelled.',
        `Target: ${endpoint} (20s timeout exceeded)`,
        true
      );
      return Promise.reject(error);
    }

    // Handle 401 Unauthorized
    if (error.response && error.response.status === 401) {
      if (!window.location.pathname.includes('/signin')) {
        localStorage.removeItem('ironclad_token');
        localStorage.removeItem('ironclad_user');
        window.location.href = '/signin';
      }
      return Promise.reject(error);
    }

    // Handle 403 Forbidden (Permission checks)
    if (error.response && error.response.status === 403) {
      const detail = error.response.data?.detail || 'You do not have required permissions for this action.';
      notifyApiError('Access Forbidden', detail, false);
      return Promise.reject(error);
    }

    // Handle Network Connection Errors (backend down or unreachable)
    if (!error.response) {
      notifyApiError(
        'Unable to connect to the backend server.',
        'Please verify that the FastAPI backend is running on port 8000 and accessible.',
        false
      );
      return Promise.reject(error);
    }

    // Handle 500 Server Errors
    if (error.response.status >= 500) {
      const detail = error.response.data?.detail || error.message;
      notifyApiError('Internal Server Error', String(detail), false);
      return Promise.reject(error);
    }

    return Promise.reject(error);
  }
);
