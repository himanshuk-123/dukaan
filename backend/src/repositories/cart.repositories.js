import { poolPromise } from '../config/db.config.js';
import sql from 'mssql';

export class CartRepository {
  /**
   * Get or create cart for user
   * @param {number|null} userId - User ID (null for guest)
   * @param {string|null} guestId - Guest ID (null for authenticated user)
   * @returns {Object} Cart data
   */
  async getOrCreateCart(userId = null, guestId = null) {
    try {
      const pool = await poolPromise;

      // First, try to find existing cart
      let query = '';
      let request = pool.request();

      if (userId) {
        query = `
          SELECT cart_id, user_id, guest_id, is_active, created_at, updated_at
          FROM Carts
          WHERE user_id = @userId AND is_active = 1
        `;
        request.input('userId', sql.Int, userId);
      } else if (guestId) {
        query = `
          SELECT cart_id, user_id, guest_id, is_active, created_at, updated_at
          FROM Carts
          WHERE guest_id = @guestId AND is_active = 1
        `;
        request.input('guestId', sql.NVarChar(50), guestId);
      } else {
        throw new Error('Either userId or guestId must be provided');
      }

      const result = await request.query(query);

      if (result.recordset.length > 0) {
        return result.recordset[0];
      }

      // Create new cart if doesn't exist
      const insertQuery = userId
        ? `INSERT INTO Carts (user_id, guest_id, is_active) OUTPUT INSERTED.cart_id, INSERTED.user_id, INSERTED.guest_id, INSERTED.is_active, INSERTED.created_at, INSERTED.updated_at VALUES (@userId, NULL, 1)`
        : `INSERT INTO Carts (user_id, guest_id, is_active) OUTPUT INSERTED.cart_id, INSERTED.user_id, INSERTED.guest_id, INSERTED.is_active, INSERTED.created_at, INSERTED.updated_at VALUES (NULL, @guestId, 1)`;

      const insertRequest = pool.request();
      if (userId) {
        insertRequest.input('userId', sql.Int, userId);
      } else {
        insertRequest.input('guestId', sql.NVarChar(50), guestId);
      }

      const insertResult = await insertRequest.query(insertQuery);
      return insertResult.recordset[0];
    } catch (error) {
      console.error('Database error in getOrCreateCart:', error);
      throw new Error(`Database operation failed: ${error.message}`);
    }
  }

  /**
   * Get cart with items
   * @param {number|null} userId - User ID
   * @param {string|null} guestId - Guest ID
   * @returns {Object|null} Cart with items or null
   */
  async getCartWithItems(userId = null, guestId = null) {
    try {
      const pool = await poolPromise;
      let query = '';
      let request = pool.request();

      if (userId) {
        query = `
          SELECT 
            c.cart_id,
            c.user_id,
            c.guest_id,
            c.is_active,
            c.created_at,
            c.updated_at,
            ci.item_id,
            ci.product_id,
            ci.quantity,
            ci.created_at as item_created_at,
            p.name as product_name,
            p.description as product_description,
            p.price as product_price,
            p.stock_quantity as product_stock
          FROM Carts c
          LEFT JOIN CartItems ci ON c.cart_id = ci.cart_id
          LEFT JOIN Products p ON ci.product_id = p.product_id AND p.is_deleted = 0
          WHERE c.user_id = @userId AND c.is_active = 1
          ORDER BY ci.created_at DESC
        `;
        request.input('userId', sql.Int, userId);
      } else if (guestId) {
        query = `
          SELECT 
            c.cart_id,
            c.user_id,
            c.guest_id,
            c.is_active,
            c.created_at,
            c.updated_at,
            ci.item_id,
            ci.product_id,
            ci.quantity,
            ci.created_at as item_created_at,
            p.name as product_name,
            p.description as product_description,
            p.price as product_price,
            p.stock_quantity as product_stock
          FROM Carts c
          LEFT JOIN CartItems ci ON c.cart_id = ci.cart_id
          LEFT JOIN Products p ON ci.product_id = p.product_id AND p.is_deleted = 0
          WHERE c.guest_id = @guestId AND c.is_active = 1
          ORDER BY ci.created_at DESC
        `;
        request.input('guestId', sql.NVarChar(50), guestId);
      } else {
        throw new Error('Either userId or guestId must be provided');
      }

      const result = await request.query(query);

      if (result.recordset.length === 0) {
        return null;
      }

      // Structure the cart data
      const cartData = {
        cart_id: result.recordset[0].cart_id,
        user_id: result.recordset[0].user_id,
        guest_id: result.recordset[0].guest_id,
        is_active: result.recordset[0].is_active,
        created_at: result.recordset[0].created_at,
        updated_at: result.recordset[0].updated_at,
        items: []
      };

      // Group items
      result.recordset.forEach(row => {
        if (row.item_id) {
          cartData.items.push({
            item_id: row.item_id,
            product_id: row.product_id,
            quantity: row.quantity,
            created_at: row.item_created_at,
            product: {
              product_id: row.product_id,
              name: row.product_name,
              description: row.product_description,
              price: parseFloat(row.product_price),
              stock_quantity: row.product_stock
            }
          });
        }
      });

      return cartData;
    } catch (error) {
      console.error('Database error in getCartWithItems:', error);
      throw new Error(`Database operation failed: ${error.message}`);
    }
  }

  /**
   * Add or update item in cart
   * @param {number} cartId - Cart ID
   * @param {number} productId - Product ID
   * @param {number} quantity - Quantity to add/update
   * @returns {Object} Cart item data
   */
  async addOrUpdateCartItem(cartId, productId, quantity) {
    try {
      const pool = await poolPromise;

      // Check if item already exists
      const checkResult = await pool.request()
        .input('cartId', sql.Int, cartId)
        .input('productId', sql.Int, productId)
        .query(`
          SELECT item_id, quantity
          FROM CartItems
          WHERE cart_id = @cartId AND product_id = @productId
        `);

      if (checkResult.recordset.length > 0) {
        // Update existing item
        const newQuantity = checkResult.recordset[0].quantity + quantity;
        const updateResult = await pool.request()
          .input('cartId', sql.Int, cartId)
          .input('productId', sql.Int, productId)
          .input('quantity', sql.Int, newQuantity)
          .query(`
            UPDATE CartItems
            SET quantity = @quantity
            OUTPUT INSERTED.item_id, INSERTED.cart_id, INSERTED.product_id, INSERTED.quantity, INSERTED.created_at
            WHERE cart_id = @cartId AND product_id = @productId
          `);

        // Update cart updated_at
        await pool.request()
          .input('cartId', sql.Int, cartId)
          .query(`UPDATE Carts SET updated_at = GETDATE() WHERE cart_id = @cartId`);

        return updateResult.recordset[0];
      } else {
        // Insert new item
        const insertResult = await pool.request()
          .input('cartId', sql.Int, cartId)
          .input('productId', sql.Int, productId)
          .input('quantity', sql.Int, quantity)
          .query(`
            INSERT INTO CartItems (cart_id, product_id, quantity)
            OUTPUT INSERTED.item_id, INSERTED.cart_id, INSERTED.product_id, INSERTED.quantity, INSERTED.created_at
            VALUES (@cartId, @productId, @quantity)
          `);

        // Update cart updated_at
        await pool.request()
          .input('cartId', sql.Int, cartId)
          .query(`UPDATE Carts SET updated_at = GETDATE() WHERE cart_id = @cartId`);

        return insertResult.recordset[0];
      }
    } catch (error) {
      console.error('Database error in addOrUpdateCartItem:', error);
      
      // Handle unique constraint violation
      if (error.number === 2627) {
        throw new Error('Item already exists in cart');
      }
      
      throw new Error(`Database operation failed: ${error.message}`);
    }
  }

  /**
   * Update cart item quantity
   * @param {number} cartId - Cart ID
   * @param {number} itemId - Cart item ID
   * @param {number} quantity - New quantity
   * @returns {Object|null} Updated cart item or null
   */
  async updateCartItemQuantity(cartId, itemId, quantity) {
    try {
      const pool = await poolPromise;

      if (quantity <= 0) {
        throw new Error('Quantity must be greater than 0');
      }

      const result = await pool.request()
        .input('cartId', sql.Int, cartId)
        .input('itemId', sql.Int, itemId)
        .input('quantity', sql.Int, quantity)
        .query(`
          UPDATE CartItems
          SET quantity = @quantity
          OUTPUT INSERTED.item_id, INSERTED.cart_id, INSERTED.product_id, INSERTED.quantity, INSERTED.created_at
          WHERE cart_id = @cartId AND item_id = @itemId
        `);

      if (result.recordset.length === 0) {
        return null;
      }

      // Update cart updated_at
      await pool.request()
        .input('cartId', sql.Int, cartId)
        .query(`UPDATE Carts SET updated_at = GETDATE() WHERE cart_id = @cartId`);

      return result.recordset[0];
    } catch (error) {
      console.error('Database error in updateCartItemQuantity:', error);
      throw new Error(`Database operation failed: ${error.message}`);
    }
  }

  /**
   * Remove item from cart
   * @param {number} cartId - Cart ID
   * @param {number} itemId - Cart item ID
   * @returns {boolean} True if deleted
   */
  async removeCartItem(cartId, itemId) {
    try {
      const pool = await poolPromise;

      const result = await pool.request()
        .input('cartId', sql.Int, cartId)
        .input('itemId', sql.Int, itemId)
        .query(`
          DELETE FROM CartItems
          WHERE cart_id = @cartId AND item_id = @itemId
        `);

      // Update cart updated_at
      await pool.request()
        .input('cartId', sql.Int, cartId)
        .query(`UPDATE Carts SET updated_at = GETDATE() WHERE cart_id = @cartId`);

      return result.rowsAffected[0] > 0;
    } catch (error) {
      console.error('Database error in removeCartItem:', error);
      throw new Error(`Database operation failed: ${error.message}`);
    }
  }

  /**
   * Clear all items from cart
   * @param {number} cartId - Cart ID
   * @returns {boolean} True if cleared
   */
  async clearCart(cartId) {
    try {
      const pool = await poolPromise;

      await pool.request()
        .input('cartId', sql.Int, cartId)
        .query(`DELETE FROM CartItems WHERE cart_id = @cartId`);

      // Update cart updated_at
      await pool.request()
        .input('cartId', sql.Int, cartId)
        .query(`UPDATE Carts SET updated_at = GETDATE() WHERE cart_id = @cartId`);

      return true;
    } catch (error) {
      console.error('Database error in clearCart:', error);
      throw new Error(`Database operation failed: ${error.message}`);
    }
  }

  /**
   * Get cart by guest_id
   * @param {string} guestId - Guest ID
   * @returns {Object|null} Cart data or null
   */
  async getCartByGuestId(guestId) {
    try {
      const pool = await poolPromise;
      const result = await pool.request()
        .input('guestId', sql.NVarChar(50), guestId)
        .query(`
          SELECT cart_id, user_id, guest_id, is_active, created_at, updated_at
          FROM Carts
          WHERE guest_id = @guestId AND is_active = 1
        `);

      return result.recordset[0] || null;
    } catch (error) {
      console.error('Database error in getCartByGuestId:', error);
      throw new Error(`Database operation failed: ${error.message}`);
    }
  }

  /**
   * Transfer cart items from guest cart to user cart
   * @param {string} guestId - Guest ID
   * @param {number} userId - User ID
   * @returns {Object} User cart with merged items
   */
  async mergeGuestCartToUser(guestId, userId) {
    try {
      const pool = await poolPromise;
      const transaction = new sql.Transaction(pool);

      try {
        await transaction.begin();

        // Get guest cart with items
        const guestCartResult = await transaction.request()
          .input('guestId', sql.NVarChar(50), guestId)
          .query(`
            SELECT ci.product_id, ci.quantity
            FROM Carts c
            INNER JOIN CartItems ci ON c.cart_id = ci.cart_id
            WHERE c.guest_id = @guestId AND c.is_active = 1
          `);

        if (guestCartResult.recordset.length === 0) {
          await transaction.commit();
          // Return user cart as-is if no guest items
          return await this.getCartWithItems(userId, null);
        }

        // Get or create user cart within transaction
        let userCartResult = await transaction.request()
          .input('userId', sql.Int, userId)
          .query(`
            SELECT cart_id, user_id, guest_id, is_active, created_at, updated_at
            FROM Carts
            WHERE user_id = @userId AND is_active = 1
          `);

        let userCart;
        if (userCartResult.recordset.length > 0) {
          userCart = userCartResult.recordset[0];
        } else {
          // Create new cart within transaction
          const createCartResult = await transaction.request()
            .input('userId', sql.Int, userId)
            .query(`
              INSERT INTO Carts (user_id, guest_id, is_active)
              OUTPUT INSERTED.cart_id, INSERTED.user_id, INSERTED.guest_id, INSERTED.is_active, INSERTED.created_at, INSERTED.updated_at
              VALUES (@userId, NULL, 1)
            `);
          userCart = createCartResult.recordset[0];
        }

        // Merge items: for each guest item, add/update in user cart
        for (const item of guestCartResult.recordset) {
          const mergeRequest = transaction.request();
          mergeRequest.input('userCartId', sql.Int, userCart.cart_id);
          mergeRequest.input('productId', sql.Int, item.product_id);
          mergeRequest.input('quantity', sql.Int, item.quantity);
          await mergeRequest.query(`
            IF EXISTS (
              SELECT 1 FROM CartItems 
              WHERE cart_id = @userCartId AND product_id = @productId
            )
            BEGIN
              UPDATE CartItems
              SET quantity = quantity + @quantity
              WHERE cart_id = @userCartId AND product_id = @productId
            END
            ELSE
            BEGIN
              INSERT INTO CartItems (cart_id, product_id, quantity)
              VALUES (@userCartId, @productId, @quantity)
            END
          `);
        }

        // Update user cart updated_at
        await transaction.request()
          .input('userCartId', sql.Int, userCart.cart_id)
          .query(`UPDATE Carts SET updated_at = GETDATE() WHERE cart_id = @userCartId`);

        // Delete guest cart items and cart
        await transaction.request()
          .input('guestId', sql.NVarChar(50), guestId)
          .query(`
            DELETE ci FROM CartItems ci
            INNER JOIN Carts c ON ci.cart_id = c.cart_id
            WHERE c.guest_id = @guestId
          `);

        await transaction.request()
          .input('guestId', sql.NVarChar(50), guestId)
          .query(`DELETE FROM Carts WHERE guest_id = @guestId`);

        await transaction.commit();

        // Return merged user cart
        return await this.getCartWithItems(userId, null);
      } catch (error) {
        await transaction.rollback();
        throw error;
      }
    } catch (error) {
      console.error('Database error in mergeGuestCartToUser:', error);
      throw new Error(`Database operation failed: ${error.message}`);
    }
  }
}

