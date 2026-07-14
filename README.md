# 🚀 AlgoVision AI

> **AI-Powered DSA Learning Platform with Advanced Visualization Engine**

AlgoVision AI is a premium, production-ready full-stack platform that revolutionizes Data Structures and Algorithms learning through AI-powered analysis, beautiful step-by-step visualizations, mock interviews, gamification, and personalized learning paths.

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![React](https://img.shields.io/badge/React-18.2.0-61dafb.svg)
![Node](https://img.shields.io/badge/Node-18+-339933.svg)
![MongoDB](https://img.shields.io/badge/MongoDB-8.0+-47A248.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

---

## ✨ Key Features

### 🤖 AI-Powered Analysis
- **Deep Problem Analysis**: Comprehensive breakdown of any LeetCode problem
- **Pattern Recognition**: Automatically identifies algorithm patterns
- **Multiple Approaches**: Brute force, optimized, and best solutions
- **Code Review**: AI-powered bug detection and optimization suggestions
- **Interview Simulation**: Practice with AI interviewer for FAANG prep

### 🎨 Visualization Engine
- **Array Algorithms**: Sliding window, two pointer, sorting
- **Tree Traversals**: BFS, DFS with animated node highlighting
- **Graph Algorithms**: Pathfinding, connectivity, cycles
- **Dynamic Programming**: DP table visualization with state transitions
- **Linked Lists**: Animated pointer movements and operations
- **Stack & Queue**: Vertical stack and horizontal queue visualizations
- **Playback Controls**: Play, pause, step-by-step, speed adjustment
- **Keyboard Shortcuts**: Space (play/pause), arrows (navigate), R (reset)

### 📊 Learning & Progress
- **Progress Analytics**: Comprehensive dashboard with charts
- **Weak Topic Detection**: AI identifies areas needing improvement
- **Interview Readiness Score**: 0-100 rating based on your preparation
- **Streak Tracking**: Daily challenge streaks with rewards
- **XP & Leveling System**: Earn experience points and level up
- **Badge System**: Unlock achievements (Array Master, DP Expert, etc.)
- **Leaderboard**: Compete with other learners globally

### 🎯 Interactive Features
- **Daily Challenge**: New problem every day with bonus XP
- **Contest Mode**: Timed contests with rankings and prizes
- **Mock Interviews**: AI-conducted technical interviews
- **Bug Detector**: Submit code for AI review
- **Hint System**: Progressive hints (Level 1-4)
- **Test Case Generator**: Auto-generate edge cases
- **Dry Run Generator**: Step-by-step code execution
- **Flashcards**: Spaced repetition for revision
- **Notes System**: Save personal notes and insights

### 🏢 Additional Features
- **Company-wise Problems**: Filter by Google, Amazon, Microsoft, Meta
- **Topic Roadmap**: Structured learning path from basics to advanced
- **Code Playground**: Multi-language code editor
- **Concept Explanations**: Deep dives into DSA concepts
- **Approach Comparison**: Side-by-side algorithm comparison
- **Related Problems**: AI-recommended similar problems

---

## 🏗️ Tech Stack

### Frontend
- **React 18** - Modern UI library with hooks
- **Vite** - Lightning-fast build tool
- **Tailwind CSS** - Utility-first CSS framework
- **Framer Motion** - Smooth animations
- **React Router v6** - Client-side routing
- **Zustand** - Lightweight state management
- **Axios** - HTTP client
- **React Hot Toast** - Beautiful notifications
- **Recharts** - Analytics charts
- **React Syntax Highlighter** - Code highlighting

### Backend
- **Node.js + Express** - RESTful API server
- **MongoDB + Mongoose** - NoSQL database with ODM
- **OpenAI API (GPT-4)** - AI-powered features
- **JWT** - Secure authentication
- **Bcrypt** - Password hashing
- **Helmet** - Security headers
- **Rate Limiting** - DDoS protection
- **Morgan** - HTTP logging

### DevOps & Tools
- **Docker** - Containerization support
- **Git** - Version control
- **ESLint** - Code linting
- **Prettier** - Code formatting

---

## 📁 Project Structure

```
algovision-ai/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── analytics/        # Charts and stats
│   │   │   ├── common/            # Reusable components
│   │   │   ├── interview/         # Mock interview UI
│   │   │   ├── layout/            # Layout components
│   │   │   ├── problem/           # Problem solver UI
│   │   │   ├── ui/                # UI primitives
│   │   │   └── visualization/     # Visualization engine
│   │   ├── pages/                 # Route pages (18 pages)
│   │   ├── services/              # API services
│   │   ├── store/                 # Zustand stores
│   │   ├── styles/                # Global CSS
│   │   └── utils/                 # Helper functions
│   ├── public/                    # Static assets
│   └── package.json
│
├── backend/
│   ├── config/                    # Configuration files
│   ├── controllers/               # Route controllers (8)
│   ├── middleware/                # Custom middleware
│   ├── models/                    # Database models (15)
│   ├── routes/                    # API routes
│   ├── services/                  # Business logic
│   │   ├── aiService.js          # 12 AI features
│   │   └── scraperService.js     # LeetCode scraper
│   ├── utils/                     # Helper utilities
│   └── server.js                  # Entry point
│
├── SETUP_GUIDE.md                 # Detailed setup instructions
├── DEPLOYMENT.md                  # Deployment guide
└── README.md                      # This file
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- MongoDB 8.0+
- OpenAI API key (optional, for AI features)

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd algovision-ai
```

2. **Install dependencies**
```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

3. **Configure environment variables**

Backend `.env`:
```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/algovision-ai
JWT_SECRET=your_super_secret_jwt_key
OPENAI_API_KEY=your_openai_api_key_here
```

Frontend `.env`:
```env
VITE_API_URL=http://localhost:5000/api
```

4. **Start MongoDB**
```bash
# Windows
net start MongoDB

# macOS/Linux
sudo systemctl start mongod
```

5. **Start the servers**

Terminal 1 (Backend):
```bash
cd backend
npm run dev
```

Terminal 2 (Frontend):
```bash
cd frontend
npm run dev
```

6. **Access the application**
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000
- Health Check: http://localhost:5000/health

---

## 📖 API Documentation

### Authentication
```
POST   /api/auth/register          Register new user
POST   /api/auth/login             Login user
GET    /api/auth/profile           Get user profile
PUT    /api/auth/profile           Update profile
POST   /api/auth/logout            Logout user
```

### Problems
```
POST   /api/problems/scrape        Scrape LeetCode problem
POST   /api/problems/analyze       Analyze problem with AI
GET    /api/problems/:id           Get problem details
GET    /api/problems/user          Get user's problems
GET    /api/problems/:id/visualization   Get visualization data
GET    /api/problems/:id/solutions       Get code solutions
POST   /api/problems/:id/hints           Get progressive hints
```

### AI Features
```
POST   /api/ai/hints               Generate hints
POST   /api/ai/detect-bugs         Detect bugs in code
POST   /api/ai/test-cases          Generate test cases
POST   /api/ai/dry-run             Execute dry run
POST   /api/ai/explain-concept     Explain DSA concept
POST   /api/ai/chat                Chat with AI tutor
POST   /api/ai/compare-approaches  Compare algorithms
```

### Gamification
```
GET    /api/gamification/badges           Get user badges
GET    /api/gamification/leaderboard      Get leaderboard
GET    /api/gamification/daily-challenge  Get today's challenge
POST   /api/gamification/daily-challenge/complete  Complete challenge
```

### Interview
```
POST   /api/interview/start        Start interview session
POST   /api/interview/:id/answer   Submit answer
GET    /api/interview/history      Get interview history
POST   /api/interview/:id/end      End interview
```

For complete API documentation, see [API.md](./API.md)

---

## 🎨 UI Design

### Color Palette
- **Background**: `#0B1120` - Deep dark blue
- **Cards**: `#111827` - Dark gray
- **Borders**: `#1F2937` - Medium gray
- **Primary**: Orange-Red Gradient (`#FF6B35` → `#F7931E`)
- **Success**: Green (`#22c55e`)
- **Warning**: Yellow (`#f59e0b`)
- **Error**: Red (`#ef4444`)

### Design Principles
- **Premium Dark Theme**: Sleek, modern interface
- **Glassmorphism**: Subtle blur and transparency effects
- **Smooth Animations**: Framer Motion for fluid transitions
- **Responsive Layout**: Mobile-first design
- **Accessibility**: WCAG 2.1 AA compliant
- **Typography**: Inter font for UI, Fira Code for code

---

## 🔧 Configuration

### Backend Configuration

**MongoDB Indexes**:
- User email (unique)
- Problem difficulty, tags, companies
- Progress userId, date
- Submissions userId, problemId

**Rate Limiting**:
- 100 requests per 15 minutes per IP
- Configurable via environment variables

**Security**:
- Helmet for HTTP headers
- CORS configured for frontend domain
- JWT token expiration: 30 days
- Password hashing with bcrypt (12 rounds)

### Frontend Configuration

**Build Optimization**:
- Code splitting by route
- Lazy loading for images
- Tree shaking for unused code
- Minification and compression

---

## 🧪 Testing

### Manual Testing Checklist

✅ **Authentication Flow**
- [ ] User registration
- [ ] Login with credentials
- [ ] Profile update
- [ ] Logout

✅ **Problem Solver**
- [ ] Paste LeetCode URL
- [ ] Manual problem input
- [ ] AI analysis generation
- [ ] Visualization playback
- [ ] Code solutions display

✅ **Visualization**
- [ ] Array sorting animation
- [ ] Tree traversal visualization
- [ ] Graph algorithm display
- [ ] DP table updates
- [ ] Playback controls work

✅ **AI Features**
- [ ] Progressive hints
- [ ] Bug detection
- [ ] Test case generation
- [ ] Dry run execution
- [ ] Concept explanation

✅ **Gamification**
- [ ] Daily challenge completion
- [ ] Badge unlocking
- [ ] XP earning
- [ ] Level progression
- [ ] Leaderboard updates

✅ **Contest Mode**
- [ ] Enter ongoing contest
- [ ] Submit solutions
- [ ] Timer countdown
- [ ] Score calculation

---

## 📊 Performance

### Metrics
- **Page Load Time**: < 2s
- **Time to Interactive**: < 3s
- **First Contentful Paint**: < 1.5s
- **API Response Time**: < 500ms (avg)
- **Visualization FPS**: 60fps

### Optimization Techniques
- React.memo for expensive components
- useCallback/useMemo for optimization
- Virtual scrolling for large lists
- Debouncing for search inputs
- Image lazy loading
- Code splitting

---

## 🐛 Troubleshooting

### Common Issues

**Backend won't start**
```bash
# Check if port 5000 is in use
netstat -ano | findstr :5000
# Kill the process or change PORT in .env
```

**Frontend build fails**
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

**MongoDB connection error**
```bash
# Start MongoDB
net start MongoDB  # Windows
sudo systemctl start mongod  # Linux
```

**AI features not working**
- Check OPENAI_API_KEY in backend/.env
- Verify API key at https://platform.openai.com
- Check API usage limits

For detailed troubleshooting, see [SETUP_GUIDE.md](./SETUP_GUIDE.md)

---

## 🚢 Deployment

### Production Checklist
- [ ] Set NODE_ENV=production
- [ ] Use strong JWT_SECRET
- [ ] Configure MongoDB Atlas
- [ ] Add OpenAI API key
- [ ] Set up SSL/HTTPS
- [ ] Configure CORS for production domain
- [ ] Enable rate limiting
- [ ] Set up monitoring (PM2, New Relic)
- [ ] Configure backups
- [ ] Set up CI/CD pipeline

For detailed deployment instructions, see [DEPLOYMENT.md](./DEPLOYMENT.md)

---

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Code Style
- Use ESLint configuration
- Follow Airbnb style guide
- Write meaningful commit messages
- Add JSDoc comments for functions
- Update documentation for new features

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👥 Authors

**AlgoVision AI Team**
- Lead Developer: [Your Name]
- UI/UX Designer: [Designer Name]
- AI Engineer: [AI Engineer Name]

---

## 🙏 Acknowledgments

- OpenAI for GPT-4 API
- LeetCode for problem inspiration
- React community for excellent libraries
- All contributors and testers

---

## 📮 Contact & Support

- **Website**: https://algovision-ai.com
- **Email**: support@algovision-ai.com
- **Discord**: https://discord.gg/algovision
- **Twitter**: @AlgoVisionAI

---

## 🗺️ Roadmap

### Version 1.1 (Q2 2026)
- [ ] Code execution sandbox
- [ ] Real-time collaboration
- [ ] Video explanations
- [ ] Mobile app (React Native)

### Version 1.2 (Q3 2026)
- [ ] Premium subscription tier
- [ ] Personalized learning paths
- [ ] Live coding sessions
- [ ] Company-specific prep tracks

### Version 2.0 (Q4 2026)
- [ ] System design module
- [ ] ML algorithm visualizations
- [ ] Peer code review
- [ ] Certification program

---

## 📈 Project Stats

- **Total Lines of Code**: ~15,000
- **Components**: 50+
- **API Endpoints**: 40+
- **Database Models**: 15
- **AI Features**: 12
- **Visualization Types**: 8
- **Pages**: 18

---

**Built with ❤️ for the DSA learning community**

---

## Quick Links
- [Setup Guide](./SETUP_GUIDE.md)
- [Deployment Guide](./DEPLOYMENT.md)
- [API Documentation](./API.md)
- [Contributing Guidelines](./CONTRIBUTING.md)
- [Changelog](./CHANGELOG.md)

---

⭐ **If you find this project helpful, please star it on GitHub!**
