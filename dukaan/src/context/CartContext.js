// context/CartContext.js
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import CartService from '../services/CartService.js';
import { Alert } from 'react-native'; // optional: for simple user feedback

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState({
    cart_id: null,
    user_id: null,
    items: [],
    summary: { itemCount: 0, total: 0 }
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch cart from server
  const fetchCart = useCallback(async (opts = { suppressError: false }) => {
    setLoading(true);
    setError(null);
    try {
      const response = await CartService.getCart();
      if (response?.success) {
        // The backend response contains data with cart + summary in controller
        setCart(response.data || {
          cart_id: null,
          user_id: null,
          items: [],
          summary: { itemCount: 0, total: 0 }
        });
      } else {
        // set empty cart if not success
        setCart(prev => ({ ...prev, items: [], summary: { itemCount: 0, total: 0 } }));
        if (!opts.suppressError) setError(response?.message || 'Failed to load cart');
      }
      return response;
    } catch (err) {
      console.error('fetchCart error', err);
      setError(err?.response?.data?.message || err.message || 'Failed to fetch cart');
      if (!opts.suppressError) {
        // optional UI feedback
        // Alert.alert('Cart error', errorMessage);
      }
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Add item (optimistic update pattern)
  const addItem = useCallback(async (productId, quantity = 1) => {
    setLoading(true);
    setError(null);

    // Optimistic: try merge locally first
    const existing = cart.items.find(it => it.product_id === productId);
    const optimisticItems = existing
      ? cart.items.map(it => it.product_id === productId ? { ...it, quantity: it.quantity + quantity } : it)
      : [
          ...cart.items,
          { // minimal optimistic shape, server will return authoritative item
            item_id: `temp-${productId}-${Date.now()}`,
            product_id: productId,
            quantity,
            product: { product_id: productId }
          }
        ];
    const prevCart = cart;
    setCart(prev => {
      const newSummary = calcSummary(optimisticItems);
      return { ...prev, items: optimisticItems, summary: newSummary };
    });

    try {
      const res = await CartService.addToCart(productId, quantity);
      if (res?.success) {
        // server returns cart item or updated cart; safest: refetch
        await fetchCart({ suppressError: true });
        return res;
      } else {
        throw new Error(res?.message || 'Add to cart failed');
      }
    } catch (err) {
      // revert optimistic update
      setCart(prevCart);
      setError(err?.response?.data?.message || err.message || 'Failed to add item');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [cart, fetchCart]);

  // Update item quantity (optimistic)
  const updateItem = useCallback(async (itemId, quantity) => {
    if (quantity <= 0) {
      throw new Error('Quantity must be greater than 0');
    }
    setLoading(true);
    setError(null);
    const prevCart = cart;
    const optimisticItems = cart.items.map(it => it.item_id === itemId ? { ...it, quantity } : it);
    setCart(prev => ({ ...prev, items: optimisticItems, summary: calcSummary(optimisticItems) }));

    try {
      const res = await CartService.updateCartItem(itemId, quantity);
      if (res?.success) {
        // refresh authoritative cart
        await fetchCart({ suppressError: true });
        return res;
      } else {
        throw new Error(res?.message || 'Update failed');
      }
    } catch (err) {
      setCart(prevCart);
      setError(err?.response?.data?.message || err.message || 'Failed to update item');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [cart, fetchCart]);

  // Remove item
  const removeItem = useCallback(async (itemId) => {
    setLoading(true);
    setError(null);
    const prevCart = cart;
    const optimisticItems = cart.items.filter(it => it.item_id !== itemId);
    setCart(prev => ({ ...prev, items: optimisticItems, summary: calcSummary(optimisticItems) }));

    try {
      const res = await CartService.removeCartItem(itemId);
      if (res?.success) {
        // optionally refetch
        await fetchCart({ suppressError: true });
        return res;
      } else {
        throw new Error(res?.message || 'Remove failed');
      }
    } catch (err) {
      setCart(prevCart);
      setError(err?.response?.data?.message || err.message || 'Failed to remove item');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [cart, fetchCart]);

  // Clear cart
  const clear = useCallback(async () => {
    setLoading(true);
    setError(null);
    const prevCart = cart;
    setCart({ cart_id: null, user_id: null, items: [], summary: { itemCount: 0, total: 0 } });

    try {
      const res = await CartService.clearCart();
      if (res?.success) {
        return res;
      } else {
        throw new Error(res?.message || 'Clear failed');
      }
    } catch (err) {
      setCart(prevCart);
      setError(err?.response?.data?.message || err.message || 'Failed to clear cart');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [cart]);

  // Helper: calculate summary
  const calcSummary = (items = []) => {
    const summary = items.reduce(
      (acc, it) => {
        const price = parseFloat(it.product?.selling_price ?? it.product?.base_price ?? 0) || 0;
        acc.itemCount += (it.quantity || 0);
        acc.total += price * (it.quantity || 0);
        return acc;
      },
      { itemCount: 0, total: 0 }
    );
    summary.total = parseFloat(summary.total.toFixed(2));
    return summary;
  };

  // Auto fetch cart on mount (if auth exists, ApiService interceptors will handle)
  useEffect(() => {
    fetchCart().catch(() => {
      // ignore here; individual calls will surface errors
    });
  }, [fetchCart]);

  const value = {
    cart,
    loading,
    error,
    fetchCart,
    addItem,
    updateItem,
    removeItem,
    clear,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

// Hook
export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error('useCart must be used within CartProvider');
  }
  return ctx;
};

export default CartContext;
