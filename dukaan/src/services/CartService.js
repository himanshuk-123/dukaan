import api from './ApiService';

const CART_BASE = '/cart';

const CartService = {
  getCart: async () => {
    try {
      const res = await api.get(`${CART_BASE}`);
      // Expecting { success, message, data }
      return res.data;
    } catch (err) {
      console.error('CartService.getCart error:', err?.response?.data || err.message);
      throw err;
    }
  },

  addToCart: async (productId, quantity = 1) => {
    try {
      const payload = { product_id: productId, quantity };
      const res = await api.post(`${CART_BASE}/items`, payload);
      return res.data;
    } catch (err) {
      console.error('CartService.addToCart error:', err?.response?.data || err.message);
      throw err;
    }
  },

  updateCartItem: async (itemId, quantity) => {
    try {
      const payload = { quantity };
      const res = await api.put(`${CART_BASE}/items/${itemId}`, payload);
      return res.data;
    } catch (err) {
      console.error('CartService.updateCartItem error:', err?.response?.data || err.message);
      throw err;
    }
  },

  removeCartItem: async (itemId) => {
    try {
      const res = await api.delete(`${CART_BASE}/items/${itemId}`);
      return res.data;
    } catch (err) {
      console.error('CartService.removeCartItem error:', err?.response?.data || err.message);
      throw err;
    }
  },

  clearCart: async () => {
    try {
      const res = await api.delete(`${CART_BASE}`);
      return res.data;
    } catch (err) {
      console.error('CartService.clearCart error:', err?.response?.data || err.message);
      throw err;
    }
  }
};

export default CartService;
