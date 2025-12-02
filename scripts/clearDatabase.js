const mysql = require('mysql2/promise');
require('dotenv').config();

async function clearDatabase() {
  let connection;
  
  try {
    // Parse DATABASE_URL
    const url = new URL(process.env.DATABASE_URL.replace('mysql://', 'http://'));
    
    connection = await mysql.createConnection({
      host: url.hostname,
      port: parseInt(url.port) || 3306,
      user: decodeURIComponent(url.username),
      password: decodeURIComponent(url.password || ''),
      database: url.pathname.slice(1)
    });

    console.log('🔌 Connected to MySQL database');

    // Get counts before deletion
    const [postsCount] = await connection.query('SELECT COUNT(*) as count FROM posts');
    const [usersCount] = await connection.query('SELECT COUNT(*) as count FROM users');
    
    console.log(`\n📊 Current data:`);
    console.log(`   Posts: ${postsCount[0].count}`);
    console.log(`   Users: ${usersCount[0].count}`);

    // Delete all posts first (due to foreign key constraints)
    console.log('\n🗑️  Deleting all posts...');
    await connection.query('DELETE FROM posts');
    console.log('✅ All posts deleted');

    // Delete all users
    console.log('🗑️  Deleting all users...');
    await connection.query('DELETE FROM users');
    console.log('✅ All users deleted');

    // Reset auto-increment counters
    console.log('🔄 Resetting auto-increment counters...');
    await connection.query('ALTER TABLE posts AUTO_INCREMENT = 1');
    await connection.query('ALTER TABLE users AUTO_INCREMENT = 1');
    console.log('✅ Auto-increment counters reset');

    // Verify deletion
    const [postsAfter] = await connection.query('SELECT COUNT(*) as count FROM posts');
    const [usersAfter] = await connection.query('SELECT COUNT(*) as count FROM users');
    
    console.log(`\n📊 Data after deletion:`);
    console.log(`   Posts: ${postsAfter[0].count}`);
    console.log(`   Users: ${usersAfter[0].count}`);
    
    console.log('\n✅ Database cleared successfully!');

  } catch (error) {
    console.error('❌ Error clearing database:', error.message);
    if (error.code === 'ER_NO_SUCH_TABLE') {
      console.error('⚠️  Tables do not exist yet. Database is already empty.');
    }
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Database connection closed');
    }
  }
}

// Run the clearing function
clearDatabase();


