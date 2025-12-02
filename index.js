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

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/posts', postsRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'WordNest API is running' });
});

// Initialize database and start server
const startServer = async () => {
  try {
    await initializeDatabase();
    
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
      console.log(`Health check: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

module.exports = app;

