const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Vocab App API',
      version: '1.0.0',
      description: 'API documentation for Vocabulary Learning App',
      contact: {
        name: 'API Support',
        email: 'support@vocabapp.com',
      },
    },
    servers: [
      {
        url: process.env.NODE_ENV === 'production' 
          ? process.env.API_BASE_URL || `https://vocab-app-backend-lmao.onrender.com`
          : `http://localhost:${process.env.PORT || 3000}`,
        description: process.env.NODE_ENV === 'production' ? 'Production server' : 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        User: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            id: {
              type: 'string',
              description: 'User unique identifier',
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'User email address',
            },
            name: {
              type: 'string',
              description: 'User full name',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'User creation timestamp',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'User last update timestamp',
            },
          },
        },
        Deck: {
          type: 'object',
          required: ['name'],
          properties: {
            id: {
              type: 'string',
              description: 'Deck unique identifier',
            },
            name: {
              type: 'string',
              description: 'Deck name',
            },
            description: {
              type: 'string',
              description: 'Deck description',
            },
            cardCount: {
              type: 'integer',
              description: 'Number of cards in deck',
            },
            userId: {
              type: 'string',
              description: 'Owner user ID',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Deck creation timestamp',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Deck last update timestamp',
            },
          },
        },
        Card: {
          type: 'object',
          required: ['frontText', 'backText', 'deckId'],
          properties: {
            id: {
              type: 'string',
              description: 'Card unique identifier',
            },
            frontText: {
              type: 'string',
              description: 'Front side text (vocabulary word)',
            },
            backText: {
              type: 'string',
              description: 'Back side text (meaning/translation)',
            },
            memorized: {
              type: 'boolean',
              description: 'Whether card is memorized',
              default: false,
            },
            deckId: {
              type: 'string',
              description: 'Parent deck ID',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Card creation timestamp',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Card last update timestamp',
            },
          },
        },
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false,
            },
            message: {
              type: 'string',
              description: 'Error message',
            },
            error: {
              type: 'string',
              description: 'Detailed error information',
            },
          },
        },
        Success: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true,
            },
            message: {
              type: 'string',
              description: 'Success message',
            },
            data: {
              type: 'object',
              description: 'Response data',
            },
          },
        },
      },
    },
    security: [
      {
        BearerAuth: [],
      },
    ],
  },
  apis: ['./src/routes/*.js', './src/controllers/*.js'], // Path to the API docs
};

const specs = swaggerJsdoc(options);

module.exports = specs;
