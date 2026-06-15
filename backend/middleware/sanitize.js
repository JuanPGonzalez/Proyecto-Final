const sanitizeString = (str) => {
  if (typeof str !== 'string') return str;
  return str.replace(/</g, '&lt;').replace(/>/g, '&gt;');
};

const sanitizeObject = (obj) => {
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item));
  } else if (obj !== null && typeof obj === 'object') {
    const sanitizedObj = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        sanitizedObj[key] = sanitizeObject(obj[key]);
      }
    }
    return sanitizedObj;
  } else if (typeof obj === 'string') {
    return sanitizeString(obj);
  }
  return obj;
};

const sanitizeMiddleware = (req, res, next) => {
  if (req.body) req.body = sanitizeObject(req.body);
  if (req.query) req.query = sanitizeObject(req.query);
  if (req.params) req.params = sanitizeObject(req.params);
  next();
};

module.exports = sanitizeMiddleware;
