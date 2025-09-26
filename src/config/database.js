const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

// Keep connection alive với periodic ping
let keepAliveInterval;

const startKeepAlive = () => {
  if (keepAliveInterval) clearInterval(keepAliveInterval);
  
  // Ping database every 5 minutes để giữ connection alive
  keepAliveInterval = setInterval(async () => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      console.log('🏓 Database keep-alive ping successful');
    } catch (error) {
      console.error('💀 Database keep-alive ping failed:', error.message);
    }
  }, 5 * 60 * 1000); // 5 minutes
};

// Health check và auto-reconnect function
const ensureConnection = async () => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    console.log('🔄 Database connection lost, attempting to reconnect...');
    try {
      await prisma.$disconnect();
      await prisma.$connect();
      await prisma.$queryRaw`SELECT 1`;
      console.log('✅ Database reconnected successfully');
      return true;
    } catch (reconnectError) {
      console.error('❌ Failed to reconnect to database:', reconnectError);
      throw reconnectError;
    }
  }
};

// Wrapper cho tất cả database operations với retry logic
const withRetry = async (operation, maxRetries = 2) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      const isConnectionError = error.code === 'P1001' || 
        error.message.includes("Can't reach database") ||
        error.message.includes("Connection terminated") ||
        error.message.includes("Connection closed");

      if (isConnectionError && attempt < maxRetries) {
        console.log(`🔄 Database operation failed (attempt ${attempt}/${maxRetries}), retrying...`);
        await ensureConnection();
        // Wait a bit before retry
        await new Promise(resolve => setTimeout(resolve, 1000));
        continue;
      }
      
      throw error;
    }
  }
};

// Warmup connection on startup
const warmupConnection = async () => {
  try {
    console.log('🔥 Warming up database connection...');
    await ensureConnection();
    console.log('✅ Database warmed up successfully');
  } catch (error) {
    console.error('❌ Database warmup failed:', error);
  }
};

// Auto warmup và start keep-alive
warmupConnection().then(() => {
  startKeepAlive();
  console.log('🔄 Database keep-alive started');
});

// Graceful shutdown
process.on('beforeExit', async () => {
  console.log('🔌 Disconnecting from database...');
  if (keepAliveInterval) {
    clearInterval(keepAliveInterval);
    console.log('🛑 Database keep-alive stopped');
  }
  await prisma.$disconnect();
});

module.exports = { prisma, withRetry, ensureConnection };
