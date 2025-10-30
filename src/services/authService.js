const bcrypt = require('bcryptjs');
const { prisma, withRetry } = require('../config/database');
const { generateToken } = require('../utils/jwt');


class AuthService {
  static async register(userData) {
    try {
      const { email, password, name } = userData;


      if (!email || !password) {
        throw new Error('Email and password are required');
      }


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


  static async login(loginData) {
    try {
      const { email, password } = loginData;


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


  static async logout(userId, token) {
    return true;
  }


  static async changePassword(userId, oldPassword, newPassword) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error('User not found');
    }


    const isValidPassword = await bcrypt.compare(oldPassword, user.password);

    if (!isValidPassword) {
      throw new Error('Invalid current password');
    }


    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);


    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });
  }


  static async updateProfile(userId, updateData) {
    const { name, email } = updateData;

    const updateFields = {};

    if (name !== undefined) {
      updateFields.name = name;
    }

    if (email !== undefined) {
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
