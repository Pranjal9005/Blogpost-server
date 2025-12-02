# WordNest API Documentation

## Base URL
```
http://localhost:3000
```

## Authentication
Most endpoints require JWT authentication. Include the token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

---

## Routes Overview

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/health` | Health check | Public |
| POST | `/api/auth/signup` | Register new user | Public |
| POST | `/api/auth/login` | Authenticate user | Public |
| GET | `/api/posts` | Get all blog posts (with pagination) | Authenticated |
| GET | `/api/posts/:id` | Get single blog post | Authenticated |
| POST | `/api/posts` | Create blog post | Authenticated |
| PUT | `/api/posts/:id` | Update blog post (author only) | Authenticated |
| DELETE | `/api/posts/:id` | Delete blog post (author only) | Authenticated |

---

## 1. Health Check

### GET `/health`
Check if the API server is running.

**Access:** Public (No authentication required)

**Request:**
```bash
GET http://localhost:3000/health
```

**Response:**
```json
{
  "status": "OK",
  "message": "WordNest API is running"
}
```

**Status Code:** `200 OK`

---

## 2. Authentication Routes

### POST `/api/auth/signup`
Register a new user account.

**Access:** Public (No authentication required)

**Request:**
```bash
POST http://localhost:3000/api/auth/signup
Content-Type: application/json
```

**Request Body:**
```json
{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "password123"
}
```

**Validation Rules:**
- `username`: Required, string
- `email`: Required, valid email format
- `password`: Required, minimum 6 characters

**Success Response (201 Created):**
```json
{
  "message": "User created successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "username": "johndoe",
    "email": "john@example.com"
  }
}
```

**Error Responses:**

**400 Bad Request** - Missing fields or invalid password length:
```json
{
  "error": "Username, email, and password are required"
}
```
or
```json
{
  "error": "Password must be at least 6 characters long"
}
```

**409 Conflict** - User already exists:
```json
{
  "error": "Username or email already exists"
}
```

**500 Internal Server Error:**
```json
{
  "error": "Internal server error"
}
```

---

### POST `/api/auth/login`
Authenticate an existing user and receive a JWT token.

**Access:** Public (No authentication required)

**Request:**
```bash
POST http://localhost:3000/api/auth/login
Content-Type: application/json
```

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Validation Rules:**
- `email`: Required, valid email format
- `password`: Required

**Success Response (200 OK):**
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "username": "johndoe",
    "email": "john@example.com"
  }
}
```

**Error Responses:**

**400 Bad Request** - Missing fields:
```json
{
  "error": "Email and password are required"
}
```

**401 Unauthorized** - Invalid credentials:
```json
{
  "error": "Invalid email or password"
}
```

**500 Internal Server Error:**
```json
{
  "error": "Internal server error"
}
```

**Note:** The JWT token expires in 7 days. Save this token to use with authenticated endpoints.

---

## 3. Posts Routes

### GET `/api/posts`
Get all blog posts with pagination support.

**Access:** Authenticated (JWT token required)

**Request:**
```bash
GET http://localhost:3000/api/posts?page=1&limit=10
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Query Parameters:**
- `page` (optional): Page number (default: 1, minimum: 1)
- `limit` (optional): Number of posts per page (default: 10, range: 1-100)

**Examples:**
```bash
# Get first page with default limit (10 posts)
GET http://localhost:3000/api/posts

# Get second page with 20 posts per page
GET http://localhost:3000/api/posts?page=2&limit=20

# Get first page with 5 posts
GET http://localhost:3000/api/posts?page=1&limit=5
```

**Success Response (200 OK):**
```json
{
  "posts": [
    {
      "id": 1,
      "title": "My First Blog Post",
      "content": "This is the content of my first blog post...",
      "author_id": 1,
      "author_name": "johndoe",
      "created_at": "2024-01-15T10:30:00.000Z",
      "updated_at": "2024-01-15T10:30:00.000Z"
    },
    {
      "id": 2,
      "title": "Another Blog Post",
      "content": "This is another blog post...",
      "author_id": 2,
      "author_name": "janedoe",
      "created_at": "2024-01-14T15:20:00.000Z",
      "updated_at": "2024-01-14T15:20:00.000Z"
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalPosts": 50,
    "limit": 10,
    "hasNextPage": true,
    "hasPreviousPage": false
  }
}
```

**Error Responses:**

**400 Bad Request** - Invalid pagination parameters:
```json
{
  "error": "Invalid pagination parameters. Page must be >= 1, limit must be between 1 and 100"
}
```

**401 Unauthorized** - Missing or invalid token:
```json
{
  "error": "Access token required"
}
```
or
```json
{
  "error": "Invalid token"
}
```
or
```json
{
  "error": "Token expired"
}
```

**500 Internal Server Error:**
```json
{
  "error": "Internal server error"
}
```

---

### GET `/api/posts/:id`
Get a single blog post by ID.

**Access:** Authenticated (JWT token required)

**Request:**
```bash
GET http://localhost:3000/api/posts/1
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Path Parameters:**
- `id` (required): Numeric ID of the post

**Success Response (200 OK):**
```json
{
  "id": 1,
  "title": "My First Blog Post",
  "content": "This is the content of my first blog post...",
  "author_id": 1,
  "author_name": "johndoe",
  "created_at": "2024-01-15T10:30:00.000Z",
  "updated_at": "2024-01-15T10:30:00.000Z"
}
```

**Error Responses:**

**400 Bad Request** - Invalid ID:
```json
{
  "error": "Invalid post id"
}
```

**404 Not Found** - Post does not exist:
```json
{
  "error": "Post not found"
}
```

---

### POST `/api/posts`
Create a new blog post.

**Access:** Authenticated (JWT token required)

**Request:**
```bash
POST http://localhost:3000/api/posts
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json
```

**Request Body:**
```json
{
  "title": "My New Blog Post",
  "content": "Here is the content of my new post..."
}
```

**Validation Rules:**
- `title`: Required, max 255 characters
- `content`: Required

**Success Response (201 Created):**
```json
{
  "message": "Post created successfully",
  "post": {
    "id": 7,
    "title": "My New Blog Post",
    "content": "Here is the content of my new post...",
    "author_id": 1,
    "author_name": "johndoe",
    "created_at": "2024-01-15T10:45:00.000Z",
    "updated_at": "2024-01-15T10:45:00.000Z"
  }
}
```

**Error Responses:**
```json
{
  "error": "Title and content are required"
}
```
or
```json
{
  "error": "Title cannot exceed 255 characters"
}
```

---

### PUT `/api/posts/:id`
Update an existing blog post. Only the author of the post can update it.

**Access:** Authenticated (JWT token required, author only)

**Request:**
```bash
PUT http://localhost:3000/api/posts/7
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json
```

**Request Body (one or both fields):**
```json
{
  "title": "Updated Title",
  "content": "Updated content for the post..."
}
```

**Validation Rules:**
- `title`: Optional, max 255 characters
- `content`: Optional
- At least one of `title` or `content` must be provided

**Success Response (200 OK):**
```json
{
  "message": "Post updated successfully",
  "post": {
    "id": 7,
    "title": "Updated Title",
    "content": "Updated content for the post...",
    "author_id": 1,
    "author_name": "johndoe",
    "created_at": "2024-01-15T10:45:00.000Z",
    "updated_at": "2024-01-15T11:00:00.000Z"
  }
}
```

**Error Responses:**

**400 Bad Request** - Invalid input:
```json
{
  "error": "Title or content must be provided"
}
```
or
```json
{
  "error": "Title cannot exceed 255 characters"
}
```

**403 Forbidden** - Not the author:
```json
{
  "error": "You do not have permission to update this post"
}
```

**404 Not Found** - Post does not exist:
```json
{
  "error": "Post not found"
}
```

---

### DELETE `/api/posts/:id`
Delete a blog post. Only the author of the post can delete it.

**Access:** Authenticated (JWT token required, author only)

**Request:**
```bash
DELETE http://localhost:3000/api/posts/7
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Success Response (200 OK):**
```json
{
  "message": "Post deleted successfully"
}
```

**Error Responses:**

**400 Bad Request** - Invalid ID:
```json
{
  "error": "Invalid post id"
}
```

**403 Forbidden** - Not the author:
```json
{
  "error": "You do not have permission to delete this post"
}
```

**404 Not Found** - Post does not exist:
```json
{
  "error": "Post not found"
}
```

---
## Testing with cURL

### 1. Signup
```bash
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "username": "johndoe",
    "email": "john@example.com",
    "password": "password123"
  }'
```

### 2. Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "password123"
  }'
```

### 3. Get Posts (with authentication)
```bash
curl -X GET http://localhost:3000/api/posts?page=1&limit=10 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE"
```

### 4. Health Check
```bash
curl -X GET http://localhost:3000/health
```

---

## Testing with Postman

### Setup
1. Create a new collection called "WordNest API"
2. Set base URL variable: `base_url = http://localhost:3000`

### 1. Signup Request
- **Method:** POST
- **URL:** `{{base_url}}/api/auth/signup`
- **Headers:** `Content-Type: application/json`
- **Body (raw JSON):**
```json
{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "password123"
}
```
- **Save Response:** Copy the `token` from response

### 2. Login Request
- **Method:** POST
- **URL:** `{{base_url}}/api/auth/login`
- **Headers:** `Content-Type: application/json`
- **Body (raw JSON):**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```
- **Save Response:** Copy the `token` from response

### 3. Get Posts Request
- **Method:** GET
- **URL:** `{{base_url}}/api/posts?page=1&limit=10`
- **Headers:** 
  - `Authorization: Bearer {{token}}`
  - Replace `{{token}}` with the token from signup/login

---

## Database Schema

### Users Table
```sql
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Posts Table
```sql
CREATE TABLE posts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  author_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE
);
```

---

## Error Codes Summary

| Status Code | Description |
|------------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request (validation error) |
| 401 | Unauthorized (authentication required/invalid) |
| 409 | Conflict (resource already exists) |
| 500 | Internal Server Error |

---

## Notes

- JWT tokens expire after 7 days
- All passwords are hashed using bcrypt
- Posts are ordered by creation date (newest first)
- Pagination is 1-indexed (first page is 1, not 0)
- Maximum limit per page is 100 posts
- All timestamps are in UTC format

---

## Support

For issues or questions, please check the server logs or contact the development team.


