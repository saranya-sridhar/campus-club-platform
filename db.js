const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dbPath = path.resolve(__dirname, 'database.sqlite');
const schemaPath = path.resolve(__dirname, 'schema.sql');

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Failed to connect to SQLite database:', err.message);
    } else {
        console.log('Connected to SQLite database.');
        db.run('PRAGMA foreign_keys = ON;', (pragmaErr) => {
            if (pragmaErr) console.error('Failed to enable Foreign Keys:', pragmaErr.message);
        });
        
        const schema = fs.readFileSync(schemaPath, 'utf8');
        db.exec(schema, (execErr) => {
            if (execErr) console.error('Error executing schema:', execErr.message);
        });
    }
});

module.exports = db;