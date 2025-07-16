import React, { createContext, useContext, useState, useEffect } from 'react';
import { mockUsers } from '../mock/data';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock authentication check
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    } else {
      // Auto-login as user1 for demo purposes
      setUser(mockUsers[0]);
      localStorage.setItem('currentUser', JSON.stringify(mockUsers[0]));
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    // Mock login logic
    const user = mockUsers.find(u => u.email === email);
    if (user) {
      setUser(user);
      localStorage.setItem('currentUser', JSON.stringify(user));
      return { success: true };
    }
    return { success: false, error: 'Invalid credentials' };
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('currentUser');
  };

  const switchUser = (userId) => {
    const newUser = mockUsers.find(u => u.id === userId);
    if (newUser) {
      setUser(newUser);
      localStorage.setItem('currentUser', JSON.stringify(newUser));
    }
  };

  const value = {
    user,
    login,
    logout,
    switchUser,
    loading
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};