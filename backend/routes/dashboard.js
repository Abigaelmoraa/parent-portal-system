const express = require('express');
const { pool } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { validatePagination } = require('../middleware/validation');

const router = express.Router();

// Helper function to calculate GPA
const calculateGPA = (results) => {
  if (!results || results.length === 0) return 0;
  
  const gradePoints = {
    'A+': 4.0, 'A': 4.0, 'A-': 3.7,
    'B+': 3.3, 'B': 3.0, 'B-': 2.7,
    'C+': 2.3, 'C': 2.0, 'C-': 1.7,
    'D+': 1.3, 'D': 1.0, 'F': 0.0
  };

  let totalPoints = 0;
  let totalCredits = 0;

  results.forEach(result => {
    const grade = result.grade;
    const credits = result.credits || 3;
    
    if (gradePoints[grade]) {
      totalPoints += gradePoints[grade] * credits;
      totalCredits += credits;
    }
  });

  return totalCredits > 0 ? (totalPoints / totalCredits).toFixed(1) : 0;
};

// Helper function to get attendance rate
const calculateAttendanceRate = (attendance) => {
  if (!attendance || attendance.length === 0) return 0;
  
  const present = attendance.filter(a => a.status === 'Present').length;
  const total = attendance.length;
  
  return total > 0 ? Math.round((present / total) * 100) : 0;
};

// GET /api/dashboard
router.get('/', authenticateToken, async (req, res) => {
  try {
    const parentId = req.user.id;

    // Get all children for the parent
    const [children] = await pool.execute(
      `SELECT s.id, s.name, s.grade, s.class, s.course, s.semester, s.academic_year
       FROM students s
       JOIN parent_student ps ON s.id = ps.student_id
       WHERE ps.parent_id = ? AND s.is_active = TRUE`,
      [parentId]
    );

    if (children.length === 0) {
      return res.json({
        success: true,
        data: {
          total_students: 0,
          total_results: 0,
          total_attendance: 0,
          total_payments: 0,
          recent_results: [],
          recent_attendance: [],
          recent_payments: [],
          fee_summary: {
            total_fees: 0,
            paid_fees: 0,
            outstanding_fees: 0
          }
        }
      });
    }

    const childIds = children.map(child => child.id);
    const currentSemester = children[0]?.semester || 'Semester 2';
    const currentYear = children[0]?.academic_year || '2024/2025';

    // Get total counts
    const [resultsCount] = await pool.execute(
      `SELECT COUNT(*) as total FROM academic_results WHERE student_id IN (${childIds.map(() => '?').join(',')})`,
      childIds
    );

    const [attendanceCount] = await pool.execute(
      `SELECT COUNT(*) as total FROM attendance WHERE student_id IN (${childIds.map(() => '?').join(',')})`,
      childIds
    );

    const [paymentsCount] = await pool.execute(
      `SELECT COUNT(*) as total FROM fee_payments WHERE student_id IN (${childIds.map(() => '?').join(',')})`,
      childIds
    );

    // Get recent results
    const [recentResults] = await pool.execute(
      `SELECT ar.id, ar.student_id, s.name as student_name, ar.subject_id, sub.name as subject_name,
              ar.assessment_type, ar.score, ar.max_score, ar.grade, ar.assessment_date
       FROM academic_results ar
       JOIN students s ON ar.student_id = s.id
       JOIN subjects sub ON ar.subject_id = sub.id
       WHERE ar.student_id IN (${childIds.map(() => '?').join(',')})
       ORDER BY ar.assessment_date DESC
       LIMIT 5`,
      childIds
    );

    // Get recent attendance
    const [recentAttendance] = await pool.execute(
      `SELECT a.id, a.student_id, s.name as student_name, a.subject_id, sub.name as subject_name,
              a.date, a.status, a.time_in
       FROM attendance a
       JOIN students s ON a.student_id = s.id
       JOIN subjects sub ON a.subject_id = sub.id
       WHERE a.student_id IN (${childIds.map(() => '?').join(',')})
       ORDER BY a.date DESC, a.time_in DESC
       LIMIT 5`,
      childIds
    );

    // Get recent payments
    const [recentPayments] = await pool.execute(
      `SELECT fp.id, fp.student_id, s.name as student_name, fp.fee_structure_id, fs.fee_type,
              fp.amount_paid, fp.payment_date, fp.payment_method, fp.status
       FROM fee_payments fp
       JOIN students s ON fp.student_id = s.id
       JOIN fee_structure fs ON fp.fee_structure_id = fs.id
       WHERE fp.student_id IN (${childIds.map(() => '?').join(',')})
       ORDER BY fp.payment_date DESC
       LIMIT 5`,
      childIds
    );

    // Get fee summary
    const [feeSummary] = await pool.execute(
      `SELECT 
        COALESCE(SUM(fs.amount), 0) as total_fees,
        COALESCE(SUM(COALESCE(fp.amount_paid, 0)), 0) as paid_fees
       FROM fee_structure fs
       LEFT JOIN fee_payments fp ON fs.id = fp.fee_structure_id AND fp.status = 'Paid'
       WHERE fs.semester = ? AND fs.academic_year = ?`,
      [currentSemester, currentYear]
    );

    const totalFees = feeSummary[0]?.total_fees || 0;
    const paidFees = feeSummary[0]?.paid_fees || 0;
    const outstandingFees = totalFees - paidFees;

    res.json({
      success: true,
      data: {
        total_students: children.length,
        total_results: resultsCount[0]?.total || 0,
        total_attendance: attendanceCount[0]?.total || 0,
        total_payments: paymentsCount[0]?.total || 0,
        recent_results: recentResults.map(result => ({
          id: result.id,
          student_id: result.student_id,
          student_name: result.student_name,
          subject_id: result.subject_id,
          subject_name: result.subject_name,
          assessment_type: result.assessment_type,
          score: result.score,
          max_score: result.max_score,
          grade: result.grade,
          assessment_date: result.assessment_date
        })),
        recent_attendance: recentAttendance.map(att => ({
          id: att.id,
          student_id: att.student_id,
          student_name: att.student_name,
          subject_id: att.subject_id,
          subject_name: att.subject_name,
          date: att.date,
          status: att.status,
          time_in: att.time_in
        })),
        recent_payments: recentPayments.map(payment => ({
          id: payment.id,
          student_id: payment.student_id,
          student_name: payment.student_name,
          fee_structure_id: payment.fee_structure_id,
          fee_type: payment.fee_type,
          amount_paid: payment.amount_paid,
          payment_date: payment.payment_date,
          payment_method: payment.payment_method,
          status: payment.status
        })),
        fee_summary: {
          total_fees: totalFees,
          paid_fees: paidFees,
          outstanding_fees: outstandingFees
        }
      }
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// GET /api/dashboard/overview
router.get('/overview', authenticateToken, async (req, res) => {
  try {
    const parentId = req.user.id;

    // Get all children for the parent
    const [children] = await pool.execute(
      `SELECT s.id, s.name, s.grade, s.class, s.course, s.semester, s.academic_year
       FROM students s
       JOIN parent_student ps ON s.id = ps.student_id
       WHERE ps.parent_id = ? AND s.is_active = TRUE`,
      [parentId]
    );

    if (children.length === 0) {
      return res.json({
        success: true,
        data: {
          stats: [],
          children: [],
          recentActivities: []
        }
      });
    }

    const childIds = children.map(child => child.id);
    const currentSemester = children[0]?.semester || 'Semester 2';
    const currentYear = children[0]?.academic_year || '2024/2025';

    // Get overall stats
    const stats = [];

    // Overall GPA
    const [gpaResults] = await pool.execute(
      `SELECT ar.grade, s.credits
       FROM academic_results ar
       JOIN subjects s ON ar.subject_id = s.id
       WHERE ar.student_id IN (${childIds.map(() => '?').join(',')})
       AND ar.semester = ? AND ar.academic_year = ?`,
      [...childIds, currentSemester, currentYear]
    );

    const overallGPA = calculateGPA(gpaResults);
    stats.push({
      title: "Overall GPA",
      value: overallGPA,
      description: "Current semester",
      icon: "GraduationCap",
      color: "text-emerald-600",
      bgColor: "bg-gradient-to-br from-emerald-50 to-emerald-100",
      iconBg: "bg-emerald-500"
    });

    // Attendance Rate
    const [attendanceData] = await pool.execute(
      `SELECT status
       FROM attendance
       WHERE student_id IN (${childIds.map(() => '?').join(',')})
       AND date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)`,
      childIds
    );

    const attendanceRate = calculateAttendanceRate(attendanceData);
    stats.push({
      title: "Attendance Rate",
      value: `${attendanceRate}%`,
      description: "This semester",
      icon: "Calendar",
      color: "text-blue-600",
      bgColor: "bg-gradient-to-br from-blue-50 to-blue-100",
      iconBg: "bg-blue-500"
    });

    // Outstanding Balance
    const [outstandingFees] = await pool.execute(
      `SELECT COALESCE(SUM(fs.amount - COALESCE(fp.amount_paid, 0)), 0) as outstanding
       FROM fee_structure fs
       LEFT JOIN fee_payments fp ON fs.id = fp.fee_structure_id
       WHERE fs.semester = ? AND fs.academic_year = ?
       AND (fp.status IS NULL OR fp.status != 'Paid')`,
      [currentSemester, currentYear]
    );

    const outstandingAmount = outstandingFees[0]?.outstanding || 0;
    stats.push({
      title: "Outstanding Balance",
      value: `KSh ${outstandingAmount.toLocaleString()}`,
      description: "Due next month",
      icon: "DollarSign",
      color: "text-orange-600",
      bgColor: "bg-gradient-to-br from-orange-50 to-orange-100",
      iconBg: "bg-orange-500"
    });

    // Academic Progress (mock data for demo)
    stats.push({
      title: "Academic Progress",
      value: "+8%",
      description: "From last semester",
      icon: "TrendingUp",
      color: "text-purple-600",
      bgColor: "bg-gradient-to-br from-purple-50 to-purple-100",
      iconBg: "bg-purple-500"
    });

    // Get children with detailed info
    const childrenWithDetails = await Promise.all(
      children.map(async (child) => {
        // Get academic performance for this child
        const [childResults] = await pool.execute(
          `SELECT ar.grade, s.credits
           FROM academic_results ar
           JOIN subjects s ON ar.subject_id = s.id
           WHERE ar.student_id = ? AND ar.semester = ? AND ar.academic_year = ?`,
          [child.id, currentSemester, currentYear]
        );

        const childGPA = calculateGPA(childResults);

        // Get attendance for this child
        const [childAttendance] = await pool.execute(
          `SELECT status FROM attendance WHERE student_id = ? AND date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)`,
          [child.id]
        );

        const childAttendanceRate = calculateAttendanceRate(childAttendance);

        // Get latest grade
        const [latestGrade] = await pool.execute(
          `SELECT ar.grade, s.name as subject_name
           FROM academic_results ar
           JOIN subjects s ON ar.subject_id = s.id
           WHERE ar.student_id = ?
           ORDER BY ar.assessment_date DESC
           LIMIT 1`,
          [child.id]
        );

        return {
          ...child,
          academicPerformance: Math.round(childGPA * 20), // Convert GPA to percentage
          attendanceRate: childAttendanceRate,
          latestGrade: latestGrade[0] ? `${latestGrade[0].grade} ${latestGrade[0].subject_name}` : 'No grades yet'
        };
      })
    );

    // Get recent activities
    const [recentActivities] = await pool.execute(
      `SELECT ar.assessment_type, ar.grade, ar.assessment_date, s.name as subject_name
       FROM academic_results ar
       JOIN subjects s ON ar.subject_id = s.id
       WHERE ar.student_id IN (${childIds.map(() => '?').join(',')})
       ORDER BY ar.assessment_date DESC
       LIMIT 10`,
      childIds
    );

    res.json({
      success: true,
      data: {
        stats,
        children: childrenWithDetails,
        recentActivities: recentActivities.map(activity => ({
          subject: activity.subject_name,
          grade: activity.grade,
          date: activity.assessment_date,
          type: activity.assessment_type
        }))
      }
    });
  } catch (error) {
    console.error('Dashboard overview error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// GET /api/dashboard/notifications
router.get('/notifications', authenticateToken, validatePagination, async (req, res) => {
  try {
    const parentId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    // Get notifications
    const [notifications] = await pool.execute(
      `SELECT id, title, message, type, is_read, created_at
       FROM notifications
       WHERE parent_id = ?
       ORDER BY created_at DESC
       LIMIT ? OFFSET ?`,
      [parentId, limit, offset]
    );

    // Get total count
    const [countResult] = await pool.execute(
      'SELECT COUNT(*) as total FROM notifications WHERE parent_id = ?',
      [parentId]
    );

    const total = countResult[0].total;
    const totalPages = Math.ceil(total / limit);

    res.json({
      success: true,
      data: {
        notifications,
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
    console.error('Notifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// PUT /api/dashboard/notifications/:id/read
router.put('/notifications/:id/read', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const parentId = req.user.id;

    const [result] = await pool.execute(
      'UPDATE notifications SET is_read = TRUE WHERE id = ? AND parent_id = ?',
      [id, parentId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    res.json({
      success: true,
      message: 'Notification marked as read'
    });
  } catch (error) {
    console.error('Mark notification read error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// GET /api/dashboard/quick-stats
router.get('/quick-stats', authenticateToken, async (req, res) => {
  try {
    const parentId = req.user.id;

    // Get quick stats for all children
    const [children] = await pool.execute(
      `SELECT s.id, s.name
       FROM students s
       JOIN parent_student ps ON s.id = ps.student_id
       WHERE ps.parent_id = ? AND s.is_active = TRUE`,
      [parentId]
    );

    const childIds = children.map(child => child.id);
    const currentSemester = 'Semester 2';
    const currentYear = '2024/2025';

    // Get quick stats
    const [totalSubjects] = await pool.execute(
      `SELECT COUNT(DISTINCT ar.subject_id) as count
       FROM academic_results ar
       WHERE ar.student_id IN (${childIds.map(() => '?').join(',')})
       AND ar.semester = ? AND ar.academic_year = ?`,
      [...childIds, currentSemester, currentYear]
    );

    const [totalAssessments] = await pool.execute(
      `SELECT COUNT(*) as count
       FROM academic_results ar
       WHERE ar.student_id IN (${childIds.map(() => '?').join(',')})
       AND ar.semester = ? AND ar.academic_year = ?`,
      [...childIds, currentSemester, currentYear]
    );

    const [totalAttendance] = await pool.execute(
      `SELECT COUNT(*) as count
       FROM attendance
       WHERE student_id IN (${childIds.map(() => '?').join(',')})
       AND date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)`,
      childIds
    );

    res.json({
      success: true,
      data: {
        totalChildren: children.length,
        totalSubjects: totalSubjects[0]?.count || 0,
        totalAssessments: totalAssessments[0]?.count || 0,
        totalAttendanceDays: totalAttendance[0]?.count || 0
      }
    });
  } catch (error) {
    console.error('Quick stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router; 