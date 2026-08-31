import { parse as parseCsv } from 'csv-parse/sync';
import readXlsxFile from 'read-excel-file/node';
import { Import } from '../models/Import.js';
import { Student } from '../models/Student.js';
import { clean, normalizeCode, normalizeHeader } from '../utils/normalize.js';

const aliases = {
  studentId: ['studentid', 'studentcode', 'id'],
  admissionNumber: ['admissionnumber', 'admissionno', 'admission'],
  name: ['studentname', 'name', 'fullname'],
  rollNumber: ['rollnumber', 'rollno', 'roll'],
  className: ['classname', 'class', 'course'],
  section: ['section'],
  academicYear: ['academicyear', 'session', 'year'],
  dateOfBirth: ['dateofbirth', 'dob', 'birthdate'],
  gender: ['gender', 'sex'],
  email: ['email', 'emailaddress'],
  phone: ['phone', 'mobile', 'mobilenumber', 'studentphone'],
  parentName: ['parentname', 'guardianname', 'fathername'],
  parentPhone: ['parentphone', 'guardianphone', 'parentmobile'],
  address: ['address', 'residentialaddress'],
  photoUrl: ['photourl', 'photo', 'imageurl']
};

function getValue(row, field, customMapping = {}) {
  const requestedHeader = customMapping[field];
  if (requestedHeader && row[requestedHeader] !== undefined) return row[requestedHeader];
  const key = Object.keys(row).find((header) => aliases[field]?.includes(normalizeHeader(header)));
  return key ? row[key] : undefined;
}

function parseDate(value) {
  if (!value) return undefined;
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

function serializeCell(value) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value.toISOString().slice(0, 10);
  return clean(value);
}

async function readRows(file) {
  if (/\.csv$/i.test(file.originalname)) {
    return parseCsv(file.buffer, { columns: true, skip_empty_lines: true, trim: true, bom: true });
  }
  const sheetRows = await readXlsxFile(file.buffer);
  if (!sheetRows.length) return [];
  const headers = sheetRows[0].map(clean);
  return sheetRows.slice(1).map((values) => Object.fromEntries(
    headers.map((header, column) => [header, values[column]]).filter(([header]) => header)
  )).filter((row) => Object.values(row).some((value) => clean(value)));
}

export async function importStudents(file, mapping = {}) {
  const record = await Import.create({ fileName: file.originalname });
  try {
    const rows = await readRows(file);
    record.totalRows = rows.length;
    const seen = new Set();
    const operations = [];

    for (let index = 0; index < rows.length; index += 1) {
      const rowNumber = index + 2;
      const row = rows[index];
      const studentId = normalizeCode(getValue(row, 'studentId', mapping));
      const name = clean(getValue(row, 'name', mapping));

      if (!studentId || !name) {
        record.rejected += 1;
        record.rowErrors.push({ row: rowNumber, message: 'Student ID and student name are required.' });
        continue;
      }
      if (seen.has(studentId)) {
        record.rejected += 1;
        record.rowErrors.push({ row: rowNumber, message: `Duplicate Student ID ${studentId} in this file.` });
        continue;
      }
      seen.add(studentId);

      const update = {
        studentId,
        name,
        admissionNumber: clean(getValue(row, 'admissionNumber', mapping)),
        rollNumber: clean(getValue(row, 'rollNumber', mapping)),
        className: clean(getValue(row, 'className', mapping)),
        section: clean(getValue(row, 'section', mapping)),
        academicYear: clean(getValue(row, 'academicYear', mapping)),
        dateOfBirth: parseDate(getValue(row, 'dateOfBirth', mapping)),
        gender: clean(getValue(row, 'gender', mapping)),
        email: clean(getValue(row, 'email', mapping)),
        phone: clean(getValue(row, 'phone', mapping)),
        parent: {
          name: clean(getValue(row, 'parentName', mapping)),
          phone: clean(getValue(row, 'parentPhone', mapping))
        },
        address: clean(getValue(row, 'address', mapping)),
        photoUrl: clean(getValue(row, 'photoUrl', mapping)),
        excelData: Object.entries(row).map(([column, value]) => ({ column: clean(column), value: serializeCell(value) })),
        source: { importId: record._id, excelRowNumber: rowNumber },
        isActive: true
      };

      operations.push({ updateOne: {
        filter: { studentId },
        update: { $set: update, $setOnInsert: { barcode: {}, rfid: {} } },
        upsert: true
      } });
    }

    for (let start = 0; start < operations.length; start += 500) {
      const batch = operations.slice(start, start + 500);
      const result = await Student.bulkWrite(batch, { ordered: false });
      record.inserted += result.upsertedCount;
      record.updated += batch.length - result.upsertedCount;
    }

    record.status = record.rejected ? 'completed_with_errors' : 'completed';
    await record.save();
    return record;
  } catch (error) {
    record.status = 'failed';
    record.rowErrors.push({ row: 0, message: error.message });
    await record.save();
    throw error;
  }
}
