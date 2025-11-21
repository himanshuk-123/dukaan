import api from "./ApiService";

const CategoryService = {
  getAllCategories: async () => {
    try {
      const response = await api.get('/categories');
      return response.data;
    } catch (error) {
      console.error('Error in getAllCategories CategoryService:', error);
      throw error;
    }
  },

  getShopsByCategory: async (categoryName, params = {}) => {
    try {
      const { page = 1, limit = 20, search = '' } = params;
      const response = await api.get(`/categories/${encodeURIComponent(categoryName)}/shops`, {
        params: { page, limit, search }
      });
      return response.data;
    } catch (error) {
      console.error('Error in getShopsByCategory CategoryService:', error);
      throw error;
    }
  }
};

export default CategoryService;