const AuthService = require('../services/authService');
const { sendSuccess, sendError } = require('../utils/response');

/**
 * Authentication Controller
 */
class AuthController {
  /**
   * @swagger
   * /api/auth/register:
   *   post:
   *     summary: Register a new user
   *     tags: [Authentication]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - email
   *               - password
   *             properties:
   *               email:
   *                 type: string
   *                 format: email
   *                 example: user@example.com
   *               password:
   *                 type: string
   *                 minLength: 6
   *                 example: password123
   *               name:
   *                 type: string
   *                 example: John Doe
   *     responses:
   *       201:
   *         description: User registered successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 message:
   *                   type: string
   *                   example: User registered successfully
   *                 data:
   *                   type: object
   *                   properties:
   *                     user:
   *                       $ref: '#/components/schemas/User'
   *                     token:
   *                       type: string
   *                       example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   *       400:
   *         description: Validation error
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   */
  static async register(req, res) {
    try {
      const { user, token } = await AuthService.register(req.body);
      
      sendSuccess(res, { user, token }, 'User registered successfully', 201);
    } catch (error) {
      console.error('Register error:', error);
      
      if (error.message === 'User already exists with this email') {
        return sendError(res, error.message, 400);
      }
      
      sendError(res, 'Registration failed', 500, error.message);
    }
  }

  /**
   * @swagger
   * /api/auth/login:
   *   post:
   *     summary: Login user
   *     tags: [Authentication]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - email
   *               - password
   *             properties:
   *               email:
   *                 type: string
   *                 format: email
   *                 example: user@example.com
   *               password:
   *                 type: string
   *                 example: password123
   *     responses:
   *       200:
   *         description: Login successful
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 message:
   *                   type: string
   *                   example: Login successful
   *                 data:
   *                   type: object
   *                   properties:
   *                     user:
   *                       $ref: '#/components/schemas/User'
   *                     token:
   *                       type: string
   *                       example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   *       401:
   *         description: Invalid credentials
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   */
  static async login(req, res) {
    try {
      const { user, token } = await AuthService.login(req.body);
      
      sendSuccess(res, { user, token }, 'Login successful');
    } catch (error) {
      console.error('Login error:', error);
      
      if (error.message === 'Invalid email or password') {
        return sendError(res, error.message, 401);
      }
      
      sendError(res, 'Login failed', 500, error.message);
    }
  }

  /**
   * @swagger
   * /api/auth/logout:
   *   post:
   *     summary: Logout user
   *     tags: [Authentication]
   *     security:
   *       - BearerAuth: []
   *     responses:
   *       200:
   *         description: Logout successful
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Success'
   *       401:
   *         description: Unauthorized
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   */
  static async logout(req, res) {
    try {
      await AuthService.logout(req.user.id, req.token);
      
      sendSuccess(res, null, 'Logout successful');
    } catch (error) {
      console.error('Logout error:', error);
      sendError(res, 'Logout failed', 500, error.message);
    }
  }

  /**
   * @swagger
   * /api/auth/me:
   *   get:
   *     summary: Get current user profile
   *     tags: [Authentication]
   *     security:
   *       - BearerAuth: []
   *     responses:
   *       200:
   *         description: User profile retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 message:
   *                   type: string
   *                   example: User profile retrieved successfully
   *                 data:
   *                   $ref: '#/components/schemas/User'
   *       401:
   *         description: Unauthorized
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   */
  static async getProfile(req, res) {
    try {
      sendSuccess(res, req.user, 'User profile retrieved successfully');
    } catch (error) {
      console.error('Get profile error:', error);
      sendError(res, 'Failed to get profile', 500, error.message);
    }
  }

  /**
   * @swagger
   * /api/auth/profile:
   *   put:
   *     summary: Update user profile
   *     tags: [Authentication]
   *     security:
   *       - BearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               name:
   *                 type: string
   *                 example: John Doe Updated
   *               email:
   *                 type: string
   *                 format: email
   *                 example: newemail@example.com
   *     responses:
   *       200:
   *         description: Profile updated successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 message:
   *                   type: string
   *                   example: Profile updated successfully
   *                 data:
   *                   $ref: '#/components/schemas/User'
   *       400:
   *         description: Validation error
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   */
  static async updateProfile(req, res) {
    try {
      const user = await AuthService.updateProfile(req.user.id, req.body);
      
      sendSuccess(res, user, 'Profile updated successfully');
    } catch (error) {
      console.error('Update profile error:', error);
      
      if (error.message === 'Email already exists') {
        return sendError(res, error.message, 400);
      }
      
      sendError(res, 'Failed to update profile', 500, error.message);
    }
  }

  /**
   * @swagger
   * /api/auth/change-password:
   *   put:
   *     summary: Change user password
   *     tags: [Authentication]
   *     security:
   *       - BearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - oldPassword
   *               - newPassword
   *             properties:
   *               oldPassword:
   *                 type: string
   *                 example: oldpassword123
   *               newPassword:
   *                 type: string
   *                 minLength: 6
   *                 example: newpassword123
   *     responses:
   *       200:
   *         description: Password changed successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Success'
   *       400:
   *         description: Invalid current password
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   */
  static async changePassword(req, res) {
    try {
      const { oldPassword, newPassword } = req.body;
      
      if (!oldPassword || !newPassword) {
        return sendError(res, 'Old password and new password are required', 400);
      }
      
      if (newPassword.length < 6) {
        return sendError(res, 'New password must be at least 6 characters long', 400);
      }
      
      await AuthService.changePassword(req.user.id, oldPassword, newPassword);
      
      sendSuccess(res, null, 'Password changed successfully');
    } catch (error) {
      console.error('Change password error:', error);
      
      if (error.message === 'Invalid current password') {
        return sendError(res, error.message, 400);
      }
      
      sendError(res, 'Failed to change password', 500, error.message);
    }
  }
}

module.exports = AuthController;
