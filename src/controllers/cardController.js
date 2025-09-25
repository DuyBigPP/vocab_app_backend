const CardService = require('../services/cardService');
const { sendSuccess, sendError, sendPaginated } = require('../utils/response');

/**
 * Card Controller
 */
class CardController {
  /**
   * @swagger
   * /api/decks/{deckId}/cards:
   *   post:
   *     summary: Create a new card in a deck
   *     tags: [Cards]
   *     security:
   *       - BearerAuth: []
   *     parameters:
   *       - in: path
   *         name: deckId
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
   *             required:
   *               - frontText
   *               - backText
   *             properties:
   *               frontText:
   *                 type: string
   *                 example: Hello
   *               backText:
   *                 type: string
   *                 example: Xin chào
   *               memorized:
   *                 type: boolean
   *                 default: false
   *                 example: false
   *     responses:
   *       201:
   *         description: Card created successfully
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
   *                   example: Card created successfully
   *                 data:
   *                   $ref: '#/components/schemas/Card'
   */
  static async createCard(req, res) {
    try {
      const card = await CardService.createCard(req.user.id, req.params.deckId, req.body);
      
      sendSuccess(res, card, 'Card created successfully', 201);
    } catch (error) {
      console.error('Create card error:', error);
      
      if (error.message === 'Deck not found') {
        return sendError(res, error.message, 404);
      }
      
      sendError(res, 'Failed to create card', 500, error.message);
    }
  }

  /**
   * @swagger
   * /api/decks/{deckId}/cards:
   *   get:
   *     summary: Get cards in a deck
   *     tags: [Cards]
   *     security:
   *       - BearerAuth: []
   *     parameters:
   *       - in: path
   *         name: deckId
   *         required: true
   *         schema:
   *           type: string
   *         description: Deck ID
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
   *         description: Search term for card front/back text
   *       - in: query
   *         name: memorized
   *         schema:
   *           type: string
   *           enum: [true, false]
   *         description: Filter by memorized status
   *       - in: query
   *         name: sortBy
   *         schema:
   *           type: string
   *           enum: [frontText, backText, memorized, createdAt, updatedAt]
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
   *         description: Cards retrieved successfully
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
   *                   example: Cards retrieved successfully
   *                 data:
   *                   type: array
   *                   items:
   *                     $ref: '#/components/schemas/Card'
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
  static async getDeckCards(req, res) {
    try {
      const { page, limit, search, memorized, sortBy, sortOrder } = req.query;
      
      const result = await CardService.getDeckCards(req.user.id, req.params.deckId, {
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 10,
        search,
        memorized,
        sortBy,
        sortOrder,
      });
      
      sendPaginated(res, result.cards, result.pagination, 'Cards retrieved successfully');
    } catch (error) {
      console.error('Get deck cards error:', error);
      
      if (error.message === 'Deck not found') {
        return sendError(res, error.message, 404);
      }
      
      sendError(res, 'Failed to get cards', 500, error.message);
    }
  }

  /**
   * @swagger
   * /api/cards/{id}:
   *   get:
   *     summary: Get card by ID
   *     tags: [Cards]
   *     security:
   *       - BearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: Card ID
   *     responses:
   *       200:
   *         description: Card retrieved successfully
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
   *                   example: Card retrieved successfully
   *                 data:
   *                   $ref: '#/components/schemas/Card'
   *       404:
   *         description: Card not found
   */
  static async getCardById(req, res) {
    try {
      const card = await CardService.getCardById(req.params.id, req.user.id);
      
      sendSuccess(res, card, 'Card retrieved successfully');
    } catch (error) {
      console.error('Get card by ID error:', error);
      
      if (error.message === 'Card not found') {
        return sendError(res, error.message, 404);
      }
      
      sendError(res, 'Failed to get card', 500, error.message);
    }
  }

  /**
   * @swagger
   * /api/cards/{id}:
   *   put:
   *     summary: Update card
   *     tags: [Cards]
   *     security:
   *       - BearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: Card ID
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               frontText:
   *                 type: string
   *                 example: Updated Hello
   *               backText:
   *                 type: string
   *                 example: Updated Xin chào
   *               memorized:
   *                 type: boolean
   *                 example: true
   *     responses:
   *       200:
   *         description: Card updated successfully
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
   *                   example: Card updated successfully
   *                 data:
   *                   $ref: '#/components/schemas/Card'
   *       404:
   *         description: Card not found
   */
  static async updateCard(req, res) {
    try {
      const card = await CardService.updateCard(req.params.id, req.user.id, req.body);
      
      sendSuccess(res, card, 'Card updated successfully');
    } catch (error) {
      console.error('Update card error:', error);
      
      if (error.message === 'Card not found') {
        return sendError(res, error.message, 404);
      }
      
      sendError(res, 'Failed to update card', 500, error.message);
    }
  }

  /**
   * @swagger
   * /api/cards/{id}:
   *   delete:
   *     summary: Delete card
   *     tags: [Cards]
   *     security:
   *       - BearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: Card ID
   *     responses:
   *       200:
   *         description: Card deleted successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Success'
   *       404:
   *         description: Card not found
   */
  static async deleteCard(req, res) {
    try {
      await CardService.deleteCard(req.params.id, req.user.id);
      
      sendSuccess(res, null, 'Card deleted successfully');
    } catch (error) {
      console.error('Delete card error:', error);
      
      if (error.message === 'Card not found') {
        return sendError(res, error.message, 404);
      }
      
      sendError(res, 'Failed to delete card', 500, error.message);
    }
  }

  /**
   * @swagger
   * /api/cards/{id}/toggle-memorized:
   *   patch:
   *     summary: Toggle card memorized status
   *     tags: [Cards]
   *     security:
   *       - BearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: Card ID
   *     responses:
   *       200:
   *         description: Card memorized status toggled successfully
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
   *                   example: Card memorized status updated successfully
   *                 data:
   *                   $ref: '#/components/schemas/Card'
   *       404:
   *         description: Card not found
   */
  static async toggleMemorized(req, res) {
    try {
      const card = await CardService.toggleMemorized(req.params.id, req.user.id);
      
      sendSuccess(res, card, 'Card memorized status updated successfully');
    } catch (error) {
      console.error('Toggle memorized error:', error);
      
      if (error.message === 'Card not found') {
        return sendError(res, error.message, 404);
      }
      
      sendError(res, 'Failed to update card status', 500, error.message);
    }
  }

  /**
   * @swagger
   * /api/decks/{deckId}/cards/bulk-memorized:
   *   patch:
   *     summary: Bulk update cards memorized status
   *     tags: [Cards]
   *     security:
   *       - BearerAuth: []
   *     parameters:
   *       - in: path
   *         name: deckId
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
   *             required:
   *               - cardIds
   *               - memorized
   *             properties:
   *               cardIds:
   *                 type: array
   *                 items:
   *                   type: string
   *                 example: ["card1", "card2", "card3"]
   *               memorized:
   *                 type: boolean
   *                 example: true
   *     responses:
   *       200:
   *         description: Cards updated successfully
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
   *                   example: Cards updated successfully
   *                 data:
   *                   type: object
   *                   properties:
   *                     updatedCount:
   *                       type: integer
   *                     memorized:
   *                       type: boolean
   */
  static async bulkUpdateMemorized(req, res) {
    try {
      const { cardIds, memorized } = req.body;
      
      if (!Array.isArray(cardIds) || cardIds.length === 0) {
        return sendError(res, 'Card IDs array is required and cannot be empty', 400);
      }
      
      if (typeof memorized !== 'boolean') {
        return sendError(res, 'Memorized status must be a boolean', 400);
      }
      
      const result = await CardService.bulkUpdateMemorized(
        req.user.id,
        req.params.deckId,
        cardIds,
        memorized
      );
      
      sendSuccess(res, result, 'Cards updated successfully');
    } catch (error) {
      console.error('Bulk update memorized error:', error);
      
      if (error.message === 'Deck not found') {
        return sendError(res, error.message, 404);
      }
      
      sendError(res, 'Failed to update cards', 500, error.message);
    }
  }

  /**
   * @swagger
   * /api/decks/{deckId}/study:
   *   get:
   *     summary: Get cards for study session
   *     tags: [Cards]
   *     security:
   *       - BearerAuth: []
   *     parameters:
   *       - in: path
   *         name: deckId
   *         required: true
   *         schema:
   *           type: string
   *         description: Deck ID
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           minimum: 1
   *           maximum: 100
   *           default: 20
   *         description: Number of cards for study
   *       - in: query
   *         name: memorizedOnly
   *         schema:
   *           type: boolean
   *           default: false
   *         description: Only include memorized cards
   *       - in: query
   *         name: unmemorizedOnly
   *         schema:
   *           type: boolean
   *           default: false
   *         description: Only include unmemorized cards
   *     responses:
   *       200:
   *         description: Study cards retrieved successfully
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
   *                   example: Study cards retrieved successfully
   *                 data:
   *                   type: array
   *                   items:
   *                     $ref: '#/components/schemas/Card'
   */
  static async getStudyCards(req, res) {
    try {
      const { limit, memorizedOnly, unmemorizedOnly } = req.query;
      
      const cards = await CardService.getStudyCards(req.user.id, req.params.deckId, {
        limit: parseInt(limit) || 20,
        memorizedOnly: memorizedOnly === 'true',
        unmemorizedOnly: unmemorizedOnly === 'true',
      });
      
      sendSuccess(res, cards, 'Study cards retrieved successfully');
    } catch (error) {
      console.error('Get study cards error:', error);
      
      if (error.message === 'Deck not found') {
        return sendError(res, error.message, 404);
      }
      
      sendError(res, 'Failed to get study cards', 500, error.message);
    }
  }

  /**
   * @swagger
   * /api/cards/search:
   *   get:
   *     summary: Search cards across all decks
   *     tags: [Cards]
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
   *       - in: query
   *         name: deckId
   *         schema:
   *           type: string
   *         description: Filter by specific deck ID
   *       - in: query
   *         name: memorized
   *         schema:
   *           type: string
   *           enum: [true, false]
   *         description: Filter by memorized status
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
   *                     $ref: '#/components/schemas/Card'
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
  static async searchCards(req, res) {
    try {
      const { q, page, limit, deckId, memorized } = req.query;
      
      if (!q || q.trim().length === 0) {
        return sendError(res, 'Search query is required', 400);
      }
      
      const result = await CardService.searchCards(req.user.id, q.trim(), {
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 10,
        deckId,
        memorized,
      });
      
      sendPaginated(res, result.cards, result.pagination, 'Search results retrieved successfully');
    } catch (error) {
      console.error('Search cards error:', error);
      sendError(res, 'Failed to search cards', 500, error.message);
    }
  }

  /**
   * @swagger
   * /api/decks/{deckId}/cards/stats:
   *   get:
   *     summary: Get card statistics for a deck
   *     tags: [Cards]
   *     security:
   *       - BearerAuth: []
   *     parameters:
   *       - in: path
   *         name: deckId
   *         required: true
   *         schema:
   *           type: string
   *         description: Deck ID
   *     responses:
   *       200:
   *         description: Card statistics retrieved successfully
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
   *                   example: Card statistics retrieved successfully
   *                 data:
   *                   type: object
   *                   properties:
   *                     deckId:
   *                       type: string
   *                     totalCards:
   *                       type: integer
   *                     memorizedCards:
   *                       type: integer
   *                     unmemorizedCards:
   *                       type: integer
   *                     progressPercentage:
   *                       type: integer
   */
  static async getCardStats(req, res) {
    try {
      const stats = await CardService.getCardStats(req.user.id, req.params.deckId);
      
      sendSuccess(res, stats, 'Card statistics retrieved successfully');
    } catch (error) {
      console.error('Get card stats error:', error);
      
      if (error.message === 'Deck not found') {
        return sendError(res, error.message, 404);
      }
      
      sendError(res, 'Failed to get card statistics', 500, error.message);
    }
  }
}

module.exports = CardController;
