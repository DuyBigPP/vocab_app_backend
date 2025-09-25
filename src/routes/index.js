const express = require('express');
const authRoutes = require('./authRoutes');
const deckRoutes = require('./deckRoutes');
const cardRoutes = require('./cardRoutes');
const deckCardRoutes = require('./deckCardRoutes');

const router = express.Router();

/**
 * @swagger
 * /api/health:
 *   get:
 *     summary: Health check endpoint
 *     tags: [System]
 *     responses:
 *       200:
 *         description: Service is healthy
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
 *                   example: Service is healthy
 *                 data:
 *                   type: object
 *                   properties:
 *                     timestamp:
 *                       type: string
 *                       format: date-time
 *                     uptime:
 *                       type: number
 *                     version:
 *                       type: string
 */
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Service is healthy',
    data: {
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0',
    },
  });
});

// API Routes
router.use('/auth', authRoutes);
router.use('/decks', deckRoutes);
router.use('/cards', cardRoutes);
router.use('/decks/:deckId/cards', deckCardRoutes);

module.exports = router;
