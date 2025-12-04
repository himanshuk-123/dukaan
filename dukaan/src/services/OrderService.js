// services/OrderService.js
import api from "./ApiService";

const OrderService = {
  getShopOrders: async (shopId) => {
    try {
      const response = await api.get(`/shop/orders/${shopId}`);
      // response.data.data is an array of lightweight order objects
      return response.data?.data || [];
    } catch (error) {
      console.error("Get shop orders error:", error?.response?.data || error);
      throw error;
    }
  },

  getShopOrderDetails: async (shopId, orderId) => {
    try {
      const response = await api.get(`/shop/orders/${shopId}/${orderId}`);
      // response.data.data is { order, items, address, payment }
      return response.data?.data;
    } catch (error) {
      console.error("Get shop order details error:", error?.response?.data || error);
      throw error;
    }
  },

  updateOrderStatus: async (shopId, orderId, newStatus) => {
    try {
      const response = await api.put(
        `/shop/orders/${shopId}/${orderId}/status`,
        { order_status: newStatus } // ensure uppercase at caller
      );
      return response.data?.data;
    } catch (error) {
      console.error("Update order status error:", error?.response?.data || error);
      throw error;
    }
  }
};

export default OrderService;
