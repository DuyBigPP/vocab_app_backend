const express = require('express');
const CardController = require('../controllers/cardController');
const { authenticateToken } = require('../middleware/auth');
const { validateCard, validatePagination } = require('../middleware/validation');

const router = express.Router({ mergeParams: true });

/**
 * @swagger
 * tags:
 *   name: Cards
 *   description: Card management within specific decks
 */

// All routes require authentication
router.use(authenticateToken);

// Cards within a specific deck
router.post('/', validateCard, CardController.createCard);
router.get('/', validatePagination, CardController.getDeckCards);

// Study session
router.get('/study', CardController.getStudyCards);

// Bulk operations
router.patch('/bulk-memorized', CardController.bulkUpdateMemorized);

// Statistics
router.get('/stats', CardController.getCardStats);

module.exports = router;
