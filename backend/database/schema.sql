-- UEAB Parent Portal Database Schema
-- University of Eastern Africa, Baraton

CREATE DATABASE IF NOT EXISTS ueab_parent_portal;
USE ueab_parent_portal;

-- Parents/Guardians table
CREATE TABLE parents (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    address TEXT,
    relationship VARCHAR(50) DEFAULT 'Parent',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Students table
CREATE TABLE students (
    id INT PRIMARY KEY AUTO_INCREMENT,
    admission_number VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    date_of_birth DATE NOT NULL,
    email VARCHAR(255) UNIQUE,
    phone VARCHAR(20),
    address TEXT,
    gender ENUM('Male', 'Female', 'Other') NOT NULL,
    course VARCHAR(255) NOT NULL,
    grade VARCHAR(50) NOT NULL,
    class VARCHAR(50) NOT NULL,
    academic_year VARCHAR(20) NOT NULL,
    semester VARCHAR(20) NOT NULL,
    emergency_contact VARCHAR(20),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Parent-Student relationship table
CREATE TABLE parent_student (
    id INT PRIMARY KEY AUTO_INCREMENT,
    parent_id INT NOT NULL,
    student_id INT NOT NULL,
    relationship_type VARCHAR(50) DEFAULT 'Parent',
    is_primary_guardian BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (parent_id) REFERENCES parents(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    UNIQUE KEY unique_parent_student (parent_id, student_id)
);

-- Subjects table
CREATE TABLE subjects (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(20) UNIQUE NOT NULL,
    description TEXT,
    credits INT DEFAULT 3,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Academic results table
CREATE TABLE academic_results (
    id INT PRIMARY KEY AUTO_INCREMENT,
    student_id INT NOT NULL,
    subject_id INT NOT NULL,
    assessment_type ENUM('CAT', 'Assignment', 'Presentation', 'Quiz', 'Final Exam', 'Project') NOT NULL,
    score DECIMAL(5,2) NOT NULL,
    max_score DECIMAL(5,2) DEFAULT 100.00,
    grade VARCHAR(5),
    semester VARCHAR(20) NOT NULL,
    academic_year VARCHAR(20) NOT NULL,
    assessment_date DATE NOT NULL,
    remarks TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE
);

-- Attendance table
CREATE TABLE attendance (
    id INT PRIMARY KEY AUTO_INCREMENT,
    student_id INT NOT NULL,
    subject_id INT NOT NULL,
    date DATE NOT NULL,
    status ENUM('Present', 'Absent', 'Late', 'Excused') NOT NULL,
    time_in TIME,
    time_out TIME,
    remarks TEXT,
    recorded_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
    UNIQUE KEY unique_attendance (student_id, subject_id, date)
);

-- Fee structure table
CREATE TABLE fee_structure (
    id INT PRIMARY KEY AUTO_INCREMENT,
    fee_type VARCHAR(100) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    semester VARCHAR(20) NOT NULL,
    academic_year VARCHAR(20) NOT NULL,
    due_date DATE NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Fee payments table
CREATE TABLE fee_payments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    student_id INT NOT NULL,
    fee_structure_id INT NOT NULL,
    transaction_id VARCHAR(100) UNIQUE NOT NULL,
    amount_paid DECIMAL(10,2) NOT NULL,
    payment_date DATE NOT NULL,
    payment_method ENUM('Bank Transfer', 'Mobile Money', 'Cash', 'Check', 'Online') NOT NULL,
    status ENUM('Paid', 'Pending', 'Failed', 'Refunded') DEFAULT 'Pending',
    receipt_number VARCHAR(100),
    remarks TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (fee_structure_id) REFERENCES fee_structure(id) ON DELETE CASCADE
);

-- Notifications table
CREATE TABLE notifications (
    id INT PRIMARY KEY AUTO_INCREMENT,
    parent_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type ENUM('Academic', 'Financial', 'Attendance', 'General') NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (parent_id) REFERENCES parents(id) ON DELETE CASCADE
);

-- Password reset tokens table
CREATE TABLE password_reset_tokens (
    id INT PRIMARY KEY AUTO_INCREMENT,
    email VARCHAR(255) NOT NULL,
    token VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert sample data

-- Sample subjects
INSERT INTO subjects (name, code, description, credits) VALUES
('Mathematics', 'MATH101', 'Basic Mathematics for Business', 3),
('Business Statistics', 'STAT201', 'Statistical Methods in Business', 3),
('Financial Accounting', 'ACCT101', 'Principles of Financial Accounting', 3),
('Business Communication', 'COMM101', 'Effective Business Communication', 3),
('Economics', 'ECON101', 'Principles of Economics', 3),
('History', 'HIST101', 'World History', 3),
('Geography', 'GEOG101', 'Physical Geography', 3),
('Art', 'ART101', 'Introduction to Art', 3),
('Science', 'SCI101', 'General Science', 3),
('English', 'ENG101', 'English Composition', 3);

-- Sample fee structure
INSERT INTO fee_structure (fee_type, amount, semester, academic_year, due_date, description) VALUES
('Tuition Fee - Semester 1', 85000.00, 'Semester 1', '2024/2025', '2024-01-15', 'Tuition fees for first semester'),
('Accommodation Fee - Semester 1', 35000.00, 'Semester 1', '2024/2025', '2024-01-15', 'Accommodation fees for first semester'),
('Library & Lab Fee', 12000.00, 'Semester 1', '2024/2025', '2024-01-15', 'Library and laboratory facilities fee'),
('Registration & Activity Fee', 8000.00, 'Semester 1', '2024/2025', '2024-01-15', 'Registration and student activity fees'),
('Tuition Fee - Semester 2', 85000.00, 'Semester 2', '2024/2025', '2024-03-15', 'Tuition fees for second semester'),
('Accommodation Fee - Semester 2', 35000.00, 'Semester 2', '2024/2025', '2024-03-15', 'Accommodation fees for second semester');

-- Create indexes for better performance
CREATE INDEX idx_student_academic_year ON students(academic_year, semester);
CREATE INDEX idx_results_student_semester ON academic_results(student_id, semester, academic_year);
CREATE INDEX idx_attendance_student_date ON attendance(student_id, date);
CREATE INDEX idx_payments_student_status ON fee_payments(student_id, status);
CREATE INDEX idx_notifications_parent_read ON notifications(parent_id, is_read); 