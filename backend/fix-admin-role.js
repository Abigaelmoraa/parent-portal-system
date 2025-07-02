const mysql = require('mysql2/promise');
require('dotenv').config();

async function fixAdminRole() {
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

    // Check current admin user
    const [adminUser] = await connection.execute(
      'SELECT id, name, email, role FROM parents WHERE email = ?',
      ['admin@ueab.ac.ke']
    );

    if (adminUser.length === 0) {
      console.log('❌ Admin user not found');
      return;
    }

    console.log('Current admin user:', adminUser[0]);

    // Update admin user role
    await connection.execute(
      'UPDATE parents SET role = ? WHERE email = ?',
      ['admin', 'admin@ueab.ac.ke']
    );

    console.log('✅ Admin user role updated to "admin"');

    // Verify the update
    const [updatedAdmin] = await connection.execute(
      'SELECT id, name, email, role FROM parents WHERE email = ?',
      ['admin@ueab.ac.ke']
    );

    console.log('Updated admin user:', updatedAdmin[0]);

  } catch (error) {
    console.error('❌ Error fixing admin role:', error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

fixAdminRole(); 