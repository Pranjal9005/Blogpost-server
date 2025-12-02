const mysql = require('mysql2/promise');
require('dotenv').config();

// Check if DATABASE_URL is set
if (!process.env.DATABASE_URL) {
  console.error('\n❌ ERROR: DATABASE_URL is not set in .env file');
  console.error('Please create a .env file with your database connection string.');
  console.error('Example:');
  console.error('  DATABASE_URL=mysql://root:password@127.0.0.1:3306/wordnest');
  console.error('  Or use separate config variables (see below)\n');
  process.exit(1);
}

// Parse DATABASE_URL
// Format: mysql://user:password@host:port/database
// Note: Special characters in password should be URL-encoded (e.g., @ becomes %40, # becomes %23)
let poolConfig;
try {
  const url = new URL(process.env.DATABASE_URL.replace('mysql://', 'http://'));
  poolConfig = {
    host: url.hostname,
    port: parseInt(url.port) || 3306,
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password || ''),
    database: url.pathname.slice(1), // Remove leading /
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  };
  
  // Debug log (remove password before logging)
  console.log(`🔌 Connecting to MySQL: ${poolConfig.user}@${poolConfig.host}:${poolConfig.port}/${poolConfig.database}`);
} catch (error) {
  console.error('❌ Error parsing DATABASE_URL:', error.message);
  console.error('Please check your DATABASE_URL format: mysql://username:password@host:port/database');
  process.exit(1);
}

const pool = mysql.createPool(poolConfig);

// Initialize database tables
const initializeDatabase = async () => {
  try {
    // Create users table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create posts table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS posts (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        content TEXT NOT NULL,
        author_id INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Create index on author_id for better query performance (MySQL doesn't support IF NOT EXISTS for indexes)
    try {
      const [indexCheck] = await pool.query(`
        SELECT COUNT(*) as count 
        FROM information_schema.statistics 
        WHERE table_schema = DATABASE() 
        AND table_name = 'posts' 
        AND index_name = 'idx_posts_author_id'
      `);
      
      if (indexCheck[0].count === 0) {
        await pool.query(`
          CREATE INDEX idx_posts_author_id ON posts(author_id)
        `);
      }
    } catch (error) {
      // Index might already exist, ignore error
      console.log('Index creation skipped (may already exist)');
    }

    console.log('✅ Database initialized successfully');
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.error('\n❌ ERROR: Cannot connect to MySQL database');
      console.error('Possible reasons:');
      console.error('  1. MySQL is not running on your machine');
      console.error('  2. DATABASE_URL in .env file is incorrect');
      console.error('  3. Database server is not accessible');
      console.error('\nTo fix this:');
      console.error('  - For local development: Start MySQL service');
      console.error('  - Check your .env file has the correct DATABASE_URL');
      console.error('  - Format: mysql://username:password@host:port/database\n');
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('\n❌ ERROR: Access denied to MySQL database');
      console.error('Possible reasons:');
      console.error('  1. Incorrect password in DATABASE_URL');
      console.error('  2. User does not have permission to access the database');
      console.error('  3. Special characters in password need to be URL-encoded');
      console.error('\nTo fix this:');
      console.error('  - Verify your MySQL root password is correct');
      console.error('  - If password contains special characters (@, #, %, etc.), URL-encode them:');
      console.error('    @ becomes %40, # becomes %23, % becomes %25, etc.');
      console.error('  - Example: mysql://root:my%40password@127.0.0.1:3306/blogpost');
      console.error('  - Or try connecting with your MySQL client to verify credentials\n');
    } else {
      console.error('❌ Error initializing database:', error.message);
    }
    throw error;
  }
};

module.exports = { pool, initializeDatabase };
