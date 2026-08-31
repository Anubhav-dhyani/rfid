import { Student } from '../models/Student.js';
import { escapeRegex, normalizeCode } from '../utils/normalize.js';

export async function listStudents(req, res) {
  const { q = '', page = 1, limit = 10, barcodeStatus, rfidStatus } = req.query;
  const filter = { isActive: true };
  if (q) {
    const regex = new RegExp(escapeRegex(q), 'i');
    filter.$and = [{ $or: [{ name: regex }, { studentId: regex }, { admissionNumber: regex }, { rollNumber: regex }] }];
  }
  if (barcodeStatus === 'mapped') filter['barcode.value'] = { $exists: true, $ne: '' };
  if (barcodeStatus === 'unmapped') filter.$and = [...(filter.$and || []), { $or: [{ 'barcode.value': { $exists: false } }, { 'barcode.value': '' }] }];
  if (rfidStatus === 'mapped') filter['rfid.value'] = { $exists: true, $ne: '' };
  if (rfidStatus === 'unmapped') filter.$and = [...(filter.$and || []), { $or: [{ 'rfid.value': { $exists: false } }, { 'rfid.value': '' }] }];

  const pageNumber = Math.max(Number(page), 1);
  const pageSize = Math.min(Math.max(Number(limit), 1), 100);
  const sort = barcodeStatus === 'mapped'
    ? { 'barcode.assignedAt': -1, name: 1 }
    : rfidStatus === 'mapped'
      ? { 'rfid.assignedAt': -1, name: 1 }
      : { name: 1 };
  const [items, total] = await Promise.all([
    Student.find(filter).sort(sort).skip((pageNumber - 1) * pageSize).limit(pageSize),
    Student.countDocuments(filter)
  ]);
  res.json({ items, total, page: pageNumber, pages: Math.ceil(total / pageSize) });
}

export async function getStudent(req, res) {
  const student = await Student.findOne({ studentId: normalizeCode(req.params.studentId) });
  if (!student) return res.status(404).json({ message: 'Student not found.' });
  res.json(student);
}

export async function dashboard(_req, res) {
  const [total, barcodeMapped, rfidMapped] = await Promise.all([
    Student.countDocuments({ isActive: true }),
    Student.countDocuments({ isActive: true, 'barcode.value': { $exists: true, $ne: '' } }),
    Student.countDocuments({ isActive: true, 'rfid.value': { $exists: true, $ne: '' } })
  ]);
  res.json({ total, barcodeMapped, rfidMapped, barcodePending: total - barcodeMapped, rfidPending: total - rfidMapped });
}
