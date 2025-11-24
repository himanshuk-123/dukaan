import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AuthService from '../services/AuthService';

const AuthContext = createContext(undefined);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [role,setRole] = useState('')
  // Initialize auth state on app startup
  useEffect(() => {
    loadStoredAuth();
  }, []);

  const loadStoredAuth = async () => {
    try {
      setIsLoading(true);
      const storedUser = await AsyncStorage.getItem('user');
      const accessToken = await AsyncStorage.getItem('accessToken');

      if (storedUser && accessToken) {
        setUser(JSON.parse(storedUser));
        setIsAuthenticated(true);
        
        // Optionally refresh user profile from server
        try {
          const response = await AuthService.getCurrentUser();
          if (response.success) {
            setUser(response.data);
            await AsyncStorage.setItem('user', JSON.stringify(response.data));
          }
        } catch (error) {
          console.log('Could not refresh user profile:', error);
        }
      }
    } catch (error) {
      console.error('Error loading auth state:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = useCallback(async (email, password) => {
    try {
      setIsLoading(true);
      const response = await AuthService.login(email, password);
      
      if (response.success) {
        const userData = response.data.user;
        setUser(userData);
        setIsAuthenticated(true);
        setRole(userData.role);
        const { user } = response.data;
        const {accessToken,refreshToken} = response.data.tokens;
        await AsyncStorage.setItem('accessToken', accessToken);
        await AsyncStorage.setItem('refreshToken', refreshToken);
        await AsyncStorage.setItem('user', JSON.stringify(user));
        return response;
      }
      
      throw new Error(response.message || 'Login failed');
    } catch (error) {
      console.error('Login error in context:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const register = useCallback(async (userData) => {
    try {
      setIsLoading(true);
      const response = await AuthService.register(userData);
      
      if (response.success) {
        const newUser = response.data.user;
        setUser(newUser);
        setRole(newUser.role);
        setIsAuthenticated(true);
        return response;
      }
      
      throw new Error(response.message || 'Registration failed');
    } catch (error) {
      console.error('Register error in context:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      setIsLoading(true);
      await AuthService.logout();
      setUser(null);
      setIsAuthenticated(false);
    } catch (error) {
      console.error('Logout error:', error);
      // Still clear local state even if API call fails
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refreshUserProfile = useCallback(async () => {
    try {
      const response = await AuthService.getCurrentUser();
      if (response.success) {
        setUser(response.data);
        await AsyncStorage.setItem('user', JSON.stringify(response.data));
        return response.data;
      }
    } catch (error) {
      console.error('Error refreshing user profile:', error);
      throw error;
    }
  }, []);

const updateUserProfile = useCallback(async (updates) => {
  try {
    setIsLoading(true);

    const response = await AuthService.updateProfile(updates);

    if (response.success) {
      // real backend se updated user
      setUser(response.data);
      await AsyncStorage.setItem('user', JSON.stringify(response.data));
      return response.data;
    }

    throw new Error(response.message || 'Update failed');

  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  } finally {
    setIsLoading(false);
  }
}, []);

const uploadProfileImage = useCallback(async (imageUri) => {
  try {
    setIsLoading(true);

    const response = await AuthService.uploadProfileImage(imageUri);

    if (response.success) {
      // Update user with new image URL
      const updatedUser = { ...user, image_url: response.data.image_url };
      setUser(updatedUser);
      await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
      return response;
    }

    throw new Error(response.message || 'Upload failed');

  } catch (error) {
    console.error('Error uploading profile image:', error);
    throw error;
  } finally {
    setIsLoading(false);
  }
}, [user]);


  const value = {
    user,
    isLoading,
    isAuthenticated,
    login,
    role,
    register,
    logout,
    refreshUserProfile,
    updateUserProfile,
    uploadProfileImage,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
