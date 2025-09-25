const express = require('express');
const CardController = require('../controllers/cardController');
const { authenticateToken } = require('../middleware/auth');
const { validateCard, validatePagination } = require('../middleware/validation');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Cards
 *   description: Card management and study operations
 */

// All card routes require authentication
router.use(authenticateToken);

// Card search (across all decks)
router.get('/search', validatePagination, CardController.searchCards);

// Individual card operations
router.get('/:id', CardController.getCardById);
router.put('/:id', validateCard, CardController.updateCard);
router.delete('/:id', CardController.deleteCard);
router.patch('/:id/toggle-memorized', CardController.toggleMemorized);

module.exports = router;
