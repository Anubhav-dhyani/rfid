# IdentiFi — Student Barcode & RFID Management

End-to-end student identity system built with React, Node.js, Express, and MongoDB. It imports student master data from XLSX/CSV, maps barcodes, assigns RFID cards, and retrieves complete student profiles from either identifier.

## Requirements

- Node.js 20+
- MongoDB 7+ (local or MongoDB Atlas)
- A USB barcode scanner that operates in keyboard-wedge mode
- An ACS ACR122U or compatible PC/SC NFC reader connected to the backend computer

## Start locally

```bash
cp .env.example .env
cp frontend/.env.example frontend/.env
npm install
npm run dev
```

The frontend runs at `http://localhost:5173` and the API at `http://localhost:5000/api`. For a production-style run, use `npm run build && npm start`; Express will serve the built frontend.

If using MongoDB Atlas, put its connection string in `MONGODB_URI` in `.env`. Vite reads `VITE_API_URL`; for the default local setup no changes are needed.

Admin access is configured only on the backend:

```env
ADMIN_LOGIN_ID=admin
ADMIN_PASSWORD=use-a-strong-private-password
JWT_SECRET=use-at-least-32-random-characters
```

You can place these values in `backend/.env` (preferred) or the root `.env`. The login creates an eight-hour HTTP-only cookie; the password and JWT secret are never exposed to frontend code. Restart the backend after changing environment variables.

If startup reports `ECONNREFUSED 127.0.0.1:27017`, either start the local MongoDB service or replace `MONGODB_URI` with a valid MongoDB Atlas URI. When using Atlas, also allow your current IP address in Atlas Network Access.

## Excel format

`Student ID` and `Student Name` are required. The importer automatically recognizes these common columns:

```text
Student ID, Admission No, Student Name, Roll No, Class/Course, Section,
Academic Year, DOB, Gender, Email, Mobile, Parent Name, Parent Phone,
Address, Photo URL
```

Existing Student IDs are updated without overwriting their barcode or RFID assignments. Duplicate rows inside a file are rejected and shown in the import report.

## Workflow

1. Upload the student master from **Import master**.
2. Open **Map barcode** and scan the barcode. Its value is treated as the Student ID, the matching Excel record is displayed, and you confirm the mapping.
3. Open **Assign RFID**, select a student from the barcode-mapped list, verify their details, tap the card, and save. Barcode mapping is required first.
4. Open **Search student** and scan either identifier to display the complete profile.

Every column from the uploaded workbook is also retained in `excelData` and displayed under **All Excel data** in the full student profile, even when the column is not one of the application's standard fields.

Scanner hardware that types its value followed by Enter works without drivers. For a serial-port-only RFID device, add a small hardware bridge that sends its UID to the RFID field or calls `POST /api/rfid/assign`.

### ACR122U NFC reader

The ACR122U is not a keyboard-wedge device. The backend connects to it through the operating system's PC/SC service and reads the card UID automatically. Keep the reader connected to the same computer that runs `npm run dev` or `npm start`.

1. Start the backend with the ACR122U connected.
2. Confirm **NFC reader connected — ACS ACR122U PICC Interface** appears on Assign RFID.
3. Select a barcode-mapped student.
4. Lift the card away, then tap it on the reader.
5. Confirm the detected UID and save.

The same reader bridge is active in **Search student → RFID card**. Tapping an assigned card automatically searches its UID and opens the complete student profile.

Set `NFC_READER_ENABLED=false` in `backend/.env` only when intentionally running without local reader hardware. macOS and Windows provide PC/SC; Linux also requires the `pcscd` service and PC/SC development libraries.

## API overview

```text
GET    /api/health
GET    /api/dashboard
GET    /api/students?q=&page=&limit=
GET    /api/students/:studentId
POST   /api/imports/students        multipart field: file
GET    /api/imports
POST   /api/barcodes/map            { studentId, value }
POST   /api/rfid/assign              { studentId, value }
GET    /api/search/:type/:value      type: barcode | rfid
DELETE /api/identity/:type/:value
```

Unique MongoDB indexes protect Student IDs, barcodes, and RFID UIDs from duplicate assignments. Every assignment or removal is written to the audit log.
