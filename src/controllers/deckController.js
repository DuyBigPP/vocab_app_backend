const DeckService = require('../services/deckService');
const { sendSuccess, sendError, sendPaginated } = require('../utils/response');

/**
 * Deck Controller
 */
class DeckController {
  /**
   * @swagger
   * /api/decks:
   *   post:
   *     summary: Create a new deck
   *     tags: [Decks]
   *     security:
   *       - BearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - name
   *             properties:
   *               name:
   *                 type: string
   *                 example: English Vocabulary
   *               description:
   *                 type: string
   *                 example: Basic English vocabulary for beginners
   *     responses:
   *       201:
   *         description: Deck created successfully
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
   *                   example: Deck created successfully
   *                 data:
   *                   $ref: '#/components/schemas/Deck'
   */
  static async createDeck(req, res) {
    try {
      const deck = await DeckService.createDeck(req.user.id, req.body);
      
      sendSuccess(res, deck, 'Deck created successfully', 201);
    } catch (error) {
      console.error('Create deck error:', error);
      sendError(res, 'Failed to create deck', 500, error.message);
    }
  }

  /**
   * @swagger
   * /api/decks:
   *   get:
   *     summary: Get user's decks
   *     tags: [Decks]
   *     security:
   *       - BearerAuth: []
   *     parameters:
   *       - in: query
   *         name: page
   *         schema:
   *           type: integer
   *           minimum: 1
   *           default: 1
   *         description: Page number
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           minimum: 1
   *           maximum: 100
   *           default: 10
   *         description: Number of items per page
   *       - in: query
   *         name: search
   *         schema:
   *           type: string
   *         description: Search term for deck name or description
   *       - in: query
   *         name: sortBy
   *         schema:
   *           type: string
   *           enum: [name, createdAt, updatedAt, cardCount]
   *           default: createdAt
   *         description: Sort field
   *       - in: query
   *         name: sortOrder
   *         schema:
   *           type: string
   *           enum: [asc, desc]
   *           default: desc
   *         description: Sort order
   *     responses:
   *       200:
   *         description: Decks retrieved successfully
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
   *                   example: Decks retrieved successfully
   *                 data:
   *                   type: array
   *                   items:
   *                     $ref: '#/components/schemas/Deck'
   *                 pagination:
   *                   type: object
   *                   properties:
   *                     page:
   *                       type: integer
   *                     limit:
   *                       type: integer
   *                     total:
   *                       type: integer
   *                     pages:
   *                       type: integer
   */
  static async getUserDecks(req, res) {
    try {
      const { page, limit, search, sortBy, sortOrder } = req.query;
      
      const result = await DeckService.getUserDecks(req.user.id, {
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 10,
        search,
        sortBy,
        sortOrder,
      });
      
      sendPaginated(res, result.decks, result.pagination, 'Decks retrieved successfully');
    } catch (error) {
      console.error('Get user decks error:', error);
      sendError(res, 'Failed to get decks', 500, error.message);
    }
  }

  /**
   * @swagger
   * /api/decks/{id}:
   *   get:
   *     summary: Get deck by ID
   *     tags: [Decks]
   *     security:
   *       - BearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: Deck ID
   *     responses:
   *       200:
   *         description: Deck retrieved successfully
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
   *                   example: Deck retrieved successfully
   *                 data:
   *                   $ref: '#/components/schemas/Deck'
   *       404:
   *         description: Deck not found
   */
  static async getDeckById(req, res) {
    try {
      const deck = await DeckService.getDeckById(req.params.id, req.user.id);
      
      sendSuccess(res, deck, 'Deck retrieved successfully');
    } catch (error) {
      console.error('Get deck by ID error:', error);
      
      if (error.message === 'Deck not found') {
        return sendError(res, error.message, 404);
      }
      
      sendError(res, 'Failed to get deck', 500, error.message);
    }
  }

  /**
   * @swagger
   * /api/decks/{id}:
   *   put:
   *     summary: Update deck
   *     tags: [Decks]
   *     security:
   *       - BearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: Deck ID
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               name:
   *                 type: string
   *                 example: Updated Deck Name
   *               description:
   *                 type: string
   *                 example: Updated deck description
   *     responses:
   *       200:
   *         description: Deck updated successfully
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
   *                   example: Deck updated successfully
   *                 data:
   *                   $ref: '#/components/schemas/Deck'
   *       404:
   *         description: Deck not found
   */
  static async updateDeck(req, res) {
    try {
      const deck = await DeckService.updateDeck(req.params.id, req.user.id, req.body);
      
      sendSuccess(res, deck, 'Deck updated successfully');
    } catch (error) {
      console.error('Update deck error:', error);
      
      if (error.message === 'Deck not found') {
        return sendError(res, error.message, 404);
      }
      
      sendError(res, 'Failed to update deck', 500, error.message);
    }
  }

  /**
   * @swagger
   * /api/decks/{id}:
   *   delete:
   *     summary: Delete deck
   *     tags: [Decks]
   *     security:
   *       - BearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: Deck ID
   *     responses:
   *       200:
   *         description: Deck deleted successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Success'
   *       404:
   *         description: Deck not found
   */
  static async deleteDeck(req, res) {
    try {
      await DeckService.deleteDeck(req.params.id, req.user.id);
      
      sendSuccess(res, null, 'Deck deleted successfully');
    } catch (error) {
      console.error('Delete deck error:', error);
      
      if (error.message === 'Deck not found') {
        return sendError(res, error.message, 404);
      }
      
      sendError(res, 'Failed to delete deck', 500, error.message);
    }
  }

  /**
   * @swagger
   * /api/decks/{id}/stats:
   *   get:
   *     summary: Get deck statistics
   *     tags: [Decks]
   *     security:
   *       - BearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: Deck ID
   *     responses:
   *       200:
   *         description: Deck statistics retrieved successfully
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
   *                   example: Deck statistics retrieved successfully
   *                 data:
   *                   type: object
   *                   properties:
   *                     deckId:
   *                       type: string
   *                     deckName:
   *                       type: string
   *                     totalCards:
   *                       type: integer
   *                     memorizedCards:
   *                       type: integer
   *                     unmemorizedCards:
   *                       type: integer
   *                     progressPercentage:
   *                       type: integer
   *                     recentCards:
   *                       type: integer
   *       404:
   *         description: Deck not found
   */
  static async getDeckStats(req, res) {
    try {
      const stats = await DeckService.getDeckStats(req.params.id, req.user.id);
      
      sendSuccess(res, stats, 'Deck statistics retrieved successfully');
    } catch (error) {
      console.error('Get deck stats error:', error);
      
      if (error.message === 'Deck not found') {
        return sendError(res, error.message, 404);
      }
      
      sendError(res, 'Failed to get deck statistics', 500, error.message);
    }
  }

  /**
   * @swagger
   * /api/decks/search:
   *   get:
   *     summary: Search decks
   *     tags: [Decks]
   *     security:
   *       - BearerAuth: []
   *     parameters:
   *       - in: query
   *         name: q
   *         required: true
   *         schema:
   *           type: string
   *         description: Search query
   *       - in: query
   *         name: page
   *         schema:
   *           type: integer
   *           minimum: 1
   *           default: 1
   *         description: Page number
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           minimum: 1
   *           maximum: 100
   *           default: 10
   *         description: Number of items per page
   *     responses:
   *       200:
   *         description: Search results retrieved successfully
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
   *                   example: Search results retrieved successfully
   *                 data:
   *                   type: array
   *                   items:
   *                     $ref: '#/components/schemas/Deck'
   *                 pagination:
   *                   type: object
   *                   properties:
   *                     page:
   *                       type: integer
   *                     limit:
   *                       type: integer
   *                     total:
   *                       type: integer
   *                     pages:
   *                       type: integer
   *       400:
   *         description: Search query is required
   */
  static async searchDecks(req, res) {
    try {
      const { q, page, limit } = req.query;
      
      if (!q || q.trim().length === 0) {
        return sendError(res, 'Search query is required', 400);
      }
      
      const result = await DeckService.searchDecks(req.user.id, q.trim(), {
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 10,
      });
      
      sendPaginated(res, result.decks, result.pagination, 'Search results retrieved successfully');
    } catch (error) {
      console.error('Search decks error:', error);
      sendError(res, 'Failed to search decks', 500, error.message);
    }
  }
}

module.exports = DeckController;
