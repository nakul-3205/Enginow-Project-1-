# Enginow User Management System

A robust, production-ready authentication and user management system built with Node.js, featuring email verification, JWT-based authentication, Redis caching, and Kafka event streaming.

## 🌟 Features

- **User Authentication & Authorization**
  - JWT-based authentication with access and refresh tokens
  - Email verification via OTP
  - Role-based access control (User/Admin)
  - Secure password hashing with bcrypt

- **Email System**
  - OTP verification emails
  - Welcome emails via Kafka event streaming
  - Asynchronous email processing with worker threads

- **Caching & Performance**
  - Redis caching for user lists and session management
  - Optimized database queries
  - Cache invalidation strategies

- **Event-Driven Architecture**
  - Kafka integration for asynchronous task processing
  - Worker threads for email processing
  - Event-based communication between services

- **Security**
  - Rate limiting (100 requests per 15 minutes)
  - Helmet.js for HTTP headers security
  - XSS, NoSQL, and SQL injection protection
  - HPP (HTTP Parameter Pollution) protection
  - CORS configuration
  - Request sanitization

- **Monitoring & Logging**
  - Structured logging with Pino
  - BetterStack (Logtail) integration for centralized logging
  - Health check endpoint
  - Real-time log streaming and monitoring

## 📋 Table of Contents

- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Usage](#usage)
- [API Documentation](#api-documentation)
- [Project Structure](#project-structure)
- [Technologies](#technologies)
- [Development](#development)
- [Contributing](#contributing)
- [License](#license)

## 🔧 Prerequisites

Before running this project, ensure you have the following installed:

- **Node.js**: v18.x or higher
- **MongoDB**: v6.0 or higher
- **Redis**: v7.0 or higher
- **Apache Kafka**: v3.0 or higher
- **npm**: v9.x or higher

## 🚀 Installation

1. **Clone the repository**
```bash
git clone https://github.com/nakul-3205/Enginow-Project-1-.git
cd Enginow-Project-1-
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**

Create a `.env` file in the root directory:

```env
# Server Configuration
PORT=3000
NODE_ENV=DEVELOPMENT

# Database
MONGO_URI=mongodb://localhost:27017/enginow-users

# Redis
REDIS_URL=redis://localhost:6379

# Kafka
KAFKA_BROKERS=localhost:9092
KAFKA_CLIENT_ID=enginow-auth-service

# JWT Secrets
JWT_ACCESS_SECRET=your_access_token_secret_key_here
JWT_REFRESH_SECRET=your_refresh_token_secret_key_here

# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM=noreply@enginow.com

# Admin Configuration
ADMIN_SIGNUP_SECRET=your_admin_secret_key_here

# Client Configuration
CLIENT_URL=http://localhost:5173

# Logging (BetterStack - Optional)
LOGTAIL_SOURCE_TOKEN=your_betterstack_source_token_here
```

4. **Start required services**

Make sure MongoDB, Redis, and Kafka are running:

```bash
# Start MongoDB
mongod

# Start Redis
redis-server

# Start Kafka (with Zookeeper)
# Start Zookeeper
bin/zookeeper-server-start.sh config/zookeeper.properties

# Start Kafka
bin/kafka-server-start.sh config/server.properties
```

## 💻 Usage

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

### Health Check
```bash
curl http://localhost:3000/health
```

## 📚 API Documentation

### Base URL
```
http://localhost:3000/api/v1/auth
```

### Endpoints

#### Public Endpoints

##### 1. User Signup
```http
POST /signup
```

**Request Body:**
```json
{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "SecurePass123!",
  "roleRequested": "user"  // or "admin"
}
```

**For Admin Signup:**
```json
{
  "username": "admin",
  "email": "admin@example.com",
  "password": "AdminPass123!",
  "roleRequested": "admin",
  "adminSecret": "your_admin_secret_key"
}
```

**Response (201):**
```json
{
  "statusCode": 201,
  "data": {
    "userId": "60d21b4667d0d8992e610c85"
  },
  "message": "User registered. Verification OTP sent.",
  "success": true
}
```

##### 2. Verify OTP
```http
POST /verify
```

**Request Body:**
```json
{
  "email": "john@example.com",
  "otp": "123456"
}
```

**Response (200):**
```json
{
  "statusCode": 200,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "message": "OTP verified successfully",
  "success": true
}
```

##### 3. Login
```http
POST /login
```

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "SecurePass123!"
}
```

**Response (200):**
```json
{
  "statusCode": 200,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "60d21b4667d0d8992e610c85",
      "username": "johndoe"
    }
  },
  "message": "Login successful",
  "success": true
}
```

##### 4. Refresh Token
```http
POST /refresh-token
```

**Request Body:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response (200):**
```json
{
  "statusCode": 200,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "message": "Token refreshed",
  "success": true
}
```

#### Protected Endpoints (Require Authentication)

##### 5. Get Current User
```http
GET /me
Authorization: Bearer <accessToken>
```

**Response (200):**
```json
{
  "statusCode": 200,
  "data": {
    "_id": "60d21b4667d0d8992e610c85",
    "username": "johndoe",
    "email": "john@example.com",
    "role": "user",
    "isVerified": true,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  },
  "message": "User profile fetched",
  "success": true
}
```

##### 6. Logout
```http
POST /logout
Authorization: Bearer <accessToken>
```

**Response (200):**
```json
{
  "statusCode": 200,
  "data": null,
  "message": "Logged out",
  "success": true
}
```

##### 7. Update User
```http
PUT /users/:id
Authorization: Bearer <accessToken>
```

**Request Body:**
```json
{
  "username": "newusername"
}
```

**Response (200):**
```json
{
  "statusCode": 200,
  "data": {
    "_id": "60d21b4667d0d8992e610c85",
    "username": "newusername",
    "email": "john@example.com",
    "role": "user",
    "isVerified": true
  },
  "message": "User updated successfully",
  "success": true
}
```

#### Admin-Only Endpoints

##### 8. List All Users
```http
GET /users?page=1&limit=10
Authorization: Bearer <adminAccessToken>
```

**Response (200):**
```json
{
  "statusCode": 200,
  "data": {
    "data": [
      {
        "_id": "60d21b4667d0d8992e610c85",
        "username": "johndoe",
        "email": "john@example.com",
        "role": "user",
        "isVerified": true,
        "createdAt": "2024-01-15T10:30:00.000Z"
      }
    ],
    "total": 25,
    "page": 1
  },
  "message": "Users fetched successfully",
  "success": true
}
```

##### 9. Delete User
```http
DELETE /users/:id
Authorization: Bearer <adminAccessToken>
```

**Response (200):**
```json
{
  "statusCode": 200,
  "data": null,
  "message": "User deleted",
  "success": true
}
```

### Error Responses

All error responses follow this format:

```json
{
  "statusCode": 400,
  "data": null,
  "message": "Error message here",
  "success": false,
  "errors": []
}
```

**Common Status Codes:**
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `429` - Too Many Requests
- `500` - Internal Server Error

## 📁 Project Structure

```
Enginow-Project-1-/
├── src/
│   ├── config/
│   │   ├── db.js              # MongoDB connection configuration
│   │   ├── redis.js           # Redis client configuration
│   │   └── kafka.js           # Kafka producer/consumer setup
│   ├── controllers/
│   │   └── auth.controller.js # Authentication business logic
│   ├── middleware/
│   │   ├── auth.middleware.js # JWT verification & authorization
│   │   └── error.middleware.js# Global error handler
│   ├── models/
│   │   └── user.model.js      # User schema and methods
│   ├── routes/
│   │   └── auth.route.js      # API route definitions
│   ├── utils/
│   │   ├── ApiError.js        # Custom error class
│   │   ├── ApiResponse.js     # Standardized response format
│   │   ├── asyncHandler.js    # Async error wrapper
│   │   ├── logger.js          # Pino logger configuration
│   │   ├── mail.util.js       # Email sending utilities
│   │   ├── otp.util.js        # OTP generation/verification
│   │   └── token.util.js      # JWT token generation
│   ├── workers/
│   │   └── auth.worker.js     # Kafka consumer for email events
│   └── app.js                 # Express app configuration
├── index.js                   # Application entry point
├── worker-entry.js            # Worker thread entry point
├── package.json
├── package-lock.json
├── .gitignore
└── README.md
```

## 🛠️ Technologies

### Core
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Primary database
- **Mongoose** - ODM for MongoDB

### Authentication & Security
- **jsonwebtoken** - JWT implementation
- **bcryptjs** - Password hashing
- **helmet** - Security headers
- **cors** - Cross-origin resource sharing
- **hpp** - HTTP parameter pollution protection
- **perfect-express-sanitizer** - Input sanitization

### Caching & Messaging
- **ioredis** - Redis client
- **kafkajs** - Kafka client

### Email
- **nodemailer** - Email sending
- **mailgen** - Email template generation

### Logging & Monitoring
- **pino** - Fast JSON logger
- **pino-pretty** - Pretty print for development
- **@logtail/pino** - BetterStack (Logtail) integration for centralized logging
- **morgan** - HTTP request logger

### Development
- **nodemon** - Auto-restart during development
- **dotenv** - Environment variable management

## 🔒 Security Features

1. **Rate Limiting**: 100 requests per 15 minutes per IP
2. **Password Hashing**: bcrypt with salt rounds of 10
3. **JWT Authentication**: Access tokens (15m) and refresh tokens (7d)
4. **Input Sanitization**: XSS, NoSQL, and SQL injection protection
5. **CORS**: Configured for specific origins
6. **Helmet**: Security headers
7. **Request Size Limiting**: 10kb limit on JSON and URL-encoded data

## 🔄 Event Flow

### User Signup Flow
```
1. User submits signup → 2. Validate input → 3. Create user in DB →
4. Generate OTP → 5. Store OTP in Redis → 6. Send OTP email →
7. Return success response
```

### Email Verification Flow
```
1. User submits OTP → 2. Verify OTP from Redis → 3. Update user as verified →
4. Publish welcome email event to Kafka → 5. Generate JWT tokens →
6. Store refresh token in Redis → 7. Return tokens
```

### Kafka Email Worker
```
1. Kafka consumer listens to 'auth-events' topic →
2. Receives SEND_WELCOME_EMAIL event →
3. Sends welcome email asynchronously
```

## 🧪 Development

### Running in Development Mode
```bash
npm run dev
```

This uses nodemon for auto-reload on file changes.

### Code Style
- ES6+ JavaScript with ES Modules
- Async/await for asynchronous operations
- Class-based controllers
- Functional utilities

### Adding New Routes

1. Create controller in `src/controllers/`
2. Define routes in `src/routes/`
3. Register routes in `src/app.js`

Example:
```javascript
// src/routes/example.route.js
import { Router } from 'express';
import exampleController from '../controllers/example.controller.js';

const router = Router();
router.get('/', exampleController.list);

export default router;
```

## 🐛 Error Handling

The application uses centralized error handling:

```javascript
// Throwing errors in controllers
throw new ApiError(400, "Invalid input");

// Errors are caught by asyncHandler and processed by errorHandler middleware
```

## 📊 Logging

Logs are structured JSON format using Pino with BetterStack (Logtail) integration:

```javascript
logger.info("User logged in", { userId: user._id });
logger.error({ error }, "Database connection failed");
logger.fatal({ error }, "Critical system failure");
```

**BetterStack Integration:**
- Centralized log management and monitoring
- Real-time log streaming
- Advanced search and filtering
- Log retention and analysis
- Alerts and notifications

Configure your BetterStack source token in `.env`:
```env
LOGTAIL_SOURCE_TOKEN=your_betterstack_source_token_here
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the ISC License.

## 👨‍💻 Author

**Nakul**

- GitHub: [@nakul-3205](https://github.com/nakul-3205)

## 🙏 Acknowledgments

- Express.js community
- MongoDB documentation
- Redis documentation
- Kafka documentation
- BetterStack for logging infrastructure

## 📧 Support

For support, email nakulkejriwal124@gmail.com or open an issue on GitHub.

---

