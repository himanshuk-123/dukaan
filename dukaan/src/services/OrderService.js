import api from "./ApiService";

const OrderService = {
  // Place a new order from cart
  placeOrder: async ({ shop_id, payment_method = "COD" }) => {
    try {
      const response = await api.post("/orders", {
        shop_id,
        payment_method,
      });

      return response.data;
    } catch (error) {
      console.error("Place order error:", error?.response?.data || error);
      throw error;
    }
  },

  // Get all user orders
  getOrders: async () => {
    try {
      const response = await api.get("/orders");
      return response.data;
    } catch (error) {
      console.error("Get orders error:", error?.response?.data || error);
      throw error;
    }
  },

  // Get order details by id
  getOrderDetails: async (orderId) => {
    try {
      const response = await api.get(`/orders/${orderId}`);
      return response.data;
    } catch (error) {
      console.error("Get order details error:", error?.response?.data || error);
      throw error;
    }
  },
};

export default OrderService;
