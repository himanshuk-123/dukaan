import { CartRepository } from '../repositories/cart.repositories.js';
import { ProductRepository } from '../repositories/product.repositories.js';
import { ValidationError } from './user.service.js';

const productRepository = new ProductRepository();

export class CartService {
  constructor() {
    this.cartRepository = new CartRepository();
  }

  /**
   * Get cart for user or guest
   * @param {number|null} userId - User ID
   * @param {string|null} guestId - Guest ID
   * @returns {Object} Cart with items
   */
  async getCart(userId = null, guestId = null) {
    try {
      if (!userId && !guestId) {
        throw new ValidationError('Either userId or guestId must be provided');
      }

      const cart = await this.cartRepository.getCartWithItems(userId, guestId);
      
      if (!cart) {
        // Create empty cart
        const newCart = await this.cartRepository.getOrCreateCart(userId, guestId);
        return {
          cart_id: newCart.cart_id,
          user_id: newCart.user_id,
          guest_id: newCart.guest_id,
          is_active: newCart.is_active,
          created_at: newCart.created_at,
          updated_at: newCart.updated_at,
          items: []
        };
      }

      return cart;
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      console.error('Error in getCart service:', error);
      throw new Error('Failed to fetch cart');
    }
  }

  /**
   * Add item to cart
   * @param {number|null} userId - User ID
   * @param {string|null} guestId - Guest ID
   * @param {number} productId - Product ID
   * @param {number} quantity - Quantity to add
   * @returns {Object} Cart item
   */
  async addToCart(userId = null, guestId = null, productId, quantity = 1) {
    try {
      if (!userId && !guestId) {
        throw new ValidationError('Either userId or guestId must be provided');
      }

      if (!productId || isNaN(productId)) {
        throw new ValidationError('Invalid product ID');
      }

      if (!quantity || quantity <= 0 || !Number.isInteger(quantity)) {
        throw new ValidationError('Quantity must be a positive integer');
      }

      // Check product availability
      const product = await productRepository.checkAvailability(parseInt(productId));
      if (!product) {
        throw new ValidationError('Product not found');
      }
      if (!product.available) {
        throw new ValidationError('Product is out of stock');
      }

      // Get or create cart
      const cart = await this.cartRepository.getOrCreateCart(userId, guestId);

      // Check if adding this quantity would exceed stock
      const cartWithItems = await this.cartRepository.getCartWithItems(userId, guestId);
      if (cartWithItems && cartWithItems.items) {
        const existingItem = cartWithItems.items.find(item => item.product_id === parseInt(productId));
        if (existingItem) {
          const newTotalQuantity = existingItem.quantity + quantity;
          if (newTotalQuantity > product.stock_quantity) {
            throw new ValidationError(`Only ${product.stock_quantity} items available in stock`);
          }
        } else if (quantity > product.stock_quantity) {
          throw new ValidationError(`Only ${product.stock_quantity} items available in stock`);
        }
      }

      // Add item to cart
      const cartItem = await this.cartRepository.addOrUpdateCartItem(
        cart.cart_id,
        parseInt(productId),
        quantity
      );

      return cartItem;
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      console.error('Error in addToCart service:', error);
      throw new Error('Failed to add item to cart');
    }
  }

  /**
   * Update cart item quantity
   * @param {number|null} userId - User ID
   * @param {string|null} guestId - Guest ID
   * @param {number} itemId - Cart item ID
   * @param {number} quantity - New quantity
   * @returns {Object} Updated cart item
   */
  async updateCartItem(userId = null, guestId = null, itemId, quantity) {
    try {
      if (!userId && !guestId) {
        throw new ValidationError('Either userId or guestId must be provided');
      }

      if (!itemId || isNaN(itemId)) {
        throw new ValidationError('Invalid item ID');
      }

      if (!quantity || quantity <= 0 || !Number.isInteger(quantity)) {
        throw new ValidationError('Quantity must be a positive integer');
      }

      // Get cart
      const cart = await this.cartRepository.getOrCreateCart(userId, guestId);

      // Get cart with items to check product availability
      const cartWithItems = await this.cartRepository.getCartWithItems(userId, guestId);
      if (!cartWithItems || !cartWithItems.items) {
        throw new ValidationError('Cart item not found');
      }

      const item = cartWithItems.items.find(i => i.item_id === parseInt(itemId));
      if (!item) {
        throw new ValidationError('Cart item not found');
      }

      // Check stock availability
      const product = await productRepository.checkAvailability(item.product_id);
      if (!product || !product.available) {
        throw new ValidationError('Product is out of stock');
      }
      if (quantity > product.stock_quantity) {
        throw new ValidationError(`Only ${product.stock_quantity} items available in stock`);
      }

      // Update item quantity
      const updatedItem = await this.cartRepository.updateCartItemQuantity(
        cart.cart_id,
        parseInt(itemId),
        quantity
      );

      if (!updatedItem) {
        throw new ValidationError('Cart item not found');
      }

      return updatedItem;
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      console.error('Error in updateCartItem service:', error);
      throw new Error('Failed to update cart item');
    }
  }

  /**
   * Remove item from cart
   * @param {number|null} userId - User ID
   * @param {string|null} guestId - Guest ID
   * @param {number} itemId - Cart item ID
   * @returns {boolean} True if removed
   */
  async removeCartItem(userId = null, guestId = null, itemId) {
    try {
      if (!userId && !guestId) {
        throw new ValidationError('Either userId or guestId must be provided');
      }

      if (!itemId || isNaN(itemId)) {
        throw new ValidationError('Invalid item ID');
      }

      const cart = await this.cartRepository.getOrCreateCart(userId, guestId);
      const removed = await this.cartRepository.removeCartItem(cart.cart_id, parseInt(itemId));

      if (!removed) {
        throw new ValidationError('Cart item not found');
      }

      return true;
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      console.error('Error in removeCartItem service:', error);
      throw new Error('Failed to remove cart item');
    }
  }

  /**
   * Clear cart
   * @param {number|null} userId - User ID
   * @param {string|null} guestId - Guest ID
   * @returns {boolean} True if cleared
   */
  async clearCart(userId = null, guestId = null) {
    try {
      if (!userId && !guestId) {
        throw new ValidationError('Either userId or guestId must be provided');
      }

      const cart = await this.cartRepository.getOrCreateCart(userId, guestId);
      await this.cartRepository.clearCart(cart.cart_id);
      return true;
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      console.error('Error in clearCart service:', error);
      throw new Error('Failed to clear cart');
    }
  }

  /**
   * Merge guest cart to user cart
   * @param {string} guestId - Guest ID
   * @param {number} userId - User ID
   * @returns {Object} Merged user cart
   */
  async mergeGuestCartToUser(guestId, userId) {
    try {
      if (!guestId) {
        throw new ValidationError('Guest ID is required');
      }
      if (!userId) {
        throw new ValidationError('User ID is required');
      }

      return await this.cartRepository.mergeGuestCartToUser(guestId, userId);
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      console.error('Error in mergeGuestCartToUser service:', error);
      throw new Error('Failed to merge guest cart');
    }
  }
}




