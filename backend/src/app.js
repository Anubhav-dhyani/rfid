import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import morgan from 'morgan';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import routes from './routes/index.js';

export function createApp() {
  const app = express();
  app.use(helmet());
  app.use(cors({ origin: process.env.CLIENT_URL?.split(',') || 'http://localhost:5173', credentials: true }));
  app.use(express.json({ limit: '1mb' }));
  app.use(cookieParser());
  app.use(morgan('dev'));
  const desktopInstaller = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../downloads/IdentiFi-Setup.exe');
  app.get('/downloads/IdentiFi-Setup.exe', (_req, res) => {
    if (!existsSync(desktopInstaller)) return res.status(404).send('Windows installer is not available yet.');
    res.set('Cache-Control', 'no-store');
    return res.download(desktopInstaller, 'IdentiFi-Setup.exe');
  });
  app.use('/api', routes);
  app.use('/api', (_req, res) => res.status(404).json({ message: 'Route not found.' }));

  const frontendDist = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../frontend/dist');
  if (existsSync(frontendDist)) {
    app.use(express.static(frontendDist));
    app.use((req, res, next) => req.accepts('html') ? res.sendFile(path.join(frontendDist, 'index.html')) : next());
  }

  app.use((_req, res) => res.status(404).json({ message: 'Route not found.' }));
  app.use((error, _req, res, _next) => {
    console.error(error);
    if (error.code === 11000) return res.status(409).json({ message: 'That identifier is already assigned.' });
    res.status(error.status || 500).json({ message: error.message || 'Internal server error.' });
  });
  return app;
}
