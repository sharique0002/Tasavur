import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import axios from 'axios';

/**
 * Global Zustand Store
 * Manages auth, notifications, cache, and optimistic updates
 */

// Auth slice
const createAuthSlice = (set, get) => ({
  user: null,
  token: localStorage.getItem('token'),
  isAuthenticated: !!localStorage.getItem('token'),
  isLoading: false,
  
  setUser: (user) => set({ user, isAuthenticated: !!user }),
  
  setToken: (token) => {
    if (token) {
      localStorage.setItem('token', token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      localStorage.removeItem('token');
      delete axios.defaults.headers.common['Authorization'];
    }
    set({ token, isAuthenticated: !!token });
  },
  
  login: async (credentials) => {
    set({ isLoading: true });
    try {
      const response = await axios.post('/api/auth/login', credentials);
      const { token, user } = response.data;
      
      get().setToken(token);
      set({ user, isAuthenticated: true, isLoading: false });
      
      return { success: true, user };
    } catch (error) {
      set({ isLoading: false });
      return { 
        success: false, 
        error: error.response?.data?.message || 'Login failed' 
      };
    }
  },
  
  logout: () => {
    get().setToken(null);
    set({ user: null, isAuthenticated: false });
    get().clearCache();
  },
  
  fetchUser: async () => {
    if (!get().token) return;
    
    set({ isLoading: true });
    try {
      const response = await axios.get('/api/auth/me');
      set({ user: response.data.data, isLoading: false });
    } catch (error) {
      if (error.response?.status === 401) {
        get().logout();
      }
      set({ isLoading: false });
    }
  },
});

// Notification slice
const createNotificationSlice = (set, get) => ({
  notifications: [],
  unreadCount: 0,
  notificationsLoading: false,
  
  fetchNotifications: async (options = {}) => {
    set({ notificationsLoading: true });
    try {
      const response = await axios.get('/api/notifications', { params: options });
      set({ 
        notifications: response.data.notifications,
        unreadCount: response.data.unreadCount || 0,
        notificationsLoading: false
      });
    } catch (error) {
      set({ notificationsLoading: false });
    }
  },
  
  markAsRead: async (notificationId) => {
    try {
      await axios.put(`/api/notifications/${notificationId}/read`);
      
      set((state) => ({
        notifications: state.notifications.map((n) =>
          n._id === notificationId ? { ...n, read: true } : n
        ),
        unreadCount: Math.max(0, state.unreadCount - 1),
      }));
    } catch (error) {
      // Silently handle error
    }
  },
  
  markAllAsRead: async () => {
    try {
      await axios.put('/api/notifications/read-all');
      
      set((state) => ({
        notifications: state.notifications.map((n) => ({ ...n, read: true })),
        unreadCount: 0,
      }));
    } catch (error) {
      // Silently handle error
    }
  },
  
  addNotification: (notification) => {
    set((state) => ({
      notifications: [notification, ...state.notifications],
      unreadCount: state.unreadCount + 1,
    }));
  },
});

// Cache slice with TTL
const createCacheSlice = (set, get) => ({
  cache: {},
  
  setCache: (key, data, ttl = 5 * 60 * 1000) => {
    set((state) => ({
      cache: {
        ...state.cache,
        [key]: {
          data,
          expiresAt: Date.now() + ttl,
        },
      },
    }));
  },
  
  getCache: (key) => {
    const cached = get().cache[key];
    if (!cached) return null;
    
    if (Date.now() > cached.expiresAt) {
      // Expired - remove from cache
      set((state) => {
        const newCache = { ...state.cache };
        delete newCache[key];
        return { cache: newCache };
      });
      return null;
    }
    
    return cached.data;
  },
  
  invalidateCache: (key) => {
    set((state) => {
      const newCache = { ...state.cache };
      delete newCache[key];
      return { cache: newCache };
    });
  },
  
  clearCache: () => {
    set({ cache: {} });
  },
});

// Optimistic updates slice
const createOptimisticSlice = (set, get) => ({
  optimisticData: {},
  
  addOptimistic: (key, data) => {
    set((state) => ({
      optimisticData: {
        ...state.optimisticData,
        [key]: data,
      },
    }));
  },
  
  removeOptimistic: (key) => {
    set((state) => {
      const newData = { ...state.optimisticData };
      delete newData[key];
      return { optimisticData: newData };
    });
  },
  
  clearOptimistic: () => {
    set({ optimisticData: {} });
  },
});

// UI state slice
const createUISlice = (set) => ({
  sidebarOpen: true,
  activeModal: null,
  modalData: null,
  
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  
  openModal: (modalName, data = null) => set({ activeModal: modalName, modalData: data }),
  closeModal: () => set({ activeModal: null, modalData: null }),
});

// Dashboard data slice
const createDashboardSlice = (set, get) => ({
  startups: [],
  startupsLoading: false,
  startupsFilters: {
    search: '',
    domain: '',
    stage: '',
    status: '',
    page: 1,
    limit: 10,
  },
  startupsPagination: {
    total: 0,
    page: 1,
    pages: 1,
  },
  
  fetchStartups: async (filters) => {
    const cacheKey = `startups-${JSON.stringify(filters)}`;
    const cached = get().getCache(cacheKey);
    
    if (cached) {
      set({ 
        startups: cached.data, 
        startupsPagination: cached.pagination,
        startupsFilters: filters 
      });
      return;
    }
    
    set({ startupsLoading: true });
    try {
      const response = await axios.get('/api/startups', { params: filters });
      const { data, pagination } = response.data;
      
      set({ 
        startups: data, 
        startupsPagination: pagination,
        startupsLoading: false,
        startupsFilters: filters
      });
      
      get().setCache(cacheKey, { data, pagination }, 3 * 60 * 1000); // 3 min TTL
    } catch (error) {
      set({ startupsLoading: false });
    }
  },
  
  addStartupOptimistic: (startup) => {
    const tempId = `temp-${Date.now()}`;
    const optimisticStartup = { ...startup, _id: tempId, status: 'Pending' };
    
    set((state) => ({
      startups: [optimisticStartup, ...state.startups],
    }));
    
    get().addOptimistic(tempId, optimisticStartup);
    
    return tempId;
  },
  
  replaceOptimisticStartup: (tempId, realStartup) => {
    set((state) => ({
      startups: state.startups.map((s) => 
        s._id === tempId ? realStartup : s
      ),
    }));
    
    get().removeOptimistic(tempId);
    get().invalidateCache('startups');
  },
  
  updateStartupInList: (startupId, updates) => {
    set((state) => ({
      startups: state.startups.map((s) =>
        s._id === startupId ? { ...s, ...updates } : s
      ),
    }));
  },
});

// Mentorship slice
const createMentorshipSlice = (set, get) => ({
  mentorshipRequests: [],
  matchedMentors: [],
  mentorshipLoading: false,
  
  fetchMentorshipRequests: async () => {
    const cacheKey = 'mentorship-requests';
    const cached = get().getCache(cacheKey);
    
    if (cached) {
      set({ mentorshipRequests: cached });
      return;
    }
    
    set({ mentorshipLoading: true });
    try {
      const response = await axios.get('/api/mentorship/requests');
      set({ 
        mentorshipRequests: response.data.data, 
        mentorshipLoading: false 
      });
      
      get().setCache(cacheKey, response.data.data, 5 * 60 * 1000);
    } catch (error) {
      set({ mentorshipLoading: false });
    }
  },
  
  setMatchedMentors: (mentors) => set({ matchedMentors: mentors }),
});

// Combined store
const useStore = create(
  persist(
    (set, get) => ({
      ...createAuthSlice(set, get),
      ...createNotificationSlice(set, get),
      ...createCacheSlice(set, get),
      ...createOptimisticSlice(set, get),
      ...createUISlice(set, get),
      ...createDashboardSlice(set, get),
      ...createMentorshipSlice(set, get),
    }),
    {
      name: 'incubator-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        // Only persist these fields
        token: state.token,
        sidebarOpen: state.sidebarOpen,
      }),
    }
  )
);

export default useStore;
