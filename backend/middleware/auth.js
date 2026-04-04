const jwt = require('jsonwebtoken');

const auth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token d’authentification manquant' });
  }

  const token = authHeader.split(' ')[1];
  const decoded = jwt.decode(token);
  if (!decoded || !decoded.sub) {
    return res.status(401).json({ error: 'Token invalide' });
  }

  req.supabaseAuthToken = token;
  req.user = {
    id: decoded.sub,
    email: decoded.email,
    role: decoded.role,
  };

  next();
};

module.exports = { auth };