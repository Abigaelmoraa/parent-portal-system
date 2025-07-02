const express = require('express');
const { pool } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { validateStudentUpdate, validatePagination } = require('../middleware/validation');

const router = express.Router();

// Middleware to check if user is admin
const checkAdminAccess = async (req, res, next) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }
    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// GET /api/admin/students - Get all students (admin only)
router.get('/students', authenticateToken, checkAdminAccess, validatePagination, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const search = req.query.search || '';
    const grade = req.query.grade || '';
    const course = req.query.course || '';

    let whereClause = 'WHERE s.is_active = TRUE';
    let params = [];

    if (search) {
      whereClause += ' AND (s.name LIKE ? OR s.admission_number LIKE ? OR s.email LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (grade) {
      whereClause += ' AND s.grade = ?';
      params.push(grade);
    }

    if (course) {
      whereClause += ' AND s.course = ?';
      params.push(course);
    }

    // Get students with detailed information
    const [students] = await pool.execute(
      `SELECT s.*, 
              GROUP_CONCAT(DISTINCT CONCAT(p.name, ' (', ps.relationship_type, ')') SEPARATOR ', ') as parents
       FROM students s
       LEFT JOIN parent_student ps ON s.id = ps.student_id
       LEFT JOIN parents p ON ps.parent_id = p.id
       ${whereClause}
       GROUP BY s.id
       ORDER BY s.name
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    // Get total count
    const [countResult] = await pool.execute(
      `SELECT COUNT(DISTINCT s.id) as total
       FROM students s
       LEFT JOIN parent_student ps ON s.id = ps.student_id
       LEFT JOIN parents p ON ps.parent_id = p.id
       ${whereClause}`,
      params
    );

    const total = countResult[0].total;
    const totalPages = Math.ceil(total / limit);

    // Add additional details for each student
    const studentsWithDetails = await Promise.all(
      students.map(async (student) => {
        // Get academic performance
        const [academicStats] = await pool.execute(
          `SELECT 
            COUNT(DISTINCT ar.subject_id) as total_subjects,
            AVG(ar.score) as average_score,
            COUNT(*) as total_assessments
           FROM academic_results ar
           WHERE ar.student_id = ? AND ar.semester = ? AND ar.academic_year = ?`,
          [student.id, student.semester, student.academic_year]
        );

        // Get attendance stats
        const [attendanceStats] = await pool.execute(
          `SELECT 
            COUNT(*) as total_days,
            SUM(CASE WHEN status = 'Present' THEN 1 ELSE 0 END) as present_days,
            SUM(CASE WHEN status = 'Absent' THEN 1 ELSE 0 END) as absent_days,
            SUM(CASE WHEN status = 'Late' THEN 1 ELSE 0 END) as late_days
           FROM attendance
           WHERE student_id = ? AND date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)`,
          [student.id]
        );

        // Get fee status
        const [feeStats] = await pool.execute(
          `SELECT 
            COALESCE(SUM(fs.amount), 0) as total_fees,
            COALESCE(SUM(COALESCE(fp.amount_paid, 0)), 0) as paid_fees
           FROM fee_structure fs
           LEFT JOIN fee_payments fp ON fs.id = fp.fee_structure_id AND fp.status = 'Paid'
           WHERE fs.semester = ? AND fs.academic_year = ?`,
          [student.semester, student.academic_year]
        );

        const attendanceRate = attendanceStats[0]?.total_days > 0 
          ? Math.round((attendanceStats[0].present_days / attendanceStats[0].total_days) * 100)
          : 0;

        const outstandingFees = (feeStats[0]?.total_fees || 0) - (feeStats[0]?.paid_fees || 0);

        return {
          ...student,
          academicStats: {
            totalSubjects: academicStats[0]?.total_subjects || 0,
            averageScore: Math.round(academicStats[0]?.average_score || 0),
            totalAssessments: academicStats[0]?.total_assessments || 0
          },
          attendanceStats: {
            totalDays: attendanceStats[0]?.total_days || 0,
            presentDays: attendanceStats[0]?.present_days || 0,
            absentDays: attendanceStats[0]?.absent_days || 0,
            lateDays: attendanceStats[0]?.late_days || 0,
            attendanceRate
          },
          feeStats: {
            totalFees: feeStats[0]?.total_fees || 0,
            paidFees: feeStats[0]?.paid_fees || 0,
            outstandingFees
          }
        };
      })
    );

    res.json({
      success: true,
      data: {
        students: studentsWithDetails,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      }
    });
  } catch (error) {
    console.error('Get students error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// GET /api/admin/students/:studentId - Get specific student details (admin only)
router.get('/students/:studentId', authenticateToken, checkAdminAccess, async (req, res) => {
  try {
    const { studentId } = req.params;

    // Get student details
    const [students] = await pool.execute(
      `SELECT s.*
       FROM students s
       WHERE s.id = ? AND s.is_active = TRUE`,
      [studentId]
    );

    if (students.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    const student = students[0];

    // Get parent information
    const [parents] = await pool.execute(
      `SELECT p.*, ps.relationship_type, ps.is_primary_guardian
       FROM parents p
       JOIN parent_student ps ON p.id = ps.parent_id
       WHERE ps.student_id = ?`,
      [studentId]
    );

    // Get academic performance summary
    const [academicSummary] = await pool.execute(
      `SELECT 
        COUNT(DISTINCT ar.subject_id) as total_subjects,
        AVG(ar.score) as average_score,
        COUNT(*) as total_assessments,
        MAX(ar.assessment_date) as last_assessment
       FROM academic_results ar
       WHERE ar.student_id = ? AND ar.semester = ? AND ar.academic_year = ?`,
      [studentId, student.semester, student.academic_year]
    );

    // Get recent academic results
    const [recentResults] = await pool.execute(
      `SELECT ar.*, s.name as subject_name, s.code as subject_code
       FROM academic_results ar
       JOIN subjects s ON ar.subject_id = s.id
       WHERE ar.student_id = ?
       ORDER BY ar.assessment_date DESC
       LIMIT 10`,
      [studentId]
    );

    // Get attendance summary
    const [attendanceSummary] = await pool.execute(
      `SELECT 
        COUNT(*) as total_days,
        SUM(CASE WHEN status = 'Present' THEN 1 ELSE 0 END) as present_days,
        SUM(CASE WHEN status = 'Absent' THEN 1 ELSE 0 END) as absent_days,
        SUM(CASE WHEN status = 'Late' THEN 1 ELSE 0 END) as late_days
       FROM attendance
       WHERE student_id = ? AND date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)`,
      [studentId]
    );

    // Get fee summary
    const [feeSummary] = await pool.execute(
      `SELECT 
        COALESCE(SUM(fs.amount), 0) as total_fees,
        COALESCE(SUM(COALESCE(fp.amount_paid, 0)), 0) as paid_fees,
        COUNT(DISTINCT fs.id) as total_fee_items,
        COUNT(DISTINCT CASE WHEN fp.status = 'Paid' THEN fp.id END) as paid_items
       FROM fee_structure fs
       LEFT JOIN fee_payments fp ON fs.id = fp.fee_structure_id
       WHERE fs.semester = ? AND fs.academic_year = ?`,
      [student.semester, student.academic_year]
    );

    const attendanceRate = attendanceSummary[0]?.total_days > 0 
      ? Math.round((attendanceSummary[0].present_days / attendanceSummary[0].total_days) * 100)
      : 0;

    const outstandingFees = (feeSummary[0]?.total_fees || 0) - (feeSummary[0]?.paid_fees || 0);

    res.json({
      success: true,
      data: {
        student: {
          ...student,
          parents,
          academicSummary: {
            totalSubjects: academicSummary[0]?.total_subjects || 0,
            averageScore: Math.round(academicSummary[0]?.average_score || 0),
            totalAssessments: academicSummary[0]?.total_assessments || 0,
            lastAssessment: academicSummary[0]?.last_assessment
          },
          attendanceSummary: {
            totalDays: attendanceSummary[0]?.total_days || 0,
            presentDays: attendanceSummary[0]?.present_days || 0,
            absentDays: attendanceSummary[0]?.absent_days || 0,
            lateDays: attendanceSummary[0]?.late_days || 0,
            attendanceRate
          },
          feeSummary: {
            totalFees: feeSummary[0]?.total_fees || 0,
            paidFees: feeSummary[0]?.paid_fees || 0,
            outstandingFees,
            totalItems: feeSummary[0]?.total_fee_items || 0,
            paidItems: feeSummary[0]?.paid_items || 0
          },
          recentResults
        }
      }
    });
  } catch (error) {
    console.error('Get student error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// POST /api/admin/students - Create new student (admin only)
router.post('/students', authenticateToken, checkAdminAccess, async (req, res) => {
  try {
    const {
      admission_number,
      name,
      date_of_birth,
      email,
      phone,
      address,
      gender,
      course,
      grade,
      class: className,
      academic_year,
      semester,
      emergency_contact
    } = req.body;

    // Validate required fields
    if (!admission_number || !name || !date_of_birth || !gender || !course || !grade || !className || !academic_year || !semester) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    // Check if admission number already exists
    const [existingStudent] = await pool.execute(
      'SELECT id FROM students WHERE admission_number = ?',
      [admission_number]
    );

    if (existingStudent.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Admission number already exists'
      });
    }

    // Insert new student
    const [result] = await pool.execute(
      `INSERT INTO students (
        admission_number, name, date_of_birth, email, phone, address,
        gender, course, grade, class, academic_year, semester, emergency_contact
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [admission_number, name, date_of_birth, email, phone, address, gender, course, grade, className, academic_year, semester, emergency_contact]
    );

    const studentId = result.insertId;

    // Get the created student
    const [newStudent] = await pool.execute(
      'SELECT * FROM students WHERE id = ?',
      [studentId]
    );

    res.status(201).json({
      success: true,
      message: 'Student created successfully',
      data: newStudent[0]
    });
  } catch (error) {
    console.error('Create student error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// PUT /api/admin/students/:studentId - Update student (admin only)
router.put('/students/:studentId', authenticateToken, checkAdminAccess, async (req, res) => {
  try {
    const { studentId } = req.params;
    const {
      admission_number,
      name,
      date_of_birth,
      email,
      phone,
      address,
      gender,
      course,
      grade,
      class: className,
      academic_year,
      semester,
      emergency_contact,
      is_active
    } = req.body;

    // Check if student exists
    const [existingStudent] = await pool.execute(
      'SELECT id FROM students WHERE id = ?',
      [studentId]
    );

    if (existingStudent.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // Check if admission number already exists for another student
    if (admission_number) {
      const [duplicateAdmission] = await pool.execute(
        'SELECT id FROM students WHERE admission_number = ? AND id != ?',
        [admission_number, studentId]
      );

      if (duplicateAdmission.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Admission number already exists'
        });
      }
    }

    // Update student
    const updateFields = [];
    const updateValues = [];

    if (admission_number !== undefined) {
      updateFields.push('admission_number = ?');
      updateValues.push(admission_number);
    }
    if (name !== undefined) {
      updateFields.push('name = ?');
      updateValues.push(name);
    }
    if (date_of_birth !== undefined) {
      updateFields.push('date_of_birth = ?');
      updateValues.push(date_of_birth);
    }
    if (email !== undefined) {
      updateFields.push('email = ?');
      updateValues.push(email);
    }
    if (phone !== undefined) {
      updateFields.push('phone = ?');
      updateValues.push(phone);
    }
    if (address !== undefined) {
      updateFields.push('address = ?');
      updateValues.push(address);
    }
    if (gender !== undefined) {
      updateFields.push('gender = ?');
      updateValues.push(gender);
    }
    if (course !== undefined) {
      updateFields.push('course = ?');
      updateValues.push(course);
    }
    if (grade !== undefined) {
      updateFields.push('grade = ?');
      updateValues.push(grade);
    }
    if (className !== undefined) {
      updateFields.push('class = ?');
      updateValues.push(className);
    }
    if (academic_year !== undefined) {
      updateFields.push('academic_year = ?');
      updateValues.push(academic_year);
    }
    if (semester !== undefined) {
      updateFields.push('semester = ?');
      updateValues.push(semester);
    }
    if (emergency_contact !== undefined) {
      updateFields.push('emergency_contact = ?');
      updateValues.push(emergency_contact);
    }
    if (is_active !== undefined) {
      updateFields.push('is_active = ?');
      updateValues.push(is_active);
    }

    updateFields.push('updated_at = NOW()');
    updateValues.push(studentId);

    await pool.execute(
      `UPDATE students SET ${updateFields.join(', ')} WHERE id = ?`,
      updateValues
    );

    // Get updated student
    const [updatedStudent] = await pool.execute(
      'SELECT * FROM students WHERE id = ?',
      [studentId]
    );

    res.json({
      success: true,
      message: 'Student updated successfully',
      data: updatedStudent[0]
    });
  } catch (error) {
    console.error('Update student error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// DELETE /api/admin/students/:studentId - Delete student (admin only)
router.delete('/students/:studentId', authenticateToken, checkAdminAccess, async (req, res) => {
  try {
    const { studentId } = req.params;

    // Check if student exists
    const [existingStudent] = await pool.execute(
      'SELECT id FROM students WHERE id = ?',
      [studentId]
    );

    if (existingStudent.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // Soft delete by setting is_active to false
    await pool.execute(
      'UPDATE students SET is_active = FALSE, updated_at = NOW() WHERE id = ?',
      [studentId]
    );

    res.json({
      success: true,
      message: 'Student deleted successfully'
    });
  } catch (error) {
    console.error('Delete student error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// GET /api/admin/dashboard - Admin dashboard statistics
router.get('/dashboard', authenticateToken, checkAdminAccess, async (req, res) => {
  try {
    // Get total students
    const [totalStudents] = await pool.execute(
      'SELECT COUNT(*) as total FROM students WHERE is_active = TRUE'
    );

    // Get students by grade
    const [studentsByGrade] = await pool.execute(
      `SELECT grade, COUNT(*) as count 
       FROM students 
       WHERE is_active = TRUE 
       GROUP BY grade 
       ORDER BY grade`
    );

    // Get students by course
    const [studentsByCourse] = await pool.execute(
      `SELECT course, COUNT(*) as count 
       FROM students 
       WHERE is_active = TRUE 
       GROUP BY course 
       ORDER BY course`
    );

    // Get recent admissions (last 30 days)
    const [recentAdmissions] = await pool.execute(
      `SELECT name, admission_number, grade, course, created_at
       FROM students 
       WHERE is_active = TRUE AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
       ORDER BY created_at DESC
       LIMIT 10`
    );

    // Get attendance overview
    const [attendanceOverview] = await pool.execute(
      `SELECT 
        COUNT(*) as total_records,
        SUM(CASE WHEN status = 'Present' THEN 1 ELSE 0 END) as present_count,
        SUM(CASE WHEN status = 'Absent' THEN 1 ELSE 0 END) as absent_count,
        SUM(CASE WHEN status = 'Late' THEN 1 ELSE 0 END) as late_count
       FROM attendance 
       WHERE date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)`
    );

    // Get fee collection overview
    const [feeOverview] = await pool.execute(
      `SELECT 
        COALESCE(SUM(fs.amount), 0) as total_fees,
        COALESCE(SUM(COALESCE(fp.amount_paid, 0)), 0) as collected_fees,
        COUNT(DISTINCT s.id) as total_students,
        COUNT(DISTINCT CASE WHEN fp.status = 'Paid' THEN s.id END) as students_with_payments
       FROM students s
       LEFT JOIN fee_structure fs ON fs.semester = s.semester AND fs.academic_year = s.academic_year
       LEFT JOIN fee_payments fp ON fs.id = fp.fee_structure_id AND fp.status = 'Paid'
       WHERE s.is_active = TRUE`
    );

    const attendanceRate = attendanceOverview[0]?.total_records > 0 
      ? Math.round((attendanceOverview[0].present_count / attendanceOverview[0].total_records) * 100)
      : 0;

    const feeCollectionRate = feeOverview[0]?.total_fees > 0 
      ? Math.round((feeOverview[0].collected_fees / feeOverview[0].total_fees) * 100)
      : 0;

    res.json({
      success: true,
      data: {
        totalStudents: totalStudents[0].total,
        studentsByGrade,
        studentsByCourse,
        recentAdmissions,
        attendanceOverview: {
          ...attendanceOverview[0],
          attendanceRate
        },
        feeOverview: {
          ...feeOverview[0],
          feeCollectionRate
        }
      }
    });
  } catch (error) {
    console.error('Admin dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// GET /api/admin/statistics - Get detailed statistics
router.get('/statistics', authenticateToken, checkAdminAccess, async (req, res) => {
  try {
    const { period = 'month' } = req.query;
    
    let dateFilter = '';
    if (period === 'week') {
      dateFilter = 'AND date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)';
    } else if (period === 'month') {
      dateFilter = 'AND date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)';
    } else if (period === 'year') {
      dateFilter = 'AND date >= DATE_SUB(CURDATE(), INTERVAL 1 YEAR)';
    }

    // Academic performance statistics
    const [academicStats] = await pool.execute(
      `SELECT 
        AVG(score) as average_score,
        MIN(score) as min_score,
        MAX(score) as max_score,
        COUNT(*) as total_assessments,
        COUNT(DISTINCT student_id) as students_with_results
       FROM academic_results ar
       WHERE 1=1 ${dateFilter}`
    );

    // Attendance statistics
    const [attendanceStats] = await pool.execute(
      `SELECT 
        COUNT(*) as total_days,
        SUM(CASE WHEN status = 'Present' THEN 1 ELSE 0 END) as present_days,
        SUM(CASE WHEN status = 'Absent' THEN 1 ELSE 0 END) as absent_days,
        SUM(CASE WHEN status = 'Late' THEN 1 ELSE 0 END) as late_days,
        COUNT(DISTINCT student_id) as students_tracked
       FROM attendance
       WHERE 1=1 ${dateFilter}`
    );

    // Fee statistics
    const [feeStats] = await pool.execute(
      `SELECT 
        COALESCE(SUM(fs.amount), 0) as total_fees,
        COALESCE(SUM(COALESCE(fp.amount_paid, 0)), 0) as collected_fees,
        COUNT(DISTINCT fp.id) as total_payments,
        COUNT(DISTINCT fp.student_id) as students_with_payments
       FROM fee_structure fs
       LEFT JOIN fee_payments fp ON fs.id = fp.fee_structure_id AND fp.status = 'Paid'
       WHERE 1=1 ${dateFilter}`
    );

    res.json({
      success: true,
      data: {
        period,
        academic: academicStats[0],
        attendance: attendanceStats[0],
        fees: feeStats[0]
      }
    });
  } catch (error) {
    console.error('Statistics error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// --- ADMIN RESULTS MANAGEMENT ---

// GET /api/admin/results - List all results (with optional filters)
router.get('/results', authenticateToken, checkAdminAccess, async (req, res) => {
  try {
    const { search = '', studentId } = req.query;
    let where = 'WHERE 1=1';
    const params = [];
    if (studentId) {
      where += ' AND ar.student_id = ?';
      params.push(studentId);
    }
    if (search) {
      where += ' AND (s.name LIKE ? OR ar.subject_name LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }
    const [results] = await pool.execute(
      `SELECT ar.*, s.name as student_name
       FROM academic_results ar
       JOIN students s ON ar.student_id = s.id
       ${where}
       ORDER BY ar.assessment_date DESC, ar.id DESC
       LIMIT 200`,
      params
    );
    res.json({ success: true, data: { results } });
  } catch (error) {
    console.error('Admin get results error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// --- ADMIN ATTENDANCE MANAGEMENT ---

// GET /api/admin/attendance - List all attendance records (with optional filters)
router.get('/attendance', authenticateToken, checkAdminAccess, async (req, res) => {
  try {
    const { search = '', studentId, date, status, startDate, endDate } = req.query;
    let where = 'WHERE 1=1';
    const params = [];

    if (studentId) {
      where += ' AND a.student_id = ?';
      params.push(studentId);
    }
    if (search) {
      where += ' AND s.name LIKE ?';
      params.push(`%${search}%`);
    }
    if (date) {
      where += ' AND DATE(a.date) = ?';
      params.push(date);
    }
    if (status) {
      where += ' AND a.status = ?';
      params.push(status);
    }
    if (startDate) {
      where += ' AND DATE(a.date) >= ?';
      params.push(startDate);
    }
    if (endDate) {
      where += ' AND DATE(a.date) <= ?';
      params.push(endDate);
    }

    const [attendance] = await pool.execute(
      `SELECT a.*, s.name as student_name, s.admission_number, s.grade, s.course
       FROM attendance a
       JOIN students s ON a.student_id = s.id
       ${where}
       ORDER BY a.date DESC, s.name
       LIMIT 200`,
      params
    );

    res.json({ success: true, data: { attendance } });
  } catch (error) {
    console.error('Admin get attendance error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// POST /api/admin/attendance - Create attendance record
router.post('/attendance', authenticateToken, checkAdminAccess, async (req, res) => {
  try {
    const {
      student_id,
      date,
      status,
      time_in,
      time_out,
      remarks
    } = req.body;

    if (!student_id || !date || !status) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    // Check if attendance record already exists for this student and date
    const [existing] = await pool.execute(
      'SELECT id FROM attendance WHERE student_id = ? AND DATE(date) = DATE(?)',
      [student_id, date]
    );

    if (existing.length > 0) {
      return res.status(400).json({ success: false, message: 'Attendance record already exists for this date' });
    }

    const [result] = await pool.execute(
      `INSERT INTO attendance (student_id, date, status, time_in, time_out, remarks)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [student_id, date, status, time_in || null, time_out || null, remarks || null]
    );

    res.status(201).json({ success: true, message: 'Attendance record created', data: { id: result.insertId } });
  } catch (error) {
    console.error('Admin create attendance error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// PUT /api/admin/attendance/:id - Update attendance record
router.put('/attendance/:id', authenticateToken, checkAdminAccess, async (req, res) => {
  try {
    const { id } = req.params;
    const fields = ['student_id', 'date', 'status', 'time_in', 'time_out', 'remarks'];
    const updates = [];
    const values = [];

    for (const field of fields) {
      if (req.body[field] !== undefined) {
        updates.push(`${field} = ?`);
        values.push(req.body[field]);
      }
    }

    if (updates.length === 0) {
      return res.status(400).json({ success: false, message: 'No fields to update' });
    }

    values.push(id);
    await pool.execute(
      `UPDATE attendance SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    res.json({ success: true, message: 'Attendance record updated' });
  } catch (error) {
    console.error('Admin update attendance error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// DELETE /api/admin/attendance/:id - Delete attendance record
router.delete('/attendance/:id', authenticateToken, checkAdminAccess, async (req, res) => {
  try {
    const { id } = req.params;
    await pool.execute('DELETE FROM attendance WHERE id = ?', [id]);
    res.json({ success: true, message: 'Attendance record deleted' });
  } catch (error) {
    console.error('Admin delete attendance error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// POST /api/admin/attendance/bulk - Bulk create attendance records
router.post('/attendance/bulk', authenticateToken, checkAdminAccess, async (req, res) => {
  try {
    const { date, records } = req.body;

    if (!date || !records || !Array.isArray(records)) {
      return res.status(400).json({ success: false, message: 'Invalid request data' });
    }

    // Check if attendance records already exist for this date
    const [existing] = await pool.execute(
      'SELECT student_id FROM attendance WHERE DATE(date) = DATE(?)',
      [date]
    );

    if (existing.length > 0) {
      return res.status(400).json({ success: false, message: 'Attendance records already exist for this date' });
    }

    // Insert all records
    const insertPromises = records.map(record => {
      return pool.execute(
        `INSERT INTO attendance (student_id, date, status, time_in, time_out, remarks)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [record.student_id, date, record.status, record.time_in || null, record.time_out || null, record.remarks || null]
      );
    });

    await Promise.all(insertPromises);

    res.status(201).json({ success: true, message: `${records.length} attendance records created` });
  } catch (error) {
    console.error('Admin bulk create attendance error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// GET /api/admin/attendance/statistics - Get attendance statistics
router.get('/attendance/statistics', authenticateToken, checkAdminAccess, async (req, res) => {
  try {
    const { startDate, endDate, grade, course } = req.query;
    let where = 'WHERE 1=1';
    const params = [];

    if (startDate) {
      where += ' AND DATE(a.date) >= ?';
      params.push(startDate);
    }
    if (endDate) {
      where += ' AND DATE(a.date) <= ?';
      params.push(endDate);
    }
    if (grade) {
      where += ' AND s.grade = ?';
      params.push(grade);
    }
    if (course) {
      where += ' AND s.course = ?';
      params.push(course);
    }

    const [stats] = await pool.execute(
      `SELECT 
        COUNT(*) as total_records,
        SUM(CASE WHEN a.status = 'Present' THEN 1 ELSE 0 END) as present_count,
        SUM(CASE WHEN a.status = 'Absent' THEN 1 ELSE 0 END) as absent_count,
        SUM(CASE WHEN a.status = 'Late' THEN 1 ELSE 0 END) as late_count,
        COUNT(DISTINCT a.student_id) as students_tracked,
        COUNT(DISTINCT DATE(a.date)) as total_days
       FROM attendance a
       JOIN students s ON a.student_id = s.id
       ${where}`,
      params
    );

    const totalRecords = stats[0]?.total_records || 0;
    const attendanceRate = totalRecords > 0 ? Math.round((stats[0]?.present_count / totalRecords) * 100) : 0;

    res.json({
      success: true,
      data: {
        ...stats[0],
        attendanceRate
      }
    });
  } catch (error) {
    console.error('Admin attendance statistics error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// POST /api/admin/results - Create a result
router.post('/results', authenticateToken, checkAdminAccess, async (req, res) => {
  try {
    const {
      student_id,
      subject_id,
      subject_name,
      assessment_type,
      score,
      max_score,
      grade,
      semester,
      academic_year,
      assessment_date,
      remarks
    } = req.body;
    if (!student_id || !subject_name || !assessment_type || !score || !max_score || !semester || !academic_year || !assessment_date) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }
    const [result] = await pool.execute(
      `INSERT INTO academic_results (student_id, subject_id, subject_name, assessment_type, score, max_score, grade, semester, academic_year, assessment_date, remarks)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [student_id, subject_id || null, subject_name, assessment_type, score, max_score, grade || null, semester, academic_year, assessment_date, remarks || null]
    );
    res.status(201).json({ success: true, message: 'Result created', data: { id: result.insertId } });
  } catch (error) {
    console.error('Admin create result error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// PUT /api/admin/results/:id - Update a result
router.put('/results/:id', authenticateToken, checkAdminAccess, async (req, res) => {
  try {
    const { id } = req.params;
    const fields = [
      'student_id', 'subject_id', 'subject_name', 'assessment_type', 'score', 'max_score', 'grade', 'semester', 'academic_year', 'assessment_date', 'remarks'
    ];
    const updates = [];
    const values = [];
    for (const field of fields) {
      if (req.body[field] !== undefined) {
        updates.push(`${field} = ?`);
        values.push(req.body[field]);
      }
    }
    if (updates.length === 0) {
      return res.status(400).json({ success: false, message: 'No fields to update' });
    }
    values.push(id);
    await pool.execute(
      `UPDATE academic_results SET ${updates.join(', ')} WHERE id = ?`,
      values
    );
    res.json({ success: true, message: 'Result updated' });
  } catch (error) {
    console.error('Admin update result error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// DELETE /api/admin/results/:id - Delete a result
router.delete('/results/:id', authenticateToken, checkAdminAccess, async (req, res) => {
  try {
    const { id } = req.params;
    await pool.execute('DELETE FROM academic_results WHERE id = ?', [id]);
    res.json({ success: true, message: 'Result deleted' });
  } catch (error) {
    console.error('Admin delete result error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

module.exports = router; 