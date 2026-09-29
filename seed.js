const db = require('./db');
const bcrypt = require('bcryptjs');

async function seed() {
    const passwordHash = await bcrypt.hash('password123', 10);

    db.serialize(() => {
        db.run('DELETE FROM users');
        db.run('DELETE FROM clubs');
        db.run('DELETE FROM timetable_structures');
        db.run('DELETE FROM periods');

        const stmtUser = db.prepare(`
            INSERT INTO users (email, password_hash, full_name, role, ra_number)
            VALUES (?, ?, ?, ?, ?)
        `);

        stmtUser.run('superadmin@college.edu', passwordHash, 'Super Admin', 'SUPER_ADMIN', null);
        stmtUser.run('admin@college.edu', passwordHash, 'College Admin', 'ADMIN', null);
        stmtUser.run('clubadmin@college.edu', passwordHash, 'Coding Club Lead', 'CLUB_ADMIN', null);
        stmtUser.run('faculty@college.edu', passwordHash, 'Dr. Smith (Faculty/Mentor)', 'FACULTY', null);
        stmtUser.run('student1@college.edu', passwordHash, 'Rahul Sharma', 'STUDENT', 'RA2026001123456');
        stmtUser.run('student2@college.edu', passwordHash, 'Ananya Patel', 'STUDENT', 'RA2026001123457');
        stmtUser.finalize();

        db.run(`
            INSERT INTO timetable_structures (name, working_days, is_active)
            VALUES ('Regular Day - Odd Semester 2026', 'Mon,Tue,Wed,Thu,Fri', 1)
        `, function (err) {
            if (err) return console.error(err.message);
            const timetableId = this.lastID;

            const stmtPeriod = db.prepare(`
                INSERT INTO periods (timetable_id, period_label, start_time, end_time, period_type)
                VALUES (?, ?, ?, ?, ?)
            `);

            stmtPeriod.run(timetableId, 'Period 1', '08:30', '09:20', 'CLASS');
            stmtPeriod.run(timetableId, 'Period 2', '09:20', '10:10', 'CLASS');
            stmtPeriod.run(timetableId, 'Short Break', '10:10', '10:30', 'SHORT_BREAK');
            stmtPeriod.run(timetableId, 'Period 3', '10:30', '11:20', 'CLASS');
            stmtPeriod.run(timetableId, 'Period 4', '11:20', '12:10', 'CLASS');
            stmtPeriod.run(timetableId, 'Lunch Break', '12:10', '13:00', 'LUNCH_BREAK');
            stmtPeriod.run(timetableId, 'Period 5', '13:00', '13:50', 'CLASS');
            stmtPeriod.finalize();
        });

        db.run(`
            INSERT INTO clubs (name, description, faculty_coordinator_id, club_admin_id, status)
            VALUES ('Coding Club', 'Official Technical & Competitive Programming Club', 4, 3, 'ACTIVE')
        `);

        console.log('Database seeded successfully!');
    });
}

setTimeout(seed, 1000);