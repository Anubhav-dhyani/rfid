import mongoose from 'mongoose';

const assignmentSchema = new mongoose.Schema(
  {
    value: { type: String, trim: true, uppercase: true },
    status: { type: String, enum: ['unassigned', 'mapped'], default: 'unassigned' },
    assignedAt: Date,
    assignedBy: { type: String, default: 'admin' }
  },
  { _id: false }
);

const studentSchema = new mongoose.Schema(
  {
    studentId: { type: String, required: true, unique: true, trim: true, uppercase: true },
    admissionNumber: { type: String, trim: true },
    name: { type: String, required: true, trim: true },
    rollNumber: { type: String, trim: true },
    className: { type: String, trim: true },
    section: { type: String, trim: true },
    academicYear: { type: String, trim: true },
    dateOfBirth: Date,
    gender: { type: String, trim: true },
    email: { type: String, trim: true, lowercase: true },
    phone: { type: String, trim: true },
    parent: {
      name: { type: String, trim: true },
      phone: { type: String, trim: true }
    },
    address: { type: String, trim: true },
    photoUrl: { type: String, trim: true },
    excelData: [{
      _id: false,
      column: { type: String, required: true },
      value: { type: String, default: '' }
    }],
    barcode: { type: assignmentSchema, default: () => ({}) },
    rfid: { type: assignmentSchema, default: () => ({}) },
    source: {
      importId: { type: mongoose.Schema.Types.ObjectId, ref: 'Import' },
      excelRowNumber: Number
    },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

studentSchema.index({ 'barcode.value': 1 }, { unique: true, sparse: true });
studentSchema.index({ 'rfid.value': 1 }, { unique: true, sparse: true });
studentSchema.index({ name: 'text', studentId: 'text', admissionNumber: 'text', rollNumber: 'text' });

export const Student = mongoose.model('Student', studentSchema);
