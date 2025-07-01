
import React, { createContext, useContext, useState, useEffect } from 'react';
import { api, User } from '@/lib/api';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (name: string, email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in
    const token = localStorage.getItem('parenthub_token');
    const savedUser = localStorage.getItem('parenthub_user');
    
    if (token && savedUser) {
      setUser(JSON.parse(savedUser));
      // Verify token is still valid
      api.getProfile().then((response) => {
        setUser(response.data.user);
        localStorage.setItem('parenthub_user', JSON.stringify(response.data.user));
      }).catch(() => {
        // Token is invalid, clear storage
        localStorage.removeItem('parenthub_token');
        localStorage.removeItem('parenthub_user');
        setUser(null);
      });
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    
    try {
      const response = await api.login(email, password);
      const { user, token } = response.data;
      
      setUser(user);
      localStorage.setItem('parenthub_token', token);
      localStorage.setItem('parenthub_user', JSON.stringify(user));
      setIsLoading(false);
      return true;
    } catch (error) {
      setIsLoading(false);
      return false;
    }
  };

  const signup = async (name: string, email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    
    try {
      const response = await api.signup(name, email, password);
      const { user, token } = response.data;
      
      setUser(user);
      localStorage.setItem('parenthub_token', token);
      localStorage.setItem('parenthub_user', JSON.stringify(user));
      setIsLoading(false);
      return true;
    } catch (error) {
      setIsLoading(false);
      throw error;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('parenthub_token');
    localStorage.removeItem('parenthub_user');
  };

  return (
    <AuthContext.Provider value={{ user, login, signup, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};
