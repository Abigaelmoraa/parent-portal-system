const express = require('express');
const { pool } = require('../config/database');
const { authenticateToken, checkStudentAccess } = require('../middleware/auth');
const { validateFeePayment, validatePagination, validateDateRange } = require('../middleware/validation');

const router = express.Router();

// GET /api/financials/overview
router.get('/overview', authenticateToken, async (req, res) => {
  try {
    const parentId = req.user.id;
    const { semester, academicYear } = req.query;

    // Get all children for the parent
    const [children] = await pool.execute(
      `SELECT s.id, s.name, s.grade, s.class, s.semester, s.academic_year
       FROM students s
       JOIN parent_student ps ON s.id = ps.student_id
       WHERE ps.parent_id = ? AND s.is_active = TRUE`,
      [parentId]
    );

    if (children.length === 0) {
      return res.json({
        success: true,
        data: {
          summary: [],
          transactions: [],
          feeBreakdown: [],
          semesterData: []
        }
      });
    }

    const childIds = children.map(child => child.id);
    const currentSemester = semester || children[0]?.semester || 'Semester 2';
    const currentYear = academicYear || children[0]?.academic_year || '2024/2025';

    // Get financial summary
    const [feeSummary] = await pool.execute(
      `SELECT 
        COALESCE(SUM(fs.amount), 0) as total_fees,
        COALESCE(SUM(COALESCE(fp.amount_paid, 0)), 0) as paid_fees,
        COUNT(DISTINCT fs.id) as total_fee_items,
        COUNT(DISTINCT CASE WHEN fp.status = 'Paid' THEN fp.id END) as paid_items
       FROM fee_structure fs
       LEFT JOIN fee_payments fp ON fs.id = fp.fee_structure_id
       WHERE fs.semester = ? AND fs.academic_year = ?`,
      [currentSemester, currentYear]
    );

    const totalFees = feeSummary[0]?.total_fees || 0;
    const paidFees = feeSummary[0]?.paid_fees || 0;
    const outstandingFees = totalFees - paidFees;

    // Get next payment due
    const [nextPayment] = await pool.execute(
      `SELECT fs.fee_type, fs.amount, fs.due_date
       FROM fee_structure fs
       LEFT JOIN fee_payments fp ON fs.id = fp.fee_structure_id AND fp.status = 'Paid'
       WHERE fs.semester = ? AND fs.academic_year = ? AND fp.id IS NULL
       ORDER BY fs.due_date ASC
       LIMIT 1`,
      [currentSemester, currentYear]
    );

    const summary = [
      {
        title: "Total Fees Paid",
        value: `KSh ${paidFees.toLocaleString()}`,
        description: "This academic year",
        icon: "DollarSign",
        color: "text-emerald-600",
        bgColor: "bg-gradient-to-br from-emerald-50 to-emerald-100",
        iconBg: "bg-emerald-500"
      },
      {
        title: "Outstanding Fees",
        value: `KSh ${outstandingFees.toLocaleString()}`,
        description: nextPayment[0] ? `Due ${nextPayment[0].due_date}` : "No pending payments",
        icon: "AlertTriangle",
        color: "text-orange-600",
        bgColor: "bg-gradient-to-br from-orange-50 to-orange-100",
        iconBg: "bg-orange-500"
      },
      {
        title: "Next Payment",
        value: nextPayment[0] ? `KSh ${nextPayment[0].amount.toLocaleString()}` : "KSh 0",
        description: nextPayment[0] ? nextPayment[0].fee_type : "No pending payments",
        icon: "Calendar",
        color: "text-blue-600",
        bgColor: "bg-gradient-to-br from-blue-50 to-blue-100",
        iconBg: "bg-blue-500"
      },
      {
        title: "Total Annual Fees",
        value: `KSh ${totalFees.toLocaleString()}`,
        description: "Full academic year",
        icon: "Receipt",
        color: "text-purple-600",
        bgColor: "bg-gradient-to-br from-purple-50 to-purple-100",
        iconBg: "bg-purple-500"
      }
    ];

    // Get recent transactions
    const [transactions] = await pool.execute(
      `SELECT fp.*, fs.fee_type, fs.amount as fee_amount, s.name as student_name
       FROM fee_payments fp
       JOIN fee_structure fs ON fp.fee_structure_id = fs.id
       JOIN students s ON fp.student_id = s.id
       WHERE fp.student_id IN (${childIds.map(() => '?').join(',')})
       ORDER BY fp.payment_date DESC
       LIMIT 10`,
      childIds
    );

    // Get fee breakdown by type
    const [feeBreakdown] = await pool.execute(
      `SELECT 
        fs.fee_type,
        SUM(fs.amount) as total_amount,
        SUM(COALESCE(fp.amount_paid, 0)) as paid_amount
       FROM fee_structure fs
       LEFT JOIN fee_payments fp ON fs.id = fp.fee_structure_id AND fp.status = 'Paid'
       WHERE fs.semester = ? AND fs.academic_year = ?
       GROUP BY fs.fee_type`,
      [currentSemester, currentYear]
    );

    // Get semester payment data
    const [semesterData] = await pool.execute(
      `SELECT 
        fs.semester,
        SUM(fs.amount) as total_amount,
        SUM(COALESCE(fp.amount_paid, 0)) as paid_amount
       FROM fee_structure fs
       LEFT JOIN fee_payments fp ON fs.id = fp.fee_structure_id AND fp.status = 'Paid'
       WHERE fs.academic_year = ?
       GROUP BY fs.semester
       ORDER BY fs.semester`,
      [currentYear]
    );

    res.json({
      success: true,
      data: {
        summary,
        transactions: transactions.map(t => ({
          id: t.id,
          transactionId: t.transaction_id,
          feeType: t.fee_type,
          amount: t.amount_paid,
          paymentDate: t.payment_date,
          paymentMethod: t.payment_method,
          status: t.status,
          studentName: t.student_name,
          receiptNumber: t.receipt_number
        })),
        feeBreakdown: feeBreakdown.map(f => ({
          name: f.fee_type,
          totalAmount: f.total_amount,
          paidAmount: f.paid_amount,
          outstandingAmount: f.total_amount - f.paid_amount
        })),
        semesterData: semesterData.map(s => ({
          semester: s.semester,
          totalAmount: s.total_amount,
          paidAmount: s.paid_amount,
          outstandingAmount: s.total_amount - s.paid_amount
        }))
      }
    });
  } catch (error) {
    console.error('Financials overview error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// GET /api/financials/student/:studentId
router.get('/student/:studentId', authenticateToken, checkStudentAccess, validatePagination, validateDateRange, async (req, res) => {
  try {
    const { studentId } = req.params;
    const { startDate, endDate, status, paymentMethod } = req.query;
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
    const conditions = ['fp.student_id = ?'];
    const queryParams = [studentId];

    if (startDate && endDate) {
      conditions.push('fp.payment_date BETWEEN ? AND ?');
      queryParams.push(startDate, endDate);
    }
    if (status) {
      conditions.push('fp.status = ?');
      queryParams.push(status);
    }
    if (paymentMethod) {
      conditions.push('fp.payment_method = ?');
      queryParams.push(paymentMethod);
    }

    const whereClause = conditions.join(' AND ');

    // Get fee payments
    const [payments] = await pool.execute(
      `SELECT fp.*, fs.fee_type, fs.amount as fee_amount, fs.due_date
       FROM fee_payments fp
       JOIN fee_structure fs ON fp.fee_structure_id = fs.id
       WHERE ${whereClause}
       ORDER BY fp.payment_date DESC
       LIMIT ? OFFSET ?`,
      [...queryParams, limit, offset]
    );

    // Get total count
    const [countResult] = await pool.execute(
      `SELECT COUNT(*) as total
       FROM fee_payments fp
       WHERE ${whereClause}`,
      queryParams
    );

    const total = countResult[0].total;
    const totalPages = Math.ceil(total / limit);

    // Get financial summary for this student
    const [summary] = await pool.execute(
      `SELECT 
        COALESCE(SUM(fs.amount), 0) as total_fees,
        COALESCE(SUM(COALESCE(fp.amount_paid, 0)), 0) as paid_fees,
        COUNT(DISTINCT fs.id) as total_fee_items,
        COUNT(DISTINCT CASE WHEN fp.status = 'Paid' THEN fp.id END) as paid_items
       FROM fee_structure fs
       LEFT JOIN fee_payments fp ON fs.id = fp.fee_structure_id
       WHERE fs.semester = ? AND fs.academic_year = ?`,
      [students[0].semester, students[0].academic_year]
    );

    const summaryData = summary[0];
    const outstandingFees = summaryData.total_fees - summaryData.paid_fees;

    res.json({
      success: true,
      data: {
        student: {
          id: students[0].id,
          name: students[0].name,
          grade: students[0].grade,
          class: students[0].class,
          semester: students[0].semester,
          academicYear: students[0].academic_year
        },
        summary: {
          totalFees: summaryData.total_fees,
          paidFees: summaryData.paid_fees,
          outstandingFees,
          totalFeeItems: summaryData.total_fee_items,
          paidItems: summaryData.paid_items
        },
        payments: payments.map(payment => ({
          id: payment.id,
          transactionId: payment.transaction_id,
          feeType: payment.fee_type,
          amountPaid: payment.amount_paid,
          feeAmount: payment.fee_amount,
          paymentDate: payment.payment_date,
          dueDate: payment.due_date,
          paymentMethod: payment.payment_method,
          status: payment.status,
          receiptNumber: payment.receipt_number,
          remarks: payment.remarks
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
    console.error('Get student financials error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// POST /api/financials/payment
router.post('/payment', authenticateToken, validateFeePayment, async (req, res) => {
  try {
    const { studentId, feeStructureId, amountPaid, paymentDate, paymentMethod, receiptNumber, remarks } = req.body;

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

    // Check if fee structure exists
    const [feeStructure] = await pool.execute(
      'SELECT * FROM fee_structure WHERE id = ? AND is_active = TRUE',
      [feeStructureId]
    );

    if (feeStructure.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Fee structure not found'
      });
    }

    // Generate transaction ID
    const transactionId = `FEE${Date.now()}${Math.random().toString(36).substr(2, 5).toUpperCase()}`;

    // Insert payment record
    const [result] = await pool.execute(
      `INSERT INTO fee_payments 
       (student_id, fee_structure_id, transaction_id, amount_paid, payment_date, payment_method, status, receipt_number, remarks)
       VALUES (?, ?, ?, ?, ?, ?, 'Paid', ?, ?)`,
      [studentId, feeStructureId, transactionId, amountPaid, paymentDate, paymentMethod, receiptNumber || null, remarks || null]
    );

    res.status(201).json({
      success: true,
      message: 'Payment recorded successfully',
      data: {
        id: result.insertId,
        transactionId,
        studentId,
        feeStructureId,
        amountPaid,
        paymentDate,
        paymentMethod,
        status: 'Paid'
      }
    });
  } catch (error) {
    console.error('Record payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// PUT /api/financials/payment/:paymentId
router.put('/payment/:paymentId', authenticateToken, validateFeePayment, async (req, res) => {
  try {
    const { paymentId } = req.params;
    const { amountPaid, paymentDate, paymentMethod, status, receiptNumber, remarks } = req.body;

    // Check if payment exists and parent has access
    const [payments] = await pool.execute(
      `SELECT fp.id FROM fee_payments fp
       JOIN students s ON fp.student_id = s.id
       JOIN parent_student ps ON s.id = ps.student_id
       WHERE fp.id = ? AND ps.parent_id = ?`,
      [paymentId, req.user.id]
    );

    if (payments.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Payment record not found'
      });
    }

    // Build update query
    const updateFields = [];
    const updateValues = [];

    if (amountPaid !== undefined) {
      updateFields.push('amount_paid = ?');
      updateValues.push(amountPaid);
    }
    if (paymentDate !== undefined) {
      updateFields.push('payment_date = ?');
      updateValues.push(paymentDate);
    }
    if (paymentMethod !== undefined) {
      updateFields.push('payment_method = ?');
      updateValues.push(paymentMethod);
    }
    if (status !== undefined) {
      updateFields.push('status = ?');
      updateValues.push(status);
    }
    if (receiptNumber !== undefined) {
      updateFields.push('receipt_number = ?');
      updateValues.push(receiptNumber);
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

    updateValues.push(paymentId);

    const [result] = await pool.execute(
      `UPDATE fee_payments SET ${updateFields.join(', ')} WHERE id = ?`,
      updateValues
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Payment record not found'
      });
    }

    res.json({
      success: true,
      message: 'Payment record updated successfully'
    });
  } catch (error) {
    console.error('Update payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// GET /api/financials/fee-structure
router.get('/fee-structure', authenticateToken, validatePagination, async (req, res) => {
  try {
    const { semester, academicYear } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    // Build query conditions
    const conditions = ['fs.is_active = TRUE'];
    const queryParams = [];

    if (semester) {
      conditions.push('fs.semester = ?');
      queryParams.push(semester);
    }
    if (academicYear) {
      conditions.push('fs.academic_year = ?');
      queryParams.push(academicYear);
    }

    const whereClause = conditions.join(' AND ');

    // Get fee structure
    const [feeStructure] = await pool.execute(
      `SELECT fs.*, 
              COALESCE(SUM(fp.amount_paid), 0) as total_paid,
              COUNT(fp.id) as payment_count
       FROM fee_structure fs
       LEFT JOIN fee_payments fp ON fs.id = fp.fee_structure_id AND fp.status = 'Paid'
       WHERE ${whereClause}
       GROUP BY fs.id
       ORDER BY fs.due_date ASC
       LIMIT ? OFFSET ?`,
      [...queryParams, limit, offset]
    );

    // Get total count
    const [countResult] = await pool.execute(
      `SELECT COUNT(*) as total FROM fee_structure fs WHERE ${whereClause}`,
      queryParams
    );

    const total = countResult[0].total;
    const totalPages = Math.ceil(total / limit);

    res.json({
      success: true,
      data: {
        feeStructure: feeStructure.map(fee => ({
          id: fee.id,
          feeType: fee.fee_type,
          amount: fee.amount,
          semester: fee.semester,
          academicYear: fee.academic_year,
          dueDate: fee.due_date,
          description: fee.description,
          totalPaid: fee.total_paid,
          outstandingAmount: fee.amount - fee.total_paid,
          paymentCount: fee.payment_count
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
    console.error('Get fee structure error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// GET /api/financials/report/:studentId
router.get('/report/:studentId', authenticateToken, checkStudentAccess, validateDateRange, async (req, res) => {
  try {
    const { studentId } = req.params;
    const { startDate, endDate, format } = req.query;

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

    // Build date filter
    let dateFilter = '';
    let dateParams = [];
    if (startDate && endDate) {
      dateFilter = 'AND fp.payment_date BETWEEN ? AND ?';
      dateParams = [startDate, endDate];
    }

    // Get comprehensive financial data
    const [payments] = await pool.execute(
      `SELECT fp.*, fs.fee_type, fs.amount as fee_amount, fs.due_date
       FROM fee_payments fp
       JOIN fee_structure fs ON fp.fee_structure_id = fs.id
       WHERE fp.student_id = ? ${dateFilter}
       ORDER BY fp.payment_date DESC`,
      [studentId, ...dateParams]
    );

    // Get fee structure for this student
    const [feeStructure] = await pool.execute(
      `SELECT fs.*, COALESCE(SUM(fp.amount_paid), 0) as total_paid
       FROM fee_structure fs
       LEFT JOIN fee_payments fp ON fs.id = fp.fee_structure_id AND fp.status = 'Paid'
       WHERE fs.semester = ? AND fs.academic_year = ?
       GROUP BY fs.id`,
      [student.semester, student.academic_year]
    );

    // Calculate summary statistics
    const totalFees = feeStructure.reduce((sum, fee) => sum + fee.amount, 0);
    const totalPaid = payments.reduce((sum, payment) => sum + payment.amount_paid, 0);
    const outstandingFees = totalFees - totalPaid;

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
        totalFees,
        totalPaid,
        outstandingFees,
        totalPayments: payments.length
      },
      feeStructure: feeStructure.map(fee => ({
        feeType: fee.fee_type,
        amount: fee.amount,
        totalPaid: fee.total_paid,
        outstandingAmount: fee.amount - fee.total_paid,
        dueDate: fee.due_date,
        description: fee.description
      })),
      payments: payments.map(payment => ({
        transactionId: payment.transaction_id,
        feeType: payment.fee_type,
        amountPaid: payment.amount_paid,
        paymentDate: payment.payment_date,
        paymentMethod: payment.payment_method,
        status: payment.status,
        receiptNumber: payment.receipt_number
      }))
    };

    if (format === 'pdf') {
      // In a real implementation, you would generate a PDF here
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
    console.error('Generate financial report error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router; 