const mysql = require('mysql2/promise');
require('dotenv').config();

async function setupAdmin() {
  let connection;
  
  try {
    // Create connection
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'ueab_parent_portal'
    });

    console.log('Connected to database');

    // Add role column to parents table if it doesn't exist
    try {
      await connection.execute(`
        ALTER TABLE parents 
        ADD COLUMN role ENUM('admin', 'parent') DEFAULT 'parent' 
        AFTER relationship
      `);
      console.log('✅ Added role column to parents table');
    } catch (error) {
      if (error.code === 'ER_DUP_FIELDNAME') {
        console.log('✅ Role column already exists');
      } else {
        throw error;
      }
    }

    // Check if admin user already exists
    const [existingAdmin] = await connection.execute(
      'SELECT id FROM parents WHERE email = ?',
      ['admin@ueab.ac.ke']
    );

    if (existingAdmin.length > 0) {
      console.log('✅ Admin user already exists');
      return;
    }

    // Create admin user
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    await connection.execute(`
      INSERT INTO parents (name, email, password_hash, phone, role) 
      VALUES (?, ?, ?, ?, ?)
    `, ['Admin User', 'admin@ueab.ac.ke', hashedPassword, '+254700000000', 'admin']);

    console.log('✅ Admin user created successfully');
    console.log('📧 Email: admin@ueab.ac.ke');
    console.log('🔑 Password: admin123');
    console.log('⚠️  Please change the password after first login!');

  } catch (error) {
    console.error('❌ Error setting up admin:', error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

setupAdmin(); 