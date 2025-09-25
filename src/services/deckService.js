const { prisma, withRetry } = require('../config/database');

/**
 * Deck Service
 */
class DeckService {
  /**
   * Create a new deck
   * @param {string} userId - User ID
   * @param {Object} deckData - Deck data
   * @returns {Object} Created deck
   */
  static async createDeck(userId, deckData) {
    const { name, description } = deckData;

    const deck = await prisma.deck.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        userId,
      },
      include: {
        cards: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return deck;
  }

  /**
   * Get all decks for a user
   * @param {string} userId - User ID
   * @param {Object} options - Query options
   * @returns {Object} Decks with pagination
   */
  static async getUserDecks(userId, options = {}) {
    const { page = 1, limit = 10, search, sortBy = 'createdAt', sortOrder = 'desc' } = options;
    const skip = (page - 1) * limit;

    // Build where clause
    const where = {
      userId,
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    // Build orderBy clause
    const orderBy = { [sortBy]: sortOrder };

    // Get decks first
    const decks = await prisma.deck.findMany({
      where,
      skip,
      take: limit,
      orderBy,
      include: {
        cards: {
          select: {
            id: true,
            memorized: true,
          },
        },
        _count: {
          select: {
            cards: true,
          },
        },
      },
    });

    // Then get count
    const total = await prisma.deck.count({ where });

    // Add statistics to each deck
    const decksWithStats = decks.map(deck => ({
      ...deck,
      stats: {
        totalCards: deck._count.cards,
        memorizedCards: deck.cards.filter(card => card.memorized).length,
        unmemorizedCards: deck.cards.filter(card => !card.memorized).length,
      },
      cards: undefined, // Remove cards from response
      _count: undefined, // Remove _count from response
    }));

    return {
      decks: decksWithStats,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get deck by ID
   * @param {string} deckId - Deck ID
   * @param {string} userId - User ID
   * @returns {Object} Deck
   */
  static async getDeckById(deckId, userId) {
    const deck = await prisma.deck.findFirst({
      where: {
        id: deckId,
        userId,
      },
      include: {
        cards: {
          orderBy: { createdAt: 'desc' },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            cards: true,
          },
        },
      },
    });

    if (!deck) {
      throw new Error('Deck not found');
    }

    // Add statistics
    const stats = {
      totalCards: deck._count.cards,
      memorizedCards: deck.cards.filter(card => card.memorized).length,
      unmemorizedCards: deck.cards.filter(card => !card.memorized).length,
    };

    return {
      ...deck,
      stats,
      _count: undefined,
    };
  }

  /**
   * Update deck
   * @param {string} deckId - Deck ID
   * @param {string} userId - User ID
   * @param {Object} updateData - Update data
   * @returns {Object} Updated deck
   */
  static async updateDeck(deckId, userId, updateData) {
    const { name, description } = updateData;

    // Check if deck exists and belongs to user
    const existingDeck = await prisma.deck.findFirst({
      where: {
        id: deckId,
        userId,
      },
    });

    if (!existingDeck) {
      throw new Error('Deck not found');
    }

    // Update deck
    const deck = await prisma.deck.update({
      where: { id: deckId },
      data: {
        ...(name && { name: name.trim() }),
        ...(description !== undefined && { description: description?.trim() || null }),
      },
      include: {
        cards: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            cards: true,
          },
        },
      },
    });

    // Add statistics
    const stats = {
      totalCards: deck._count.cards,
      memorizedCards: deck.cards.filter(card => card.memorized).length,
      unmemorizedCards: deck.cards.filter(card => !card.memorized).length,
    };

    return {
      ...deck,
      stats,
      cards: undefined,
      _count: undefined,
    };
  }

  /**
   * Delete deck
   * @param {string} deckId - Deck ID
   * @param {string} userId - User ID
   */
  static async deleteDeck(deckId, userId) {
    // Check if deck exists and belongs to user
    const existingDeck = await prisma.deck.findFirst({
      where: {
        id: deckId,
        userId,
      },
    });

    if (!existingDeck) {
      throw new Error('Deck not found');
    }

    // Delete deck (cards will be deleted automatically due to cascade)
    await prisma.deck.delete({
      where: { id: deckId },
    });
  }

  /**
   * Get deck statistics
   * @param {string} deckId - Deck ID
   * @param {string} userId - User ID
   * @returns {Object} Deck statistics
   */
  static async getDeckStats(deckId, userId) {
    const deck = await prisma.deck.findFirst({
      where: {
        id: deckId,
        userId,
      },
      include: {
        cards: {
          select: {
            id: true,
            memorized: true,
            createdAt: true,
          },
        },
      },
    });

    if (!deck) {
      throw new Error('Deck not found');
    }

    const totalCards = deck.cards.length;
    const memorizedCards = deck.cards.filter(card => card.memorized).length;
    const unmemorizedCards = totalCards - memorizedCards;
    const progressPercentage = totalCards > 0 ? Math.round((memorizedCards / totalCards) * 100) : 0;

    // Cards created in the last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentCards = deck.cards.filter(card => card.createdAt >= sevenDaysAgo).length;

    return {
      deckId: deck.id,
      deckName: deck.name,
      totalCards,
      memorizedCards,
      unmemorizedCards,
      progressPercentage,
      recentCards,
      createdAt: deck.createdAt,
      updatedAt: deck.updatedAt,
    };
  }

  /**
   * Search decks
   * @param {string} userId - User ID
   * @param {string} query - Search query
   * @param {Object} options - Search options
   * @returns {Object} Search results
   */
  static async searchDecks(userId, query, options = {}) {
    const { page = 1, limit = 10 } = options;
    const skip = (page - 1) * limit;

    const where = {
      userId,
      OR: [
        { name: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
      ],
    };

    const [decks, total] = await Promise.all([
      prisma.deck.findMany({
        where,
        skip,
        take: limit,
        orderBy: { updatedAt: 'desc' },
        include: {
          _count: {
            select: {
              cards: true,
            },
          },
        },
      }),
      prisma.deck.count({ where }),
    ]);

    return {
      decks: decks.map(deck => ({
        ...deck,
        cardCount: deck._count.cards,
        _count: undefined,
      })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }
}

module.exports = DeckService;
