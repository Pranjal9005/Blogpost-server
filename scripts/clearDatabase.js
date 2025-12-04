const { Pool } = require('pg');
require('dotenv').config();

async function clearDatabase() {
  let pool;
  
  try {
    if (!process.env.DATABASE_URL) {
      console.error('❌ ERROR: DATABASE_URL is not set in .env file');
      process.exit(1);
    }

    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DATABASE_URL.includes('sslmode=require') ? { rejectUnauthorized: false } : false
    });

    console.log('🔌 Connected to PostgreSQL database');

    // Get counts before deletion
    const postsCountResult = await pool.query('SELECT COUNT(*) as count FROM posts');
    const usersCountResult = await pool.query('SELECT COUNT(*) as count FROM users');
    
    console.log(`\n📊 Current data:`);
    console.log(`   Posts: ${postsCountResult.rows[0].count}`);
    console.log(`   Users: ${usersCountResult.rows[0].count}`);

    // Delete all posts first (due to foreign key constraints)
    console.log('\n🗑️  Deleting all posts...');
    await pool.query('DELETE FROM posts');
    console.log('✅ All posts deleted');

    // Delete all users
    console.log('🗑️  Deleting all users...');
    await pool.query('DELETE FROM users');
    console.log('✅ All users deleted');

    // Reset sequences (PostgreSQL equivalent of AUTO_INCREMENT)
    console.log('🔄 Resetting sequences...');
    await pool.query('ALTER SEQUENCE users_id_seq RESTART WITH 1');
    await pool.query('ALTER SEQUENCE posts_id_seq RESTART WITH 1');
    console.log('✅ Sequences reset');

    // Verify deletion
    const postsAfterResult = await pool.query('SELECT COUNT(*) as count FROM posts');
    const usersAfterResult = await pool.query('SELECT COUNT(*) as count FROM users');
    
    console.log(`\n📊 Data after deletion:`);
    console.log(`   Posts: ${postsAfterResult.rows[0].count}`);
    console.log(`   Users: ${usersAfterResult.rows[0].count}`);
    
    console.log('\n✅ Database cleared successfully!');

  } catch (error) {
    console.error('❌ Error clearing database:', error.message);
    if (error.code === '42P01') {
      console.error('⚠️  Tables do not exist yet. Database is already empty.');
    }
    process.exit(1);
  } finally {
    if (pool) {
      await pool.end();
      console.log('\n🔌 Database connection closed');
    }
  }
}

// Run the clearing function
clearDatabase();
