const { body, param, query, validationResult } = require('express-validator');

// Middleware to handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map(error => ({
        field: error.path,
        message: error.msg,
        value: error.value
      }))
    });
  }
  next();
};

// Validation rules for authentication
const validateLogin = [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  handleValidationErrors
];

const validateSignup = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 255 })
    .withMessage('Name must be between 2 and 255 characters'),
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  body('phone')
    .optional()
    .matches(/^\+?[\d\s\-\(\)]+$/)
    .withMessage('Please provide a valid phone number'),
  handleValidationErrors
];

// Validation rules for student management
const validateStudentUpdate = [
  param('studentId')
    .isInt()
    .withMessage('Student ID must be a valid integer'),
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 255 })
    .withMessage('Name must be between 2 and 255 characters'),
  body('email')
    .optional()
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  body('phone')
    .optional()
    .matches(/^\+?[\d\s\-\(\)]+$/)
    .withMessage('Please provide a valid phone number'),
  body('dateOfBirth')
    .optional()
    .isISO8601()
    .withMessage('Date of birth must be a valid date'),
  handleValidationErrors
];

// Validation rules for academic results
const validateAcademicResult = [
  body('studentId')
    .isInt()
    .withMessage('Student ID must be a valid integer'),
  body('subjectId')
    .isInt()
    .withMessage('Subject ID must be a valid integer'),
  body('assessmentType')
    .isIn(['CAT', 'Assignment', 'Presentation', 'Quiz', 'Final Exam', 'Project'])
    .withMessage('Invalid assessment type'),
  body('score')
    .isFloat({ min: 0, max: 100 })
    .withMessage('Score must be between 0 and 100'),
  body('maxScore')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Maximum score must be a positive number'),
  body('semester')
    .isIn(['Semester 1', 'Semester 2', 'Summer'])
    .withMessage('Invalid semester'),
  body('academicYear')
    .matches(/^\d{4}\/\d{4}$/)
    .withMessage('Academic year must be in format YYYY/YYYY'),
  body('assessmentDate')
    .isISO8601()
    .withMessage('Assessment date must be a valid date'),
  handleValidationErrors
];

// Validation rules for attendance
const validateAttendance = [
  body('studentId')
    .isInt()
    .withMessage('Student ID must be a valid integer'),
  body('subjectId')
    .isInt()
    .withMessage('Subject ID must be a valid integer'),
  body('date')
    .isISO8601()
    .withMessage('Date must be a valid date'),
  body('status')
    .isIn(['Present', 'Absent', 'Late', 'Excused'])
    .withMessage('Invalid attendance status'),
  body('timeIn')
    .optional()
    .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Time in must be in HH:MM format'),
  body('timeOut')
    .optional()
    .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Time out must be in HH:MM format'),
  handleValidationErrors
];

// Validation rules for fee payments
const validateFeePayment = [
  body('studentId')
    .isInt()
    .withMessage('Student ID must be a valid integer'),
  body('feeStructureId')
    .isInt()
    .withMessage('Fee structure ID must be a valid integer'),
  body('amountPaid')
    .isFloat({ min: 0 })
    .withMessage('Amount paid must be a positive number'),
  body('paymentDate')
    .isISO8601()
    .withMessage('Payment date must be a valid date'),
  body('paymentMethod')
    .isIn(['Bank Transfer', 'Mobile Money', 'Cash', 'Check', 'Online'])
    .withMessage('Invalid payment method'),
  body('receiptNumber')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Receipt number must be between 1 and 100 characters'),
  handleValidationErrors
];

// Validation rules for query parameters
const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('semester')
    .optional()
    .isIn(['Semester 1', 'Semester 2', 'Summer'])
    .withMessage('Invalid semester'),
  query('academicYear')
    .optional()
    .matches(/^\d{4}\/\d{4}$/)
    .withMessage('Academic year must be in format YYYY/YYYY'),
  handleValidationErrors
];

// Validation rules for date ranges
const validateDateRange = [
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Start date must be a valid date'),
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('End date must be a valid date'),
  handleValidationErrors
];

module.exports = {
  validateLogin,
  validateSignup,
  validateStudentUpdate,
  validateAcademicResult,
  validateAttendance,
  validateFeePayment,
  validatePagination,
  validateDateRange,
  handleValidationErrors
}; 