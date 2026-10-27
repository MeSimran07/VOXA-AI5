import { create } from 'zustand';
import { api } from '@/lib/api';

interface User {
  id: string;
  email: string;
  name: string | null;
  role: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string, rememberMe?: boolean) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  
  login: async (token: string, rememberMe: boolean = true) => {
    if (rememberMe) {
      localStorage.setItem('access_token', token);
      sessionStorage.removeItem('access_token');
    } else {
      sessionStorage.setItem('access_token', token);
      localStorage.removeItem('access_token');
    }
    try {
      const userData = await api.get<User>('/auth/me');
      set({ user: userData, isAuthenticated: true, isLoading: false });
    } catch (error) {
      localStorage.removeItem('access_token');
      set({ user: null, isAuthenticated: false, isLoading: false });
      throw error;
    }
  },
  
  logout: () => {
    localStorage.removeItem('access_token');
    sessionStorage.removeItem('access_token');
    set({ user: null, isAuthenticated: false });
  },
  
  checkAuth: async () => {
    const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
    if (!token) {
      set({ user: null, isAuthenticated: false, isLoading: false });
      return;
    }
    
    try {
      // Re-use token, API wrapper automatically attaches it
      const userData = await api.get<User>('/auth/me');
      set({ user: userData, isAuthenticated: true, isLoading: false });
    } catch (error) {
      localStorage.removeItem('access_token');
      sessionStorage.removeItem('access_token');
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  }
}));
