// RATE LIMITING MIDDLEWARE - FREE Security Protection
// =================================================

// Simple in-memory rate limiter (for production, use Redis)
const rateLimitStore = new Map();

const createRateLimiter = (maxRequests = 100, windowMs = 15 * 60 * 1000) => {
  return (req, res, next) => {
    const clientId = req.headers['x-forwarded-for'] || 
                    req.headers['x-real-ip'] || 
                    req.connection.remoteAddress || 
                    'unknown';
    
    const now = Date.now();
    const windowStart = now - windowMs;
    
    // Get existing requests for this client
    const requests = rateLimitStore.get(clientId) || [];
    
    // Remove old requests outside the window
    const validRequests = requests.filter(timestamp => timestamp > windowStart);
    
    // Check if limit exceeded
    if (validRequests.length >= maxRequests) {
      return res.status(429).json({
        error: 'Too many requests',
        retryAfter: Math.ceil((validRequests[0] + windowMs - now) / 1000)
      });
    }
    
    // Add current request
    validRequests.push(now);
    rateLimitStore.set(clientId, validRequests);
    
    // Add rate limit headers
    res.setHeader('X-RateLimit-Limit', maxRequests);
    res.setHeader('X-RateLimit-Remaining', maxRequests - validRequests.length);
    res.setHeader('X-RateLimit-Reset', new Date(now + windowMs).toISOString());
    
    if (next) next();
  };
};

// Security headers middleware
const securityHeaders = (req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  if (next) next();
};

// Input validation middleware
const validateInput = (schema) => {
  return (req, res, next) => {
    try {
      const { error } = schema.validate(req.body);
      if (error) {
        return res.status(400).json({
          error: 'Invalid input',
          details: error.details.map(d => d.message)
        });
      }
      if (next) next();
    } catch (err) {
      return res.status(400).json({ error: 'Validation failed' });
    }
  };
};

// SQL injection detection
const detectSQLInjection = (req, res, next) => {
  const body = JSON.stringify(req.body);
  const sqlPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)/gi,
    /(\b(OR|AND)\s+\d+\s*=\s*\d+)/gi,
    /(UNION\s+SELECT)/gi,
    /(DROP\s+TABLE)/gi,
    /(DELETE\s+FROM)/gi
  ];
  
  if (sqlPatterns.some(pattern => pattern.test(body))) {
    console.warn('🔒 SQL INJECTION ATTEMPT DETECTED:', {
      ip: req.headers['x-forwarded-for'],
      body: req.body,
      timestamp: new Date().toISOString()
    });
    
    return res.status(400).json({
      error: 'Invalid request detected'
    });
  }
  
  if (next) next();
};

// XSS detection
const detectXSS = (req, res, next) => {
  const body = JSON.stringify(req.body);
  const xssPatterns = [
    /<script/gi,
    /javascript:/gi,
    /on\w+=/gi,
    /eval\(/gi,
    /expression\(/gi
  ];
  
  if (xssPatterns.some(pattern => pattern.test(body))) {
    console.warn('🔒 XSS ATTEMPT DETECTED:', {
      ip: req.headers['x-forwarded-for'],
      body: req.body,
      timestamp: new Date().toISOString()
    });
    
    return res.status(400).json({
      error: 'Invalid request detected'
    });
  }
  
  if (next) next();
};

// Request size limiter
const limitRequestSize = (maxSize = 1024 * 1024) => { // 1MB default
  return (req, res, next) => {
    const contentLength = parseInt(req.headers['content-length'] || '0');
    
    if (contentLength > maxSize) {
      return res.status(413).json({
        error: 'Request too large',
        maxSize: `${maxSize / 1024}KB`
      });
    }
    
    if (next) next();
  };
};

// CORS security
const secureCORS = (req, res, next) => {
  const origin = req.headers.origin;
  const allowedOrigins = [
    'https://yourdomain.com',
    'https://www.yourdomain.com',
    'http://localhost:3000', // Development
    'http://localhost:5173'  // Vite dev server
  ];
  
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Max-Age', '86400');
  
  if (next) next();
};

// Combine all security middleware
const securityMiddleware = [
  securityHeaders,
  createRateLimiter(100, 15 * 60 * 1000), // 100 requests per 15 minutes
  limitRequestSize(1024 * 1024), // 1MB limit
  detectSQLInjection,
  detectXSS,
  secureCORS
];

module.exports = {
  createRateLimiter,
  securityHeaders,
  validateInput,
  detectSQLInjection,
  detectXSS,
  limitRequestSize,
  secureCORS,
  securityMiddleware
};
