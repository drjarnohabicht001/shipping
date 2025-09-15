'use client';

import React, { createContext, useContext, useReducer, useEffect, useCallback, ReactNode } from 'react';
import { User, AuthState, LoginCredentials, UserRole, hasPermission } from '@/types/auth';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { adminUserService } from '@/services/adminUserService';

interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

type AuthAction =
  | { type: 'LOGIN_START' }
  | { type: 'LOGIN_SUCCESS'; payload: User }
  | { type: 'LOGIN_FAILURE'; payload: string }
  | { type: 'LOGOUT' }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'CLEAR_ERROR' };

const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'LOGIN_START':
      return { ...state, isLoading: true, error: null };
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        user: action.payload,
        isAuthenticated: true,
        isLoading: false,
        error: null
      };
    case 'LOGIN_FAILURE':
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload
      };
    case 'LOGOUT':
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null
      };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    default:
      return state;
  }
};

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null
};

// Mock authentication service - replace with actual API calls
const mockAuthService = {
  async login(credentials: LoginCredentials): Promise<User> {
    try {
      // For development, we'll authenticate against Firestore admin users
      const adminUser = await adminUserService.getAdminUserByEmail(credentials.email);
      
      if (!adminUser) {
        throw new Error('Invalid credentials');
      }
      
      // In a real app, you'd verify the password hash here
      // For now, we'll use simple password check for development
      const validPasswords = {
        'admin@shipping.com': 'admin123',
        'user@shipping.com': 'user123'
      };
      
      if (validPasswords[credentials.email as keyof typeof validPasswords] !== credentials.password) {
        throw new Error('Invalid credentials');
      }
      
      if (!adminUser.isActive || adminUser.isLocked) {
        throw new Error('Account is inactive or locked');
      }
      
      return {
        id: adminUser.uid,
        email: adminUser.email,
        name: adminUser.name,
        role: adminUser.accessLevel === 'super_admin' ? UserRole.ADMIN : UserRole.USER,
        avatar: '/img/testimonials-1.webp',
        createdAt: adminUser.createdAt.toDate(),
        lastLogin: new Date(),
        isActive: adminUser.isActive
      };
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Authentication failed');
    }
  },
  
  async checkAuth(): Promise<User | null> {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) return null;
      
      // In development, we'll check for the seeded admin user
      const adminUser = await adminUserService.getAdminUserByEmail('admin@shipping.com');
      
      if (!adminUser || !adminUser.isActive || adminUser.isLocked) {
        return null;
      }
      
      return {
        id: adminUser.uid,
        email: adminUser.email,
        name: adminUser.name,
        role: adminUser.accessLevel === 'super_admin' ? UserRole.ADMIN : UserRole.USER,
        avatar: '/img/testimonials-1.webp',
        createdAt: adminUser.createdAt.toDate(),
        lastLogin: new Date(),
        isActive: adminUser.isActive
      };
    } catch (error) {
      console.error('Auth check failed:', error);
      return null;
    }
  }
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  const login = useCallback(async (credentials: LoginCredentials) => {
    dispatch({ type: 'LOGIN_START' });
    try {
      const user = await mockAuthService.login(credentials);
      const token = 'mock_token_' + user.id;
      localStorage.setItem('auth_token', token);
      // Set cookie for middleware
      document.cookie = `auth-token=${token}; path=/; max-age=86400; secure; samesite=strict`;
      dispatch({ type: 'LOGIN_SUCCESS', payload: user });
    } catch (error) {
      dispatch({ type: 'LOGIN_FAILURE', payload: (error as Error).message });
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('auth_token');
    // Remove cookie
    document.cookie = 'auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    dispatch({ type: 'LOGOUT' });
  }, []);

  const checkAuth = useCallback(async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const user = await mockAuthService.checkAuth();
      if (user) {
        // Ensure cookie is set for middleware
        const token = localStorage.getItem('auth_token');
        if (token) {
          document.cookie = `auth-token=${token}; path=/; max-age=86400; secure; samesite=strict`;
        }
        dispatch({ type: 'LOGIN_SUCCESS', payload: user });
      } else {
        dispatch({ type: 'LOGOUT' });
      }
    } catch (error) {
      dispatch({ type: 'LOGOUT' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  useEffect(() => {
    // Using development mode bypass for Firestore access
    console.log('AuthContext initialized - using development mode for Firestore access');
    checkAuth();
  }, []);

  const value: AuthContextType = {
    ...state,
    login,
    logout,
    checkAuth
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const usePermissions = () => {
  const { user } = useAuth();
  
  const checkPermission = (resource: string, action: string): boolean => {
    if (!user) return false;
    
    return hasPermission(user.role, resource, action);
  };
  
  return { hasPermission: checkPermission };
};