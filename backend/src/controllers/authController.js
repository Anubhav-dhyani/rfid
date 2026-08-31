import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import { COOKIE_NAME } from '../middleware/auth.js';

const digest = (value) => crypto.createHash('sha256').update(String(value ?? '')).digest();
const safeEqual = (left, right) => crypto.timingSafeEqual(digest(left), digest(right));

function assertAuthConfig() {
  const missing = ['ADMIN_LOGIN_ID', 'ADMIN_PASSWORD', 'JWT_SECRET'].filter((key) => !process.env[key]);
  if (missing.length) {
    const error = new Error(`Server authentication is not configured. Missing: ${missing.join(', ')}`);
    error.status = 503;
    throw error;
  }
  if (process.env.JWT_SECRET.length < 32) {
    const error = new Error('JWT_SECRET must contain at least 32 characters.');
    error.status = 503;
    throw error;
  }
}

export function login(req, res) {
  assertAuthConfig();
  const { loginId = '', password = '' } = req.body;
  if (!safeEqual(loginId, process.env.ADMIN_LOGIN_ID) || !safeEqual(password, process.env.ADMIN_PASSWORD)) {
    return res.status(401).json({ message: 'Invalid admin ID or password.' });
  }
  const token = jwt.sign({ role: 'admin', loginId: process.env.ADMIN_LOGIN_ID }, process.env.JWT_SECRET, { expiresIn: '8h' });
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 8 * 60 * 60 * 1000,
    path: '/'
  });
  res.json({ admin: { loginId: process.env.ADMIN_LOGIN_ID, role: 'admin' } });
}

export function currentAdmin(req, res) {
  res.json({ admin: { loginId: req.admin.loginId, role: req.admin.role } });
}

export function logout(_req, res) {
  res.clearCookie(COOKIE_NAME, { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/' });
  res.json({ message: 'Signed out successfully.' });
}
