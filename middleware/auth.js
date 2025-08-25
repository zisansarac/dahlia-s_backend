const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];

  if (!authHeader) {
    return res.status(401).json({ error: 'Token bulunamadı' });
  }

  const token = authHeader.split(' ')[1]; // Bearer xxxxxx

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ error: 'Token geçersiz' });
    }

    req.user = decoded; // Örn: { id: 5 }
    next();
  });
};

module.exports = verifyToken;
