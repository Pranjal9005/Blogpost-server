const express = require('express');
const { pool } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const upload = require('../middleware/upload');
const fs = require('fs');
const path = require('path');

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
    const countResult = await pool.query('SELECT COUNT(*) as count FROM posts');
    const totalPosts = parseInt(countResult.rows[0].count);
    const totalPages = Math.ceil(totalPosts / limit);

    // Get posts with author information
    const result = await pool.query(
      `SELECT 
        p.id, 
        p.title, 
        p.content,
        p.image_url,
        p.author_id, 
        u.username as author_name,
        p.created_at, 
        p.updated_at
      FROM posts p
      JOIN users u ON p.author_id = u.id
      ORDER BY p.created_at DESC
      LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    res.json({
      posts: result.rows,
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

    const posts = await pool.query(
      `SELECT 
        p.id,
        p.title,
        p.content,
        p.image_url,
        p.author_id,
        u.username as author_name,
        p.created_at,
        p.updated_at
      FROM posts p
      JOIN users u ON p.author_id = u.id
      WHERE p.id = $1`,
      [postId]
    );

    if (posts.rows.length === 0) {
      return res.status(404).json({ error: 'Post not found' });
    }

    res.json(posts.rows[0]);
  } catch (error) {
    console.error('Error fetching post:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/posts - Create new blog post with optional image
router.post('/', authenticateToken, upload.single('image'), async (req, res) => {
  try {
    const { title, content } = req.body;

    if (!title || !content) {
      // If file was uploaded but validation failed, delete it
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(400).json({ error: 'Title and content are required' });
    }

    if (title.length > 255) {
      // If file was uploaded but validation failed, delete it
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(400).json({ error: 'Title cannot exceed 255 characters' });
    }

    // Handle image upload
    let imageUrl = null;
    if (req.file) {
      // Generate URL for the uploaded image
      imageUrl = `/uploads/${req.file.filename}`;
    }

    const result = await pool.query(
      'INSERT INTO posts (title, content, image_url, author_id) VALUES ($1, $2, $3, $4) RETURNING id',
      [title, content, imageUrl, req.user.id]
    );

    const postId = result.rows[0].id;

    const createdPost = await pool.query(
      `SELECT 
        p.id,
        p.title,
        p.content,
        p.image_url,
        p.author_id,
        u.username as author_name,
        p.created_at,
        p.updated_at
      FROM posts p
      JOIN users u ON p.author_id = u.id
      WHERE p.id = $1`,
      [postId]
    );

    res.status(201).json({
      message: 'Post created successfully',
      post: createdPost.rows[0]
    });
  } catch (error) {
    // If file was uploaded but error occurred, delete it
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    console.error('Error creating post:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/posts/:id - Update a blog post with optional image
router.put('/:id', authenticateToken, upload.single('image'), async (req, res) => {
  try {
    const postId = parseInt(req.params.id);
    const { title, content } = req.body;

    if (Number.isNaN(postId) || postId < 1) {
      // If file was uploaded but validation failed, delete it
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(400).json({ error: 'Invalid post id' });
    }

    if (!title && !content && !req.file) {
      // If file was uploaded but validation failed, delete it
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(400).json({ error: 'Title, content, or image must be provided' });
    }

    const posts = await pool.query('SELECT * FROM posts WHERE id = $1', [postId]);

    if (posts.rows.length === 0) {
      // If file was uploaded but post not found, delete it
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(404).json({ error: 'Post not found' });
    }

    const post = posts.rows[0];

    if (post.author_id !== req.user.id) {
      // If file was uploaded but permission denied, delete it
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(403).json({ error: 'You do not have permission to update this post' });
    }

    const updatedTitle = title || post.title;
    const updatedContent = content || post.content;

    if (updatedTitle.length > 255) {
      // If file was uploaded but validation failed, delete it
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(400).json({ error: 'Title cannot exceed 255 characters' });
    }

    // Handle image update
    let imageUrl = post.image_url;
    let oldImagePath = null;

    if (req.file) {
      // Delete old image if it exists
      if (post.image_url) {
        oldImagePath = path.join(__dirname, '..', post.image_url);
      }
      // Set new image URL
      imageUrl = `/uploads/${req.file.filename}`;
    }

    await pool.query(
      'UPDATE posts SET title = $1, content = $2, image_url = $3, updated_at = CURRENT_TIMESTAMP WHERE id = $4',
      [updatedTitle, updatedContent, imageUrl, postId]
    );

    // Delete old image file after successful database update
    if (oldImagePath && fs.existsSync(oldImagePath)) {
      try {
        fs.unlinkSync(oldImagePath);
      } catch (error) {
        console.error('Error deleting old image:', error);
        // Don't fail the request if image deletion fails
      }
    }

    const updatedPosts = await pool.query(
      `SELECT 
        p.id,
        p.title,
        p.content,
        p.image_url,
        p.author_id,
        u.username as author_name,
        p.created_at,
        p.updated_at
      FROM posts p
      JOIN users u ON p.author_id = u.id
      WHERE p.id = $1`,
      [postId]
    );

    res.json({
      message: 'Post updated successfully',
      post: updatedPosts.rows[0]
    });
  } catch (error) {
    // If file was uploaded but error occurred, delete it
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
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

    const posts = await pool.query('SELECT * FROM posts WHERE id = $1', [postId]);

    if (posts.rows.length === 0) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const post = posts.rows[0];

    if (post.author_id !== req.user.id) {
      return res.status(403).json({ error: 'You do not have permission to delete this post' });
    }

    // Delete associated image file if it exists
    if (post.image_url) {
      const imagePath = path.join(__dirname, '..', post.image_url);
      if (fs.existsSync(imagePath)) {
        try {
          fs.unlinkSync(imagePath);
        } catch (error) {
          console.error('Error deleting image file:', error);
          // Continue with post deletion even if image deletion fails
        }
      }
    }

    await pool.query('DELETE FROM posts WHERE id = $1', [postId]);

    res.json({ message: 'Post deleted successfully' });
  } catch (error) {
    console.error('Error deleting post:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
