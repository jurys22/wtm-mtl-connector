-- Users table
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    display_name TEXT NOT NULL,
    networking_intention TEXT NOT NULL CHECK(networking_intention IN ('Searching for a job', 'Searching for a hire', 'Just chat')),
    industry TEXT NOT NULL,
    tech_skills TEXT NOT NULL, -- JSON array
    soft_skills TEXT NOT NULL, -- JSON array
    reset_token TEXT,
    reset_token_expiry DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_networking_intention ON users(networking_intention);
CREATE INDEX idx_users_industry ON users(industry);
CREATE INDEX idx_users_reset_token ON users(reset_token);

-- Conference sessions table
CREATE TABLE IF NOT EXISTS sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    start_time DATETIME NOT NULL,
    end_time DATETIME NOT NULL,
    location TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_sessions_time ON sessions(start_time, end_time);

-- User session attendance (junction table)
CREATE TABLE IF NOT EXISTS user_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    session_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE,
    UNIQUE(user_id, session_id)
);

CREATE INDEX idx_user_sessions_user ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_session ON user_sessions(session_id);

-- Meeting requests table
CREATE TABLE IF NOT EXISTS meeting_requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    requester_id INTEGER NOT NULL,
    recipient_id INTEGER NOT NULL,
    proposed_time DATETIME NOT NULL,
    proposed_place TEXT NOT NULL CHECK(proposed_place IN ('Main corridor', 'Garden')),
    note TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'accepted', 'declined', 'cancelled', 'unconfirmed')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (requester_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (recipient_id) REFERENCES users(id) ON DELETE CASCADE,
    CHECK(requester_id != recipient_id)
);

CREATE INDEX idx_meeting_requests_requester ON meeting_requests(requester_id);
CREATE INDEX idx_meeting_requests_recipient ON meeting_requests(recipient_id);
CREATE INDEX idx_meeting_requests_status ON meeting_requests(status);

-- Trigger to update updated_at timestamp on users
CREATE TRIGGER IF NOT EXISTS update_users_timestamp
AFTER UPDATE ON users
BEGIN
    UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- Trigger to update updated_at timestamp on meeting_requests
CREATE TRIGGER IF NOT EXISTS update_meeting_requests_timestamp
AFTER UPDATE ON meeting_requests
BEGIN
    UPDATE meeting_requests SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;
