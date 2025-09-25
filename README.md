# 📚 Vocab App Backend

A comprehensive vocabulary learning application backend built with Node.js, Express, Prisma ORM, and PostgreSQL.

## 🚀 Features

### 🔐 Authentication & User Management
- User registration and login with JWT authentication
- Password hashing with bcryptjs
- Profile management and password change
- Secure JWT token-based authentication

### 📖 Deck Management
- Create, read, update, delete decks
- Search decks by name and description
- Deck statistics and progress tracking
- Pagination support for large datasets

### 🃏 Card Management
- Create, read, update, delete vocabulary cards
- Mark cards as memorized/unmemorized
- Bulk operations for card status updates
- Advanced filtering (memorized, unmemorized, all)
- Search cards across all decks or within specific decks

### 📊 Study Features
- Get optimized study sessions (prioritizes unmemorized cards)
- Progress tracking and statistics
- Card count and memorization progress per deck

### 🔍 Search & Filtering
- Full-text search for decks and cards
- Advanced filtering options
- Sorting by various criteria
- Pagination for all list endpoints

### 📈 Statistics & Analytics
- Deck-level statistics (total cards, memorized/unmemorized)
- Progress percentage calculation
- Recent activity tracking
- Card statistics per deck

## 🛠️ Tech Stack

- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** PostgreSQL (via Supabase)
- **ORM:** Prisma
- **Authentication:** JWT with bcryptjs
- **Documentation:** Swagger/OpenAPI 3.0
- **Security:** Helmet, CORS, Rate Limiting

## 📁 Project Structure

```
vocab_app_backend/
├── src/
│   ├── config/          # Configuration files
│   │   ├── database.js  # Prisma client setup
│   │   └── swagger.js   # Swagger/OpenAPI configuration
│   ├── controllers/     # Request handlers
│   │   ├── authController.js
│   │   ├── deckController.js
│   │   └── cardController.js
│   ├── middleware/      # Custom middleware
│   │   ├── auth.js      # Authentication middleware
│   │   ├── validation.js # Input validation
│   │   └── errorHandler.js # Global error handling
│   ├── routes/          # API routes
│   │   ├── authRoutes.js
│   │   ├── deckRoutes.js
│   │   ├── cardRoutes.js
│   │   ├── deckCardRoutes.js
│   │   └── index.js
│   ├── services/        # Business logic
│   │   ├── authService.js
│   │   ├── deckService.js
│   │   └── cardService.js
│   └── utils/           # Utility functions
│       ├── jwt.js       # JWT utilities
│       └── response.js  # Standardized API responses
├── prisma/
│   └── schema.prisma    # Database schema
├── generated/
│   └── prisma/          # Generated Prisma client
├── server.js            # Main server file
├── package.json
└── README.md
```

## 🚦 Getting Started

### Prerequisites

- Node.js (v16 or higher)
- PostgreSQL database (or Supabase account)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd vocab_app_backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   
   Create a `.env` file in the root directory:
   ```env
   # Database
   DATABASE_URL="postgresql://username:password@localhost:5432/vocab_app?schema=public"
   DIRECT_URL="postgresql://username:password@localhost:5432/vocab_app?schema=public"
   


4. **Database Setup**
   ```bash
   # Generate Prisma client
   npm run db:generate
   
   # Push schema to database (for development)
   npm run db:push
   
   # Or run migrations (for production)
   npm run db:migrate
   ```

5. **Start the server**
   ```bash
   # Development mode with auto-reload
   npm run dev
   
   # Production mode
   npm start
   ```

## 📚 API Documentation

Once the server is running, visit:
- **Swagger UI:** http://localhost:3000/api-docs
- **API Base URL:** http://localhost:3000/api


## 🔧 Available Scripts

```bash
npm start          # Start production server
npm run dev        # Start development server with nodemon
npm run db:generate # Generate Prisma client
npm run db:push    # Push schema changes to database
npm run db:migrate # Run database migrations
npm run db:studio  # Open Prisma Studio (database GUI)
```







