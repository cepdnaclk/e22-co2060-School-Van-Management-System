CREATE TABLE IF NOT EXISTS student_absences (
    id SERIAL PRIMARY KEY,
    student_id INTEGER NOT NULL REFERENCES students(id),
    absence_date DATE NOT NULL,
    session_type VARCHAR(20) NOT NULL DEFAULT 'both' CHECK (session_type IN ('morning', 'afternoon', 'both')),
    reason VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (student_id, absence_date)
);

ALTER TABLE student_absences ADD COLUMN IF NOT EXISTS session_type VARCHAR(20) NOT NULL DEFAULT 'both' CHECK (session_type IN ('morning', 'afternoon', 'both'));

