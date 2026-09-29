PRAGMA foreign_keys = ON;

-- 1. USERS TABLE
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('SUPER_ADMIN', 'ADMIN', 'CLUB_ADMIN', 'FACULTY', 'STUDENT')),
    ra_number TEXT UNIQUE CHECK(
        ra_number IS NULL OR (length(ra_number) = 15 AND ra_number GLOB '[A-Za-z0-9]*')
    ),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. CLUBS TABLE
CREATE TABLE IF NOT EXISTS clubs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    faculty_coordinator_id INTEGER,
    club_admin_id INTEGER,
    status TEXT DEFAULT 'ACTIVE' CHECK(status IN ('ACTIVE', 'INACTIVE', 'ARCHIVED')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (faculty_coordinator_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (club_admin_id) REFERENCES users(id) ON DELETE SET NULL
);

-- 3. DYNAMIC CLUB ROLES & MEMBERSHIPS
CREATE TABLE IF NOT EXISTS club_roles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    club_id INTEGER NOT NULL,
    role_name TEXT NOT NULL,
    can_manage_events INTEGER DEFAULT 0 CHECK(can_manage_events IN (0, 1)),
    can_mark_attendance INTEGER DEFAULT 0 CHECK(can_mark_attendance IN (0, 1)),
    can_issue_certificates INTEGER DEFAULT 0 CHECK(can_issue_certificates IN (0, 1)),
    FOREIGN KEY (club_id) REFERENCES clubs(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS club_memberships (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    club_id INTEGER NOT NULL,
    dynamic_role_id INTEGER,
    joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (club_id) REFERENCES clubs(id) ON DELETE CASCADE,
    FOREIGN KEY (dynamic_role_id) REFERENCES club_roles(id) ON DELETE SET NULL,
    UNIQUE(user_id, club_id)
);

-- 4. TIMETABLE STRUCTURE
CREATE TABLE IF NOT EXISTS timetable_structures (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    working_days TEXT NOT NULL,
    is_active INTEGER DEFAULT 0 CHECK(is_active IN (0, 1)),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS periods (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timetable_id INTEGER NOT NULL,
    period_label TEXT NOT NULL,
    start_time TEXT NOT NULL,
    end_time TEXT NOT NULL,
    period_type TEXT NOT NULL CHECK(period_type IN ('CLASS', 'SHORT_BREAK', 'LUNCH_BREAK')),
    FOREIGN KEY (timetable_id) REFERENCES timetable_structures(id) ON DELETE CASCADE
);

-- 5. EVENTS TABLE
CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    club_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    event_date DATE NOT NULL,
    start_time TEXT NOT NULL,
    end_time TEXT NOT NULL,
    venue TEXT NOT NULL,
    capacity INTEGER NOT NULL CHECK(capacity > 0),
    status TEXT DEFAULT 'PENDING' CHECK(status IN ('DRAFT', 'PENDING', 'APPROVED', 'REJECTED', 'ONGOING', 'COMPLETED', 'CANCELLED')),
    rejection_reason TEXT,
    created_by INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (club_id) REFERENCES clubs(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- 6. EVENT REGISTRATIONS
CREATE TABLE IF NOT EXISTS event_registrations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_id INTEGER NOT NULL,
    student_id INTEGER NOT NULL,
    attended INTEGER DEFAULT 0 CHECK(attended IN (0, 1)),
    registered_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(event_id, student_id)
);

-- 7. ON-DUTY REQUESTS
CREATE TABLE IF NOT EXISTS od_requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_registration_id INTEGER UNIQUE NOT NULL,
    student_id INTEGER NOT NULL,
    class_mentor_id INTEGER NOT NULL,
    affected_periods TEXT NOT NULL,
    status TEXT DEFAULT 'PENDING' CHECK(status IN ('PENDING', 'APPROVED', 'REJECTED')),
    faculty_remark TEXT,
    applied_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (event_registration_id) REFERENCES event_registrations(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES users(id),
    FOREIGN KEY (class_mentor_id) REFERENCES users(id)
);

-- 8. CERTIFICATES & BADGES
CREATE TABLE IF NOT EXISTS certificates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    certificate_code TEXT UNIQUE NOT NULL,
    event_id INTEGER NOT NULL,
    student_id INTEGER NOT NULL,
    participation_role TEXT DEFAULT 'Participant',
    issued_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (event_id) REFERENCES events(id),
    FOREIGN KEY (student_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS badges (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    club_id INTEGER NOT NULL,
    FOREIGN KEY (club_id) REFERENCES clubs(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS user_badges (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER NOT NULL,
    badge_id INTEGER NOT NULL,
    awarded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (badge_id) REFERENCES badges(id) ON DELETE CASCADE
);