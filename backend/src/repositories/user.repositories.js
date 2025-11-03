import { poolPromise } from '../config/db.config.js';
import sql from 'mssql';

export class UserRepository {

  /**
   * Create a new user in the database
   * @param {Object} userData - User data to insert
   * @returns {Object} Created user data with user_id
   * @throws {Error} Database operation errors
   */
  async createUser(userData) {
    try {
      const { name, email, password_hash, phone_number, role } = userData;
      const pool = await poolPromise;
      
      // Insert user and return the created record
      const result = await pool.request()
        .input('name', sql.NVarChar(255), name)
        .input('email', sql.NVarChar(255), email)
        .input('password_hash', sql.NVarChar(255), password_hash)
        .input('phone_number', sql.NVarChar(15), phone_number)
        .input('role', sql.NVarChar(50), role)
        .query(`
          INSERT INTO Users (name, email, password_hash, phone_number, role) 
          OUTPUT INSERTED.user_id, INSERTED.name, INSERTED.email, INSERTED.phone_number, INSERTED.role, INSERTED.image_url, INSERTED.created_at
          VALUES (@name, @email, @password_hash, @phone_number, @role)
        `);

      if (result.recordset.length === 0) {
        throw new Error('Failed to create user - no record returned');
      }

      return result.recordset[0];
    } catch (error) {
      console.error('Database error in createUser:', error);
      
      // Handle specific SQL Server errors
      if (error.number === 2627) { // Unique constraint violation
        throw new Error('User with this email already exists');
      }
      
      throw new Error(`Database operation failed: ${error.message}`);
    }
  }

  /**
   * Find user by email address
   * @param {string} email - User email to search for
   * @returns {Object|null} User data or null if not found
   * @throws {Error} Database operation errors
   */
  async findByEmail(email) {
    try {
      const pool = await poolPromise;
      const result = await pool.request()
        .input('email', sql.NVarChar(255), email)
        .query(`
          SELECT user_id, name, email, password_hash, phone_number, role, image_url, is_deleted, created_at 
          FROM Users 
          WHERE email = @email
        `);
      
      return result.recordset[0] || null;
    } catch (error) {
      console.error('Database error in findByEmail:', error);
      throw new Error(`Database operation failed: ${error.message}`);
    }
  }

  /**
   * Find user by ID
   * @param {number} userId - User ID to search for
   * @returns {Object|null} User data or null if not found
   * @throws {Error} Database operation errors
   */
  async findById(userId) {
    try {
      const pool = await poolPromise;
      const result = await pool.request()
        .input('userId', sql.Int, userId)
        .query(`
          SELECT user_id, name, email, phone_number, role, image_url, is_deleted, created_at 
          FROM Users 
          WHERE user_id = @userId AND is_deleted = 0
        `);
      
      return result.recordset[0] || null;
    } catch (error) {
      console.error('Database error in findById:', error);
      throw new Error(`Database operation failed: ${error.message}`);
    }
  }

  /**
   * Update user image URL
   * @param {number} userId - User ID
   * @param {string} imageUrl - Image URL
   * @returns {boolean} True if updated
   */
  async updateImageUrl(userId, imageUrl) {
    try {
      const pool = await poolPromise;
      const result = await pool.request()
        .input('userId', sql.Int, userId)
        .input('imageUrl', sql.NVarChar(500), imageUrl)
        .query(`
          UPDATE Users
          SET image_url = @imageUrl
          WHERE user_id = @userId
        `);

      return result.rowsAffected[0] > 0;
    } catch (error) {
      console.error('Database error in updateImageUrl:', error);
      throw new Error(`Database operation failed: ${error.message}`);
    }
  }
}