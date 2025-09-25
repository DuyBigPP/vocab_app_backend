const bcrypt = require('bcryptjs');
const { prisma, withRetry } = require('../config/database');
const { generateToken } = require('../utils/jwt');

/**
 * Authentication Service
 */
class AuthService {
  /**
   * Register a new user
   * @param {Object} userData - User registration data
   * @returns {Object} User and token
   */
  static async register(userData) {
    try {
      const { email, password, name } = userData;

      // Input validation
      if (!email || !password) {
        throw new Error('Email and password are required');
      }

      // Check if user already exists
      const existingUser = await withRetry(async () => {
        return await prisma.user.findUnique({
          where: { email: email.toLowerCase() },
        });
      });

      if (existingUser) {
        throw new Error('User already exists with this email');
      }

      // Hash password
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      // Create user
      const user = await withRetry(async () => {
        return await prisma.user.create({
          data: {
            email: email.toLowerCase(),
            password: hashedPassword,
            name: name || null,
          },
          select: {
            id: true,
            email: true,
            name: true,
            createdAt: true,
            updatedAt: true,
          },
        });
      });

      // Generate token
      const token = generateToken({ userId: user.id });

      return { user, token };
    } catch (error) {
      console.error('Register service error:', error);
      throw error;
    }
  }

  /**
   * Login user
   * @param {Object} loginData - User login data
   * @returns {Object} User and token
   */
  static async login(loginData) {
    try {
      const { email, password } = loginData;

      // Input validation
      if (!email || !password) {
        throw new Error('Email and password are required');
      }

      // Find user
      const user = await withRetry(async () => {
        return await prisma.user.findUnique({
          where: { email: email.toLowerCase() },
        });
      });

      if (!user) {
        throw new Error('Invalid email or password');
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.password);

      if (!isValidPassword) {
        throw new Error('Invalid email or password');
      }

      // Generate token
      const token = generateToken({ userId: user.id });

      // Remove password from response
      const { password: _, ...userWithoutPassword } = user;

      return { user: userWithoutPassword, token };
    } catch (error) {
      console.error('Login service error:', error);
      throw error;
    }
  }

  /**
   * Logout user
   * @param {string} userId - User ID
   * @param {string} token - JWT token
   */
  static async logout(userId, token) {
    // Note: In a production environment, you might want to implement token blacklisting
    // using a database table or in-memory store
    // For now, we'll just return success as the token will expire naturally
    return true;
  }

  /**
   * Change user password
   * @param {string} userId - User ID
   * @param {string} oldPassword - Current password
   * @param {string} newPassword - New password
   */
  static async changePassword(userId, oldPassword, newPassword) {
    // Get user with password
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Verify old password
    const isValidPassword = await bcrypt.compare(oldPassword, user.password);

    if (!isValidPassword) {
      throw new Error('Invalid current password');
    }

    // Hash new password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update password
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });
  }

  /**
   * Update user profile
   * @param {string} userId - User ID
   * @param {Object} updateData - Update data
   * @returns {Object} Updated user
   */
  static async updateProfile(userId, updateData) {
    const { name, email } = updateData;

    const updateFields = {};

    if (name !== undefined) {
      updateFields.name = name;
    }

    if (email !== undefined) {
      // Check if email is already taken
      const existingUser = await prisma.user.findUnique({
        where: { email: email.toLowerCase() },
      });

      if (existingUser && existingUser.id !== userId) {
        throw new Error('Email already exists');
      }

      updateFields.email = email.toLowerCase();
    }

    // Update user
    const user = await prisma.user.update({
      where: { id: userId },
      data: updateFields,
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return user;
  }
}

module.exports = AuthService;
