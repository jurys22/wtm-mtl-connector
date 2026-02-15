# WTM MTL Connector

A web application to help attendees of WTM MTL events connect with each other for networking.

## Features

### User Management
- 🔐 Secure registration and authentication with JWT
- 👤 Rich profile creation with networking goals, industry, and skills
- 🔒 Password hashing with bcrypt (12 rounds)

### Smart Matching
- 🎯 Intelligent matching algorithm with weighted scoring:
  - 40% Networking intention alignment
  - 30% Industry match
  - 30% Skills overlap (tech + soft skills)
- 📊 Color-coded match scores (Excellent 80%+, Great 60%+, Good 40%+)
- 🔍 Detailed match cards showing shared attributes

### Conference Schedule
- 📅 View all conference sessions with time/location
- ✅ Track your attendance at sessions
- ⚠️ Automatic conflict detection for overlapping sessions
- 🕐 Real-time availability management

### Meeting Requests
- 💬 Send meeting requests to matched attendees
- 📍 Choose meeting location (Main corridor / Garden)
- 📝 Add personal notes (200 char limit)
- ⏱️ Time conflict validation against your schedule
- ✅ Accept or decline incoming requests
- 📬 Separate inbox and outbox views
- 🔔 Pending request notifications on dashboard

## Tech Stack

- **Frontend**: React + TypeScript + Vite
- **Backend**: Node.js + Express + TypeScript
- **Database**: SQLite (for local development)
- **Auth**: JWT with bcrypt password hashing

## Project Structure

```
wtm-mtl-connector/
├── frontend/          # React TypeScript frontend
├── backend/           # Node.js Express backend
├── prd.md            # Product Requirements Document
└── .taskmaster/      # Task management
```

## Getting Started

### Prerequisites

- Node.js 18+ and npm

### Installation

1. Install all dependencies:
```bash
npm run install-all
```

2. Set up backend environment:
```bash
cd backend
cp .env.example .env
# Edit .env with your configuration
```

3. Initialize database:
```bash
cd backend
npm run db:setup
```

### Development

Run both frontend and backend in development mode:
```bash
npm run dev
```

Or run them separately:
```bash
# Terminal 1 - Backend (runs on http://localhost:3000)
npm run dev:backend

# Terminal 2 - Frontend (runs on http://localhost:5173)
npm run dev:frontend
```

### Build

Build both frontend and backend:
```bash
npm run build
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user (rate limited: 5 attempts per 15 min)
- `GET /api/auth/profile` - Get user profile (protected)
- `POST /api/auth/logout` - Logout user (protected)

### Profile Management
- `GET /api/users/profile` - Get current user profile (protected)
- `PUT /api/users/profile` - Update user profile (protected)
- `GET /api/users/users` - Get all users (protected)
- `GET /api/users/users/:id` - Get user by ID (protected)

### Matching
- `GET /api/matching/matches` - Get matches with pagination (protected)
  - Query params: `limit` (default 20), `offset` (default 0)

### Conference Schedule
- `GET /api/schedule/sessions` - Get all conference sessions (protected)
- `GET /api/schedule/user-sessions` - Get user's scheduled sessions (protected)
- `POST /api/schedule/user-sessions` - Add session to schedule (protected)
- `DELETE /api/schedule/user-sessions/:id` - Remove session from schedule (protected)

### Meeting Requests
- `POST /api/meeting-requests` - Create meeting request (protected)
- `GET /api/meeting-requests/inbox` - Get received requests (protected)
- `GET /api/meeting-requests/outbox` - Get sent requests (protected)
- `PUT /api/meeting-requests/:id/accept` - Accept request (protected)
- `PUT /api/meeting-requests/:id/decline` - Decline request (protected)

## Database Schema

See `backend/src/db/schema.sql` for the complete database schema including:
- Users table with profile information
- Sessions table for conference schedule
- User_sessions junction table for attendance tracking
- Meeting_requests table for connection requests

## Project Stats

- **10 Tasks Completed**: From initial setup to final polish
- **Backend**: 15+ TypeScript files, 2000+ lines of code
- **Frontend**: 20+ React components, 2500+ lines of code
- **API Endpoints**: 20+ REST endpoints with full authentication
- **Database**: 4 tables with proper indexing and foreign keys

## License

Private project for WTM MTL events.
