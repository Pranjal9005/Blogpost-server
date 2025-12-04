const { Pool } = require('pg');
require('dotenv').config();

// Check if DATABASE_URL is set
if (!process.env.DATABASE_URL) {
  console.error('\n❌ ERROR: DATABASE_URL is not set in .env file');
  console.error('Please create a .env file with your database connection string.');
  console.error('Example:');
  console.error('  DATABASE_URL=postgresql://user:password@host:port/database');
  console.error('  Or use separate config variables (see below)\n');
  process.exit(1);
}

// Create PostgreSQL connection pool
// PostgreSQL connection string format: postgresql://user:password@host:port/database?sslmode=require
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL.includes('sslmode=require') ? { rejectUnauthorized: false } : false
});

// Test connection
pool.on('connect', () => {
  console.log('🔌 Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('❌ Unexpected error on idle PostgreSQL client', err);
  process.exit(-1);
});

// Initialize database tables
const initializeDatabase = async () => {
  try {
    // Create users table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        profile_picture_url VARCHAR(500),
        bio TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Add profile fields if they don't exist (for existing databases)
    try {
      await pool.query(`
        ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_picture_url VARCHAR(500)
      `);
    } catch (error) {
      if (error.code !== '42701') {
        console.log('Note: profile_picture_url column may already exist');
      }
    }

    try {
      await pool.query(`
        ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT
      `);
    } catch (error) {
      if (error.code !== '42701') {
        console.log('Note: bio column may already exist');
      }
    }

    // Create posts table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS posts (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        content TEXT NOT NULL,
        image_url VARCHAR(500),
        author_id INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Add image_url column if it doesn't exist (for existing databases)
    try {
      await pool.query(`
        ALTER TABLE posts ADD COLUMN IF NOT EXISTS image_url VARCHAR(500)
      `);
    } catch (error) {
      // Column might already exist, ignore error
      if (error.code !== '42701') { // 42701 is "duplicate_column" error
        console.log('Note: image_url column may already exist');
      }
    }

    // Create trigger function to update updated_at timestamp
    await pool.query(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
      END;
      $$ language 'plpgsql';
    `);

    // Create trigger for posts table
    await pool.query(`
      DROP TRIGGER IF EXISTS update_posts_updated_at ON posts;
      CREATE TRIGGER update_posts_updated_at
      BEFORE UPDATE ON posts
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
    `);

    // Create index on author_id for better query performance
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_posts_author_id ON posts(author_id)
    `);

    console.log('✅ Database initialized successfully');
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.error('\n❌ ERROR: Cannot connect to PostgreSQL database');
      console.error('Possible reasons:');
      console.error('  1. PostgreSQL is not running on your machine');
      console.error('  2. DATABASE_URL in .env file is incorrect');
      console.error('  3. Database server is not accessible');
      console.error('\nTo fix this:');
      console.error('  - Check your .env file has the correct DATABASE_URL');
      console.error('  - Format: postgresql://username:password@host:port/database\n');
    } else if (error.code === '28P01') {
      console.error('\n❌ ERROR: Access denied to PostgreSQL database');
      console.error('Possible reasons:');
      console.error('  1. Incorrect password in DATABASE_URL');
      console.error('  2. User does not have permission to access the database');
      console.error('\nTo fix this:');
      console.error('  - Verify your PostgreSQL credentials are correct');
      console.error('  - Check that the database user has the necessary permissions\n');
    } else {
      console.error('❌ Error initializing database:', error.message);
    }
    throw error;
  }
};

module.exports = { pool, initializeDatabase };
