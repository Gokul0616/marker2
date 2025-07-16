import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

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
    // Check if user is already authenticated
    const token = localStorage.getItem('authToken');
    const savedUser = localStorage.getItem('currentUser');
    
    if (token && savedUser) {
      try {
        const userObj = JSON.parse(savedUser);
        setUser(userObj);
        
        // Verify token is still valid
        authAPI.getCurrentUser()
          .then(currentUser => {
            setUser(currentUser);
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
          })
          .catch(() => {
            // Token is invalid, clear auth
            logout();
          });
      } catch (error) {
        logout();
      }
    }
    
    setLoading(false);
  }, []);

  const register = async (userData) => {
    try {
      const user = await authAPI.register(userData);
      return { success: true, user };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.detail || 'Registration failed' 
      };
    }
  };

  const login = async (email, password) => {
    try {
      const response = await authAPI.login({ email, password });
      
      // Store auth token and user info
      localStorage.setItem('authToken', response.access_token);
      localStorage.setItem('currentUser', JSON.stringify(response.user));
      setUser(response.user);
      
      return { success: true, user: response.user };
    } catch (error) {
      if (error.response?.status === 202) {
        // MFA required
        const userId = error.response.headers['x-user-id'];
        return { 
          success: false, 
          mfaRequired: true,
          userId: userId,
          error: 'MFA verification required' 
        };
      } else if (error.response?.status === 429) {
        // Rate limited
        return { 
          success: false, 
          error: 'Too many login attempts. Please try again later.' 
        };
      } else {
        return { 
          success: false, 
          error: error.response?.data?.detail || 'Login failed' 
        };
      }
    }
  };

  const verifyMFA = async (userId, backupCode) => {
    try {
      const response = await authAPI.verifyMFA(userId, backupCode);
      
      // Store auth token and user info
      localStorage.setItem('authToken', response.access_token);
      localStorage.setItem('currentUser', JSON.stringify(response.user));
      setUser(response.user);
      
      return { success: true, user: response.user };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.detail || 'MFA verification failed' 
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    setUser(null);
  };

  const updateUser = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('currentUser', JSON.stringify(updatedUser));
  };

  const value = {
    user,
    loading,
    register,
    login,
    verifyMFA,
    logout,
    updateUser
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};