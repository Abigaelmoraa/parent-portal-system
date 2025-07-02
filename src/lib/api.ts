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
  role: string; // 'admin' or 'parent'
}

export interface Student {
  id: number;
  admission_number: string;
  name: string;
  date_of_birth: string;
  email?: string;
  phone?: string;
  address?: string;
  gender: string;
  course: string;
  grade: string;
  class: string;
  academic_year: string;
  semester: string;
  emergency_contact?: string;
  is_active: boolean | number;
  created_at: string;
  updated_at?: string;
  academicStats?: {
    totalSubjects: number;
    averageScore: number;
    totalAssessments: number;
  };
  attendanceStats?: {
    totalDays: number;
    presentDays: number;
    absentDays: number;
    lateDays: number;
    attendanceRate: number;
  };
  feeStats?: {
    totalFees: string | number;
    paidFees: string | number;
    outstandingFees: string | number;
  };
  relationship_type?: string;
  is_primary_guardian?: boolean | number;
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

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface Notification {
  id: number;
  title?: string;
  message: string;
  type?: string;
  is_read: boolean;
  created_at: string;
}

// --- ADMIN API ---

export type AdminStudentPayload = Partial<Student>;

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
    return this.request('/auth/me');
  }

  // Dashboard endpoints
  async getDashboardData(): Promise<DashboardData> {
    const response = await this.request('/dashboard');
    return response.data;
  }

  // Students endpoints
  async getStudents(): Promise<Student[]> {
    const response = await this.request('/students');
    return response.data?.students || [];
  }

  async getStudent(id: number): Promise<Student> {
    return this.request(`/students/${id}`);
  }

  // Results endpoints
  async getResults(studentId?: number): Promise<AcademicResult[]> {
    const endpoint = studentId ? `/results/student/${studentId}` : '/results';
    const response = await this.request(endpoint);
    return response.data.results || response.data;
  }

  // Attendance endpoints
  async getAttendance(studentId?: number): Promise<Attendance[]> {
    const endpoint = studentId ? `/attendance/student/${studentId}` : '/attendance';
    const response = await this.request(endpoint);
    return response.data.attendance || response.data;
  }

  // Financials endpoints
  async getFinancials(studentId?: number) {
    const endpoint = studentId ? `/financials/student/${studentId}` : '/financials';
    const response = await this.request(endpoint);
    return response.data.payments || response.data;
  }

  async getFeeStructure(): Promise<FeeStructure[]> {
    const response = await this.request('/financials/fee-structure');
    return response.data.feeStructure || response.data;
  }

  async getFeePayments(studentId?: number): Promise<FeePayment[]> {
    const endpoint = studentId ? `/financials/payments?studentId=${studentId}` : '/financials/payments';
    const response = await this.request(endpoint);
    return response.data.payments || response.data;
  }

  async getNotifications(page = 1, limit = 10): Promise<{ notifications: Notification[]; pagination: Pagination }> {
    const response = await this.request(`/dashboard/notifications?page=${page}&limit=${limit}`);
    return response.data;
  }

  async markNotificationRead(id: number): Promise<void> {
    await this.request(`/dashboard/notifications/${id}/read`, { method: 'PUT' });
  }

  // Helper to clean params
  private cleanParams(params: Record<string, unknown>): Record<string, string> {
    return Object.fromEntries(
      Object.entries(params)
        .filter(([, v]) => v !== undefined && v !== null && v !== '')
        .map(([k, v]) => [k, String(v)])
    );
  }

  // Admin: Dashboard stats
  async getAdminDashboard() {
    return this.request('/admin/dashboard');
  }

  // Admin: Get all students
  async getAdminStudents(params: { page?: number; limit?: number; search?: string; grade?: string; course?: string } = {}) {
    const cleanParams = this.cleanParams(params);
    const query = new URLSearchParams(cleanParams).toString();
    return this.request(`/admin/students${query ? `?${query}` : ''}`);
  }

  // Admin: Create student
  async createAdminStudent(payload: AdminStudentPayload) {
    return this.request('/admin/students', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  // Admin: Update student
  async updateAdminStudent(studentId: number, payload: AdminStudentPayload) {
    return this.request(`/admin/students/${studentId}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  }

  // Admin: Delete student
  async deleteAdminStudent(studentId: number) {
    return this.request(`/admin/students/${studentId}`, {
      method: 'DELETE',
    });
  }

  // Admin: Results endpoints
  async getAdminResults(params: { search?: string; studentId?: number } = {}) {
    const cleanParams = this.cleanParams(params);
    const query = new URLSearchParams(cleanParams).toString();
    return this.request(`/admin/results${query ? `?${query}` : ''}`);
  }

  async createAdminResult(payload: Partial<AcademicResult>) {
    return this.request('/admin/results', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async updateAdminResult(id: number, payload: Partial<AcademicResult>) {
    return this.request(`/admin/results/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  }

  async deleteAdminResult(id: number) {
    return this.request(`/admin/results/${id}`, {
      method: 'DELETE',
    });
  }

  // Admin: Attendance endpoints
  async getAdminAttendance(params: { search?: string; studentId?: number; date?: string; status?: string; startDate?: string; endDate?: string } = {}) {
    const cleanParams = this.cleanParams(params);
    const query = new URLSearchParams(cleanParams).toString();
    return this.request(`/admin/attendance${query ? `?${query}` : ''}`);
  }

  async createAdminAttendance(payload: Partial<Attendance>) {
    return this.request('/admin/attendance', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async updateAdminAttendance(id: number, payload: Partial<Attendance>) {
    return this.request(`/admin/attendance/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  }

  async deleteAdminAttendance(id: number) {
    return this.request(`/admin/attendance/${id}`, {
      method: 'DELETE',
    });
  }

  async createBulkAttendance(date: string, records: Array<{ student_id: number; status: string; time_in?: string; time_out?: string; remarks?: string }>) {
    return this.request('/admin/attendance/bulk', {
      method: 'POST',
      body: JSON.stringify({ date, records }),
    });
  }

  async getAdminAttendanceStats(params: { startDate?: string; endDate?: string; grade?: string; course?: string } = {}) {
    const cleanParams = this.cleanParams(params);
    const query = new URLSearchParams(cleanParams).toString();
    return this.request(`/admin/attendance/statistics${query ? `?${query}` : ''}`);
  }

  // Admin: Get all subjects
  async getAdminSubjects() {
    return this.request('/admin/subjects');
  }
}

// Create and export API instance
export const api = new ApiService(API_BASE_URL);

