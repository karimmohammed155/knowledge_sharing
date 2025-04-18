# User Management API

## Overview
This API provides user management features including registration, authentication, account activation, password management, and user profile updates. Below are the available endpoints for the frontend team to interact with.

## Base URL
```
http://localhost:3000/user
```

## Endpoints

### Register User
```
POST /register
```
Registers a new user with optional profile image upload.

- **Headers:** None
- **Body (multipart/form-data):**
  - `name` (string)
  - `email` (string)
  - `password` (string)
  - `profileImage` (file, optional)
  - `confirmPassword`(string)
  - `role`(doctor/user,optional)(default=user)

### Login
```
POST /login
```
Authenticates a user and returns a JWT token.

- **Headers:** None
- **Body:**
  - `email` (string)
  - `password` (string)

### Forget Password
```
POST /forgetPassword
```
Initiates the password reset process and sends a reset code via email.

- **Headers:** None
- **Body:**
  - `email` (string)

### Reset Password
```
PUT /resetPassword
```
Resets the user's password using the provided reset code.

- **Headers:** None
- **Body:**
  - `email` (string)
  - `password` (string)
  -  `confirmPassword`(string)
  - `forgetCode` (string)

### Delete User
```
DELETE /deleteUser
```
Deletes the authenticated user's account.

- **Headers:**
  - `token`: Bearer token for authentication

### Update User
```
PUT /updateUser
```
Updates user profile information, including profile image.

- **Headers:**
  - `token`: Bearer token for authentication
- **Body (multipart/form-data):**
  - `name` (string, optional)
  - `profileImage` (file, optional)

## Authentication
All protected routes require a JWT token. Include the token in the request headers as follows:
```
Authorization: Bearer <your_token>
```

######

# Post Management API

## Overview
This API provides endpoints for managing posts including creation, retrieval, updating, and deletion of posts. It supports file uploads (images, videos, documents), user authentication, and data referencing for categories, subcategories, comments, and interactions.

## Base URL
```
http://localhost:3000/post
```

## Endpoints

### Add Post
```
POST /add
```
Creates a new post. Authenticated users can upload up to 5 files (images, documents, or videos).

- **Headers:**
  - `Authorization`: Bearer token for authentication
- **Body (multipart/form-data):**
  - `title` (string, required)
  - `content` (string, required)
  - `files` (file[], optional) — up to 5 files

### Get All Posts
```
GET /list
```
Retrieves a list of all posts.

- **Headers:** None

### Get Specific Post
```
GET /list_specific/:_id
```
Retrieves details for a specific post by its ID.

- **Headers:** None
- **Params:**
  - `_id` (string) — ID of the post

### Update Post
```
PUT /update/:post_id
```
Updates an existing post. Authenticated users can also upload new files.

- **Headers:**
  - `Authorization`: Bearer token for authentication
- **Params:**
  - `post_id` (string) — ID of the post
- **Body (multipart/form-data):**
  - `title` (string, optional)
  - `content` (string, optional)
  - `files` (file[], optional) — up to 5 files

### Delete Post
```
DELETE /delete/:post_id
```
Deletes a specific post. Authentication required.

- **Headers:**
  - `Authorization`: Bearer token for authentication
- **Params:**
  - `post_id` (string) — ID of the post

## Authentication
All protected routes require a JWT token. Include the token in the request headers as follows:
```
Authorization: Bearer <your_token>
```
######

# Interaction Management API

## Overview
This API provides endpoints for managing interactions with posts including likes, ratings, and saving posts. All interaction routes require user authentication and are associated with specific post IDs.

## Base URL
```
http://localhost:3000/interaction
```

## Endpoints

### Like Post
```
POST /:post_id/like
```
Likes a specific post.

- **Headers:**
  - `Authorization`: Bearer token for authentication
- **Params:**
  - `post_id` (string) — ID of the post to like

### Rate Post
```
POST /:post_id/rate
```
Rates a specific post between 1 and 5.

- **Headers:**
  - `Authorization`: Bearer token for authentication
- **Params:**
  - `post_id` (string)
- **Body:**
  - `rating` (number) — value from 1 to 5

### Save Post
```
POST /:post_id/save
```
Saves a specific post to the user's saved posts list.

- **Headers:**
  - `Authorization`: Bearer token for authentication
- **Params:**
  - `post_id` (string)

### Get Likes Count
```
GET /:post_id/likes_count
```
Retrieves the number of likes for a specific post.

- **Headers:** None
- **Params:**
  - `post_id` (string)

### Get Ratings Count
```
GET /:post_id/ratings_count
```
Retrieves the number of ratings for a specific post.

- **Headers:** None
- **Params:**
  - `post_id` (string)

### Get Saved Posts
```
GET /saved_posts
```
Retrieves a list of posts saved by the authenticated user.

- **Headers:**
  - `Authorization`: Bearer token for authentication

## Authentication
All protected routes require a JWT token. Include the token in the request headers as follows:
```
Authorization: Bearer <your_token>
```
######

# Comment Management API

## Overview
This API provides endpoints for managing comments on posts, including adding, retrieving, and deleting comments. It supports nested replies and requires user authentication for modification actions.

## Base URL
```
http://localhost:3000/comment
```

## Endpoints

### Add Comment
```
POST /:post_id/add
```
Adds a new comment to a post.

- **Headers:**
  - `Authorization`: Bearer token for authentication
- **Params:**
  - `post_id` (string) — ID of the post to comment on
- **Body:**
  - `text` (string, required)
  - `parent_comment` (string, optional) — ID of the parent comment (for replies)

### Get Comments
```
GET /:post_id/get
```
Retrieves all comments for a specific post, including nested replies.

- **Headers:** None
- **Params:**
  - `post_id` (string)

### Delete Comment
```
DELETE /:_id/delete
```
Deletes a specific comment. Authentication required.

- **Headers:**
  - `Authorization`: Bearer token for authentication
- **Params:**
  - `_id` (string) — ID of the comment to delete

## Authentication
All protected routes require a JWT token. Include the token in the request headers as follows:
```
Authorization: Bearer <your_token>
```
######

# Category Management API

## Overview
This API provides endpoints for managing categories, including creation, retrieval, updating, and deletion. All write operations require user authentication.

## Base URL
```
http://localhost:3000/category
```

## Endpoints

### Add Category
```
POST /add
```
Adds a new category. Requires authentication.

- **Headers:**
  - `Authorization`: Bearer token for authentication
- **Body:**
  - `name` (string, required)

### Get All Categories
```
GET /get
```
Retrieves all available categories.

- **Headers:** None

### Update Category
```
PUT /update/:_id
```
Updates the name of a specific category.

- **Headers:**
  - `Authorization`: Bearer token for authentication
- **Params:**
  - `_id` (string) — ID of the category
- **Body:**
  - `name` (string, required)

### Delete Category
```
DELETE /delete/:_id
```
Deletes a specific category.

- **Headers:**
  - `Authorization`: Bearer token for authentication
- **Params:**
  - `_id` (string) — ID of the category

## Authentication
All protected routes require a JWT token. Include the token in the request headers as follows:
```
Authorization: Bearer <your_token>
```
######

# Sub-Category Management API

## Overview
This API provides endpoints for managing sub-categories, including creation, retrieval, updating, and deletion. Each sub-category is associated with a parent category. All write operations require user authentication.

## Base URL
```
http://localhost:3000/sub_category
```

## Endpoints

### Add Sub-Category
```
POST /add
```
Adds a new sub-category. Requires authentication.

- **Headers:**
  - `Authorization`: Bearer token for authentication
- **Body:**
  - `name` (string, required)
  - `category` (string, required) — ID of the parent category

### Get All Sub-Categories
```
GET /get
```
Retrieves all available sub-categories.

- **Headers:** None

### Update Sub-Category
```
PUT /update/:_id
```
Updates the name or category of a specific sub-category.

- **Headers:**
  - `Authorization`: Bearer token for authentication
- **Params:**
  - `_id` (string) — ID of the sub-category
- **Body:**
  - `name` (string, optional)
  - `category` (string, optional)

### Delete Sub-Category
```
DELETE /delete/:_id
```
Deletes a specific sub-category.

- **Headers:**
  - `Authorization`: Bearer token for authentication
- **Params:**
  - `_id` (string) — ID of the sub-category

## Authentication
All protected routes require a JWT token. Include the token in the request headers as follows:
```
Authorization: Bearer <your_token>
```



