/**
 * Global error handling middleware
 */
const errorHandler = (err, req, res, next) => {
  console.error('Error:', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  // Default error status
  let status = err.status || err.statusCode || 500;
  let message = err.message || 'Internal server error';

  // Handle specific error types
  if (err.name === 'MongoError' || err.name === 'MongoServerError') {
    status = 500;
    message = 'Database error occurred';
  } else if (err.name === 'ValidationError') {
    status = 400;
    message = 'Validation error';
  } else if (err.name === 'JsonWebTokenError') {
    status = 401;
    message = 'Invalid token';
  } else if (err.name === 'TokenExpiredError') {
    status = 401;
    message = 'Token expired';
  } else if (err.name === 'CastError') {
    status = 400;
    message = 'Invalid ID format';
  }

  // Ensure we always send a valid JSON response
  res.status(status).json({
    success: false,
    message,
    error: {
      message,
      status,
      id: req.id || 'unknown',
    },
  });
};

module.exports = errorHandler;