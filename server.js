const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const dbPath = path.resolve(__dirname, '../db/database.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) console.error('DB Error:', err.message);
    else console.log('Connected to SQLite database.');
});

// Create tables & Seed default data
db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT,
        description TEXT,
        event_date TEXT,
        venue TEXT,
        status TEXT DEFAULT 'APPROVED'
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS event_registrations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        event_id INTEGER,
        student_id INTEGER
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS od_requests (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        event_id INTEGER,
        student_id INTEGER,
        reason TEXT,
        status TEXT DEFAULT 'PENDING'
    )`);

    db.get(`SELECT COUNT(*) as count FROM events`, [], (err, row) => {
        if (row && row.count === 0) {
            db.run(`INSERT INTO events (title, description, event_date, venue, status) VALUES 
                ('Hackathon 2026', '24 Hour Coding Challenge', '2026-09-27', 'Main Block Auditorium', 'APPROVED')`);
        }
    });
});

// --- API ROUTES ---

// Get Events
app.get(['/events', '/api/events'], (req, res) => {
    db.all(`SELECT * FROM events`, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows || []);
    });
});

// Register Event
const handleRegister = (req, res) => {
    const eventId = req.params.id || req.body.eventId || 1;
    const studentId = req.body.student_id || 1;
    db.run(`INSERT INTO event_registrations (event_id, student_id) VALUES (?, ?)`, [eventId, studentId], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.status(201).json({ message: 'Registered successfully', registration_id: this.lastID });
    });
};
app.post(['/events/:id/register', '/api/events/:id/register', '/events/register', '/api/events/register'], handleRegister);

// Get OD Requests
app.get(['/od', '/api/od', '/od-requests', '/api/od-requests'], (req, res) => {
    db.all(`SELECT * FROM od_requests`, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows || []);
    });
});

// Submit OD Request
const handleOD = (req, res) => {
    const eventId = req.body.eventId || req.params.id || 1;
    const studentId = req.body.student_id || 1;
    const reason = req.body.reason || 'Participant/Coding Challenge';

    db.run(`INSERT INTO od_requests (event_id, student_id, reason, status) VALUES (?, ?, ?, 'PENDING')`,
        [eventId, studentId, reason],
        function (err) {
            if (err) return res.status(500).json({ error: err.message });
            res.status(201).json({ message: 'OD Request submitted successfully', id: this.lastID });
        }
    );
};
app.post(['/od', '/api/od', '/od-requests', '/api/od-requests', '/events/:id/od'], handleOD);

// Approve or Reject OD Request (FACULTY API)
app.post(['/od/:id/status', '/api/od/:id/status'], (req, res) => {
    const { status } = req.body; // 'APPROVED' or 'REJECTED'
    const requestId = req.params.id;

    db.run(`UPDATE od_requests SET status = ? WHERE id = ?`, [status, requestId], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: `OD Request status updated to ${status}` });
    });
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
// Universal Login Endpoint
app.post(['/login', '/api/login', '/auth/login', '/api/auth/login'], (req, res) => {
    const { email } = req.body;
    res.json({
        message: 'Login successful',
        user: {
            id: 1,
            name: 'SARANYA SRIDHAR',
            email: email || 'student@campus.edu',
            role: 'STUDENT',
            raNumber: 'RA2026001002003'
        },
        token: 'fake-jwt-token-for-demo'
    });
});