const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');

// Middleware to verify JWT token
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ 
      success: false, 
      message: 'Access token required' 
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get user from database to ensure they still exist and are active
    const [users] = await pool.execute(
      'SELECT id, name, email, phone, address, relationship, role, is_active FROM parents WHERE id = ? AND is_active = TRUE',
      [decoded.userId]
    );

    if (users.length === 0) {
      return res.status(401).json({ 
        success: false, 
        message: 'User not found or inactive' 
      });
    }

    req.user = users[0];
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false, 
        message: 'Token expired' 
      });
    }
    return res.status(403).json({ 
      success: false, 
      message: 'Invalid token' 
    });
  }
};

// Middleware to check if user has access to specific student
const checkStudentAccess = async (req, res, next) => {
  const { studentId } = req.params;
  const parentId = req.user.id;

  try {
    const [relationships] = await pool.execute(
      'SELECT * FROM parent_student WHERE parent_id = ? AND student_id = ?',
      [parentId, studentId]
    );

    if (relationships.length === 0) {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied to this student' 
      });
    }

    next();
  } catch (error) {
    console.error('Error checking student access:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
};

// Optional authentication middleware (for public endpoints)
const optionalAuth = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    req.user = null;
    return next();
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const [users] = await pool.execute(
      'SELECT id, name, email, phone, address, relationship, role, is_active FROM parents WHERE id = ? AND is_active = TRUE',
      [decoded.userId]
    );

    if (users.length > 0) {
      req.user = users[0];
    }
    next();
  } catch (error) {
    req.user = null;
    next();
  }
};

module.exports = {
  authenticateToken,
  checkStudentAccess,
  optionalAuth
}; 