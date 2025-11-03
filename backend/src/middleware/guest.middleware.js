import { generateGuestId, isValidGuestId } from '../utils/guest.util.js';

/**
 * Middleware to extract or generate guest_id from request
 * Guest ID can be provided in:
 * 1. X-Guest-Id header (preferred)
 * 2. Or will be generated if not present
 */
export const handleGuestId = (req, res, next) => {
  // Skip if user is authenticated
  if (req.user) {
    return next();
  }

  // Check for guest_id in header
  let guestId = req.headers['x-guest-id'] || req.headers['x-guestid'];

  // Validate guest_id format if provided
  if (guestId && !isValidGuestId(guestId)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid guest ID format',
      error: 'Guest ID must be a valid UUID'
    });
  }

  // Generate new guest_id if not provided or invalid
  if (!guestId) {
    guestId = generateGuestId();
  }

  // Attach guest_id to request
  req.guestId = guestId;

  // Attach guest_id to response header for client to store
  res.setHeader('X-Guest-Id', guestId);

  next();
};

/**
 * Optional middleware - only processes guest_id if present
 * Doesn't generate new one if missing
 */
export const optionalGuestId = (req, res, next) => {
  // Skip if user is authenticated
  if (req.user) {
    return next();
  }

  // Check for guest_id in header
  let guestId = req.headers['x-guest-id'] || req.headers['x-guestid'];

  // Validate guest_id format if provided
  if (guestId && !isValidGuestId(guestId)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid guest ID format',
      error: 'Guest ID must be a valid UUID'
    });
  }

  // Attach guest_id to request if present
  if (guestId) {
    req.guestId = guestId;
    res.setHeader('X-Guest-Id', guestId);
  }

  next();
};




