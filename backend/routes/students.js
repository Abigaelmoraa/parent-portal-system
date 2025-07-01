const express = require('express');
const { pool } = require('../config/database');
const { authenticateToken, checkStudentAccess } = require('../middleware/auth');
const { validateStudentUpdate, validatePagination } = require('../middleware/validation');

const router = express.Router();

// GET /api/students
router.get('/', authenticateToken, validatePagination, async (req, res) => {
  try {
    const parentId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    // Get students with detailed information
    const [students] = await pool.execute(
      `SELECT s.*, 
              ps.relationship_type, ps.is_primary_guardian
       FROM students s
       JOIN parent_student ps ON s.id = ps.student_id
       WHERE ps.parent_id = ? AND s.is_active = TRUE
       ORDER BY s.name
       LIMIT ? OFFSET ?`,
      [parentId, limit, offset]
    );

    // Get total count
    const [countResult] = await pool.execute(
      `SELECT COUNT(*) as total
       FROM students s
       JOIN parent_student ps ON s.id = ps.student_id
       WHERE ps.parent_id = ? AND s.is_active = TRUE`,
      [parentId]
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

// GET /api/students/:studentId
router.get('/:studentId', authenticateToken, checkStudentAccess, async (req, res) => {
  try {
    const { studentId } = req.params;

    // Get student details
    const [students] = await pool.execute(
      `SELECT s.*, ps.relationship_type, ps.is_primary_guardian
       FROM students s
       JOIN parent_student ps ON s.id = ps.student_id
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
      [studentId, student.semester, student.academic_year]
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
            totalFeeItems: feeSummary[0]?.total_fee_items || 0,
            paidItems: feeSummary[0]?.paid_items || 0
          },
          recentResults: recentResults.map(result => ({
            id: result.id,
            subject: result.subject_name,
            assessmentType: result.assessment_type,
            score: result.score,
            grade: result.grade,
            date: result.assessment_date,
            remarks: result.remarks
          }))
        }
      }
    });
  } catch (error) {
    console.error('Get student details error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// PUT /api/students/:studentId
router.put('/:studentId', authenticateToken, checkStudentAccess, validateStudentUpdate, async (req, res) => {
  try {
    const { studentId } = req.params;
    const { name, email, phone, dateOfBirth, address, emergencyContact } = req.body;

    // Build update query dynamically
    const updateFields = [];
    const updateValues = [];

    if (name !== undefined) {
      updateFields.push('name = ?');
      updateValues.push(name);
    }
    if (email !== undefined) {
      updateFields.push('email = ?');
      updateValues.push(email);
    }
    if (phone !== undefined) {
      updateFields.push('phone = ?');
      updateValues.push(phone);
    }
    if (dateOfBirth !== undefined) {
      updateFields.push('date_of_birth = ?');
      updateValues.push(dateOfBirth);
    }
    if (address !== undefined) {
      updateFields.push('address = ?');
      updateValues.push(address);
    }
    if (emergencyContact !== undefined) {
      updateFields.push('emergency_contact = ?');
      updateValues.push(emergencyContact);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No fields to update'
      });
    }

    updateValues.push(studentId);

    const [result] = await pool.execute(
      `UPDATE students SET ${updateFields.join(', ')} WHERE id = ?`,
      updateValues
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    res.json({
      success: true,
      message: 'Student information updated successfully'
    });
  } catch (error) {
    console.error('Update student error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// GET /api/students/:studentId/report
router.get('/:studentId/report', authenticateToken, checkStudentAccess, async (req, res) => {
  try {
    const { studentId } = req.params;
    const { format = 'json' } = req.query;

    // Get student details
    const [students] = await pool.execute(
      'SELECT * FROM students WHERE id = ? AND is_active = TRUE',
      [studentId]
    );

    if (students.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    const student = students[0];

    // Get comprehensive academic data
    const [academicResults] = await pool.execute(
      `SELECT ar.*, s.name as subject_name, s.code as subject_code
       FROM academic_results ar
       JOIN subjects s ON ar.subject_id = s.id
       WHERE ar.student_id = ?
       ORDER BY ar.semester, ar.academic_year, ar.assessment_date`,
      [studentId]
    );

    // Get attendance data
    const [attendanceData] = await pool.execute(
      `SELECT a.*, s.name as subject_name
       FROM attendance a
       JOIN subjects s ON a.subject_id = s.id
       WHERE a.student_id = ?
       ORDER BY a.date DESC`,
      [studentId]
    );

    // Get fee data
    const [feeData] = await pool.execute(
      `SELECT fp.*, fs.fee_type, fs.amount as fee_amount
       FROM fee_payments fp
       JOIN fee_structure fs ON fp.fee_structure_id = fs.id
       WHERE fp.student_id = ?
       ORDER BY fp.payment_date DESC`,
      [studentId]
    );

    // Calculate summary statistics
    const totalAssessments = academicResults.length;
    const averageScore = totalAssessments > 0 
      ? academicResults.reduce((sum, result) => sum + result.score, 0) / totalAssessments
      : 0;

    const totalAttendanceDays = attendanceData.length;
    const presentDays = attendanceData.filter(a => a.status === 'Present').length;
    const attendanceRate = totalAttendanceDays > 0 ? (presentDays / totalAttendanceDays) * 100 : 0;

    const totalFeesPaid = feeData.reduce((sum, fee) => sum + fee.amount_paid, 0);

    const report = {
      student: {
        id: student.id,
        name: student.name,
        admissionNumber: student.admission_number,
        course: student.course,
        grade: student.grade,
        class: student.class,
        academicYear: student.academic_year,
        semester: student.semester
      },
      summary: {
        totalAssessments,
        averageScore: Math.round(averageScore),
        totalAttendanceDays,
        attendanceRate: Math.round(attendanceRate),
        totalFeesPaid
      },
      academicResults: academicResults.map(result => ({
        subject: result.subject_name,
        assessmentType: result.assessment_type,
        score: result.score,
        grade: result.grade,
        date: result.assessment_date,
        semester: result.semester,
        academicYear: result.academic_year
      })),
      attendance: attendanceData.map(att => ({
        date: att.date,
        subject: att.subject_name,
        status: att.status,
        timeIn: att.time_in,
        timeOut: att.time_out
      })),
      fees: feeData.map(fee => ({
        transactionId: fee.transaction_id,
        feeType: fee.fee_type,
        amountPaid: fee.amount_paid,
        paymentDate: fee.payment_date,
        paymentMethod: fee.payment_method,
        status: fee.status
      }))
    };

    if (format === 'pdf') {
      // In a real implementation, you would generate a PDF here
      // For now, return JSON with a message
      return res.json({
        success: true,
        message: 'PDF generation not implemented in demo',
        data: report
      });
    }

    res.json({
      success: true,
      data: report
    });
  } catch (error) {
    console.error('Generate student report error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router; 