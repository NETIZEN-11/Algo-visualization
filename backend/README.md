# AlgoVision AI - Backend

RESTful API server for AlgoVision AI platform built with Node.js, Express, and MongoDB.

## Features

- 🔐 JWT Authentication
- 🤖 OpenAI Integration for problem analysis
- 📊 Progress tracking and analytics
- 🎤 Mock interview system
- 🔍 LeetCode problem scraping
- 📈 Gamification with XP and badges
- 🛡️ Security with Helmet and rate limiting

## Tech Stack

- Node.js
- Express.js
- MongoDB with Mongoose
- OpenAI API
- JWT Authentication
- Bcrypt for password hashing

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- MongoDB (local or Atlas)
- OpenAI API key

### Installation

```bash
# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Update .env with your configuration

# Start development server
npm run dev

# Start production server
npm start
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile
- `POST /api/auth/logout` - Logout user

### Problems
- `POST /api/problems/analyze` - Analyze a problem
- `GET /api/problems/user` - Get user's problems
- `GET /api/problems/:id` - Get problem by ID
- `POST /api/problems/:id/save` - Save problem
- `GET /api/problems/:id/visualization` - Get visualization
- `GET /api/problems/:id/solutions` - Get code solutions
- `POST /api/problems/:id/hints` - Get hints
- `POST /api/problems/analyze-code` - Analyze user code
- `POST /api/problems/:id/test-cases` - Generate test cases
- `POST /api/problems/:id/dry-run` - Execute dry run
- `GET /api/problems/:id/related` - Get related problems
- `GET /api/problems/company/:company` - Search by company
- `GET /api/problems/pattern/:pattern` - Get by pattern

### Interview
- `POST /api/interview/start` - Start interview session
- `POST /api/interview/:sessionId/answer` - Submit answer
- `GET /api/interview/:sessionId/feedback/:questionId` - Get feedback
- `POST /api/interview/:sessionId/end` - End interview
- `GET /api/interview/history` - Get interview history
- `GET /api/interview/stats` - Get interview statistics

### Progress
- `GET /api/progress/dashboard` - Get user dashboard
- `GET /api/progress/statistics` - Get detailed statistics
- `GET /api/progress/badges` - Get user badges
- `GET /api/progress/streak` - Get daily streak
- `GET /api/progress/leaderboard` - Get leaderboard
- `GET /api/progress/rank` - Get user rank
- `GET /api/progress/heatmap` - Get activity heatmap
- `GET /api/progress/readiness` - Get interview readiness score
- `POST /api/progress/xp` - Update XP

## Project Structure

```
backend/
├── config/         # Configuration files
├── controllers/    # Route controllers
├── middleware/     # Custom middleware
├── models/         # Mongoose models
├── routes/         # API routes
├── services/       # Business logic services
├── utils/          # Utility functions
└── server.js       # Entry point
```

## Environment Variables

See `.env.example` for required environment variables.

## Security

- Helmet for security headers
- CORS configuration
- Rate limiting
- JWT authentication
- Password hashing with bcrypt

## License

MIT
