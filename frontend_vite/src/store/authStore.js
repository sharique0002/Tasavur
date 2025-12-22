import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authAPI, handleAPIError } from '../services/api';

/**
 * Auth Store using Zustand
 * Manages authentication state, user data, and auth actions
 */
const useAuthStore = create(
  persist(
    (set, get) => ({
      // State
      user: null,
      token: null,
      isAuthenticated: false,
      loading: false,
      error: null,
      initialized: false,

      // =============================================================================
      // ACTIONS
      // =============================================================================

      /**
       * Initialize auth state from localStorage
       */
      initialize: () => {
        const token = localStorage.getItem('token');
        const userStr = localStorage.getItem('user');

        if (token && userStr) {
          try {
            const user = JSON.parse(userStr);
            set({
              token,
              user,
              isAuthenticated: true,
              initialized: true,
            });
          } catch (e) {
            // Invalid JSON in localStorage
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            set({ initialized: true });
          }
        } else {
          set({ initialized: true });
        }
      },

      /**
       * Login with email and password
       * @param {Object} credentials - { email, password }
       * @returns {Promise<Object>} Result with success status
       */
      login: async (credentials) => {
        set({ loading: true, error: null });

        try {
          const response = await authAPI.login(credentials);
          const { token, user } = response.data;

          // Store in localStorage and state
          localStorage.setItem('token', token);
          localStorage.setItem('user', JSON.stringify(user));

          set({
            user,
            token,
            isAuthenticated: true,
            loading: false,
            error: null,
          });

          return { success: true, user };
        } catch (error) {
          const errorMsg = handleAPIError(error);
          set({ error: errorMsg, loading: false });
          return { success: false, error: errorMsg };
        }
      },

      /**
       * Register new user
       * @param {Object} userData - Registration data
       * @returns {Promise<Object>} Result with success status
       */
      register: async (userData) => {
        set({ loading: true, error: null });

        try {
          const response = await authAPI.register(userData);
          const { token, user } = response.data;

          localStorage.setItem('token', token);
          localStorage.setItem('user', JSON.stringify(user));

          set({
            user,
            token,
            isAuthenticated: true,
            loading: false,
            error: null,
          });

          return { success: true, user };
        } catch (error) {
          const errorMsg = handleAPIError(error);
          set({ error: errorMsg, loading: false });
          return { success: false, error: errorMsg };
        }
      },

      /**
       * Logout current user
       */
      logout: async () => {
        try {
          await authAPI.logout();
        } catch (error) {
          // Ignore logout errors
          console.error('Logout error:', error);
        } finally {
          // Clear state regardless of API result
          localStorage.removeItem('token');
          localStorage.removeItem('user');

          set({
            user: null,
            token: null,
            isAuthenticated: false,
            error: null,
          });
        }
      },

      /**
       * Load/refresh current user profile
       * @returns {Promise<Object>} Result with user data
       */
      loadUser: async () => {
        const { token } = get();

        if (!token) {
          return { success: false, error: 'Not authenticated' };
        }

        set({ loading: true });

        try {
          const response = await authAPI.getProfile();
          const user = response.data.data;

          localStorage.setItem('user', JSON.stringify(user));
          set({ user, loading: false });

          return { success: true, user };
        } catch (error) {
          const errorMsg = handleAPIError(error);
          set({ loading: false, error: errorMsg });

          // If unauthorized, clear auth state
          if (error.response?.status === 401) {
            get().logout();
          }

          return { success: false, error: errorMsg };
        }
      },

      /**
       * Update user profile
       * @param {Object} data - Profile updates
       * @returns {Promise<Object>} Result with updated user
       */
      updateProfile: async (data) => {
        set({ loading: true, error: null });

        try {
          const response = await authAPI.updateProfile(data);
          const user = response.data.data;

          localStorage.setItem('user', JSON.stringify(user));
          set({ user, loading: false });

          return { success: true, user };
        } catch (error) {
          const errorMsg = handleAPIError(error);
          set({ error: errorMsg, loading: false });
          return { success: false, error: errorMsg };
        }
      },

      /**
       * Change password
       * @param {Object} data - { currentPassword, newPassword, confirmPassword }
       * @returns {Promise<Object>} Result
       */
      changePassword: async (data) => {
        set({ loading: true, error: null });

        try {
          await authAPI.changePassword(data);
          set({ loading: false });
          return { success: true };
        } catch (error) {
          const errorMsg = handleAPIError(error);
          set({ error: errorMsg, loading: false });
          return { success: false, error: errorMsg };
        }
      },

      /**
       * Clear any auth errors
       */
      clearError: () => set({ error: null }),

      /**
       * Check if user has a specific role
       * @param {string|string[]} roles - Role(s) to check
       * @returns {boolean}
       */
      hasRole: (roles) => {
        const { user } = get();
        if (!user) return false;

        const roleArray = Array.isArray(roles) ? roles : [roles];
        return roleArray.includes(user.role);
      },

      /**
       * Check if user is admin
       * @returns {boolean}
       */
      isAdmin: () => get().user?.role === 'admin',

      /**
       * Check if user is mentor
       * @returns {boolean}
       */
      isMentor: () => get().user?.role === 'mentor',

      /**
       * Check if user is founder
       * @returns {boolean}
       */
      isFounder: () => get().user?.role === 'founder',
    }),
    {
      name: 'auth-storage',
      version: 1,
      // Only persist specific fields
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

export default useAuthStore;
