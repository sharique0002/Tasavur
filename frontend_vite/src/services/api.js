import axios from 'axios';

/**
 * API Service
 * Centralized Axios instance with interceptors for authentication
 */

// Create axios instance with base configuration
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Enable cookies for refresh tokens
});

// =============================================================================
// REQUEST INTERCEPTOR
// =============================================================================

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// =============================================================================
// RESPONSE INTERCEPTOR
// =============================================================================

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

    // Don't retry on logout, refresh, or login endpoints
    const skipRetryUrls = ['/auth/logout', '/auth/refresh', '/auth/login'];
    const shouldSkipRetry = skipRetryUrls.some(url => originalRequest.url?.includes(url));

    // Handle 401 errors (unauthorized)
    if (error.response?.status === 401 && !originalRequest._retry && !shouldSkipRetry) {
      if (isRefreshing) {
        // Queue failed requests while refreshing
        return new Promise((resolve, reject) => {
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

      try {
        // Try to refresh token
        const response = await api.post('/auth/refresh');
        const { token } = response.data;

        localStorage.setItem('token', token);
        api.defaults.headers.Authorization = `Bearer ${token}`;
        originalRequest.headers.Authorization = `Bearer ${token}`;

        processQueue(null, token);
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed - logout user
        processQueue(refreshError, null);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

// =============================================================================
// AUTH API
// =============================================================================

export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  refresh: () => api.post('/auth/refresh'),
  getProfile: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/updateprofile', data),
  changePassword: (data) => api.put('/auth/changepassword', data),
  forgotPassword: (data) => api.post('/auth/forgot-password', data),
  resetPassword: (token, data) => api.post(`/auth/reset-password/${token}`, data),
  verifyEmail: (token) => api.post(`/auth/verify-email/${token}`),
  resendVerification: () => api.post('/auth/resend-verification'),
};

// =============================================================================
// STARTUP API
// =============================================================================

export const startupAPI = {
  create: (formData) => {
    const config = formData instanceof FormData
      ? { headers: { 'Content-Type': 'multipart/form-data' } }
      : {};
    return api.post('/startups', formData, config);
  },
  getAll: (params) => api.get('/startups', { params }),
  getById: (id) => api.get(`/startups/${id}`),
  update: (id, formData) => {
    const config = formData instanceof FormData
      ? { headers: { 'Content-Type': 'multipart/form-data' } }
      : {};
    return api.put(`/startups/${id}`, formData, config);
  },
  delete: (id) => api.delete(`/startups/${id}`),
  updateStatus: (id, data) => api.put(`/startups/${id}/status`, data),
};

// =============================================================================
// DASHBOARD API
// =============================================================================

export const dashboardAPI = {
  getStats: () => api.get('/dashboard'),
  getRecentActivity: (limit = 10) => api.get('/dashboard/recent-activity', { params: { limit } }),
};

// =============================================================================
// MENTORSHIP API
// =============================================================================

export const mentorshipAPI = {
  // Mentors
  getMentors: (params) => api.get('/mentorship/mentors', { params }),
  getMentor: (id) => api.get(`/mentorship/mentors/${id}`),

  // Requests
  createRequest: (data) => api.post('/mentorship/requests', data),
  getRequests: (params) => api.get('/mentorship/requests', { params }),
  getRequest: (id) => api.get(`/mentorship/requests/${id}`),
  selectMentor: (id, mentorId) => api.post(`/mentorship/requests/${id}/select-mentor`, { mentorId }),
  scheduleSession: (id, data) => api.post(`/mentorship/requests/${id}/schedule`, data),
  submitFeedback: (id, data) => api.post(`/mentorship/requests/${id}/feedback`, data),
  cancelRequest: (id, reason) => api.post(`/mentorship/requests/${id}/cancel`, { reason }),
};

// =============================================================================
// RESOURCE API
// =============================================================================

export const resourceAPI = {
  getAll: (params) => api.get('/resources', { params }),
  getOne: (id) => api.get(`/resources/${id}`),
  create: (formData) => {
    const config = formData instanceof FormData
      ? { headers: { 'Content-Type': 'multipart/form-data' } }
      : {};
    return api.post('/resources', formData, config);
  },
  update: (id, formData) => {
    const config = formData instanceof FormData
      ? { headers: { 'Content-Type': 'multipart/form-data' } }
      : {};
    return api.put(`/resources/${id}`, formData, config);
  },
  delete: (id) => api.delete(`/resources/${id}`),
  download: (id) => api.post(`/resources/${id}/download`),
  toggleLike: (id) => api.post(`/resources/${id}/like`),
  getPopular: (limit = 10) => api.get('/resources/popular', { params: { limit } }),
  getFeatured: (limit = 6) => api.get('/resources/featured', { params: { limit } }),
  getTags: () => api.get('/resources/tags'),
  getAnalytics: () => api.get('/resources/analytics'),
};

// =============================================================================
// NOTIFICATION API
// =============================================================================

export const notificationAPI = {
  getAll: (params) => api.get('/notifications', { params }),
  getUnreadCount: () => api.get('/notifications/unread-count'),
  markAsRead: (id) => api.put(`/notifications/${id}/read`),
  markAllAsRead: () => api.put('/notifications/read-all'),
  delete: (id) => api.delete(`/notifications/${id}`),
};

// =============================================================================
// FUNDING API
// =============================================================================

export const fundingAPI = {
  create: (data) => api.post('/funding/applications', data),
  getAll: (params) => api.get('/funding/applications', { params }),
  getOne: (id) => api.get(`/funding/applications/${id}`),
  update: (id, data) => api.put(`/funding/applications/${id}`, data),
  submit: (id) => api.post(`/funding/applications/${id}/submit`),
  withdraw: (id, reason) => api.post(`/funding/applications/${id}/withdraw`, { reason }),
  addReviewer: (id, reviewerId) => api.post(`/funding/applications/${id}/reviewers`, { reviewerId }),
  submitReview: (id, data) => api.post(`/funding/applications/${id}/review`, data),
  getStatistics: (params) => api.get('/funding/statistics', { params }),
};

// =============================================================================
// ADMIN API
// =============================================================================

export const adminAPI = {
  getUsers: (params) => api.get('/admin/users', { params }),
  getUser: (id) => api.get(`/admin/users/${id}`),
  updateUser: (id, data) => api.put(`/admin/users/${id}`, data),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
  getSystemStats: () => api.get('/admin/stats'),
};

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Extract error message from API error response
 * @param {Error} error - Axios error object
 * @returns {string} Human-readable error message
 */
export const handleAPIError = (error) => {
  if (error.response) {
    // Server responded with error status
    const { data, status } = error.response;

    // Handle validation errors
    if (data.errors && Array.isArray(data.errors)) {
      return data.errors.map(e => e.message || e.msg).join(', ');
    }

    // Handle generic message
    if (data.message) {
      return data.message;
    }

    // Default status-based messages
    const statusMessages = {
      400: 'Invalid request. Please check your input.',
      401: 'Please login to continue.',
      403: 'You do not have permission to perform this action.',
      404: 'The requested resource was not found.',
      429: 'Too many requests. Please try again later.',
      500: 'Server error. Please try again later.',
    };

    return statusMessages[status] || 'An error occurred';
  }

  if (error.request) {
    // Request made but no response
    return 'Unable to reach server. Please check your connection.';
  }

  // Something else happened
  return error.message || 'An unexpected error occurred';
};

/**
 * Check if error is a network error
 * @param {Error} error - Error object
 * @returns {boolean}
 */
export const isNetworkError = (error) => {
  return !error.response && error.request;
};

/**
 * Check if error is authentication error
 * @param {Error} error - Error object
 * @returns {boolean}
 */
export const isAuthError = (error) => {
  return error.response?.status === 401;
};

export default api;
