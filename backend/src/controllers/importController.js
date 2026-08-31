import { Import } from '../models/Import.js';
import { importStudents } from '../services/importService.js';

export async function uploadStudents(req, res) {
  if (!req.file) return res.status(400).json({ message: 'Please upload an Excel or CSV file.' });
  let mapping = {};
  if (req.body.mapping) {
    try { mapping = JSON.parse(req.body.mapping); }
    catch { return res.status(400).json({ message: 'Column mapping must be valid JSON.' }); }
  }
  const result = await importStudents(req.file, mapping);
  return res.status(201).json(result);
}

export async function listImports(_req, res) {
  res.json(await Import.find().sort({ createdAt: -1 }).limit(20));
}
