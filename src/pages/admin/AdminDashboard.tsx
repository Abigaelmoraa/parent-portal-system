import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { api, Student } from '@/lib/api';

interface AdminDashboardStats {
  totalStudents: number;
  studentsByGrade: { grade: string; count: number }[];
  studentsByCourse: { course: string; count: number }[];
  recentAdmissions: any[];
  attendanceOverview: any;
  feeOverview: any;
}

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editStudent, setEditStudent] = useState<Student | null>(null);
  const [form, setForm] = useState<Partial<Student>>({});

  useEffect(() => {
    fetchStats();
    fetchStudents();
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    try {
      // Replace with actual admin dashboard API call
      const res = await api.getAdminDashboard();
      setStats(res.data);
    } catch (e) {
      // handle error
    }
    setLoading(false);
  };

  const fetchStudents = async () => {
    setLoading(true);
    try {
      // Replace with actual admin students API call
      const res = await api.getAdminStudents();
      setStudents(res.data.students);
    } catch (e) {
      // handle error
    }
    setLoading(false);
  };

  const handleEdit = (student: Student) => {
    setEditStudent(student);
    setForm(student);
    setShowDialog(true);
  };

  const handleDelete = async (studentId: number) => {
    if (!window.confirm('Are you sure you want to delete this student?')) return;
    try {
      await api.deleteAdminStudent(studentId);
      fetchStudents();
    } catch (e) {
      // handle error
    }
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editStudent) {
        await api.updateAdminStudent(editStudent.id, form);
      } else {
        await api.createAdminStudent(form);
      }
      setShowDialog(false);
      setEditStudent(null);
      setForm({});
      fetchStudents();
    } catch (e) {
      // handle error
    }
  };

  return (
    <div className="p-6 space-y-8">
      <h1 className="text-3xl font-bold mb-4">Admin Dashboard</h1>
      {loading && <div>Loading...</div>}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="p-4">
            <div className="text-lg font-semibold">Total Students</div>
            <div className="text-2xl font-bold">{stats.totalStudents}</div>
          </Card>
          <Card className="p-4">
            <div className="text-lg font-semibold">Recent Admissions</div>
            <div className="text-2xl font-bold">{stats.recentAdmissions.length}</div>
          </Card>
          <Card className="p-4">
            <div className="text-lg font-semibold">Attendance Rate</div>
            <div className="text-2xl font-bold">{stats.attendanceOverview.attendanceRate}%</div>
          </Card>
        </div>
      )}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-semibold">Manage Students</h2>
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogTrigger asChild>
            <Button onClick={() => { setEditStudent(null); setForm({}); setShowDialog(true); }}>Add Student</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogTitle>{editStudent ? 'Edit Student' : 'Add Student'}</DialogTitle>
            <form className="space-y-4" onSubmit={handleFormSubmit}>
              <Input name="admission_number" placeholder="Admission Number" value={form.admission_number || ''} onChange={handleFormChange} required />
              <Input name="name" placeholder="Name" value={form.name || ''} onChange={handleFormChange} required />
              <Input name="date_of_birth" placeholder="Date of Birth" value={form.date_of_birth || ''} onChange={handleFormChange} required />
              <Input name="email" placeholder="Email" value={form.email || ''} onChange={handleFormChange} />
              <Input name="phone" placeholder="Phone" value={form.phone || ''} onChange={handleFormChange} />
              <Input name="address" placeholder="Address" value={form.address || ''} onChange={handleFormChange} />
              <Input name="gender" placeholder="Gender" value={form.gender || ''} onChange={handleFormChange} required />
              <Input name="course" placeholder="Course" value={form.course || ''} onChange={handleFormChange} required />
              <Input name="grade" placeholder="Grade" value={form.grade || ''} onChange={handleFormChange} required />
              <Input name="class" placeholder="Class" value={form.class || ''} onChange={handleFormChange} required />
              <Input name="academic_year" placeholder="Academic Year" value={form.academic_year || ''} onChange={handleFormChange} required />
              <Input name="semester" placeholder="Semester" value={form.semester || ''} onChange={handleFormChange} required />
              <Input name="emergency_contact" placeholder="Emergency Contact" value={form.emergency_contact || ''} onChange={handleFormChange} />
              <div className="flex gap-2">
                <Button type="submit">{editStudent ? 'Update' : 'Create'}</Button>
                <Button type="button" variant="secondary" onClick={() => setShowDialog(false)}>Cancel</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Admission #</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Grade</TableHead>
              <TableHead>Course</TableHead>
              <TableHead>Class</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {students.map((student) => (
              <TableRow key={student.id}>
                <TableCell>{student.admission_number}</TableCell>
                <TableCell>{student.name}</TableCell>
                <TableCell>{student.grade}</TableCell>
                <TableCell>{student.course}</TableCell>
                <TableCell>{student.class}</TableCell>
                <TableCell>{student.email}</TableCell>
                <TableCell>{student.phone}</TableCell>
                <TableCell>
                  <Button size="sm" variant="outline" onClick={() => handleEdit(student)}>Edit</Button>
                  <Button size="sm" variant="destructive" className="ml-2" onClick={() => handleDelete(student.id)}>Delete</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default AdminDashboard; 