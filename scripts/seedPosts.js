const { Pool } = require('pg');
require('dotenv').config();

// Sample blog posts data
const samplePosts = [
  {
    title: "Getting Started with Node.js and Express",
    content: `Node.js has revolutionized backend development with its event-driven, non-blocking I/O model. In this post, we'll explore how to build a RESTful API using Express.js, one of the most popular Node.js frameworks.

Express.js provides a minimal and flexible framework for building web applications. It offers a robust set of features for web and mobile applications, including:
- Simple routing
- Middleware support
- Template engine integration
- Easy database integration

Whether you're building a simple blog API or a complex microservices architecture, Express.js provides the tools you need to get started quickly. Let's dive into creating your first Express server!`
  },
  {
    title: "Understanding JWT Authentication",
    content: `JSON Web Tokens (JWT) have become the standard for stateless authentication in modern web applications. Unlike traditional session-based authentication, JWTs allow you to authenticate users without storing session data on the server.

Here's how JWT authentication works:
1. User logs in with credentials
2. Server validates credentials and generates a JWT
3. Client stores the token (usually in localStorage or cookies)
4. Client sends token with each request
5. Server validates token and processes the request

JWTs consist of three parts: Header, Payload, and Signature. The header contains metadata about the token, the payload contains claims (user data), and the signature ensures the token hasn't been tampered with.

Best practices for JWT:
- Always use HTTPS to transmit tokens
- Set appropriate expiration times
- Don't store sensitive data in the payload
- Use strong secret keys for signing

Implementing JWT authentication in your application provides a scalable and secure way to handle user authentication.`
  },
  {
    title: "MySQL vs PostgreSQL: Choosing the Right Database",
    content: `When building a web application, choosing the right database is crucial. MySQL and PostgreSQL are two of the most popular open-source relational databases. Let's compare them:

**MySQL:**
- Widely used and well-documented
- Excellent performance for read-heavy workloads
- Great for web applications and content management
- Easy to set up and maintain
- Strong community support

**PostgreSQL:**
- More advanced features (JSON support, full-text search)
- Better for complex queries and analytics
- ACID compliant with strong data integrity
- Excellent for large-scale applications
- More SQL standards compliant

For most blog applications, MySQL is a great choice due to its simplicity and performance. However, if you need advanced features or are building a complex application, PostgreSQL might be the better option.

Both databases are excellent choices, and the decision often comes down to your specific needs and team expertise.`
  },
  {
    title: "Building RESTful APIs: Best Practices",
    content: `REST (Representational State Transfer) is an architectural style for designing networked applications. RESTful APIs follow specific conventions that make them intuitive and easy to use.

**Key Principles:**
1. **Use HTTP methods correctly**: GET for reading, POST for creating, PUT for updating, DELETE for deleting
2. **Use meaningful URLs**: /api/users, /api/posts, not /api/get-users
3. **Stateless**: Each request should contain all information needed
4. **Use proper HTTP status codes**: 200 for success, 201 for created, 400 for bad request, etc.
5. **Version your API**: /api/v1/users instead of /api/users

**Response Format:**
Always return consistent JSON responses. Include metadata like pagination information when needed.

**Error Handling:**
Provide clear error messages that help developers understand what went wrong. Include error codes and descriptive messages.

**Security:**
- Always use HTTPS in production
- Implement authentication and authorization
- Validate and sanitize all inputs
- Use rate limiting to prevent abuse

Following these best practices will make your API more maintainable, secure, and user-friendly.`
  },
  {
    title: "The Future of Web Development",
    content: `Web development continues to evolve at a rapid pace. As we look to the future, several trends are shaping the landscape:

**Serverless Architecture:**
Functions-as-a-Service (FaaS) platforms like AWS Lambda and Vercel are making it easier to build scalable applications without managing servers.

**API-First Development:**
Building APIs first allows for multiple frontends (web, mobile, desktop) to consume the same backend services.

**Microservices:**
Breaking applications into smaller, independent services improves scalability and maintainability.

**Modern JavaScript:**
ES6+ features, TypeScript, and modern frameworks continue to improve developer experience and application performance.

**AI Integration:**
AI-powered tools are becoming integrated into development workflows, helping developers write better code faster.

**Security Focus:**
With increasing cyber threats, security is becoming a first-class concern in application development.

As developers, staying current with these trends while maintaining a solid foundation in core technologies is key to building successful applications. The future looks bright for web development!`
  },
  {
    title: "Understanding Database Indexing",
    content: `Database indexes are crucial for query performance. They work like an index in a book - they help the database find data quickly without scanning every row.

**How Indexes Work:**
When you create an index on a column, the database creates a data structure that allows it to quickly locate rows. Without an index, the database performs a full table scan, which can be slow for large tables.

**When to Use Indexes:**
- Columns used in WHERE clauses
- Foreign keys (for JOIN operations)
- Columns used for sorting (ORDER BY)
- Columns used for grouping (GROUP BY)

**Types of Indexes:**
1. **Primary Key**: Automatically indexed, unique identifier
2. **Foreign Key**: Improves JOIN performance
3. **Single Column**: Index on one column
4. **Composite**: Index on multiple columns

**Best Practices:**
- Don't over-index: Too many indexes slow down INSERT/UPDATE operations
- Index frequently queried columns
- Monitor query performance and adjust indexes accordingly

**Example:**
If you frequently query posts by author_id, creating an index on author_id will significantly improve query performance, especially as your database grows.

Proper indexing is one of the easiest ways to improve database performance without changing your application code.`
  }
];

async function seedPosts() {
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

    // Check if users table exists and has users
    const usersResult = await pool.query('SELECT id, username FROM users LIMIT 1');
    const users = usersResult.rows;
    
    let authorId;
    
    if (users.length === 0) {
      // Create a test user
      console.log('📝 Creating test user...');
      const result = await pool.query(
        'INSERT INTO users (username, email, password) VALUES ($1, $2, $3) RETURNING id',
        ['testuser', 'test@example.com', '$2a$10$dummyhashedpassword'] // Dummy hash for seeding
      );
      authorId = result.rows[0].id;
      console.log(`✅ Created test user with ID: ${authorId}`);
    } else {
      authorId = users[0].id;
      console.log(`✅ Using existing user: ${users[0].username} (ID: ${authorId})`);
    }

    // Check if posts already exist
    const existingPostsResult = await pool.query('SELECT COUNT(*) as count FROM posts');
    
    if (parseInt(existingPostsResult.rows[0].count) > 0) {
      console.log(`⚠️  Found ${existingPostsResult.rows[0].count} existing posts. Adding more sample posts...`);
    }

    // Insert sample posts
    console.log('📝 Inserting sample blog posts...');
    
    for (const post of samplePosts) {
      await pool.query(
        'INSERT INTO posts (title, content, author_id) VALUES ($1, $2, $3)',
        [post.title, post.content, authorId]
      );
    }

    console.log(`✅ Successfully inserted ${samplePosts.length} sample blog posts!`);
    
    // Show summary
    const totalPostsResult = await pool.query('SELECT COUNT(*) as count FROM posts');
    console.log(`\n📊 Total posts in database: ${totalPostsResult.rows[0].count}`);
    
    const recentPostsResult = await pool.query(
      'SELECT id, title, created_at FROM posts ORDER BY created_at DESC LIMIT 5'
    );
    
    console.log('\n📋 Recent posts:');
    recentPostsResult.rows.forEach((post, index) => {
      console.log(`   ${index + 1}. ${post.title} (ID: ${post.id})`);
    });

  } catch (error) {
    console.error('❌ Error seeding posts:', error.message);
    process.exit(1);
  } finally {
    if (pool) {
      await pool.end();
      console.log('\n🔌 Database connection closed');
    }
  }
}

// Run the seeding function
seedPosts();
