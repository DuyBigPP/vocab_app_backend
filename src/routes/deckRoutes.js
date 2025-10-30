const express = require('express');
const DeckController = require('../controllers/deckController');
const { authenticateToken } = require('../middleware/auth');
const { validateDeck, validatePagination } = require('../middleware/validation');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Decks
 *   description: Deck management operations
 */

// All deck routes 
router.use(authenticateToken);

// Deck CRUD operations
router.post('/', validateDeck, DeckController.createDeck);
router.get('/', validatePagination, DeckController.getUserDecks);
router.get('/search', validatePagination, DeckController.searchDecks);
router.get('/:id', DeckController.getDeckById);
router.put('/:id', validateDeck, DeckController.updateDeck);
router.delete('/:id', DeckController.deleteDeck);

// Deck statistics
router.get('/:id/stats', DeckController.getDeckStats);

module.exports = router;
