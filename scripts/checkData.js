const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkData() {
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

    console.log('🔌 Connected to MySQL database\n');
    console.log('='.repeat(60));
    console.log('DATABASE INFORMATION');
    console.log('='.repeat(60));
    console.log(`Database: ${url.pathname.slice(1)}`);
    console.log(`Host: ${url.hostname}:${url.port}`);
    console.log(`User: ${url.username}\n`);

    // Check users
    console.log('='.repeat(60));
    console.log('USERS TABLE');
    console.log('='.repeat(60));
    const [users] = await connection.query('SELECT id, username, email, created_at FROM users');
    
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
    const [posts] = await connection.query(`
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
    
    const [userCount] = await connection.query('SELECT COUNT(*) as count FROM users');
    const [postCount] = await connection.query('SELECT COUNT(*) as count FROM posts');
    const [latestPost] = await connection.query(`
      SELECT title, created_at FROM posts ORDER BY created_at DESC LIMIT 1
    `);
    
    console.log(`Total Users: ${userCount[0].count}`);
    console.log(`Total Posts: ${postCount[0].count}`);
    if (latestPost.length > 0) {
      console.log(`Latest Post: "${latestPost[0].title}"`);
      console.log(`Posted: ${latestPost[0].created_at}`);
    }
    console.log('='.repeat(60));

  } catch (error) {
    console.error('❌ Error checking data:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Database connection closed\n');
    }
  }
}

checkData();


