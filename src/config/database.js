const { PrismaClient } = require('@prisma/client');


const optimizedUrl = process.env.DATABASE_URL;

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['error'] : ['error'], 
  datasources: {
    db: {
      url: optimizedUrl,
    },
  },
});


let keepAliveInterval;

const startKeepAlive = () => {
  if (keepAliveInterval) clearInterval(keepAliveInterval);
  
 
  keepAliveInterval = setInterval(async () => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      console.log('🏓 Database keep-alive ping successful');
    } catch (error) {
      console.error('� Database keep-alive ping failed:', error.message);
      // Thử reconnect nếu ping fail
      try {
        await ensureConnection();
        console.log('✅ Database reconnected after ping failure');
      } catch (reconnectError) {
        console.error('❌ Failed to reconnect after ping failure:', reconnectError.message);
      }
    }
  }, 4 * 60 * 1000); 
};

// Health check 
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


const withRetry = async (operation, maxRetries = 2) => {
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
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      
      throw error;
    }
  }
};

// Warmup connection
const warmupConnection = async () => {
  try {
    console.log('🔥 Warming up database connection...');
    await ensureConnection();
    console.log('✅ Database warmed up successfully');
  } catch (error) {
    console.error('❌ Database warmup failed:', error);
  }
};


warmupConnection().then(() => {
  startKeepAlive();
  console.log('🔄 Database keep-alive started');
});


process.on('beforeExit', async () => {
  console.log('🔌 Disconnecting from database...');
  if (keepAliveInterval) {
    clearInterval(keepAliveInterval);
    console.log('🛑 Database keep-alive stopped');
  }
  await prisma.$disconnect();
});

module.exports = { prisma, withRetry, ensureConnection };
