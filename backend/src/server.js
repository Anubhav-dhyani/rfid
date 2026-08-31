import dotenv from 'dotenv';
import { createApp } from './app.js';
import { connectDatabase } from './config/db.js';
import { startNfcReader, stopNfcReader } from './services/nfcReaderService.js';

dotenv.config({ path: new URL('../.env', import.meta.url) });
dotenv.config({ path: new URL('../../.env', import.meta.url) });

const port = process.env.PORT || 5000;
const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/student_identity';

connectDatabase(mongoUri)
  .then(() => {
    startNfcReader();
    const server = createApp().listen(port, () => console.log(`API listening on http://localhost:${port}`));
    const shutdown = () => { stopNfcReader(); server.close(() => process.exit(0)); };
    process.once('SIGINT', shutdown);
    process.once('SIGTERM', shutdown);
  })
  .catch((error) => {
    console.error('Unable to start server:', error.message);
    if (error.message.includes('ECONNREFUSED')) {
      console.error('MongoDB is not reachable. Start local MongoDB or set MONGODB_URI in backend/.env to a valid MongoDB Atlas connection string.');
    }
    process.exit(1);
  });
