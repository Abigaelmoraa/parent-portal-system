const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'ueab_parent_portal',
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

// Create connection pool
const pool = mysql.createPool(dbConfig);

// Test database connection
const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    console.log('✅ Database connected successfully');
    connection.release();
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    process.exit(1);
  }
};

// Initialize database with sample data if needed
const initializeDatabase = async () => {
  try {
    const connection = await pool.getConnection();
    
    // Check if sample data exists
    const [parents] = await connection.execute('SELECT COUNT(*) as count FROM parents');
    const [students] = await connection.execute('SELECT COUNT(*) as count FROM students');
    
    if (parents[0].count === 0 && students[0].count === 0) {
      console.log('📊 Initializing database with sample data...');
      
      // Insert sample parent
      const [parentResult] = await connection.execute(
        'INSERT INTO parents (name, email, password_hash, phone, address) VALUES (?, ?, ?, ?, ?)',
        ['Sarah Johnson', 'sarah.johnson@example.com', '$2a$10$dummy.hash.for.demo', '+254712345678', '123 Kapsabet Road, Eldoret']
      );
      
      // Insert sample students
      const [student1Result] = await connection.execute(
        'INSERT INTO students (admission_number, name, date_of_birth, email, phone, gender, course, grade, class, academic_year, semester, emergency_contact) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        ['UEAB/2024/001', 'Emma Johnson', '2008-05-15', 'emma.johnson@student.ueab.ac.ke', '+254712345679', 'Female', 'Bachelor of Business Administration', '10th Grade', 'Class A', '2024/2025', 'Semester 2', '+254722123456']
      );
      
      const [student2Result] = await connection.execute(
        'INSERT INTO students (admission_number, name, date_of_birth, email, phone, gender, course, grade, class, academic_year, semester, emergency_contact) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        ['UEAB/2024/002', 'Alex Johnson', '2010-03-22', 'alex.johnson@student.ueab.ac.ke', '+254712345680', 'Male', 'Bachelor of Business Administration', '8th Grade', 'Class B', '2024/2025', 'Semester 2', '+254722123456']
      );
      
      // Link parent to students
      await connection.execute(
        'INSERT INTO parent_student (parent_id, student_id, relationship_type, is_primary_guardian) VALUES (?, ?, ?, ?)',
        [parentResult.insertId, student1Result.insertId, 'Parent', true]
      );
      
      await connection.execute(
        'INSERT INTO parent_student (parent_id, student_id, relationship_type, is_primary_guardian) VALUES (?, ?, ?, ?)',
        [parentResult.insertId, student2Result.insertId, 'Parent', true]
      );
      
      console.log('✅ Sample data initialized successfully');
    }
    
    connection.release();
  } catch (error) {
    console.error('❌ Error initializing database:', error.message);
  }
};

module.exports = {
  pool,
  testConnection,
  initializeDatabase
}; 