const express = require('express');
const { pool } = require('../config/database');
const { authenticateToken, checkStudentAccess } = require('../middleware/auth');
const { validateAttendance, validatePagination, validateDateRange } = require('../middleware/validation');

const router = express.Router();

// GET /api/attendance/overview
router.get('/overview', authenticateToken, async (req, res) => {
  try {
    const parentId = req.user.id;
    const { startDate, endDate } = req.query;

    // Get all children for the parent
    const [children] = await pool.execute(
      `SELECT s.id, s.name, s.grade, s.class
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
          monthlyBreakdown: [],
          recentAttendance: []
        }
      });
    }

    const childIds = children.map(child => child.id);

    // Build date filter
    let dateFilter = '';
    let dateParams = [];
    if (startDate && endDate) {
      dateFilter = 'AND date BETWEEN ? AND ?';
      dateParams = [startDate, endDate];
    } else {
      // Default to last 30 days
      dateFilter = 'AND date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)';
    }

    // Get attendance statistics
    const [attendanceStats] = await pool.execute(
      `SELECT 
        COUNT(*) as total_days,
        SUM(CASE WHEN status = 'Present' THEN 1 ELSE 0 END) as present_days,
        SUM(CASE WHEN status = 'Absent' THEN 1 ELSE 0 END) as absent_days,
        SUM(CASE WHEN status = 'Late' THEN 1 ELSE 0 END) as late_days,
        SUM(CASE WHEN status = 'Excused' THEN 1 ELSE 0 END) as excused_days
       FROM attendance
       WHERE student_id IN (${childIds.map(() => '?').join(',')})
       ${dateFilter}`,
      [...childIds, ...dateParams]
    );

    const stats = attendanceStats[0];
    const totalDays = stats.total_days || 0;
    const presentDays = stats.present_days || 0;
    const absentDays = stats.absent_days || 0;
    const lateDays = stats.late_days || 0;
    const excusedDays = stats.excused_days || 0;

    const attendanceRate = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;

    const statsData = [
      {
        title: "Present",
        value: presentDays.toString(),
        percentage: totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0,
        color: "text-green-600",
        bgColor: "bg-green-50",
        icon: "CheckCircle"
      },
      {
        title: "Absent",
        value: absentDays.toString(),
        percentage: totalDays > 0 ? Math.round((absentDays / totalDays) * 100) : 0,
        color: "text-red-600",
        bgColor: "bg-red-50",
        icon: "XCircle"
      },
      {
        title: "Late",
        value: lateDays.toString(),
        percentage: totalDays > 0 ? Math.round((lateDays / totalDays) * 100) : 0,
        color: "text-yellow-600",
        bgColor: "bg-yellow-50",
        icon: "AlertCircle"
      },
      {
        title: "Total Days",
        value: totalDays.toString(),
        percentage: 100,
        color: "text-blue-600",
        bgColor: "bg-blue-50",
        icon: "Calendar"
      }
    ];

    // Get monthly breakdown
    const [monthlyData] = await pool.execute(
      `SELECT 
        DATE_FORMAT(date, '%Y-%m') as month,
        COUNT(*) as total,
        SUM(CASE WHEN status = 'Present' THEN 1 ELSE 0 END) as present,
        SUM(CASE WHEN status = 'Absent' THEN 1 ELSE 0 END) as absent,
        SUM(CASE WHEN status = 'Late' THEN 1 ELSE 0 END) as late
       FROM attendance
       WHERE student_id IN (${childIds.map(() => '?').join(',')})
       GROUP BY DATE_FORMAT(date, '%Y-%m')
       ORDER BY month DESC
       LIMIT 6`,
      childIds
    );

    const monthlyBreakdown = monthlyData.map(month => ({
      month: month.month,
      present: month.present,
      absent: month.absent,
      late: month.late,
      total: month.total,
      rate: month.total > 0 ? Math.round((month.present / month.total) * 100) : 0
    }));

    // Get recent attendance
    const [recentAttendance] = await pool.execute(
      `SELECT a.date, a.status, a.time_in, a.time_out, s.name as subject_name
       FROM attendance a
       JOIN subjects s ON a.subject_id = s.id
       WHERE a.student_id IN (${childIds.map(() => '?').join(',')})
       ORDER BY a.date DESC, a.time_in DESC
       LIMIT 20`,
      childIds
    );

    res.json({
      success: true,
      data: {
        stats: statsData,
        monthlyBreakdown,
        recentAttendance: recentAttendance.map(att => ({
          date: att.date,
          status: att.status,
          time: att.time_in ? att.time_in.substring(0, 5) : '-',
          subject: att.subject_name
        })),
        summary: {
          totalDays,
          presentDays,
          absentDays,
          lateDays,
          excusedDays,
          attendanceRate
        }
      }
    });
  } catch (error) {
    console.error('Attendance overview error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// GET /api/attendance/student/:studentId
router.get('/student/:studentId', authenticateToken, checkStudentAccess, validatePagination, validateDateRange, async (req, res) => {
  try {
    const { studentId } = req.params;
    const { startDate, endDate, subjectId, status } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

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

    // Build query conditions
    const conditions = ['a.student_id = ?'];
    const queryParams = [studentId];

    if (startDate && endDate) {
      conditions.push('a.date BETWEEN ? AND ?');
      queryParams.push(startDate, endDate);
    }
    if (subjectId) {
      conditions.push('a.subject_id = ?');
      queryParams.push(subjectId);
    }
    if (status) {
      conditions.push('a.status = ?');
      queryParams.push(status);
    }

    const whereClause = conditions.join(' AND ');

    // Get attendance records
    const [attendance] = await pool.execute(
      `SELECT a.*, s.name as subject_name, s.code as subject_code
       FROM attendance a
       JOIN subjects s ON a.subject_id = s.id
       WHERE ${whereClause}
       ORDER BY a.date DESC, a.time_in DESC
       LIMIT ? OFFSET ?`,
      [...queryParams, limit, offset]
    );

    // Get total count
    const [countResult] = await pool.execute(
      `SELECT COUNT(*) as total
       FROM attendance a
       WHERE ${whereClause}`,
      queryParams
    );

    const total = countResult[0].total;
    const totalPages = Math.ceil(total / limit);

    // Get attendance summary for this student
    const [summary] = await pool.execute(
      `SELECT 
        COUNT(*) as total_days,
        SUM(CASE WHEN status = 'Present' THEN 1 ELSE 0 END) as present_days,
        SUM(CASE WHEN status = 'Absent' THEN 1 ELSE 0 END) as absent_days,
        SUM(CASE WHEN status = 'Late' THEN 1 ELSE 0 END) as late_days,
        SUM(CASE WHEN status = 'Excused' THEN 1 ELSE 0 END) as excused_days
       FROM attendance
       WHERE student_id = ?`,
      [studentId]
    );

    const summaryData = summary[0];
    const attendanceRate = summaryData.total_days > 0 
      ? Math.round((summaryData.present_days / summaryData.total_days) * 100)
      : 0;

    res.json({
      success: true,
      data: {
        student: {
          id: students[0].id,
          name: students[0].name,
          grade: students[0].grade,
          class: students[0].class
        },
        summary: {
          totalDays: summaryData.total_days,
          presentDays: summaryData.present_days,
          absentDays: summaryData.absent_days,
          lateDays: summaryData.late_days,
          excusedDays: summaryData.excused_days,
          attendanceRate
        },
        attendance: attendance.map(att => ({
          id: att.id,
          date: att.date,
          subject: att.subject_name,
          subjectCode: att.subject_code,
          status: att.status,
          timeIn: att.time_in,
          timeOut: att.time_out,
          remarks: att.remarks
        })),
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
    console.error('Get student attendance error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// POST /api/attendance
router.post('/', authenticateToken, validateAttendance, async (req, res) => {
  try {
    const { studentId, subjectId, date, status, timeIn, timeOut, remarks } = req.body;

    // Check if student exists and parent has access
    const [students] = await pool.execute(
      `SELECT s.id FROM students s
       JOIN parent_student ps ON s.id = ps.student_id
       WHERE s.id = ? AND ps.parent_id = ? AND s.is_active = TRUE`,
      [studentId, req.user.id]
    );

    if (students.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this student'
      });
    }

    // Check if attendance record already exists for this date and subject
    const [existing] = await pool.execute(
      'SELECT id FROM attendance WHERE student_id = ? AND subject_id = ? AND date = ?',
      [studentId, subjectId, date]
    );

    if (existing.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Attendance record already exists for this date and subject'
      });
    }

    // Insert attendance record
    const [result] = await pool.execute(
      `INSERT INTO attendance 
       (student_id, subject_id, date, status, time_in, time_out, remarks)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [studentId, subjectId, date, status, timeIn || null, timeOut || null, remarks || null]
    );

    res.status(201).json({
      success: true,
      message: 'Attendance record added successfully',
      data: {
        id: result.insertId,
        studentId,
        subjectId,
        date,
        status,
        timeIn,
        timeOut
      }
    });
  } catch (error) {
    console.error('Add attendance error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// PUT /api/attendance/:attendanceId
router.put('/:attendanceId', authenticateToken, validateAttendance, async (req, res) => {
  try {
    const { attendanceId } = req.params;
    const { status, timeIn, timeOut, remarks } = req.body;

    // Check if attendance record exists and parent has access
    const [attendance] = await pool.execute(
      `SELECT a.id FROM attendance a
       JOIN students s ON a.student_id = s.id
       JOIN parent_student ps ON s.id = ps.student_id
       WHERE a.id = ? AND ps.parent_id = ?`,
      [attendanceId, req.user.id]
    );

    if (attendance.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Attendance record not found'
      });
    }

    // Build update query
    const updateFields = [];
    const updateValues = [];

    if (status !== undefined) {
      updateFields.push('status = ?');
      updateValues.push(status);
    }
    if (timeIn !== undefined) {
      updateFields.push('time_in = ?');
      updateValues.push(timeIn);
    }
    if (timeOut !== undefined) {
      updateFields.push('time_out = ?');
      updateValues.push(timeOut);
    }
    if (remarks !== undefined) {
      updateFields.push('remarks = ?');
      updateValues.push(remarks);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No fields to update'
      });
    }

    updateValues.push(attendanceId);

    const [result] = await pool.execute(
      `UPDATE attendance SET ${updateFields.join(', ')} WHERE id = ?`,
      updateValues
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Attendance record not found'
      });
    }

    res.json({
      success: true,
      message: 'Attendance record updated successfully'
    });
  } catch (error) {
    console.error('Update attendance error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// DELETE /api/attendance/:attendanceId
router.delete('/:attendanceId', authenticateToken, async (req, res) => {
  try {
    const { attendanceId } = req.params;

    // Check if attendance record exists and parent has access
    const [attendance] = await pool.execute(
      `SELECT a.id FROM attendance a
       JOIN students s ON a.student_id = s.id
       JOIN parent_student ps ON s.id = ps.student_id
       WHERE a.id = ? AND ps.parent_id = ?`,
      [attendanceId, req.user.id]
    );

    if (attendance.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Attendance record not found'
      });
    }

    const [result] = await pool.execute(
      'DELETE FROM attendance WHERE id = ?',
      [attendanceId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Attendance record not found'
      });
    }

    res.json({
      success: true,
      message: 'Attendance record deleted successfully'
    });
  } catch (error) {
    console.error('Delete attendance error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// GET /api/attendance/calendar/:studentId
router.get('/calendar/:studentId', authenticateToken, checkStudentAccess, validateDateRange, async (req, res) => {
  try {
    const { studentId } = req.params;
    const { startDate, endDate } = req.query;

    // Default to current month if no dates provided
    const start = startDate || new Date().toISOString().split('T')[0].substring(0, 7) + '-01';
    const end = endDate || new Date().toISOString().split('T')[0];

    // Get attendance for calendar view
    const [attendance] = await pool.execute(
      `SELECT a.date, a.status, a.time_in, s.name as subject_name
       FROM attendance a
       JOIN subjects s ON a.subject_id = s.id
       WHERE a.student_id = ? AND a.date BETWEEN ? AND ?
       ORDER BY a.date, a.time_in`,
      [studentId, start, end]
    );

    // Group by date
    const calendarData = {};
    attendance.forEach(att => {
      const date = att.date;
      if (!calendarData[date]) {
        calendarData[date] = [];
      }
      calendarData[date].push({
        status: att.status,
        time: att.time_in ? att.time_in.substring(0, 5) : null,
        subject: att.subject_name
      });
    });

    res.json({
      success: true,
      data: {
        calendarData,
        dateRange: { start, end }
      }
    });
  } catch (error) {
    console.error('Get calendar attendance error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router; 