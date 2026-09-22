import { Router } from 'express';
import multer from 'multer';
import { asyncHandler } from '../utils/asyncHandler.js';
import { listImports, uploadStudents } from '../controllers/importController.js';
import { dashboard, getStudent, listStudents } from '../controllers/studentController.js';
import { assignRfid, mapBarcode, searchIdentity, unassign } from '../controllers/identityController.js';
import { currentAdmin, login, logout } from '../controllers/authController.js';
import { requireAdmin } from '../middleware/auth.js';
import { readerStatus } from '../controllers/nfcReaderController.js';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const router = Router();
const desktopInstaller = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../downloads/IdentiFi-Setup.exe');
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, callback) => {
    const accepted = /\.(xlsx|csv)$/i.test(file.originalname);
    callback(accepted ? null : new Error('Only XLSX and CSV files are supported.'), accepted);
  }
});

router.get('/health', (_req, res) => res.json({ status: 'ok' }));
router.get('/desktop-download', (_req, res) => {
  res.set('Cache-Control', 'no-store');
  res.json({ available: existsSync(desktopInstaller), url: '/downloads/IdentiFi-Setup.exe' });
});
router.post('/auth/login', asyncHandler(login));
router.use(requireAdmin);
router.get('/auth/me', asyncHandler(currentAdmin));
router.post('/auth/logout', asyncHandler(logout));
router.get('/rfid-reader/status', asyncHandler(readerStatus));
router.get('/dashboard', asyncHandler(dashboard));
router.get('/students', asyncHandler(listStudents));
router.get('/students/:studentId', asyncHandler(getStudent));
router.post('/imports/students', upload.single('file'), asyncHandler(uploadStudents));
router.get('/imports', asyncHandler(listImports));
router.post('/barcodes/map', asyncHandler(mapBarcode));
router.post('/rfid/assign', asyncHandler(assignRfid));
router.get('/search/:type/:value', asyncHandler(searchIdentity));
router.delete('/identity/:type/:value', asyncHandler(unassign));

export default router;
