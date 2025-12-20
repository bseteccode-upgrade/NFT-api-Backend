'use strict';

/**
 * Global Error Handling Middleware
 * --------------------------------
 * This middleware catches all unhandled errors
 * thrown in routes, controllers, or async handlers.
 *
 */
function errorHandler(err, req, res, next) {
  console.error('Error=================:', err);

  // Avoid leaking sensitive information
  const message = err.message || 'Internal server error';
  const status = err.status || err.statusCode || 500;

  res.status(status).json({
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
}

module.exports = errorHandler;

