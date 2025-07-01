const express = require('express');
const { pool } = require('../config/database');
const { authenticateToken, checkStudentAccess } = require('../middleware/auth');
const { validateAcademicResult, validatePagination, validateDateRange } = require('../middleware/validation');

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

// Helper function to get grade letter
const getGradeLetter = (score) => {
  if (score >= 97) return 'A+';
  if (score >= 93) return 'A';
  if (score >= 90) return 'A-';
  if (score >= 87) return 'B+';
  if (score >= 83) return 'B';
  if (score >= 80) return 'B-';
  if (score >= 77) return 'C+';
  if (score >= 73) return 'C';
  if (score >= 70) return 'C-';
  return 'F';
};

// GET /api/results
router.get('/', authenticateToken, async (req, res) => {
  try {
    const parentId = req.user.id;
    const { semester, academicYear, subjectId } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

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
          results: [],
          pagination: {
            page,
            limit,
            total: 0,
            totalPages: 0,
            hasNext: false,
            hasPrev: false
          }
        }
      });
    }

    const childIds = children.map(child => child.id);
    const currentSemester = semester || children[0]?.semester || 'Semester 2';
    const currentYear = academicYear || children[0]?.academic_year || '2024/2025';

    // Build query conditions
    let whereConditions = [`ar.student_id IN (${childIds.map(() => '?').join(',')})`];
    let queryParams = [...childIds];

    if (semester) {
      whereConditions.push('ar.semester = ?');
      queryParams.push(semester);
    }
    if (academicYear) {
      whereConditions.push('ar.academic_year = ?');
      queryParams.push(academicYear);
    }
    if (subjectId) {
      whereConditions.push('ar.subject_id = ?');
      queryParams.push(subjectId);
    }

    // Get total count
    const [countResult] = await pool.execute(
      `SELECT COUNT(*) as total
       FROM academic_results ar
       WHERE ${whereConditions.join(' AND ')}`,
      queryParams
    );

    const total = countResult[0].total;
    const totalPages = Math.ceil(total / limit);

    // Get results with pagination
    const [results] = await pool.execute(
      `SELECT 
        ar.id,
        ar.student_id,
        s.name as student_name,
        ar.subject_id,
        sub.name as subject_name,
        ar.assessment_type,
        ar.score,
        ar.max_score,
        ar.grade,
        ar.semester,
        ar.academic_year,
        ar.assessment_date,
        ar.remarks
       FROM academic_results ar
       JOIN students s ON ar.student_id = s.id
       JOIN subjects sub ON ar.subject_id = sub.id
       WHERE ${whereConditions.join(' AND ')}
       ORDER BY ar.assessment_date DESC, ar.id DESC
       LIMIT ? OFFSET ?`,
      [...queryParams, limit, offset]
    );

    const formattedResults = results.map(result => ({
      id: result.id,
      student_id: result.student_id,
      student_name: result.student_name,
      subject_id: result.subject_id,
      subject_name: result.subject_name,
      assessment_type: result.assessment_type,
      score: result.score,
      max_score: result.max_score,
      grade: result.grade,
      semester: result.semester,
      academic_year: result.academic_year,
      assessment_date: result.assessment_date,
      remarks: result.remarks
    }));

    res.json({
      success: true,
      data: {
        results: formattedResults,
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
    console.error('Get results error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// GET /api/results/overview
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
          summary: {},
          subjects: [],
          performanceTrend: [],
          gradeDistribution: []
        }
      });
    }

    const childIds = children.map(child => child.id);
    const currentSemester = semester || children[0]?.semester || 'Semester 2';
    const currentYear = academicYear || children[0]?.academic_year || '2024/2025';

    // Get overall summary
    const [summaryResults] = await pool.execute(
      `SELECT 
        COUNT(DISTINCT ar.subject_id) as total_subjects,
        COUNT(*) as total_assessments,
        AVG(ar.score) as average_score,
        COUNT(DISTINCT ar.student_id) as total_students
       FROM academic_results ar
       WHERE ar.student_id IN (${childIds.map(() => '?').join(',')})
       AND ar.semester = ? AND ar.academic_year = ?`,
      [...childIds, currentSemester, currentYear]
    );

    const overallGPA = calculateGPA(summaryResults);
    const totalTests = summaryResults[0]?.total_assessments || 0;

    // Get class rank (mock data for demo)
    const classRank = Math.floor(Math.random() * 20) + 1;

    const summary = {
      overallGPA: parseFloat(overallGPA),
      classRank: `${classRank}th`,
      totalTests,
      totalStudents: children.length
    };

    // Get subject performance
    const [subjectResults] = await pool.execute(
      `SELECT 
        s.name as subject_name,
        s.code as subject_code,
        COUNT(ar.id) as total_tests,
        AVG(ar.score) as average_score,
        MAX(ar.score) as highest_score,
        MIN(ar.score) as lowest_score
       FROM academic_results ar
       JOIN subjects s ON ar.subject_id = s.id
       WHERE ar.student_id IN (${childIds.map(() => '?').join(',')})
       AND ar.semester = ? AND ar.academic_year = ?
       GROUP BY s.id, s.name, s.code
       ORDER BY s.name`,
      [...childIds, currentSemester, currentYear]
    );

    const subjects = subjectResults.map(subject => ({
      name: subject.subject_name,
      code: subject.subject_code,
      current: Math.round(subject.average_score),
      previous: Math.round(subject.average_score - (Math.random() * 5)), // Mock previous score
      trend: Math.random() > 0.5 ? 'up' : 'down',
      tests: subject.total_tests,
      highest: subject.highest_score,
      lowest: subject.lowest_score
    }));

    // Get performance trend (mock data for demo)
    const performanceTrend = [
      { month: 'Sep', Mathematics: 82, Science: 85, English: 88, History: 86 },
      { month: 'Oct', Mathematics: 85, Science: 87, English: 86, History: 87 },
      { month: 'Nov', Mathematics: 87, Science: 90, English: 85, History: 89 },
      { month: 'Dec', Mathematics: 88, Science: 92, English: 85, History: 90 }
    ];

    // Get grade distribution
    const [gradeResults] = await pool.execute(
      `SELECT ar.grade, COUNT(*) as count
       FROM academic_results ar
       WHERE ar.student_id IN (${childIds.map(() => '?').join(',')})
       AND ar.semester = ? AND ar.academic_year = ?
       GROUP BY ar.grade
       ORDER BY ar.grade`,
      [...childIds, currentSemester, currentYear]
    );

    const gradeDistribution = gradeResults.map(grade => ({
      grade: grade.grade,
      count: grade.count
    }));

    res.json({
      success: true,
      data: {
        summary,
        subjects,
        performanceTrend,
        gradeDistribution
      }
    });
  } catch (error) {
    console.error('Results overview error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// GET /api/results/student/:studentId
router.get('/student/:studentId', authenticateToken, checkStudentAccess, validatePagination, async (req, res) => {
  try {
    const { studentId } = req.params;
    const { semester, academicYear, subjectId } = req.query;
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

    const student = students[0];
    const currentSemester = semester || student.semester;
    const currentYear = academicYear || student.academic_year;

    // Build query conditions
    const conditions = ['ar.student_id = ?'];
    const queryParams = [studentId];

    if (semester) {
      conditions.push('ar.semester = ?');
      queryParams.push(semester);
    }
    if (academicYear) {
      conditions.push('ar.academic_year = ?');
      queryParams.push(academicYear);
    }
    if (subjectId) {
      conditions.push('ar.subject_id = ?');
      queryParams.push(subjectId);
    }

    const whereClause = conditions.join(' AND ');

    // Get academic results
    const [results] = await pool.execute(
      `SELECT ar.*, s.name as subject_name, s.code as subject_code, s.credits
       FROM academic_results ar
       JOIN subjects s ON ar.subject_id = s.id
       WHERE ${whereClause}
       ORDER BY ar.assessment_date DESC
       LIMIT ? OFFSET ?`,
      [...queryParams, limit, offset]
    );

    // Get total count
    const [countResult] = await pool.execute(
      `SELECT COUNT(*) as total
       FROM academic_results ar
       WHERE ${whereClause}`,
      queryParams
    );

    const total = countResult[0].total;
    const totalPages = Math.ceil(total / limit);

    // Calculate GPA for this student
    const [gpaResults] = await pool.execute(
      `SELECT ar.grade, s.credits
       FROM academic_results ar
       JOIN subjects s ON ar.subject_id = s.id
       WHERE ar.student_id = ? AND ar.semester = ? AND ar.academic_year = ?`,
      [studentId, currentSemester, currentYear]
    );

    const gpa = calculateGPA(gpaResults);

    // Get subject summary
    const [subjectSummary] = await pool.execute(
      `SELECT 
        s.name as subject_name,
        COUNT(ar.id) as total_assessments,
        AVG(ar.score) as average_score,
        MAX(ar.score) as highest_score,
        MIN(ar.score) as lowest_score
       FROM academic_results ar
       JOIN subjects s ON ar.subject_id = s.id
       WHERE ar.student_id = ? AND ar.semester = ? AND ar.academic_year = ?
       GROUP BY s.id, s.name
       ORDER BY s.name`,
      [studentId, currentSemester, currentYear]
    );

    res.json({
      success: true,
      data: {
        student: {
          id: student.id,
          name: student.name,
          grade: student.grade,
          class: student.class,
          semester: currentSemester,
          academicYear: currentYear
        },
        summary: {
          gpa: parseFloat(gpa),
          totalAssessments: total,
          subjects: subjectSummary.length
        },
        results: results.map(result => ({
          id: result.id,
          subject: result.subject_name,
          subjectCode: result.subject_code,
          assessmentType: result.assessment_type,
          score: result.score,
          maxScore: result.max_score,
          grade: result.grade,
          date: result.assessment_date,
          remarks: result.remarks
        })),
        subjects: subjectSummary.map(subject => ({
          name: subject.subject_name,
          totalAssessments: subject.total_assessments,
          averageScore: Math.round(subject.average_score),
          highestScore: subject.highest_score,
          lowestScore: subject.lowest_score
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
    console.error('Get student results error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// POST /api/results
router.post('/', authenticateToken, validateAcademicResult, async (req, res) => {
  try {
    const { studentId, subjectId, assessmentType, score, maxScore, grade, semester, academicYear, assessmentDate, remarks } = req.body;

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

    // Auto-generate grade if not provided
    const finalGrade = grade || getGradeLetter(score);

    // Insert academic result
    const [result] = await pool.execute(
      `INSERT INTO academic_results 
       (student_id, subject_id, assessment_type, score, max_score, grade, semester, academic_year, assessment_date, remarks)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [studentId, subjectId, assessmentType, score, maxScore || 100, finalGrade, semester, academicYear, assessmentDate, remarks]
    );

    res.status(201).json({
      success: true,
      message: 'Academic result added successfully',
      data: {
        id: result.insertId,
        studentId,
        subjectId,
        assessmentType,
        score,
        grade: finalGrade,
        date: assessmentDate
      }
    });
  } catch (error) {
    console.error('Add academic result error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// PUT /api/results/:resultId
router.put('/:resultId', authenticateToken, validateAcademicResult, async (req, res) => {
  try {
    const { resultId } = req.params;
    const { score, maxScore, grade, remarks } = req.body;

    // Check if result exists and parent has access
    const [results] = await pool.execute(
      `SELECT ar.id FROM academic_results ar
       JOIN students s ON ar.student_id = s.id
       JOIN parent_student ps ON s.id = ps.student_id
       WHERE ar.id = ? AND ps.parent_id = ?`,
      [resultId, req.user.id]
    );

    if (results.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Academic result not found'
      });
    }

    // Build update query
    const updateFields = [];
    const updateValues = [];

    if (score !== undefined) {
      updateFields.push('score = ?');
      updateValues.push(score);
    }
    if (maxScore !== undefined) {
      updateFields.push('max_score = ?');
      updateValues.push(maxScore);
    }
    if (grade !== undefined) {
      updateFields.push('grade = ?');
      updateValues.push(grade);
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

    updateValues.push(resultId);

    const [result] = await pool.execute(
      `UPDATE academic_results SET ${updateFields.join(', ')} WHERE id = ?`,
      updateValues
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Academic result not found'
      });
    }

    res.json({
      success: true,
      message: 'Academic result updated successfully'
    });
  } catch (error) {
    console.error('Update academic result error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// DELETE /api/results/:resultId
router.delete('/:resultId', authenticateToken, async (req, res) => {
  try {
    const { resultId } = req.params;

    // Check if result exists and parent has access
    const [results] = await pool.execute(
      `SELECT ar.id FROM academic_results ar
       JOIN students s ON ar.student_id = s.id
       JOIN parent_student ps ON s.id = ps.student_id
       WHERE ar.id = ? AND ps.parent_id = ?`,
      [resultId, req.user.id]
    );

    if (results.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Academic result not found'
      });
    }

    const [result] = await pool.execute(
      'DELETE FROM academic_results WHERE id = ?',
      [resultId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Academic result not found'
      });
    }

    res.json({
      success: true,
      message: 'Academic result deleted successfully'
    });
  } catch (error) {
    console.error('Delete academic result error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router; 