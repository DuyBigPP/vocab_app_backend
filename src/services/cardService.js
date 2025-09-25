const prisma = require('../config/database');

/**
 * Card Service
 */
class CardService {
  /**
   * Create a new card
   * @param {string} userId - User ID
   * @param {string} deckId - Deck ID
   * @param {Object} cardData - Card data
   * @returns {Object} Created card
   */
  static async createCard(userId, deckId, cardData) {
    const { frontText, backText, memorized = false } = cardData;

    // Check if deck exists and belongs to user
    const deck = await prisma.deck.findFirst({
      where: {
        id: deckId,
        userId,
      },
    });

    if (!deck) {
      throw new Error('Deck not found');
    }

    // Create card
    const card = await prisma.card.create({
      data: {
        frontText: frontText.trim(),
        backText: backText.trim(),
        memorized,
        deckId,
      },
      include: {
        deck: {
          select: {
            id: true,
            name: true,
            userId: true,
          },
        },
      },
    });

    // Update deck card count
    await this.updateDeckCardCount(deckId);

    return card;
  }

  /**
   * Get cards for a deck
   * @param {string} userId - User ID
   * @param {string} deckId - Deck ID
   * @param {Object} options - Query options
   * @returns {Object} Cards with pagination
   */
  static async getDeckCards(userId, deckId, options = {}) {
    const { 
      page = 1, 
      limit = 10, 
      search, 
      memorized, 
      sortBy = 'createdAt', 
      sortOrder = 'desc' 
    } = options;
    const skip = (page - 1) * limit;

    // Check if deck exists and belongs to user
    const deck = await prisma.deck.findFirst({
      where: {
        id: deckId,
        userId,
      },
    });

    if (!deck) {
      throw new Error('Deck not found');
    }

    // Build where clause
    const where = {
      deckId,
      ...(search && {
        OR: [
          { frontText: { contains: search, mode: 'insensitive' } },
          { backText: { contains: search, mode: 'insensitive' } },
        ],
      }),
      ...(memorized !== undefined && { memorized: memorized === 'true' }),
    };

    // Build orderBy clause
    const orderBy = { [sortBy]: sortOrder };

    // Get cards with count
    const [cards, total] = await Promise.all([
      prisma.card.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          deck: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),
      prisma.card.count({ where }),
    ]);

    return {
      cards,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get card by ID
   * @param {string} cardId - Card ID
   * @param {string} userId - User ID
   * @returns {Object} Card
   */
  static async getCardById(cardId, userId) {
    const card = await prisma.card.findFirst({
      where: {
        id: cardId,
        deck: {
          userId,
        },
      },
      include: {
        deck: {
          select: {
            id: true,
            name: true,
            userId: true,
          },
        },
      },
    });

    if (!card) {
      throw new Error('Card not found');
    }

    return card;
  }

  /**
   * Update card
   * @param {string} cardId - Card ID
   * @param {string} userId - User ID
   * @param {Object} updateData - Update data
   * @returns {Object} Updated card
   */
  static async updateCard(cardId, userId, updateData) {
    const { frontText, backText, memorized } = updateData;

    // Check if card exists and belongs to user
    const existingCard = await prisma.card.findFirst({
      where: {
        id: cardId,
        deck: {
          userId,
        },
      },
    });

    if (!existingCard) {
      throw new Error('Card not found');
    }

    // Update card
    const card = await prisma.card.update({
      where: { id: cardId },
      data: {
        ...(frontText && { frontText: frontText.trim() }),
        ...(backText && { backText: backText.trim() }),
        ...(memorized !== undefined && { memorized }),
      },
      include: {
        deck: {
          select: {
            id: true,
            name: true,
            userId: true,
          },
        },
      },
    });

    return card;
  }

  /**
   * Delete card
   * @param {string} cardId - Card ID
   * @param {string} userId - User ID
   */
  static async deleteCard(cardId, userId) {
    // Check if card exists and belongs to user
    const existingCard = await prisma.card.findFirst({
      where: {
        id: cardId,
        deck: {
          userId,
        },
      },
      include: {
        deck: true,
      },
    });

    if (!existingCard) {
      throw new Error('Card not found');
    }

    // Delete card
    await prisma.card.delete({
      where: { id: cardId },
    });

    // Update deck card count
    await this.updateDeckCardCount(existingCard.deckId);
  }

  /**
   * Toggle card memorized status
   * @param {string} cardId - Card ID
   * @param {string} userId - User ID
   * @returns {Object} Updated card
   */
  static async toggleMemorized(cardId, userId) {
    // Get current card
    const existingCard = await prisma.card.findFirst({
      where: {
        id: cardId,
        deck: {
          userId,
        },
      },
    });

    if (!existingCard) {
      throw new Error('Card not found');
    }

    // Toggle memorized status
    const card = await prisma.card.update({
      where: { id: cardId },
      data: {
        memorized: !existingCard.memorized,
      },
      include: {
        deck: {
          select: {
            id: true,
            name: true,
            userId: true,
          },
        },
      },
    });

    return card;
  }

  /**
   * Bulk update cards memorized status
   * @param {string} userId - User ID
   * @param {string} deckId - Deck ID
   * @param {Array} cardIds - Array of card IDs
   * @param {boolean} memorized - Memorized status
   * @returns {Object} Update result
   */
  static async bulkUpdateMemorized(userId, deckId, cardIds, memorized) {
    // Check if deck exists and belongs to user
    const deck = await prisma.deck.findFirst({
      where: {
        id: deckId,
        userId,
      },
    });

    if (!deck) {
      throw new Error('Deck not found');
    }

    // Update cards
    const result = await prisma.card.updateMany({
      where: {
        id: { in: cardIds },
        deckId,
      },
      data: {
        memorized,
      },
    });

    return {
      updatedCount: result.count,
      memorized,
    };
  }

  /**
   * Get cards for study session
   * @param {string} userId - User ID
   * @param {string} deckId - Deck ID
   * @param {Object} options - Study options
   * @returns {Array} Study cards
   */
  static async getStudyCards(userId, deckId, options = {}) {
    const { limit = 20, memorizedOnly = false, unmemorizedOnly = false } = options;

    // Check if deck exists and belongs to user
    const deck = await prisma.deck.findFirst({
      where: {
        id: deckId,
        userId,
      },
    });

    if (!deck) {
      throw new Error('Deck not found');
    }

    // Build where clause
    let where = { deckId };

    if (memorizedOnly) {
      where.memorized = true;
    } else if (unmemorizedOnly) {
      where.memorized = false;
    }

    // Get cards (prioritize unmemorized cards)
    const cards = await prisma.card.findMany({
      where,
      take: limit,
      orderBy: [
        { memorized: 'asc' }, // Unmemorized first
        { updatedAt: 'asc' }, // Least recently updated first
      ],
      include: {
        deck: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return cards;
  }

  /**
   * Search cards across all user's decks
   * @param {string} userId - User ID
   * @param {string} query - Search query
   * @param {Object} options - Search options
   * @returns {Object} Search results
   */
  static async searchCards(userId, query, options = {}) {
    const { page = 1, limit = 10, deckId, memorized } = options;
    const skip = (page - 1) * limit;

    const where = {
      deck: {
        userId,
        ...(deckId && { id: deckId }),
      },
      OR: [
        { frontText: { contains: query, mode: 'insensitive' } },
        { backText: { contains: query, mode: 'insensitive' } },
      ],
      ...(memorized !== undefined && { memorized: memorized === 'true' }),
    };

    const [cards, total] = await Promise.all([
      prisma.card.findMany({
        where,
        skip,
        take: limit,
        orderBy: { updatedAt: 'desc' },
        include: {
          deck: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),
      prisma.card.count({ where }),
    ]);

    return {
      cards,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get card statistics for a deck
   * @param {string} userId - User ID
   * @param {string} deckId - Deck ID
   * @returns {Object} Card statistics
   */
  static async getCardStats(userId, deckId) {
    // Check if deck exists and belongs to user
    const deck = await prisma.deck.findFirst({
      where: {
        id: deckId,
        userId,
      },
    });

    if (!deck) {
      throw new Error('Deck not found');
    }

    const stats = await prisma.card.groupBy({
      by: ['memorized'],
      where: { deckId },
      _count: true,
    });

    const totalCards = stats.reduce((sum, stat) => sum + stat._count, 0);
    const memorizedCards = stats.find(stat => stat.memorized)?._count || 0;
    const unmemorizedCards = stats.find(stat => !stat.memorized)?._count || 0;

    return {
      deckId,
      totalCards,
      memorizedCards,
      unmemorizedCards,
      progressPercentage: totalCards > 0 ? Math.round((memorizedCards / totalCards) * 100) : 0,
    };
  }

  /**
   * Update deck card count
   * @param {string} deckId - Deck ID
   * @private
   */
  static async updateDeckCardCount(deckId) {
    const cardCount = await prisma.card.count({
      where: { deckId },
    });

    await prisma.deck.update({
      where: { id: deckId },
      data: { cardCount },
    });
  }
}

module.exports = CardService;
