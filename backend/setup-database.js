const mysql = require('mysql2/promise');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  port: process.env.DB_PORT || 3306
};

async function setupDatabase() {
  let connection;
  
  try {
    console.log('🔧 Setting up UEAB Parent Portal Database...');
    
    // Connect to MySQL server (without specifying database)
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to MySQL server');

    // Create database if it doesn't exist
    const dbName = process.env.DB_NAME || 'ueab_parent_portal';
    await connection.execute(`CREATE DATABASE IF NOT EXISTS ${dbName}`);
    console.log(`✅ Database '${dbName}' created/verified`);

    // Close connection and reconnect with database specified
    await connection.end();
    
    // Reconnect with database specified
    const dbConfigWithDB = {
      ...dbConfig,
      database: dbName
    };
    connection = await mysql.createConnection(dbConfigWithDB);
    console.log(`✅ Connected to database '${dbName}'`);

    // Read and execute schema file
    const schemaPath = path.join(__dirname, 'database', 'schema.sql');
    const schemaContent = await fs.readFile(schemaPath, 'utf8');
    
    // Split the schema into individual statements and filter out USE and CREATE DATABASE
    const statements = schemaContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => 
        stmt.length > 0 && 
        !stmt.startsWith('--') && 
        !stmt.toUpperCase().startsWith('USE') &&
        !stmt.toUpperCase().startsWith('CREATE DATABASE')
      );

    console.log('📊 Creating tables...');
    
    // First, create all tables
    for (const statement of statements) {
      if (statement.trim() && statement.toUpperCase().startsWith('CREATE TABLE')) {
        try {
          console.log(`Creating table: ${statement.split('(')[0].replace('CREATE TABLE', '').trim()}`);
          await connection.execute(statement);
        } catch (error) {
          if (!error.message.includes('already exists')) {
            console.warn(`⚠️  Warning: ${error.message}`);
          }
        }
      }
    }

    console.log('📊 Inserting sample data...');
    
    // Then, insert data
    for (const statement of statements) {
      if (statement.trim() && statement.toUpperCase().startsWith('INSERT INTO')) {
        try {
          console.log(`Inserting data: ${statement.split('(')[0].replace('INSERT INTO', '').trim()}`);
          await connection.execute(statement);
        } catch (error) {
          if (!error.message.includes('already exists')) {
            console.warn(`⚠️  Warning: ${error.message}`);
          }
        }
      }
    }

    console.log('📊 Creating indexes...');
    
    // Finally, create indexes
    for (const statement of statements) {
      if (statement.trim() && statement.toUpperCase().startsWith('CREATE INDEX')) {
        try {
          console.log(`Creating index: ${statement.split('ON')[1].trim()}`);
          await connection.execute(statement);
        } catch (error) {
          if (!error.message.includes('already exists')) {
            console.warn(`⚠️  Warning: ${error.message}`);
          }
        }
      }
    }

    console.log('✅ Database setup completed successfully!');
    console.log('\n📋 Database Summary:');
    console.log('   - Database: ueab_parent_portal');
    console.log('   - Tables: parents, students, parent_student, subjects, academic_results, attendance, fee_structure, fee_payments, notifications, password_reset_tokens');
    console.log('   - Sample data: 10 subjects, fee structure');
    
    console.log('\n🚀 You can now start the server with: npm run dev');

  } catch (error) {
    console.error('❌ Database setup failed:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Run the setup
setupDatabase(); 