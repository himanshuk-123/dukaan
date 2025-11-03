import express from 'express';
import { getCart, addToCart, updateCartItem, removeCartItem, clearCart } from '../controllers/cart.controller.js';
import { handleGuestId } from '../middleware/guest.middleware.js';
import { verifyAccessToken } from '../utils/jwt.util.js';
import { UserRepository } from '../repositories/user.repositories.js';

const router = express.Router();
const userRepository = new UserRepository();

/**
 * Optional authentication middleware - tries to authenticate but doesn't fail if no token
 * This allows both authenticated and guest users to use cart endpoints
 */
const optionalAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const token = authHeader.substring(7);
      const decoded = verifyAccessToken(token);
      const user = await userRepository.findById(decoded.user_id);
      
      if (user && !user.is_deleted) {
        req.user = {
          user_id: user.user_id,
          email: user.email,
          role: user.role,
          name: user.name
        };
      }
    } catch (error) {
      // Authentication failed, continue as guest (don't set req.user)
    }
  }
  next();
};

// Middleware chain: try auth (optional) then handle guest ID
const cartMiddleware = [optionalAuth, handleGuestId];

/**
 * @route   GET /api/cart
 * @desc    Get cart (works for guest and authenticated users)
 * @access  Public (with guest ID or authentication)
 */
router.get('/', cartMiddleware, getCart);

/**
 * @route   POST /api/cart/items
 * @desc    Add item to cart (works for guest and authenticated users)
 * @access  Public (with guest ID or authentication)
 */
router.post('/items', cartMiddleware, addToCart);

/**
 * @route   PUT /api/cart/items/:itemId
 * @desc    Update cart item quantity (works for guest and authenticated users)
 * @access  Public (with guest ID or authentication)
 */
router.put('/items/:itemId', cartMiddleware, updateCartItem);

/**
 * @route   DELETE /api/cart/items/:itemId
 * @desc    Remove item from cart (works for guest and authenticated users)
 * @access  Public (with guest ID or authentication)
 */
router.delete('/items/:itemId', cartMiddleware, removeCartItem);

/**
 * @route   DELETE /api/cart
 * @desc    Clear cart (works for guest and authenticated users)
 * @access  Public (with guest ID or authentication)
 */
router.delete('/', cartMiddleware, clearCart);

export default router;

