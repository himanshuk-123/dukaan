import { poolPromise } from '../config/db.config.js';
import sql from 'mssql';

export class ProductRepository {
  /**
   * Get all active products by shop with pagination
   * @param {Object} options - Query options (page, limit, search, shop_id)
   * @returns {Object} Products data with pagination info
   */
  async findAll(options = {}) {
    try {
      const { page = 1, limit = 20, search = '', shop_id = null } = options;
      const offset = (page - 1) * limit;
      const pool = await poolPromise;

      // Build conditions
      let whereConditions = ['p.is_deleted = 0', 'i.is_deleted = 0'];
      let searchCondition = '';
      
      if (shop_id) {
        whereConditions.push('i.shop_id = @shop_id');
      }
      
      if (search) {
        searchCondition = `AND (p.name LIKE @search OR p.description LIKE @search)`;
      }

      const whereClause = whereConditions.join(' AND ');

      // Get total count
      const countRequest = pool.request();
      if (shop_id) countRequest.input('shop_id', sql.Int, shop_id);
      if (search) countRequest.input('search', sql.NVarChar, `%${search}%`);
      
      const countResult = await countRequest.query(`
        SELECT COUNT(DISTINCT p.product_id) as total
        FROM Products p
        INNER JOIN Inventory i ON p.product_id = i.product_id
        WHERE ${whereClause}
        ${searchCondition}
      `);

      const total = countResult.recordset[0].total;

      // Get products
      const productsRequest = pool.request();
      if (shop_id) productsRequest.input('shop_id', sql.Int, shop_id);
      if (search) productsRequest.input('search', sql.NVarChar, `%${search}%`);
      productsRequest.input('limit', sql.Int, limit);
      productsRequest.input('offset', sql.Int, offset);

      const productsResult = await productsRequest.query(`
          SELECT 
            p.product_id,
            p.name,
            p.description,
            p.price,
            p.image_url,
            i.id as inventory_id,
            i.shop_id,
            i.stock_quantity,
            i.selling_price,
            p.created_at,
            s.name as shop_name,
            s.category as shop_category
          FROM Products p
          INNER JOIN Inventory i ON p.product_id = i.product_id
          INNER JOIN Shops s ON i.shop_id = s.shop_id
          WHERE ${whereClause}
          ${searchCondition}
          ORDER BY p.created_at DESC
          OFFSET @offset ROWS
          FETCH NEXT @limit ROWS ONLY
      `);

      return {
        products: productsResult.recordset,
        pagination: {
          total: total,
          page: page,
          limit: limit,
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      console.error('Database error in findAll products:', error);
      throw new Error(`Database operation failed: ${error.message}`);
    }
  }

  /**
   * Get products by shop ID
   * @param {number} shopId - Shop ID
   * @param {Object} options - Query options
   * @returns {Object} Products with pagination
   */
  async findByShopId(shopId, options = {}) {
    try {
      return await this.findAll({ ...options, shop_id: shopId });
    } catch (error) {
      console.error('Database error in findByShopId:', error);
      throw new Error(`Database operation failed: ${error.message}`);
    }
  }

  /**
   * Get product by ID (with shop info if available)
   * @param {number} productId - Product ID
   * @param {number|null} shopId - Optional shop ID to get shop-specific info
   * @returns {Object|null} Product data or null if not found
   */
  async findById(productId, shopId = null) {
    try {
      const pool = await poolPromise;
      
      if (shopId) {
        // Get product with shop-specific inventory info
        const result = await pool.request()
          .input('productId', sql.Int, productId)
          .input('shopId', sql.Int, shopId)
          .query(`
            SELECT 
              p.product_id,
              p.name,
              p.description,
              p.price,
              p.image_url,
              p.created_at,
              i.id as inventory_id,
              i.shop_id,
              i.stock_quantity,
              i.selling_price,
              s.name as shop_name,
              s.category as shop_category
            FROM Products p
            LEFT JOIN Inventory i ON p.product_id = i.product_id AND i.shop_id = @shopId AND i.is_deleted = 0
            LEFT JOIN Shops s ON i.shop_id = s.shop_id AND s.is_deleted = 0
            WHERE p.product_id = @productId AND p.is_deleted = 0
          `);
        return result.recordset[0] || null;
      } else {
        // Get basic product info
        const result = await pool.request()
          .input('productId', sql.Int, productId)
          .query(`
            SELECT 
              product_id,
              name,
              description,
              price,
              image_url,
              created_at
            FROM Products
            WHERE product_id = @productId AND is_deleted = 0
          `);
        return result.recordset[0] || null;
      }
    } catch (error) {
      console.error('Database error in findById product:', error);
      throw new Error(`Database operation failed: ${error.message}`);
    }
  }

  /**
   * Create a new product
   * @param {Object} productData - Product data
   * @returns {Object} Created product
   */
  async create(productData) {
    try {
      const { name, description, price } = productData;
      const pool = await poolPromise;

      const result = await pool.request()
        .input('name', sql.NVarChar(255), name)
        .input('description', sql.NVarChar(sql.MAX), description || null)
        .input('price', sql.Decimal(10, 2), price)
        .query(`
          INSERT INTO Products (name, description, price, stock_quantity)
          OUTPUT INSERTED.product_id, INSERTED.name, INSERTED.description, INSERTED.price, INSERTED.image_url, INSERTED.created_at
          VALUES (@name, @description, @price, 0)
        `);

      return result.recordset[0];
    } catch (error) {
      console.error('Database error in create product:', error);
      throw new Error(`Database operation failed: ${error.message}`);
    }
  }

  /**
   * Update product
   * @param {number} productId - Product ID
   * @param {Object} productData - Updated product data
   * @returns {Object|null} Updated product or null
   */
  async update(productId, productData) {
    try {
      const { name, description, price } = productData;
      const pool = await poolPromise;

      const updates = [];
      const request = pool.request().input('productId', sql.Int, productId);

      if (name !== undefined) {
        updates.push('name = @name');
        request.input('name', sql.NVarChar(255), name);
      }
      if (description !== undefined) {
        updates.push('description = @description');
        request.input('description', sql.NVarChar(sql.MAX), description);
      }
      if (price !== undefined) {
        updates.push('price = @price');
        request.input('price', sql.Decimal(10, 2), price);
      }

      if (updates.length === 0) {
        throw new Error('No fields to update');
      }

      const result = await request.query(`
        UPDATE Products
        SET ${updates.join(', ')}
        OUTPUT INSERTED.product_id, INSERTED.name, INSERTED.description, INSERTED.price, INSERTED.image_url, INSERTED.created_at
        WHERE product_id = @productId AND is_deleted = 0
      `);

      return result.recordset[0] || null;
    } catch (error) {
      console.error('Database error in update product:', error);
      throw new Error(`Database operation failed: ${error.message}`);
    }
  }

  /**
   * Soft delete product
   * @param {number} productId - Product ID
   * @returns {boolean} True if deleted
   */
  async softDelete(productId) {
    try {
      const pool = await poolPromise;
      const result = await pool.request()
        .input('productId', sql.Int, productId)
        .query(`
          UPDATE Products
          SET is_deleted = 1, deleted_at = GETDATE()
          WHERE product_id = @productId AND is_deleted = 0
        `);

      return result.rowsAffected[0] > 0;
    } catch (error) {
      console.error('Database error in softDelete product:', error);
      throw new Error(`Database operation failed: ${error.message}`);
    }
  }

  /**
   * Add product to shop inventory
   * @param {number} shopId - Shop ID
   * @param {number} productId - Product ID
   * @param {Object} inventoryData - Inventory data (stock_quantity, selling_price)
   * @returns {Object} Created inventory entry
   */
  async addToInventory(shopId, productId, inventoryData) {
    try {
      const { stock_quantity, selling_price } = inventoryData;
      const pool = await poolPromise;

      const result = await pool.request()
        .input('shopId', sql.Int, shopId)
        .input('productId', sql.Int, productId)
        .input('stock_quantity', sql.Int, stock_quantity)
        .input('selling_price', sql.Decimal(10, 2), selling_price)
        .query(`
          INSERT INTO Inventory (shop_id, product_id, stock_quantity, selling_price)
          OUTPUT INSERTED.id, INSERTED.shop_id, INSERTED.product_id, INSERTED.stock_quantity, INSERTED.selling_price
          VALUES (@shopId, @productId, @stock_quantity, @selling_price)
        `);

      return result.recordset[0];
    } catch (error) {
      console.error('Database error in addToInventory:', error);
      
      // Handle unique constraint violation (product already in shop inventory)
      if (error.number === 2627) {
        throw new Error('Product already exists in shop inventory');
      }
      
      throw new Error(`Database operation failed: ${error.message}`);
    }
  }

  /**
   * Update inventory entry
   * @param {number} inventoryId - Inventory ID
   * @param {Object} inventoryData - Updated inventory data
   * @returns {Object|null} Updated inventory entry
   */
  async updateInventory(inventoryId, inventoryData) {
    try {
      const { stock_quantity, selling_price } = inventoryData;
      const pool = await poolPromise;

      const updates = [];
      const request = pool.request().input('inventoryId', sql.Int, inventoryId);

      if (stock_quantity !== undefined) {
        updates.push('stock_quantity = @stock_quantity');
        request.input('stock_quantity', sql.Int, stock_quantity);
      }
      if (selling_price !== undefined) {
        updates.push('selling_price = @selling_price');
        request.input('selling_price', sql.Decimal(10, 2), selling_price);
      }

      if (updates.length === 0) {
        throw new Error('No fields to update');
      }

      const result = await request.query(`
        UPDATE Inventory
        SET ${updates.join(', ')}
        OUTPUT INSERTED.id, INSERTED.shop_id, INSERTED.product_id, INSERTED.stock_quantity, INSERTED.selling_price
        WHERE id = @inventoryId AND is_deleted = 0
      `);

      return result.recordset[0] || null;
    } catch (error) {
      console.error('Database error in updateInventory:', error);
      throw new Error(`Database operation failed: ${error.message}`);
    }
  }

  /**
   * Get inventory entry by shop and product
   * @param {number} shopId - Shop ID
   * @param {number} productId - Product ID
   * @returns {Object|null} Inventory entry or null
   */
  async getInventoryByShopAndProduct(shopId, productId) {
    try {
      const pool = await poolPromise;
      const result = await pool.request()
        .input('shopId', sql.Int, shopId)
        .input('productId', sql.Int, productId)
        .query(`
          SELECT 
            id,
            shop_id,
            product_id,
            stock_quantity,
            selling_price,
            is_deleted
          FROM Inventory
          WHERE shop_id = @shopId AND product_id = @productId AND is_deleted = 0
        `);

      return result.recordset[0] || null;
    } catch (error) {
      console.error('Database error in getInventoryByShopAndProduct:', error);
      throw new Error(`Database operation failed: ${error.message}`);
    }
  }

  /**
   * Check if product exists and is available in shop
   * @param {number} productId - Product ID
   * @param {number|null} shopId - Shop ID (optional)
   * @returns {Object|null} Product availability info
   */
  async checkAvailability(productId, shopId = null) {
    try {
      const pool = await poolPromise;
      
      if (shopId) {
        // Check availability in specific shop
        const result = await pool.request()
          .input('productId', sql.Int, productId)
          .input('shopId', sql.Int, shopId)
          .query(`
            SELECT 
              p.product_id,
              i.stock_quantity,
              p.is_deleted as product_deleted,
              i.is_deleted as inventory_deleted
            FROM Products p
            LEFT JOIN Inventory i ON p.product_id = i.product_id AND i.shop_id = @shopId
            WHERE p.product_id = @productId
          `);

        if (!result.recordset[0]) {
          return null;
        }

        const data = result.recordset[0];
        return {
          exists: true,
          available: !data.product_deleted && !data.inventory_deleted && (data.stock_quantity || 0) > 0,
          stock_quantity: data.stock_quantity || 0,
          in_shop: !!data.stock_quantity
        };
      } else {
        // Check general availability
        const result = await pool.request()
          .input('productId', sql.Int, productId)
          .query(`
            SELECT 
              product_id,
              stock_quantity,
              is_deleted
            FROM Products
            WHERE product_id = @productId
          `);

        if (!result.recordset[0]) {
          return null;
        }

        const product = result.recordset[0];
        return {
          exists: true,
          available: !product.is_deleted && product.stock_quantity > 0,
          stock_quantity: product.stock_quantity
        };
      }
    } catch (error) {
      console.error('Database error in checkAvailability:', error);
      throw new Error(`Database operation failed: ${error.message}`);
    }
  }

  /**
   * Check if product belongs to owner (via shop ownership)
   * @param {number} productId - Product ID
   * @param {number} ownerId - Owner (user) ID
   * @returns {boolean} True if product belongs to owner's shop
   */
  async isProductOwner(productId, ownerId) {
    try {
      const pool = await poolPromise;
      const result = await pool.request()
        .input('productId', sql.Int, productId)
        .input('ownerId', sql.Int, ownerId)
        .query(`
          SELECT COUNT(*) as count
          FROM Products p
          INNER JOIN Inventory i ON p.product_id = i.product_id
          INNER JOIN Shops s ON i.shop_id = s.shop_id
          WHERE p.product_id = @productId 
            AND s.owner_id = @ownerId 
            AND p.is_deleted = 0 
            AND i.is_deleted = 0
        `);

      return result.recordset[0].count > 0;
    } catch (error) {
      console.error('Database error in isProductOwner:', error);
      throw new Error(`Database operation failed: ${error.message}`);
    }
  }

  /**
   * Check if inventory entry belongs to owner (via shop ownership)
   * @param {number} inventoryId - Inventory ID
   * @param {number} ownerId - Owner (user) ID
   * @returns {boolean} True if inventory belongs to owner's shop
   */
  async isInventoryOwner(inventoryId, ownerId) {
    try {
      const pool = await poolPromise;
      const result = await pool.request()
        .input('inventoryId', sql.Int, inventoryId)
        .input('ownerId', sql.Int, ownerId)
        .query(`
          SELECT COUNT(*) as count
          FROM Inventory i
          INNER JOIN Shops s ON i.shop_id = s.shop_id
          WHERE i.id = @inventoryId 
            AND s.owner_id = @ownerId 
            AND i.is_deleted = 0
        `);

      return result.recordset[0].count > 0;
    } catch (error) {
      console.error('Database error in isInventoryOwner:', error);
      throw new Error(`Database operation failed: ${error.message}`);
    }
  }

  /**
   * Get products by shop owner
   * @param {number} ownerId - Owner (user) ID
   * @param {number|null} shopId - Optional shop ID filter
   * @param {Object} options - Query options
   * @returns {Object} Products with pagination
   */
  async findByOwner(ownerId, shopId = null, options = {}) {
    try {
      const { page = 1, limit = 20, search = '' } = options;
      const offset = (page - 1) * limit;
      const pool = await poolPromise;

      let whereConditions = ['p.is_deleted = 0', 'i.is_deleted = 0', 's.owner_id = @ownerId'];
      let searchCondition = '';
      
      if (shopId) {
        whereConditions.push('i.shop_id = @shop_id');
      }
      
      if (search) {
        searchCondition = `AND (p.name LIKE @search OR p.description LIKE @search)`;
      }

      const whereClause = whereConditions.join(' AND ');

      const countRequest = pool.request()
        .input('ownerId', sql.Int, ownerId);
      if (shopId) countRequest.input('shop_id', sql.Int, shopId);
      if (search) countRequest.input('search', sql.NVarChar, `%${search}%`);
      
      const countResult = await countRequest.query(`
        SELECT COUNT(DISTINCT p.product_id) as total
        FROM Products p
        INNER JOIN Inventory i ON p.product_id = i.product_id
        INNER JOIN Shops s ON i.shop_id = s.shop_id
        WHERE ${whereClause}
        ${searchCondition}
      `);

      const total = countResult.recordset[0].total;

      const productsRequest = pool.request()
        .input('ownerId', sql.Int, ownerId);
      if (shopId) productsRequest.input('shop_id', sql.Int, shopId);
      if (search) productsRequest.input('search', sql.NVarChar, `%${search}%`);
      productsRequest.input('limit', sql.Int, limit);
      productsRequest.input('offset', sql.Int, offset);

      const productsResult = await productsRequest.query(`
        SELECT 
          p.product_id,
          p.name,
          p.description,
          p.price,
          p.image_url,
          i.id as inventory_id,
          i.shop_id,
          i.stock_quantity,
          i.selling_price,
          p.created_at,
          s.name as shop_name
        FROM Products p
        INNER JOIN Inventory i ON p.product_id = i.product_id
        INNER JOIN Shops s ON i.shop_id = s.shop_id
        WHERE ${whereClause}
        ${searchCondition}
        ORDER BY p.created_at DESC
        OFFSET @offset ROWS
        FETCH NEXT @limit ROWS ONLY
      `);

      return {
        products: productsResult.recordset,
        pagination: {
          total: total,
          page: page,
          limit: limit,
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      console.error('Database error in findByOwner:', error);
      throw new Error(`Database operation failed: ${error.message}`);
    }
  }

  /**
   * Update product image URL
   * @param {number} productId - Product ID
   * @param {string} imageUrl - Image URL
   * @returns {boolean} True if updated
   */
  async updateImageUrl(productId, imageUrl) {
    try {
      const pool = await poolPromise;
      const result = await pool.request()
        .input('productId', sql.Int, productId)
        .input('imageUrl', sql.NVarChar(500), imageUrl)
        .query(`
          UPDATE Products
          SET image_url = @imageUrl
          WHERE product_id = @productId
        `);

      return result.rowsAffected[0] > 0;
    } catch (error) {
      console.error('Database error in updateImageUrl:', error);
      throw new Error(`Database operation failed: ${error.message}`);
    }
  }
}




