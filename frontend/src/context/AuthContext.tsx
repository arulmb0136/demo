import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { apiClient } from '../api/client';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<User>;
  logout: () => void;
  hasPermission: (permission: string) => boolean;
  hasRole: (role: string | string[]) => boolean;
  refreshUserProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('ironclad_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('ironclad_token');
  });

  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('ironclad_token');
      if (storedToken) {
        try {
          const res = await apiClient.get<User>('/auth/me');
          setUser(res.data);
          localStorage.setItem('ironclad_user', JSON.stringify(res.data));
        } catch (e) {
          console.warn('Failed to validate active session token:', e);
          logout();
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string): Promise<User> => {
    const res = await apiClient.post('/auth/login', { email, password });
    const { access_token, user: loggedUser } = res.data;

    localStorage.setItem('ironclad_token', access_token);
    localStorage.setItem('ironclad_user', JSON.stringify(loggedUser));

    setToken(access_token);
    setUser(loggedUser);
    return loggedUser;
  };

  const logout = () => {
    localStorage.removeItem('ironclad_token');
    localStorage.removeItem('ironclad_user');
    setToken(null);
    setUser(null);
  };

  const refreshUserProfile = async () => {
    try {
      const res = await apiClient.get<User>('/auth/me');
      setUser(res.data);
      localStorage.setItem('ironclad_user', JSON.stringify(res.data));
    } catch (err) {
      console.error('Failed to refresh user profile', err);
    }
  };

  const hasPermission = (permission: string): boolean => {
    if (!user) return false;
    // Admins implicitly possess all permissions
    if (user.role === 'admin') return true;
    return Array.isArray(user.permissions) && user.permissions.includes(permission);
  };

  const hasRole = (role: string | string[]): boolean => {
    if (!user) return false;
    if (Array.isArray(role)) {
      return role.includes(user.role);
    }
    return user.role === role;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        hasPermission,
        hasRole,
        refreshUserProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
