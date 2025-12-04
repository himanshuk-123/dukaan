import ApiService from './ApiService';

const ProductService = {
  /**
   * Get shopkeeper's products with optional shop filter
   * @param {number} shopId - Shop ID filter (optional)
   * @param {Object} params - Query parameters { page, limit, search }
   * @returns {Promise} Response with products array and pagination
   */

  uploadProductImage: async (productId, formData) => {
  return ApiService.post(
    `/products/${productId}/upload-image`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data"
      }
    }
  );
},
  getMyProducts: async (shopId = null, params = {}) => {
    try {
      const { page = 1, limit = 20, search = '' } = params;
      
      const queryParams = {
        page,
        limit,
        search
      };

      if (shopId) {
        queryParams.shop_id = shopId;
      }

      const response = await ApiService.get('/products/my-products', {
        params: queryParams
      });
      
      return response.data;
    } catch (error) {
      console.error('Error fetching my products:', error);
      throw error;
    }
  },

  /**
   * Create a new product
   * @param {number} shopId - Shop ID
   * @param {Object} productData - Product data { name, description, price, stock_quantity, selling_price }
   * @returns {Promise} Created product
   */
  createProduct: async (shopId, productData) => {
    try {
      const payload = {
        shop_id: shopId,
        name: productData.name,
        description: productData.description || '',
        Base_Price: parseFloat(productData.Base_Price),
        stock_quantity: parseInt(productData.stock_quantity) || 0,
        selling_price: productData.selling_price ? parseFloat(productData.selling_price) : parseFloat(productData.Base_Price),
        unit: productData.unit || ''
      };

      const response = await ApiService.post('/products', payload);
      
      return response.data;
    } catch (error) {
      console.error('Error creating product:', error);
      throw error;
    }
  },

  /**
   * Update product
   * @param {number} productId - Product ID
   * @param {Object} productData - Updated product data
   * @returns {Promise} Updated product
   */
  updateProduct: async (productId, productData) => {
    try {
      const payload = {};
      
      if (productData.name !== undefined) payload.name = productData.name;
      if (productData.description !== undefined) payload.description = productData.description;
      if (productData.price !== undefined) payload.price = parseFloat(productData.price);

      const response = await ApiService.put(`/products/${productId}`, payload);
      
      return response.data;
    } catch (error) {
      console.error('Error updating product:', error);
      throw error;
    }
  },

  /**
   * Update inventory (stock and selling price)
   * @param {number} inventoryId - Inventory ID
   * @param {Object} inventoryData - Updated inventory data { stock_quantity, selling_price }
   * @returns {Promise} Updated inventory
   */
  updateInventory: async (inventoryId, inventoryData) => {
    try {
      const payload = {};
      
      if (inventoryData.stock_quantity !== undefined) {
        payload.stock_quantity = parseInt(inventoryData.stock_quantity);
      }
      if (inventoryData.selling_price !== undefined) {
        payload.selling_price = parseFloat(inventoryData.selling_price);
      }

      const response = await ApiService.put(`/products/inventory/${inventoryId}`, payload);
      
      return response.data;
    } catch (error) {
      console.error('Error updating inventory:', error);
      throw error;
    }
  },

  /**
   * Delete product (soft delete)
   * @param {number} productId - Product ID
   * @returns {Promise} Success response
   */
  deleteProduct: async (productId) => {
    try {
      const response = await ApiService.delete(`/products/${productId}`);
      
      return response.data;
    } catch (error) {
      console.error('Error deleting product:', error);
      throw error;
    }
  },

  /**
   * Get all products (public)
   * @param {Object} params - Query parameters { page, limit, search, shop_id }
   * @returns {Promise} Response with products array and pagination
   */
  getAllProducts: async (params = {}) => {
    try {
      const { page = 1, limit = 20, search = '', shop_id = null } = params;
      
      const queryParams = {
        page,
        limit,
        search
      };

      if (shop_id) {
        queryParams.shop_id = shop_id;
      }

      const response = await ApiService.get('/products', {
        params: queryParams
      });
      
      return response.data;
    } catch (error) {
      console.error('Error fetching products:', error);
      throw error;
    }
  },

  /**
   * Get product by ID
   * @param {number} productId - Product ID
   * @param {number} shopId - Shop ID (optional)
   * @returns {Promise} Product details
   */
  getProductById: async (productId, shopId = null) => {
    try {
      const params = {};
      if (shopId) {
        params.shop_id = shopId;
      }

      const response = await ApiService.get(`/products/${productId}`, {
        params
      });
      
      return response.data;
    } catch (error) {
      console.error('Error fetching product details:', error);
      throw error;
    }
  }

};



export default ProductService;
