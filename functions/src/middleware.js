const jwt = require('jsonwebtoken');
function getSecret() { return process.env.JWT_SECRET || 'tiferet_jwt_secret_2024'; }
function auth(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'נדרשת הזדהות' });
  try { req.user = jwt.verify(token, getSecret()); next(); }
  catch { return res.status(401).json({ error: 'טוקן לא תקין' }); }
}
module.exports = { auth, getSecret };
