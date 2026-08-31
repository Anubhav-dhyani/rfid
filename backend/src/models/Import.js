import mongoose from 'mongoose';

const importSchema = new mongoose.Schema(
  {
    fileName: { type: String, required: true },
    status: { type: String, enum: ['processing', 'completed', 'completed_with_errors', 'failed'], default: 'processing' },
    totalRows: { type: Number, default: 0 },
    inserted: { type: Number, default: 0 },
    updated: { type: Number, default: 0 },
    rejected: { type: Number, default: 0 },
    rowErrors: [{ row: Number, message: String }]
  },
  { timestamps: true }
);

export const Import = mongoose.model('Import', importSchema);
