const express = require('express');
const { pool } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// GET /api/posts - Get all blog posts with pagination
router.get('/', authenticateToken, async (req, res) => {
  try {
    // Get pagination parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    // Validate pagination parameters
    if (page < 1 || limit < 1 || limit > 100) {
      return res.status(400).json({ 
        error: 'Invalid pagination parameters. Page must be >= 1, limit must be between 1 and 100' 
      });
    }

    // Get total count of posts
    const [countResult] = await pool.query('SELECT COUNT(*) as count FROM posts');
    const totalPosts = parseInt(countResult[0].count);
    const totalPages = Math.ceil(totalPosts / limit);

    // Get posts with author information
    const [result] = await pool.query(
      `SELECT 
        p.id, 
        p.title, 
        p.content, 
        p.author_id, 
        u.username as author_name,
        p.created_at, 
        p.updated_at
      FROM posts p
      JOIN users u ON p.author_id = u.id
      ORDER BY p.created_at DESC
      LIMIT ? OFFSET ?`,
      [limit, offset]
    );

    res.json({
      posts: result,
      pagination: {
        currentPage: page,
        totalPages,
        totalPosts,
        limit,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1
      }
    });
  } catch (error) {
    console.error('Error fetching posts:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/posts/:id - Get single blog post
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const postId = parseInt(req.params.id);

    if (Number.isNaN(postId) || postId < 1) {
      return res.status(400).json({ error: 'Invalid post id' });
    }

    const [posts] = await pool.query(
      `SELECT 
        p.id,
        p.title,
        p.content,
        p.author_id,
        u.username as author_name,
        p.created_at,
        p.updated_at
      FROM posts p
      JOIN users u ON p.author_id = u.id
      WHERE p.id = ?`,
      [postId]
    );

    if (posts.length === 0) {
      return res.status(404).json({ error: 'Post not found' });
    }

    res.json(posts[0]);
  } catch (error) {
    console.error('Error fetching post:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/posts - Create new blog post
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { title, content } = req.body;

    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content are required' });
    }

    if (title.length > 255) {
      return res.status(400).json({ error: 'Title cannot exceed 255 characters' });
    }

    const [result] = await pool.query(
      'INSERT INTO posts (title, content, author_id) VALUES (?, ?, ?)',
      [title, content, req.user.id]
    );

    const [createdPost] = await pool.query(
      `SELECT 
        p.id,
        p.title,
        p.content,
        p.author_id,
        u.username as author_name,
        p.created_at,
        p.updated_at
      FROM posts p
      JOIN users u ON p.author_id = u.id
      WHERE p.id = ?`,
      [result.insertId]
    );

    res.status(201).json({
      message: 'Post created successfully',
      post: createdPost[0]
    });
  } catch (error) {
    console.error('Error creating post:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/posts/:id - Update a blog post
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const postId = parseInt(req.params.id);
    const { title, content } = req.body;

    if (Number.isNaN(postId) || postId < 1) {
      return res.status(400).json({ error: 'Invalid post id' });
    }

    if (!title && !content) {
      return res.status(400).json({ error: 'Title or content must be provided' });
    }

    const [posts] = await pool.query('SELECT * FROM posts WHERE id = ?', [postId]);

    if (posts.length === 0) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const post = posts[0];

    if (post.author_id !== req.user.id) {
      return res.status(403).json({ error: 'You do not have permission to update this post' });
    }

    const updatedTitle = title || post.title;
    const updatedContent = content || post.content;

    if (updatedTitle.length > 255) {
      return res.status(400).json({ error: 'Title cannot exceed 255 characters' });
    }

    await pool.query(
      'UPDATE posts SET title = ?, content = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [updatedTitle, updatedContent, postId]
    );

    const [updatedPosts] = await pool.query(
      `SELECT 
        p.id,
        p.title,
        p.content,
        p.author_id,
        u.username as author_name,
        p.created_at,
        p.updated_at
      FROM posts p
      JOIN users u ON p.author_id = u.id
      WHERE p.id = ?`,
      [postId]
    );

    res.json({
      message: 'Post updated successfully',
      post: updatedPosts[0]
    });
  } catch (error) {
    console.error('Error updating post:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/posts/:id - Delete a blog post
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const postId = parseInt(req.params.id);

    if (Number.isNaN(postId) || postId < 1) {
      return res.status(400).json({ error: 'Invalid post id' });
    }

    const [posts] = await pool.query('SELECT * FROM posts WHERE id = ?', [postId]);

    if (posts.length === 0) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const post = posts[0];

    if (post.author_id !== req.user.id) {
      return res.status(403).json({ error: 'You do not have permission to delete this post' });
    }

    await pool.query('DELETE FROM posts WHERE id = ?', [postId]);

    res.json({ message: 'Post deleted successfully' });
  } catch (error) {
    console.error('Error deleting post:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
