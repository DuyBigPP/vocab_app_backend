require('dotenv').config();

console.log('=== Environment Variables Debug ===');
console.log('JWT_SECRET:', process.env.JWT_SECRET ? 'SET' : 'NOT SET');
console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'SET' : 'NOT SET');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('PORT:', process.env.PORT);

// Test database connection
const { PrismaClient } = require('./generated/prisma');
const prisma = new PrismaClient();

async function testDatabase() {
  try {
    await prisma.$connect();
    console.log('✅ Database connection successful');
    
    // Test creating a user
    console.log('Testing user creation...');
    const testUser = {
      email: 'test@example.com',
      password: 'testpassword',
      name: 'Test User'
    };
    
    console.log('Test data:', testUser);
    
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testDatabase();
