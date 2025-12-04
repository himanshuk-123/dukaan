import ApiService from './ApiService';

const ShopService = {
  /**
   * Get shops by category with pagination and search
   * @param {string} category - Category name (required)
   * @param {Object} params - Query parameters { page, limit, search }
   * @returns {Promise} Response with shops array and pagination
   */
  getShopsByCategory: async (categoryId,params = {}) => {
    try {
      const {page = 1, limit = 20, search = '' } = params;
      
      const response = await ApiService.get('/shops', {
        params: {
          category:categoryId,
          page,
          limit,
          search
        }
      });
      
      return response.data;
    } catch (error) {
      console.error('Error fetching shops by category:', error);
      throw error;
    }
  },

  /**
   * Get shop by ID
   * @param {number} shopId - Shop ID
   * @returns {Promise} Shop details
   */
  getShopById: async (shopId) => {
    try {
      console.log('=== ShopService.getShopById ===');
      console.log('shopId:', shopId);
      const url = `/shops/${shopId}`;
      console.log('API URL:', url);
      
      const response = await ApiService.get(url);
      console.log('API Response status:', response.status);
      console.log('API Response data:', response.data);
      
      return response.data;
    } catch (error) {
      console.error('=== ShopService.getShopById ERROR ===');
      console.error('Error fetching shop details:', error);
      console.error('Error response:', error.response?.data);
      throw error;
    }
  },

  /**
   * Get products by shop ID with pagination
   * @param {number} shopId - Shop ID
   * @param {Object} params - Query parameters { page, limit }
   * @returns {Promise} Response with products array and pagination
   */
getProductsByShop: async (shop_id, params = {}) => {
  try {
    const { page = 1, limit = 20 } = params;
    const url = `/products`;

    console.log('API URL:', url, {
      params: {
        shop_id,
        page,
        limit
      }
    });

    const response = await ApiService.get(url, {
      params: {
        shop_id,
        page,
        limit
      }
    });

    console.log('API Response status:', response.status);
    console.log('API Response data:', response.data);

    return response.data;
  } catch (error) {
    console.error('=== ShopService.getProductsByShop ERROR ===');
    console.error('Error fetching shop products:', error);
    console.error('Error response:', error.response?.data);
    throw error;
  }
},


  /**
   * Get my shops (for shopkeepers)
   * @returns {Promise} List of user's shops
   */
  getMyShops: async () => {
    try {
      const response = await ApiService.get('/shops/my-shops');
      return response.data;
    } catch (error) {
      console.error('Error fetching my shops:', error);
      throw error;
    }
  },

  /**
   * Create a new shop (for shopkeepers)
   * @param {Object} shopData - Shop data
   * @returns {Promise} Created shop
   */
  createShop: async (shopData) => {
    try {
      const response = await ApiService.post('/shops', shopData);
      return response.data;
    } catch (error) {
      console.error('Error creating shop:', error);
      throw error;
    }
  },

  /**
   * Update shop (for shopkeepers)
   * @param {number} shopId - Shop ID
   * @param {Object} shopData - Updated shop data
   * @returns {Promise} Updated shop
   */
  updateShop: async (shopId, shopData) => {
    try {
      const response = await ApiService.put(`/shops/${shopId}`, shopData);
      return response.data;
    } catch (error) {
      console.error('Error updating shop:', error);
      throw error;
    }
  },

  /**
   * Delete shop (for shopkeepers)
   * @param {number} shopId - Shop ID
   * @returns {Promise} Success response
   */
  deleteShop: async (shopId) => {
    try {
      const response = await ApiService.delete(`/shops/${shopId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting shop:', error);
      throw error;
    }
  },

  /**
   * Upload shop image
   * @param {number} shopId - Shop ID
   * @param {FormData} formData - Form data with image file
   * @returns {Promise} Upload response
   */
  uploadShopImage: async (shopId, formData) => {
    try {
      const response = await ApiService.post(`/shops/${shopId}/upload-image`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error uploading shop image:', error);
      throw error;
    }
  },

  /**
   * Get shopkeeper's own shops
   * @returns {Promise} Response with shops array
   */
  getMyShops: async () => {
    try {
      const response = await ApiService.get('/shops/my-shops');
      return response.data;
    } catch (error) {
      console.error('Error fetching my shops:', error);
      throw error;
    }
  },

  /**
   * Get shop dashboard data
   * @param {number} shopId - Shop ID
   * @returns {Promise} Dashboard data
   */
  getShopDashboard: async (shopId) => {
    try {
      const response = await ApiService.get(`/shops/dashboard/${shopId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching shop dashboard:', error);
      throw error;
    }
  }
};

export default ShopService;