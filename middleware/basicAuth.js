// Basic auth middleware for admin UI
module.exports = function basicAuth(req, res, next) {
  const pw = process.env.ADMIN_PASSWORD;
  if (!pw) {
    // If no admin password configured, block access and prompt to set one
    return res.status(403).send('Admin UI is disabled. Set ADMIN_PASSWORD in environment to enable it.');
  }

  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Basic ')) {
    res.set('WWW-Authenticate', 'Basic realm="Admin"');
    return res.status(401).send('Authentication required');
  }

  const creds = Buffer.from(auth.split(' ')[1], 'base64').toString();
  const sep = creds.indexOf(':');
  const password = sep >= 0 ? creds.slice(sep + 1) : creds;

  if (password !== pw) {
    res.set('WWW-Authenticate', 'Basic realm="Admin"');
    return res.status(401).send('Invalid credentials');
  }

  next();
};
