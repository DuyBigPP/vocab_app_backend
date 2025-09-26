const { PrismaClient } = require('@prisma/client');

// Tối ưu connection string cho Render free tier
const optimizedUrl = process.env.DATABASE_URL + '&connection_limit=1&pool_timeout=5';

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['error'] : ['error'], // Giảm logging
  datasources: {
    db: {
      url: optimizedUrl,
    },
  },
});

// Lightweight keep-alive - chỉ khi cần
let keepAliveInterval;
let lastActivity = Date.now();

const startKeepAlive = () => {
  if (keepAliveInterval) clearInterval(keepAliveInterval);
  
  // Ping database mỗi 10 phút, NHƯNG chỉ khi không có activity
  keepAliveInterval = setInterval(async () => {
    const timeSinceLastActivity = Date.now() - lastActivity;
    
    // Nếu có activity trong 8 phút qua thì skip ping
    if (timeSinceLastActivity < 8 * 60 * 1000) {
      console.log('🚫 Skipping keep-alive ping (recent activity)');
      return;
    }
    
    try {
      await prisma.$queryRaw`SELECT 1`;
      console.log('🏓 Database keep-alive ping successful');
    } catch (error) {
      console.error('💀 Database keep-alive ping failed:', error.message);
    }
  }, 10 * 60 * 1000); // 10 minutes
};

// Track activity để tối ưu keep-alive
const trackActivity = () => {
  lastActivity = Date.now();
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
  trackActivity(); // Track mỗi lần sử dụng database
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await operation();
      return result;
    } catch (error) {
      const isConnectionError = error.code === 'P1001' || 
        error.message.includes("Can't reach database") ||
        error.message.includes("Connection terminated") ||
        error.message.includes("Connection closed");

      if (isConnectionError && attempt < maxRetries) {
        console.log(`🔄 Database operation failed (attempt ${attempt}/${maxRetries}), retrying...`);
        await ensureConnection();
        // Exponential backoff
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
        await new Promise(resolve => setTimeout(resolve, delay));
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

module.exports = { prisma, withRetry, ensureConnection, trackActivity };
