require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const helmet = require('helmet');
const morgan = require('morgan');

const { generalLimiter } = require('./middleware/rateLimiter');
const errorHandler = require('./middleware/errorHandler');

const app = express();

app.use(helmet());
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'http:', 'https:'],
    },
  })
);

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

app.use(generalLimiter);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use(
  cors({
    origin: [
      process.env.CLIENT_URL || 'http://localhost:5173',
      'http://localhost:5173',
      'http://127.0.0.1:5173',
      'http://localhost:3000',
      'http://127.0.0.1:3000',
    ],
    credentials: true,
  })
);

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Mongo connection (serverless-safe: reuse global connection)
let cached = global.__mongoose_conn__;
if (!cached) cached = global.__mongoose_conn__ = { conn: null, promise: null };

async function connectDB() {
  if (cached.conn) return cached.conn;
  if (!cached.promise) {
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/devhubpro';
    cached.promise = mongoose
      .connect(uri)
      .then((m) => {
        console.log('MongoDB connected to BuildBoard+');
        return m;
      })
      .catch((err) => {
        console.error('MongoDB error:', err);
        throw err;
      });
  }
  cached.conn = await cached.promise;
  return cached.conn;
}

// Ensure DB connection for every request in serverless
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (e) {
    next(e);
  }
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/repos', require('./routes/repos'));
app.use('/api/issues', require('./routes/issues'));
app.use('/api/pullrequests', require('./routes/pullrequests'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/platform', require('./routes/platform'));
app.use('/api/ai', require('./routes/ai'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/projects', require('./routes/projects'));
app.use('/api/versions', require('./routes/versions'));
app.use('/api/feedback', require('./routes/feedback'));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'BuildBoard+ API is running' });
});

// 404 handler
app.use((req, res) => {
  console.log(`404 - Route not found: ${req.method} ${req.path}`);
  res.status(404).json({ message: 'Route not found' });
});

// Global error handler (must be last)
app.use(errorHandler);

module.exports = app;
