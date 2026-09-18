CREATE TABLE IF NOT EXISTS payment_settings (
    id SERIAL PRIMARY KEY,
    driver_id INTEGER NOT NULL UNIQUE,
    mode VARCHAR(20) NOT NULL DEFAULT 'fixed' CHECK (mode IN ('fixed', 'dynamic')),
    fixed_amount DECIMAL(10, 2) DEFAULT 0,
    base_charge DECIMAL(10, 2) DEFAULT 0,
    charge_per_km DECIMAL(10, 2) DEFAULT 0,
    due_date_day INTEGER DEFAULT 5,
    auto_generate_day INTEGER DEFAULT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_payment_settings_driver
        FOREIGN KEY (driver_id)
        REFERENCES drivers(id)
        ON DELETE CASCADE
);

-- Ensure auto_generate_day column exists in case the table was created in an older migration
ALTER TABLE payment_settings ADD COLUMN IF NOT EXISTS auto_generate_day INTEGER DEFAULT NULL;

CREATE TABLE IF NOT EXISTS payments (
    id SERIAL PRIMARY KEY,
    student_id INTEGER NOT NULL,
    driver_id INTEGER NOT NULL,
    month VARCHAR(20) NOT NULL, -- e.g. "2026-07"
    amount_due DECIMAL(10, 2) NOT NULL,
    amount_paid DECIMAL(10, 2) DEFAULT 0,
    due_date DATE NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'pending' 
        CHECK (status IN ('pending', 'paid', 'overdue', 'receipt_submitted', 'rejected')),
    receipt_url TEXT,
    receipt_ref VARCHAR(100),
    reject_reason TEXT,
    approved_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_payments_student
        FOREIGN KEY (student_id)
        REFERENCES students(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_payments_driver
        FOREIGN KEY (driver_id)
        REFERENCES drivers(id)
        ON DELETE CASCADE
);

ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_student_id_month_key;

CREATE UNIQUE INDEX IF NOT EXISTS idx_payments_student_driver_month
ON payments (student_id, driver_id, month);
