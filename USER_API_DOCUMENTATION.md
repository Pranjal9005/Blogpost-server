# User Profile API Documentation

## Base URL
```
http://localhost:3000
```

## Authentication
All user profile endpoints require JWT authentication. Include the token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

---

## User Profile Endpoints Overview

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/api/user/profile` | Get current user's profile | Authenticated |
| PUT | `/api/user/profile` | Update user profile | Authenticated |
| POST | `/api/user/profile-picture` | Upload profile picture | Authenticated |
| DELETE | `/api/user/profile-picture` | Remove profile picture | Authenticated |
| GET | `/api/user/posts` | Get current user's posts | Authenticated |
| GET | `/api/user/stats` | Get user statistics | Authenticated |

---

## 1. GET `/api/user/profile`

Get the current authenticated user's profile information.

**Endpoint:** `GET /api/user/profile`  
**Access:** Authenticated (JWT token required)

### Request
```bash
GET http://localhost:3000/api/user/profile
Authorization: Bearer YOUR_TOKEN_HERE
```

### Success Response (200 OK)
```json
{
  "id": 1,
  "username": "johndoe",
  "email": "john@example.com",
  "profile_picture_url": "/uploads/profile-1234567890.jpg",
  "bio": "Software developer and blogger",
  "created_at": "2024-01-15T10:30:00.000Z",
  "post_count": 15
}
```

### Response Fields
- `id` (integer): User ID
- `username` (string): Username
- `email` (string): Email address
- `profile_picture_url` (string|null): URL to profile picture
- `bio` (string|null): User's bio/description
- `created_at` (string): Account creation timestamp (ISO 8601)
- `post_count` (integer): Total number of posts by the user

### Error Responses

**401 Unauthorized - Missing token:**
```json
{
  "error": "Access token required"
}
```

**401 Unauthorized - Invalid token:**
```json
{
  "error": "Invalid token"
}
```

**404 Not Found:**
```json
{
  "error": "User not found"
}
```

**500 Internal Server Error:**
```json
{
  "error": "Internal server error"
}
```

### Example using cURL
```bash
curl -X GET http://localhost:3000/api/user/profile \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## 2. PUT `/api/user/profile`

Update the current authenticated user's profile information.

**Endpoint:** `PUT /api/user/profile`  
**Access:** Authenticated (JWT token required)

### Request
```bash
PUT http://localhost:3000/api/user/profile
Authorization: Bearer YOUR_TOKEN_HERE
Content-Type: application/json
```

### Request Body
All fields are optional. You can update any combination of fields.

```json
{
  "username": "newusername",
  "email": "newemail@example.com",
  "bio": "Updated bio text",
  "currentPassword": "oldpassword123",
  "newPassword": "newpassword123"
}
```

### Validation Rules
- `username`: Optional, must be unique if changed
- `email`: Optional, must be unique if changed
- `bio`: Optional, text field (no length limit)
- `currentPassword`: Required if changing password
- `newPassword`: Optional, minimum 6 characters (required if `currentPassword` is provided)

### Success Response (200 OK)
```json
{
  "message": "Profile updated successfully",
  "user": {
    "id": 1,
    "username": "newusername",
    "email": "newemail@example.com",
    "profile_picture_url": "/uploads/profile-1234567890.jpg",
    "bio": "Updated bio text",
    "created_at": "2024-01-15T10:30:00.000Z"
  }
}
```

### Error Responses

**400 Bad Request - Missing current password:**
```json
{
  "error": "Current password is required to change password"
}
```

**400 Bad Request - Password too short:**
```json
{
  "error": "New password must be at least 6 characters long"
}
```

**400 Bad Request - No updates:**
```json
{
  "error": "No fields to update"
}
```

**401 Unauthorized - Wrong current password:**
```json
{
  "error": "Current password is incorrect"
}
```

**409 Conflict - Username taken:**
```json
{
  "error": "Username already taken"
}
```

**409 Conflict - Email taken:**
```json
{
  "error": "Email already taken"
}
```

### Example using cURL

**Update bio only:**
```bash
curl -X PUT http://localhost:3000/api/user/profile \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "bio": "This is my updated bio"
  }'
```

**Update username:**
```bash
curl -X PUT http://localhost:3000/api/user/profile \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "newusername"
  }'
```

**Change password:**
```bash
curl -X PUT http://localhost:3000/api/user/profile \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "currentPassword": "oldpassword123",
    "newPassword": "newpassword123"
  }'
```

**Update multiple fields:**
```bash
curl -X PUT http://localhost:3000/api/user/profile \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "newusername",
    "bio": "Updated bio",
    "email": "newemail@example.com"
  }'
```

---

## 3. POST `/api/user/profile-picture`

Upload a profile picture for the current authenticated user.

**Endpoint:** `POST /api/user/profile-picture`  
**Access:** Authenticated (JWT token required)

### Request
```bash
POST http://localhost:3000/api/user/profile-picture
Authorization: Bearer YOUR_TOKEN_HERE
Content-Type: multipart/form-data
```

### Form Data
- `profile_picture` (required): Image file
  - Allowed formats: JPEG, JPG, PNG, GIF, WebP
  - Maximum file size: 5MB

### Success Response (200 OK)
```json
{
  "message": "Profile picture updated successfully",
  "user": {
    "id": 1,
    "username": "johndoe",
    "email": "john@example.com",
    "profile_picture_url": "/uploads/profile-1234567890-987654321.jpg",
    "bio": "Software developer",
    "created_at": "2024-01-15T10:30:00.000Z"
  }
}
```

### Error Responses

**400 Bad Request - No file:**
```json
{
  "error": "No image file provided"
}
```

**400 Bad Request - Invalid file type:**
```json
{
  "error": "Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed."
}
```

**401 Unauthorized:**
```json
{
  "error": "Access token required"
}
```

**404 Not Found:**
```json
{
  "error": "User not found"
}
```

**500 Internal Server Error:**
```json
{
  "error": "Internal server error"
}
```

### Example using cURL
```bash
curl -X POST http://localhost:3000/api/user/profile-picture \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -F "profile_picture=@/path/to/your/image.jpg"
```

### Notes
- Old profile picture is automatically deleted when a new one is uploaded
- Image is accessible at: `http://localhost:3000/uploads/filename.jpg`
- Filename format: `originalname-timestamp-random.ext`

---

## 4. DELETE `/api/user/profile-picture`

Remove the profile picture for the current authenticated user.

**Endpoint:** `DELETE /api/user/profile-picture`  
**Access:** Authenticated (JWT token required)

### Request
```bash
DELETE http://localhost:3000/api/user/profile-picture
Authorization: Bearer YOUR_TOKEN_HERE
```

### Success Response (200 OK)
```json
{
  "message": "Profile picture removed successfully",
  "user": {
    "id": 1,
    "username": "johndoe",
    "email": "john@example.com",
    "profile_picture_url": null,
    "bio": "Software developer",
    "created_at": "2024-01-15T10:30:00.000Z"
  }
}
```

### Error Responses

**400 Bad Request:**
```json
{
  "error": "No profile picture to delete"
}
```

**401 Unauthorized:**
```json
{
  "error": "Access token required"
}
```

**404 Not Found:**
```json
{
  "error": "User not found"
}
```

### Example using cURL
```bash
curl -X DELETE http://localhost:3000/api/user/profile-picture \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## 5. GET `/api/user/posts`

Get all posts created by the current authenticated user with pagination support.

**Endpoint:** `GET /api/user/posts`  
**Access:** Authenticated (JWT token required)

### Request
```bash
GET http://localhost:3000/api/user/posts?page=1&limit=10
Authorization: Bearer YOUR_TOKEN_HERE
```

### Query Parameters
- `page` (optional): Page number (default: 1, minimum: 1)
- `limit` (optional): Number of posts per page (default: 10, range: 1-100)

### Success Response (200 OK)
```json
{
  "posts": [
    {
      "id": 3,
      "title": "My Latest Post",
      "content": "Content here...",
      "image_url": "/uploads/post-image.jpg",
      "author_id": 1,
      "author_name": "johndoe",
      "created_at": "2024-01-15T10:30:00.000Z",
      "updated_at": "2024-01-15T10:30:00.000Z"
    },
    {
      "id": 2,
      "title": "Another Post",
      "content": "More content...",
      "image_url": null,
      "author_id": 1,
      "author_name": "johndoe",
      "created_at": "2024-01-14T15:20:00.000Z",
      "updated_at": "2024-01-14T15:20:00.000Z"
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 3,
    "totalPosts": 25,
    "limit": 10,
    "hasNextPage": true,
    "hasPreviousPage": false
  }
}
```

### Response Fields

**Post Object:**
- `id` (integer): Post ID
- `title` (string): Post title
- `content` (string): Post content
- `image_url` (string|null): URL to post image
- `author_id` (integer): Author's user ID
- `author_name` (string): Author's username
- `created_at` (string): Creation timestamp (ISO 8601)
- `updated_at` (string): Last update timestamp (ISO 8601)

**Pagination Object:**
- `currentPage` (integer): Current page number
- `totalPages` (integer): Total number of pages
- `totalPosts` (integer): Total number of posts
- `limit` (integer): Posts per page
- `hasNextPage` (boolean): Whether there's a next page
- `hasPreviousPage` (boolean): Whether there's a previous page

### Error Responses

**400 Bad Request - Invalid pagination:**
```json
{
  "error": "Invalid pagination parameters. Page must be >= 1, limit must be between 1 and 100"
}
```

**401 Unauthorized:**
```json
{
  "error": "Access token required"
}
```

**500 Internal Server Error:**
```json
{
  "error": "Internal server error"
}
```

### Example using cURL

**Get first page with default limit:**
```bash
curl -X GET http://localhost:3000/api/user/posts \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Get second page with 20 posts:**
```bash
curl -X GET "http://localhost:3000/api/user/posts?page=2&limit=20" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Get first 5 posts:**
```bash
curl -X GET "http://localhost:3000/api/user/posts?page=1&limit=5" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Notes
- Posts are ordered by creation date (newest first)
- Only returns posts created by the authenticated user
- Pagination is 1-indexed (first page is 1, not 0)

---

## 6. GET `/api/user/stats`

Get statistics for the current authenticated user.

**Endpoint:** `GET /api/user/stats`  
**Access:** Authenticated (JWT token required)

### Request
```bash
GET http://localhost:3000/api/user/stats
Authorization: Bearer YOUR_TOKEN_HERE
```

### Success Response (200 OK)
```json
{
  "total_posts": 15,
  "latest_post_date": "2024-01-15T10:30:00.000Z"
}
```

### Response Fields
- `total_posts` (integer): Total number of posts created by the user
- `latest_post_date` (string|null): Creation date of the most recent post (ISO 8601), or `null` if user has no posts

### Error Responses

**401 Unauthorized:**
```json
{
  "error": "Access token required"
}
```

**500 Internal Server Error:**
```json
{
  "error": "Internal server error"
}
```

### Example using cURL
```bash
curl -X GET http://localhost:3000/api/user/stats \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## Complete Example Flow

### Step 1: Login to get token
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@gmail.com",
    "password": "asdfasdf"
  }'
```

**Response:**
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "username": "test",
    "email": "test@gmail.com",
    "profile_picture_url": null,
    "bio": null
  }
}
```

### Step 2: Get user profile
```bash
curl -X GET http://localhost:3000/api/user/profile \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Step 3: Update profile
```bash
curl -X PUT http://localhost:3000/api/user/profile \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "bio": "Software developer and blogger",
    "username": "johndoe"
  }'
```

### Step 4: Upload profile picture
```bash
curl -X POST http://localhost:3000/api/user/profile-picture \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -F "profile_picture=@/path/to/image.jpg"
```

### Step 5: Get user's posts
```bash
curl -X GET "http://localhost:3000/api/user/posts?page=1&limit=10" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Step 6: Get user statistics
```bash
curl -X GET http://localhost:3000/api/user/stats \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## Testing with Postman/Thunder Client

### Setup
1. Create a new collection called "User Profile API"
2. Set base URL variable: `base_url = http://localhost:3000`
3. Create an environment variable: `token = YOUR_JWT_TOKEN`

### 1. Get Profile Request
- **Method:** GET
- **URL:** `{{base_url}}/api/user/profile`
- **Headers:** 
  - `Authorization: Bearer {{token}}`

### 2. Update Profile Request
- **Method:** PUT
- **URL:** `{{base_url}}/api/user/profile`
- **Headers:** 
  - `Authorization: Bearer {{token}}`
  - `Content-Type: application/json`
- **Body (raw JSON):**
```json
{
  "bio": "Updated bio",
  "username": "newusername"
}
```

### 3. Upload Profile Picture Request
- **Method:** POST
- **URL:** `{{base_url}}/api/user/profile-picture`
- **Headers:** 
  - `Authorization: Bearer {{token}}`
- **Body (form-data):**
  - `profile_picture`: [Select File]

### 4. Get User Posts Request
- **Method:** GET
- **URL:** `{{base_url}}/api/user/posts?page=1&limit=10`
- **Headers:** 
  - `Authorization: Bearer {{token}}`

---

## Error Codes Summary

| Status Code | Description |
|------------|-------------|
| 200 | Success |
| 400 | Bad Request (validation error) |
| 401 | Unauthorized (authentication required/invalid) |
| 404 | Not Found |
| 409 | Conflict (resource already exists) |
| 500 | Internal Server Error |

---

## Notes

- All endpoints require JWT authentication
- JWT tokens expire after 7 days
- Profile pictures are stored in the `uploads/` directory
- Old profile pictures are automatically deleted when updated
- Username and email must be unique across all users
- Password changes require current password verification
- All timestamps are in UTC format (ISO 8601)
- Posts are ordered by creation date (newest first)
- Pagination is 1-indexed (first page is 1, not 0)
- Maximum limit per page is 100 posts

---

## Database Schema

### Users Table
```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  profile_picture_url VARCHAR(500),
  bio TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Posts Table
```sql
CREATE TABLE posts (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  image_url VARCHAR(500),
  author_id INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE
);
```

---

## Support

For issues or questions, please check the server logs or contact the development team.

---

**Last Updated:** December 2024  
**API Version:** 1.0

