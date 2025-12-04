const express = require('express');
const bcrypt = require('bcryptjs');
const { pool } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const upload = require('../middleware/upload');
const fs = require('fs');
const path = require('path');

const router = express.Router();

// GET /api/user/profile - Get current user's profile
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, username, email, profile_picture_url, bio, created_at FROM users WHERE id = $1',
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get user's post count
    const postCountResult = await pool.query(
      'SELECT COUNT(*) as count FROM posts WHERE author_id = $1',
      [req.user.id]
    );

    const user = result.rows[0];
    res.json({
      ...user,
      post_count: parseInt(postCountResult.rows[0].count)
    });
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/user/profile - Update user profile
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const { username, email, bio, currentPassword, newPassword } = req.body;

    // Get current user data
    const currentUserResult = await pool.query(
      'SELECT * FROM users WHERE id = $1',
      [req.user.id]
    );

    if (currentUserResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const currentUser = currentUserResult.rows[0];
    const updates = [];
    const values = [];
    let paramCount = 1;

    // Update username if provided
    if (username && username !== currentUser.username) {
      // Check if username is already taken
      const usernameCheck = await pool.query(
        'SELECT id FROM users WHERE username = $1 AND id != $2',
        [username, req.user.id]
      );

      if (usernameCheck.rows.length > 0) {
        return res.status(409).json({ error: 'Username already taken' });
      }

      updates.push(`username = $${paramCount}`);
      values.push(username);
      paramCount++;
    }

    // Update email if provided
    if (email && email !== currentUser.email) {
      // Check if email is already taken
      const emailCheck = await pool.query(
        'SELECT id FROM users WHERE email = $1 AND id != $2',
        [email, req.user.id]
      );

      if (emailCheck.rows.length > 0) {
        return res.status(409).json({ error: 'Email already taken' });
      }

      updates.push(`email = $${paramCount}`);
      values.push(email);
      paramCount++;
    }

    // Update bio if provided
    if (bio !== undefined) {
      updates.push(`bio = $${paramCount}`);
      values.push(bio);
      paramCount++;
    }

    // Update password if provided
    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({ error: 'Current password is required to change password' });
      }

      // Verify current password
      const isValidPassword = await bcrypt.compare(currentPassword, currentUser.password);
      if (!isValidPassword) {
        return res.status(401).json({ error: 'Current password is incorrect' });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({ error: 'New password must be at least 6 characters long' });
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      updates.push(`password = $${paramCount}`);
      values.push(hashedPassword);
      paramCount++;
    }

    // If no updates provided
    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    // Add user id to values for WHERE clause
    values.push(req.user.id);

    // Update user
    await pool.query(
      `UPDATE users SET ${updates.join(', ')} WHERE id = $${paramCount}`,
      values
    );

    // Get updated user data
    const updatedUserResult = await pool.query(
      'SELECT id, username, email, profile_picture_url, bio, created_at FROM users WHERE id = $1',
      [req.user.id]
    );

    res.json({
      message: 'Profile updated successfully',
      user: updatedUserResult.rows[0]
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/user/profile-picture - Upload profile picture
router.post('/profile-picture', authenticateToken, upload.single('profile_picture'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    // Get current user to check for existing profile picture
    const currentUserResult = await pool.query(
      'SELECT profile_picture_url FROM users WHERE id = $1',
      [req.user.id]
    );

    if (currentUserResult.rows.length === 0) {
      // If file was uploaded but user not found, delete it
      fs.unlinkSync(req.file.path);
      return res.status(404).json({ error: 'User not found' });
    }

    const currentUser = currentUserResult.rows[0];
    const oldImagePath = currentUser.profile_picture_url
      ? path.join(__dirname, '..', currentUser.profile_picture_url)
      : null;

    // Generate URL for the uploaded image
    const imageUrl = `/uploads/${req.file.filename}`;

    // Update user profile picture
    await pool.query(
      'UPDATE users SET profile_picture_url = $1 WHERE id = $2',
      [imageUrl, req.user.id]
    );

    // Delete old profile picture if it exists
    if (oldImagePath && fs.existsSync(oldImagePath)) {
      try {
        fs.unlinkSync(oldImagePath);
      } catch (error) {
        console.error('Error deleting old profile picture:', error);
        // Don't fail the request if image deletion fails
      }
    }

    // Get updated user data
    const updatedUserResult = await pool.query(
      'SELECT id, username, email, profile_picture_url, bio, created_at FROM users WHERE id = $1',
      [req.user.id]
    );

    res.json({
      message: 'Profile picture updated successfully',
      user: updatedUserResult.rows[0]
    });
  } catch (error) {
    // If file was uploaded but error occurred, delete it
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    console.error('Error uploading profile picture:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/user/profile-picture - Remove profile picture
router.delete('/profile-picture', authenticateToken, async (req, res) => {
  try {
    // Get current user
    const currentUserResult = await pool.query(
      'SELECT profile_picture_url FROM users WHERE id = $1',
      [req.user.id]
    );

    if (currentUserResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const currentUser = currentUserResult.rows[0];

    if (!currentUser.profile_picture_url) {
      return res.status(400).json({ error: 'No profile picture to delete' });
    }

    // Delete image file
    const imagePath = path.join(__dirname, '..', currentUser.profile_picture_url);
    if (fs.existsSync(imagePath)) {
      try {
        fs.unlinkSync(imagePath);
      } catch (error) {
        console.error('Error deleting profile picture file:', error);
        // Continue with database update even if file deletion fails
      }
    }

    // Update user to remove profile picture URL
    await pool.query(
      'UPDATE users SET profile_picture_url = NULL WHERE id = $1',
      [req.user.id]
    );

    // Get updated user data
    const updatedUserResult = await pool.query(
      'SELECT id, username, email, profile_picture_url, bio, created_at FROM users WHERE id = $1',
      [req.user.id]
    );

    res.json({
      message: 'Profile picture removed successfully',
      user: updatedUserResult.rows[0]
    });
  } catch (error) {
    console.error('Error removing profile picture:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/user/posts - Get current user's posts
router.get('/posts', authenticateToken, async (req, res) => {
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

    // Get total count of user's posts
    const countResult = await pool.query(
      'SELECT COUNT(*) as count FROM posts WHERE author_id = $1',
      [req.user.id]
    );
    const totalPosts = parseInt(countResult.rows[0].count);
    const totalPages = Math.ceil(totalPosts / limit);

    // Get user's posts
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
      WHERE p.author_id = $1
      ORDER BY p.created_at DESC
      LIMIT $2 OFFSET $3`,
      [req.user.id, limit, offset]
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
    console.error('Error fetching user posts:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/user/stats - Get user statistics
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    // Get post count
    const postCountResult = await pool.query(
      'SELECT COUNT(*) as count FROM posts WHERE author_id = $1',
      [req.user.id]
    );

    // Get total views (if you add views later, for now just return 0)
    // const viewsResult = await pool.query(
    //   'SELECT SUM(views) as total FROM posts WHERE author_id = $1',
    //   [req.user.id]
    // );

    // Get latest post date
    const latestPostResult = await pool.query(
      'SELECT created_at FROM posts WHERE author_id = $1 ORDER BY created_at DESC LIMIT 1',
      [req.user.id]
    );

    res.json({
      total_posts: parseInt(postCountResult.rows[0].count),
      latest_post_date: latestPostResult.rows[0]?.created_at || null
    });
  } catch (error) {
    console.error('Error fetching user stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;

