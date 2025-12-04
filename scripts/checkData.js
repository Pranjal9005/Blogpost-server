const { Pool } = require('pg');
require('dotenv').config();

async function checkData() {
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

    console.log('🔌 Connected to PostgreSQL database\n');
    console.log('='.repeat(60));
    console.log('DATABASE INFORMATION');
    console.log('='.repeat(60));
    
    const url = new URL(process.env.DATABASE_URL);
    console.log(`Database: ${url.pathname.slice(1)}`);
    console.log(`Host: ${url.hostname}:${url.port || 5432}`);
    console.log(`User: ${url.username}\n`);

    // Check users
    console.log('='.repeat(60));
    console.log('USERS TABLE');
    console.log('='.repeat(60));
    const usersResult = await pool.query('SELECT id, username, email, created_at FROM users');
    const users = usersResult.rows;
    
    if (users.length === 0) {
      console.log('❌ No users found in the database\n');
    } else {
      console.log(`✅ Found ${users.length} user(s):\n`);
      users.forEach((user, index) => {
        console.log(`   ${index + 1}. ID: ${user.id}`);
        console.log(`      Username: ${user.username}`);
        console.log(`      Email: ${user.email}`);
        console.log(`      Created: ${user.created_at}`);
        console.log('');
      });
    }

    // Check posts
    console.log('='.repeat(60));
    console.log('POSTS TABLE');
    console.log('='.repeat(60));
    const postsResult = await pool.query(`
      SELECT 
        p.id, 
        p.title, 
        p.author_id,
        u.username as author_name,
        p.created_at,
        p.updated_at,
        LENGTH(p.content) as content_length
      FROM posts p
      LEFT JOIN users u ON p.author_id = u.id
      ORDER BY p.created_at DESC
    `);
    const posts = postsResult.rows;
    
    if (posts.length === 0) {
      console.log('❌ No posts found in the database\n');
    } else {
      console.log(`✅ Found ${posts.length} post(s):\n`);
      posts.forEach((post, index) => {
        console.log(`   ${index + 1}. ID: ${post.id}`);
        console.log(`      Title: ${post.title}`);
        console.log(`      Author: ${post.author_name || 'Unknown'} (ID: ${post.author_id})`);
        console.log(`      Content Length: ${post.content_length} characters`);
        console.log(`      Created: ${post.created_at}`);
        console.log(`      Updated: ${post.updated_at}`);
        console.log('');
      });
    }

    // Summary statistics
    console.log('='.repeat(60));
    console.log('SUMMARY STATISTICS');
    console.log('='.repeat(60));
    
    const userCountResult = await pool.query('SELECT COUNT(*) as count FROM users');
    const postCountResult = await pool.query('SELECT COUNT(*) as count FROM posts');
    const latestPostResult = await pool.query(`
      SELECT title, created_at FROM posts ORDER BY created_at DESC LIMIT 1
    `);
    
    console.log(`Total Users: ${userCountResult.rows[0].count}`);
    console.log(`Total Posts: ${postCountResult.rows[0].count}`);
    if (latestPostResult.rows.length > 0) {
      console.log(`Latest Post: "${latestPostResult.rows[0].title}"`);
      console.log(`Posted: ${latestPostResult.rows[0].created_at}`);
    }
    console.log('='.repeat(60));

  } catch (error) {
    console.error('❌ Error checking data:', error.message);
    process.exit(1);
  } finally {
    if (pool) {
      await pool.end();
      console.log('\n🔌 Database connection closed\n');
    }
  }
}

checkData();
