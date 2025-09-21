const pool = require('../config/database');
const bcrypt = require('bcryptjs');

class User {
  static async create({ email, password, firstName, lastName }) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      const passwordHash = await bcrypt.hash(password, 10);
      
      const userQuery = `
        INSERT INTO users (email, password_hash)
        VALUES ($1, $2)
        RETURNING id, email, created_at
      `;
      const userResult = await client.query(userQuery, [email, passwordHash]);
      const user = userResult.rows[0];
      
      const profileQuery = `
        INSERT INTO user_profiles (user_id, first_name, last_name)
        VALUES ($1, $2, $3)
        RETURNING *
      `;
      const profileResult = await client.query(profileQuery, [
        user.id,
        firstName,
        lastName
      ]);
      
      await client.query('COMMIT');
      
      return {
        ...user,
        profile: profileResult.rows[0]
      };
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  static async findByEmail(email) {
    const query = `
      SELECT u.*, up.first_name, up.last_name, up.avatar_url, up.bio, up.brand_name
      FROM users u
      LEFT JOIN user_profiles up ON u.id = up.user_id
      WHERE u.email = $1 AND u.is_active = true
    `;
    const result = await pool.query(query, [email]);
    return result.rows[0];
  }

  static async findById(id) {
    const query = `
      SELECT u.*, up.first_name, up.last_name, up.avatar_url, up.bio, up.brand_name
      FROM users u
      LEFT JOIN user_profiles up ON u.id = up.user_id
      WHERE u.id = $1 AND u.is_active = true
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  static async verifyPassword(user, password) {
    return bcrypt.compare(password, user.password_hash);
  }
}

module.exports = User;
