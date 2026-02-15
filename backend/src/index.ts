import express from 'express';
import cors from 'cors';
import { config } from './config';
import { getDatabase } from './db';
import routes from './routes';

const app = express();

// Middleware
app.use(cors({
  origin: config.frontendUrl,
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: config.nodeEnv
  });
});

// API info endpoint
app.get('/api', (req, res) => {
  res.json({
    message: 'WTM MTL Connector API',
    version: '1.0.0',
    endpoints: {
      auth: {
        register: 'POST /api/auth/register',
        login: 'POST /api/auth/login',
        profile: 'GET /api/auth/profile (protected)',
        logout: 'POST /api/auth/logout (protected)'
      },
      users: {
        getProfile: 'GET /api/users/profile (protected)',
        updateProfile: 'PUT /api/users/profile (protected)',
        getAllUsers: 'GET /api/users/users (protected)',
        getUserById: 'GET /api/users/users/:id (protected)'
      }
    }
  });
});

// API routes
app.use('/api', routes);

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: config.nodeEnv === 'development' ? err.message : undefined
  });
});

// Initialize and start server
async function startServer() {
  try {
    // Initialize database connection
    await getDatabase();
    console.log('Database initialized');

    // Start server
    app.listen(config.port, () => {
      console.log(`
╔═══════════════════════════════════════════════╗
║   WTM MTL Connector Backend                  ║
║   Server running on http://localhost:${config.port}   ║
║   Environment: ${config.nodeEnv.padEnd(28)}║
╚═══════════════════════════════════════════════╝

API Endpoints:
  Authentication:
    POST   /api/auth/register        - Register new user
    POST   /api/auth/login           - Login user
    GET    /api/auth/profile         - Get user profile (protected)
    POST   /api/auth/logout          - Logout user (protected)

  Profile Management:
    GET    /api/users/profile        - Get current user profile (protected)
    PUT    /api/users/profile        - Update user profile (protected)
    GET    /api/users/users          - Get all users (protected)
    GET    /api/users/users/:id      - Get user by ID (protected)

  Other:
    GET    /health                   - Health check
      `);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

export default app;
