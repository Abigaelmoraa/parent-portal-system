import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Attendance, AcademicResult, Student, FeeStructure, FeePayment } from './api';

export interface AttendanceRecord extends Attendance {
  student_name: string;
  admission_number: string;
  grade: string;
  course: string;
}

export interface FinancialSummary {
  student_name: string;
  admission_number: string;
  total_fees: number;
  paid_fees: number;
  outstanding_fees: number;
}

export const generateAttendanceReport = (
  attendance: AttendanceRecord[],
  stats: any,
  filters: any = {}
) => {
  const doc = new jsPDF();
  
  // Header
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('Attendance Report', 105, 20, { align: 'center' });
  
  // Subtitle
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 105, 30, { align: 'center' });
  
  // Filters info
  if (filters.startDate || filters.endDate) {
    doc.setFontSize(10);
    doc.text(`Period: ${filters.startDate || 'All'} - ${filters.endDate || 'All'}`, 105, 40, { align: 'center' });
  }
  
  // Statistics
  if (stats) {
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Summary Statistics', 20, 55);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Total Records: ${stats.total_records || 0}`, 20, 65);
    doc.text(`Present: ${stats.present_count || 0}`, 20, 72);
    doc.text(`Absent: ${stats.absent_count || 0}`, 20, 79);
    doc.text(`Late: ${stats.late_count || 0}`, 20, 86);
    doc.text(`Attendance Rate: ${stats.attendanceRate ? `${stats.attendanceRate.toFixed(1)}%` : 'N/A'}`, 20, 93);
  }
  
  // Table
  const tableData = attendance.map(record => [
    record.student_name,
    record.admission_number,
    record.grade,
    record.course,
    record.subject_name,
    new Date(record.date).toLocaleDateString(),
    record.status,
    record.time_in || '-',
    record.time_out || '-',
    record.remarks || '-'
  ]);
  
  autoTable(doc, {
    startY: stats ? 105 : 50,
    head: [['Student', 'Admission #', 'Grade', 'Course', 'Subject', 'Date', 'Status', 'Time In', 'Time Out', 'Remarks']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [41, 128, 185],
      textColor: 255,
      fontStyle: 'bold'
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245]
    },
    styles: {
      fontSize: 8,
      cellPadding: 2
    },
    columnStyles: {
      0: { cellWidth: 30 },
      1: { cellWidth: 25 },
      2: { cellWidth: 15 },
      3: { cellWidth: 20 },
      4: { cellWidth: 25 },
      5: { cellWidth: 20 },
      6: { cellWidth: 15 },
      7: { cellWidth: 15 },
      8: { cellWidth: 15 },
      9: { cellWidth: 20 }
    }
  });
  
  return doc;
};

export const generateFinancialReport = (
  feeStructure: FeeStructure[],
  summary: FinancialSummary[],
  payments: FeePayment[] = []
) => {
  const doc = new jsPDF();
  
  // Header
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('Financial Report', 105, 20, { align: 'center' });
  
  // Subtitle
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 105, 30, { align: 'center' });
  
  // Fee Structure Section
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Fee Structure', 20, 45);
  
  const feeData = feeStructure.map(fee => [
    fee.fee_type,
    `$${Number(fee.amount).toFixed(2)}`,
    fee.semester,
    fee.academic_year,
    new Date(fee.due_date).toLocaleDateString(),
    fee.description || '-'
  ]);
  
  autoTable(doc, {
    startY: 50,
    head: [['Fee Type', 'Amount', 'Semester', 'Academic Year', 'Due Date', 'Description']],
    body: feeData,
    theme: 'grid',
    headStyles: {
      fillColor: [46, 204, 113],
      textColor: 255,
      fontStyle: 'bold'
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245]
    },
    styles: {
      fontSize: 8,
      cellPadding: 2
    }
  });
  
  // Student Balances Section
  const currentY = 150; // Fixed position for second table
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Student Balances', 20, currentY);
  
  const summaryData = summary.map(s => [
    s.student_name,
    s.admission_number,
    `$${Number(s.total_fees).toFixed(2)}`,
    `$${Number(s.paid_fees).toFixed(2)}`,
    `$${Number(s.outstanding_fees).toFixed(2)}`
  ]);
  
  autoTable(doc, {
    startY: currentY + 5,
    head: [['Student', 'Admission #', 'Total Fees', 'Paid', 'Outstanding']],
    body: summaryData,
    theme: 'grid',
    headStyles: {
      fillColor: [155, 89, 182],
      textColor: 255,
      fontStyle: 'bold'
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245]
    },
    styles: {
      fontSize: 8,
      cellPadding: 2
    }
  });
  
  return doc;
};

export const generateResultsReport = (
  results: AcademicResult[],
  students: Student[] = []
) => {
  const doc = new jsPDF();
  
  // Header
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('Academic Results Report', 105, 20, { align: 'center' });
  
  // Subtitle
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 105, 30, { align: 'center' });
  
  // Summary Statistics
  const totalResults = results.length;
  const averageScore = results.length > 0 
    ? results.reduce((sum, r) => sum + (r.score / r.max_score * 100), 0) / results.length 
    : 0;
  
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Summary', 20, 45);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Total Results: ${totalResults}`, 20, 55);
  doc.text(`Average Score: ${averageScore.toFixed(1)}%`, 20, 62);
  
  // Results Table
  const resultsData = results.map(result => {
    const student = students.find(s => s.id === result.student_id);
    const percentage = (result.score / result.max_score * 100).toFixed(1);
    const grade = getGrade(percentage);
    
    return [
      student?.name || 'Unknown',
      student?.admission_number || 'N/A',
      result.subject_name,
      result.assessment_type,
      `${result.score}/${result.max_score}`,
      `${percentage}%`,
      grade,
      new Date(result.assessment_date).toLocaleDateString(),
      result.semester,
      result.academic_year
    ];
  });
  
  autoTable(doc, {
    startY: 75,
    head: [['Student', 'Admission #', 'Subject', 'Assessment', 'Score', 'Percentage', 'Grade', 'Date', 'Semester', 'Year']],
    body: resultsData,
    theme: 'grid',
    headStyles: {
      fillColor: [231, 76, 60],
      textColor: 255,
      fontStyle: 'bold'
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245]
    },
    styles: {
      fontSize: 7,
      cellPadding: 2
    },
    columnStyles: {
      0: { cellWidth: 25 },
      1: { cellWidth: 20 },
      2: { cellWidth: 20 },
      3: { cellWidth: 20 },
      4: { cellWidth: 15 },
      5: { cellWidth: 15 },
      6: { cellWidth: 10 },
      7: { cellWidth: 15 },
      8: { cellWidth: 15 },
      9: { cellWidth: 15 }
    }
  });
  
  return doc;
};

const getGrade = (percentage: string): string => {
  const num = parseFloat(percentage);
  if (num >= 80) return 'A';
  if (num >= 70) return 'B';
  if (num >= 60) return 'C';
  if (num >= 50) return 'D';
  return 'F';
};

export const downloadPDF = (doc: jsPDF, filename: string) => {
  doc.save(filename);
}; 