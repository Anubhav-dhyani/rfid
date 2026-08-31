import jwt from 'jsonwebtoken';

const COOKIE_NAME = 'admin_session';

export function requireAdmin(req, res, next) {
  const token = req.cookies?.[COOKIE_NAME];
  if (!token) return res.status(401).json({ message: 'Please sign in to continue.' });
  try {
    req.admin = jwt.verify(token, process.env.JWT_SECRET);
    return next();
  } catch {
    res.clearCookie(COOKIE_NAME);
    return res.status(401).json({ message: 'Your session has expired. Please sign in again.' });
  }
}

export { COOKIE_NAME };
