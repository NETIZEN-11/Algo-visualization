# AlgoVision AI - Frontend

AI-powered DSA tutor with visualization engine built with React, Tailwind CSS, and Framer Motion.

## Features

- 🎯 LeetCode problem analysis
- 🎨 Step-by-step algorithm visualization
- 🧠 AI-powered insights and explanations
- 📊 Progress tracking and analytics
- 🎤 Mock interview mode
- 🏆 Gamification with XP and badges

## Tech Stack

- React 18
- Tailwind CSS
- Framer Motion
- Zustand (State Management)
- React Router
- Axios
- Vite

## Getting Started

### Prerequisites

- Node.js 18+ and npm

### Installation

```bash
# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Update .env with your API URL

# Start development server
npm run dev
```

### Build for Production

```bash
npm run build
```

## Project Structure

```
src/
├── components/     # Reusable components
│   ├── common/     # Common UI components
│   ├── visualization/  # Visualization components
│   ├── problem/    # Problem-related components
│   ├── interview/  # Interview mode components
│   ├── analytics/  # Analytics components
│   └── layout/     # Layout components
├── pages/          # Page components
├── hooks/          # Custom React hooks
├── services/       # API services
├── store/          # Zustand stores
├── utils/          # Utility functions
├── styles/         # Global styles
└── assets/         # Static assets
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## License

MIT
