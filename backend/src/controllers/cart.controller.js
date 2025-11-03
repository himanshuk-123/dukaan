import { CartService } from '../service/cart.service.js';
import { ValidationError } from '../service/user.service.js';

const cartService = new CartService();

/**
 * Get cart (works for both guest and authenticated users)
 * @route GET /api/cart
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getCart = async (req, res) => {
  try {
    const userId = req.user ? req.user.user_id : null;
    const guestId = req.guestId || null;

    if (!userId && !guestId) {
      return res.status(400).json({
        success: false,
        message: 'Either authentication or guest ID is required'
      });
    }

    const cart = await cartService.getCart(userId, guestId);

    // Calculate total
    let total = 0;
    let itemCount = 0;
    if (cart.items && cart.items.length > 0) {
      cart.items.forEach(item => {
        total += parseFloat(item.product.price) * item.quantity;
        itemCount += item.quantity;
      });
    }

    res.status(200).json({
      success: true,
      message: 'Cart retrieved successfully',
      data: {
        ...cart,
        summary: {
          itemCount,
          total: parseFloat(total.toFixed(2))
        }
      }
    });
  } catch (error) {
    console.error('Error in getCart controller:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: 'Failed to fetch cart'
    });
  }
};

/**
 * Add item to cart (works for both guest and authenticated users)
 * @route POST /api/cart/items
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const addToCart = async (req, res) => {
  try {
    const userId = req.user ? req.user.user_id : null;
    const guestId = req.guestId || null;

    if (!userId && !guestId) {
      return res.status(400).json({
        success: false,
        message: 'Either authentication or guest ID is required'
      });
    }

    const { product_id, quantity = 1 } = req.body;

    if (!product_id) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        error: 'Product ID is required'
      });
    }

    const cartItem = await cartService.addToCart(userId, guestId, product_id, quantity);

    res.status(200).json({
      success: true,
      message: 'Item added to cart successfully',
      data: cartItem
    });
  } catch (error) {
    console.error('Error in addToCart controller:', error);

    if (error instanceof ValidationError) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        error: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: 'Failed to add item to cart'
    });
  }
};

/**
 * Update cart item quantity (works for both guest and authenticated users)
 * @route PUT /api/cart/items/:itemId
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const updateCartItem = async (req, res) => {
  try {
    const userId = req.user ? req.user.user_id : null;
    const guestId = req.guestId || null;

    if (!userId && !guestId) {
      return res.status(400).json({
        success: false,
        message: 'Either authentication or guest ID is required'
      });
    }

    const { itemId } = req.params;
    const { quantity } = req.body;

    if (!quantity) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        error: 'Quantity is required'
      });
    }

    const updatedItem = await cartService.updateCartItem(userId, guestId, itemId, quantity);

    res.status(200).json({
      success: true,
      message: 'Cart item updated successfully',
      data: updatedItem
    });
  } catch (error) {
    console.error('Error in updateCartItem controller:', error);

    if (error instanceof ValidationError) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        error: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: 'Failed to update cart item'
    });
  }
};

/**
 * Remove item from cart (works for both guest and authenticated users)
 * @route DELETE /api/cart/items/:itemId
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const removeCartItem = async (req, res) => {
  try {
    const userId = req.user ? req.user.user_id : null;
    const guestId = req.guestId || null;

    if (!userId && !guestId) {
      return res.status(400).json({
        success: false,
        message: 'Either authentication or guest ID is required'
      });
    }

    const { itemId } = req.params;

    await cartService.removeCartItem(userId, guestId, itemId);

    res.status(200).json({
      success: true,
      message: 'Item removed from cart successfully'
    });
  } catch (error) {
    console.error('Error in removeCartItem controller:', error);

    if (error instanceof ValidationError) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        error: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: 'Failed to remove cart item'
    });
  }
};

/**
 * Clear cart (works for both guest and authenticated users)
 * @route DELETE /api/cart
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const clearCart = async (req, res) => {
  try {
    const userId = req.user ? req.user.user_id : null;
    const guestId = req.guestId || null;

    if (!userId && !guestId) {
      return res.status(400).json({
        success: false,
        message: 'Either authentication or guest ID is required'
      });
    }

    await cartService.clearCart(userId, guestId);

    res.status(200).json({
      success: true,
      message: 'Cart cleared successfully'
    });
  } catch (error) {
    console.error('Error in clearCart controller:', error);

    if (error instanceof ValidationError) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        error: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: 'Failed to clear cart'
    });
  }
};




