import { Student } from '../models/Student.js';
import { AuditLog } from '../models/AuditLog.js';
import { normalizeCode } from '../utils/normalize.js';

async function assign(req, res, type) {
  const studentId = normalizeCode(req.body.studentId);
  const value = normalizeCode(req.body.value);
  if (!studentId || !value) return res.status(400).json({ message: 'Student ID and scanned value are required.' });

  const student = await Student.findOne({ studentId, isActive: true });
  if (!student) return res.status(404).json({ message: 'Student not found in the master data.' });
  if (type === 'barcode' && value !== student.studentId) {
    return res.status(400).json({ message: 'The barcode value must match the Student ID.' });
  }
  if (type === 'rfid' && !student.barcode?.value) {
    return res.status(409).json({ message: 'Map a barcode to this student before assigning RFID.' });
  }

  const owner = await Student.findOne({ [`${type}.value`]: value, _id: { $ne: student._id } });
  if (owner) return res.status(409).json({ message: `This ${type.toUpperCase()} is already assigned to ${owner.name} (${owner.studentId}).` });

  const previousIdentifier = student[type]?.value;
  student[type] = { value, status: 'mapped', assignedAt: new Date(), assignedBy: req.body.performedBy || 'admin' };
  await student.save();
  await AuditLog.create({
    action: type === 'barcode' ? 'BARCODE_MAPPED' : 'RFID_ASSIGNED',
    student: student._id,
    identifier: value,
    previousIdentifier,
    performedBy: req.body.performedBy || 'admin'
  });
  res.json(student);
}

export const mapBarcode = (req, res) => assign(req, res, 'barcode');
export const assignRfid = (req, res) => assign(req, res, 'rfid');

export async function searchIdentity(req, res) {
  const type = req.params.type;
  if (!['barcode', 'rfid'].includes(type)) return res.status(400).json({ message: 'Search type must be barcode or RFID.' });
  const value = normalizeCode(req.params.value);
  const student = await Student.findOne({ [`${type}.value`]: value, isActive: true });
  if (!student) return res.status(404).json({ message: `No student is mapped to this ${type.toUpperCase()}.` });
  res.json(student);
}

export async function unassign(req, res) {
  const type = req.params.type;
  if (!['barcode', 'rfid'].includes(type)) return res.status(400).json({ message: 'Invalid identity type.' });
  const value = normalizeCode(req.params.value);
  const student = await Student.findOne({ [`${type}.value`]: value });
  if (!student) return res.status(404).json({ message: 'Mapping not found.' });
  student[type] = { status: 'unassigned' };
  await student.save();
  await AuditLog.create({ action: `${type.toUpperCase()}_UNASSIGNED`, student: student._id, previousIdentifier: value });
  res.json({ message: `${type.toUpperCase()} mapping removed.` });
}
