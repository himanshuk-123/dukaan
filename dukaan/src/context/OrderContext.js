import React, { createContext, useContext, useState } from "react";
import OrderService from "../services/OrderService";
import { useCart } from "./CartContext";
import { useAddress } from "./AddressContext";

const OrderContext = createContext();

export const OrderProvider = ({ children }) => {
  const { fetchCart } = useCart();
  const { fetchDefaultAddress } = useAddress();

  const [orders, setOrders] = useState([]);
  const [currentOrder, setCurrentOrder] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // ✅ Place order
  const placeOrder = async (shopId, paymentMethod = "COD") => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await OrderService.placeOrder({
        shop_id: shopId,
        payment_method: paymentMethod,
      });

      if (response?.success) {
        setCurrentOrder(response.data);

        // Refresh cart & address after order placed
        await fetchCart();
        await fetchDefaultAddress();
      }

      return response;
    } catch (err) {
      console.error("OrderContext - placeOrder failed:", err);
      setError(err?.response?.data?.message || "Order failed");
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ Fetch order history
  const fetchOrders = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await OrderService.getOrders();

      if (response?.success) {
        setOrders(response.data);
      }

      return response;
    } catch (err) {
      console.error("OrderContext - fetchOrders failed:", err);
      setError(err?.response?.data?.message || "Failed to load orders");
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ Fetch order details
  const fetchOrderDetails = async (orderId) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await OrderService.getOrderDetails(orderId);

      if (response?.success) {
        setCurrentOrder(response.data);
      }

      return response;
    } catch (err) {
      console.error("OrderContext - fetchOrderDetails failed:", err);
      setError(err?.response?.data?.message || "Failed to load order details");
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <OrderContext.Provider
      value={{
        orders,
        currentOrder,
        isLoading,
        error,
        placeOrder,
        fetchOrders,
        fetchOrderDetails,
      }}
    >
      {children}
    </OrderContext.Provider>
  );
};

export const useOrder = () => {
  const context = useContext(OrderContext);

  if (!context) {
    throw new Error("useOrder must be used inside OrderProvider");
  }

  return context;
};

export default OrderContext;
