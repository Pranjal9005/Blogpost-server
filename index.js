const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Check for required environment variables
if (!process.env.JWT_SECRET) {
  console.error('\n❌ ERROR: JWT_SECRET is not set in .env file');
  console.error('Please add JWT_SECRET to your .env file');
  console.error('Example: JWT_SECRET=your-super-secret-jwt-key\n');
  process.exit(1);
}

const { initializeDatabase } = require('./config/database');
const authRoutes = require('./routes/auth');
const postsRoutes = require('./routes/posts');
const userRoutes = require('./routes/user');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded images statically
// Note: On Vercel, files in /tmp are temporary and not accessible via static serving
// Consider using cloud storage (S3, Cloudinary, etc.) for production
if (process.env.VERCEL !== '1') {
  app.use('/uploads', express.static('uploads'));
}

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/posts', postsRoutes);
app.use('/api/user', userRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'WordNest API is running' });
});

// Initialize database and start server
const startServer = async () => {
  try {
    await initializeDatabase();
    
    // Only start server if not in Vercel environment
    if (process.env.VERCEL !== '1') {
      app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
        console.log(`Health check: http://localhost:${PORT}/health`);
      });
    }
  } catch (error) {
    console.error('Failed to start server:', error);
    if (process.env.VERCEL !== '1') {
      process.exit(1);
    }
  }
};

// Initialize database on module load (for Vercel)
if (process.env.VERCEL === '1') {
  initializeDatabase().catch(console.error);
} else {
  startServer();
}

module.exports = app;

