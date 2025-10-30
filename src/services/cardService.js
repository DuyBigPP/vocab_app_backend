const { prisma, withRetry } = require('../config/database');

class CardService {
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

 
  static async deleteCard(cardId, userId) {
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


    await this.updateDeckCardCount(existingCard.deckId);
  }

  static async toggleMemorized(cardId, userId) {
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


  static async bulkUpdateMemorized(userId, deckId, cardIds, memorized) {
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


  static async getStudyCards(userId, deckId, options = {}) {
    const { limit = 20, memorizedOnly = false, unmemorizedOnly = false } = options;


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
        { memorized: 'asc' }, 
        { updatedAt: 'asc' }, 
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

 
  static async getCardStats(userId, deckId) {
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
