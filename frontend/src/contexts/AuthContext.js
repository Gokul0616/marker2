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
  const [error, setError] = useState(null);

  useEffect(() => {
    // Check if user is already authenticated
    const token = localStorage.getItem('authToken');
    const savedUser = localStorage.getItem('currentUser');
    
    if (token && savedUser) {
      try {
        const userObj = JSON.parse(savedUser);
        // Add default role if not present
        if (!userObj.role) {
          userObj.role = 'owner';
        }
        setUser(userObj);
        
        // Verify token is still valid
        authAPI.getCurrentUser()
          .then(currentUser => {
            // Ensure user has proper role
            if (!currentUser.role) {
              currentUser.role = 'owner';
            }
            setUser(currentUser);
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            setError(null);
          })
          .catch((err) => {
            // Token is invalid, clear auth
            console.error('Token validation failed:', err);
            logout();
          });
      } catch (error) {
        console.error('Error parsing saved user:', error);
        logout();
      }
    }
    
    setLoading(false);
  }, []);

  const register = async (userData) => {
    try {
      setError(null);
      const user = await authAPI.register(userData);
      return { success: true, user };
    } catch (error) {
      const errorMessage = error.response?.data?.detail || 'Registration failed';
      setError(errorMessage);
      return { 
        success: false, 
        error: errorMessage 
      };
    }
  };

  const login = async (email, password) => {
    try {
      setError(null);
      const response = await authAPI.login({ email, password });
      
      // Ensure user has proper role
      if (!response.user.role) {
        response.user.role = 'owner';
      }
      
      // Store auth token and user info
      localStorage.setItem('authToken', response.access_token);
      localStorage.setItem('currentUser', JSON.stringify(response.user));
      setUser(response.user);
      
      return { success: true, user: response.user };
    } catch (error) {
      const errorMessage = error.response?.data?.detail || 'Login failed';
      setError(errorMessage);
      
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
          error: errorMessage 
        };
      }
    }
  };

  const verifyMFA = async (userId, backupCode) => {
    try {
      setError(null);
      const response = await authAPI.verifyMFA(userId, backupCode);
      
      // Ensure user has proper role
      if (!response.user.role) {
        response.user.role = 'owner';
      }
      
      // Store auth token and user info
      localStorage.setItem('authToken', response.access_token);
      localStorage.setItem('currentUser', JSON.stringify(response.user));
      setUser(response.user);
      
      return { success: true, user: response.user };
    } catch (error) {
      const errorMessage = error.response?.data?.detail || 'MFA verification failed';
      setError(errorMessage);
      return { 
        success: false, 
        error: errorMessage 
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    setUser(null);
    setError(null);
  };

  const updateUser = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('currentUser', JSON.stringify(updatedUser));
  };

  const clearError = () => {
    setError(null);
  };

  const value = {
    user,
    loading,
    error,
    register,
    login,
    verifyMFA,
    logout,
    updateUser,
    clearError
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};