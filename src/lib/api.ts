// API Base URL
const API_BASE_URL = 'http://localhost:5000/api';

// Types
export interface User {
  id: number;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  relationship?: string;
  created_at: string;
}

export interface Student {
  id: number;
  admission_number: string;
  name: string;
  date_of_birth: string;
  email?: string;
  phone?: string;
  address?: string;
  gender: 'Male' | 'Female' | 'Other';
  course: string;
  grade: string;
  class: string;
  academic_year: string;
  semester: string;
  emergency_contact?: string;
  created_at: string;
}

export interface AcademicResult {
  id: number;
  student_id: number;
  subject_id: number;
  subject_name: string;
  assessment_type: 'CAT' | 'Assignment' | 'Presentation' | 'Quiz' | 'Final Exam' | 'Project';
  score: number;
  max_score: number;
  grade?: string;
  semester: string;
  academic_year: string;
  assessment_date: string;
  remarks?: string;
}

export interface Attendance {
  id: number;
  student_id: number;
  subject_id: number;
  subject_name: string;
  date: string;
  status: 'Present' | 'Absent' | 'Late' | 'Excused';
  time_in?: string;
  time_out?: string;
  remarks?: string;
}

export interface FeeStructure {
  id: number;
  fee_type: string;
  amount: number;
  semester: string;
  academic_year: string;
  due_date: string;
  description?: string;
}

export interface FeePayment {
  id: number;
  student_id: number;
  fee_structure_id: number;
  fee_type: string;
  transaction_id: string;
  amount_paid: number;
  payment_date: string;
  payment_method: 'Bank Transfer' | 'Mobile Money' | 'Cash' | 'Check' | 'Online';
  status: 'Paid' | 'Pending' | 'Failed' | 'Refunded';
  receipt_number?: string;
  remarks?: string;
}

export interface DashboardData {
  total_students: number;
  total_results: number;
  total_attendance: number;
  total_payments: number;
  recent_results: AcademicResult[];
  recent_attendance: Attendance[];
  recent_payments: FeePayment[];
  fee_summary: {
    total_fees: number;
    paid_fees: number;
    outstanding_fees: number;
  };
}

// Helper function to get auth token
const getAuthToken = (): string | null => {
  return localStorage.getItem('parenthub_token');
};

// Helper function to handle API responses
const handleResponse = async (response: Response) => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
  }
  return response.json();
};

// API Service Class
class ApiService {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const token = getAuthToken();
    const url = `${this.baseURL}${endpoint}`;
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };

    const response = await fetch(url, config);
    return handleResponse(response);
  }

  // Auth endpoints
  async login(email: string, password: string) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async signup(name: string, email: string, password: string) {
    return this.request('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    });
  }

  async getProfile() {
    return this.request('/auth/profile');
  }

  // Dashboard endpoints
  async getDashboardData(): Promise<DashboardData> {
    return this.request('/dashboard');
  }

  // Students endpoints
  async getStudents(): Promise<Student[]> {
    return this.request('/students');
  }

  async getStudent(id: number): Promise<Student> {
    return this.request(`/students/${id}`);
  }

  // Results endpoints
  async getResults(studentId?: number): Promise<AcademicResult[]> {
    const endpoint = studentId ? `/results/${studentId}` : '/results';
    return this.request(endpoint);
  }

  // Attendance endpoints
  async getAttendance(studentId?: number): Promise<Attendance[]> {
    const endpoint = studentId ? `/attendance/${studentId}` : '/attendance';
    return this.request(endpoint);
  }

  // Financials endpoints
  async getFinancials(studentId?: number) {
    const endpoint = studentId ? `/financials/${studentId}` : '/financials';
    return this.request(endpoint);
  }

  async getFeeStructure(): Promise<FeeStructure[]> {
    return this.request('/financials/fee-structure');
  }

  async getFeePayments(studentId?: number): Promise<FeePayment[]> {
    const endpoint = studentId ? `/financials/payments/${studentId}` : '/financials/payments';
    return this.request(endpoint);
  }
}

// Create and export API instance
export const api = new ApiService(API_BASE_URL);

