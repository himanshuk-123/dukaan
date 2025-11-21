import api from "./ApiService";
import AsyncStorage from '@react-native-async-storage/async-storage';

const AuthService = {
  login: async (email, password) => {
    try {
      const response = await api.post('/users/login', { email, password });
      return response.data;
    } catch (error) {
      console.error('Login error in AuthService:', error);
      throw error;
    }
  },

  register: async (userData) => {
    try {
      const response = await api.post('/users/register', userData);
      
      // Store tokens and user data
      if (response.data.success && response.data.data) {
        const { user } = response.data.data;
        const {accessToken,refreshToken} = response.data.data.tokens;
        await AsyncStorage.setItem('accessToken', accessToken);
        await AsyncStorage.setItem('refreshToken', refreshToken);
        await AsyncStorage.setItem('user', JSON.stringify(user));
      }
      
      return response.data;
    } catch (error) {
      console.error('Register error in AuthService:', error);
      throw error;
    }
  },

  logout: async () => {
    try {
      // Clear all stored data
      await AsyncStorage.removeItem('accessToken');
      await AsyncStorage.removeItem('refreshToken');
      await AsyncStorage.removeItem('user');
      await AsyncStorage.removeItem('guestId');
      return { success: true };
    } catch (error) {
      console.error('Logout error in AuthService:', error);
      throw error;
    }
  },

  getCurrentUser: async () => {
    try {
      const accessToken = await AsyncStorage.getItem('accessToken');
      if (!accessToken) {
        throw new Error('No access token found');
      }
      
      const response = await api.get('/users/me', {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      });
      
      return response.data;
    } catch (error) {
      console.error('Get current user error:', error);
      throw error;
    }
  },

  refreshToken: async () => {
    try {
      const refreshToken = await AsyncStorage.getItem('refreshToken');
      if (!refreshToken) {
        throw new Error('No refresh token found');
      }
      
      const response = await api.post('/auth/refresh', { refreshToken });
      
      if (response.data.success && response.data.data) {
        const { accessToken } = response.data.data;
        await AsyncStorage.setItem('accessToken', accessToken);
        return accessToken;
      }
      
      throw new Error('Token refresh failed');
    } catch (error) {
      console.error('Refresh token error:', error);
      throw error;
    }
  },

  updateProfile: async (profileData) => {
  try {
    const response = await api.put('/users/update-profile', profileData);

    if (response.data.success && response.data.data) {
      await AsyncStorage.setItem('user', JSON.stringify(response.data.data));
    }

    return response.data;

  } catch (error) {
    console.error('Update profile error:', error?.response?.data || error);
    throw error;
  }
},

  uploadProfileImage: async (imageUri) => {
    try {
      const formData = new FormData();
      
      // Extract filename from URI
      const filename = imageUri.split('/').pop();
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : 'image/jpeg';

      formData.append('image', {
        uri: imageUri,
        name: filename,
        type: type,
      });

      const response = await api.post('/users/upload-image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      // Update user data in AsyncStorage with new image URL
      if (response.data.success && response.data.data) {
        const storedUser = await AsyncStorage.getItem('user');
        if (storedUser) {
          const user = JSON.parse(storedUser);
          user.image_url = response.data.data.image_url;
          await AsyncStorage.setItem('user', JSON.stringify(user));
        }
      }

      return response.data;
    } catch (error) {
      console.error('Upload profile image error:', error?.response?.data || error);
      throw error;
    }
  }

  
}

export default AuthService;