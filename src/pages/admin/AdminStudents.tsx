import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, Plus, Edit, Trash2, Eye } from 'lucide-react';
import { api, Student } from '@/lib/api';

const AdminStudents: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDialog, setShowDialog] = useState(false);
  const [editStudent, setEditStudent] = useState<Student | null>(null);
  const [form, setForm] = useState<Partial<Student>>({});

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const res = await api.getAdminStudents({ search: searchTerm });
      setStudents(res.data.students);
    } catch (e) {
      console.error('Error fetching students:', e);
    }
    setLoading(false);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchStudents();
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
      console.error('Error deleting student:', e);
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
      console.error('Error saving student:', e);
    }
  };

  const filteredStudents = students.filter(student =>
    student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.admission_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Student Management</h1>
          <p className="text-gray-600">Manage all students in the system</p>
        </div>
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogTrigger asChild>
            <Button onClick={() => { setEditStudent(null); setForm({}); setShowDialog(true); }}>
              <Plus className="h-4 w-4 mr-2" />
              Add Student
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogTitle>{editStudent ? 'Edit Student' : 'Add New Student'}</DialogTitle>
            <form className="space-y-4" onSubmit={handleFormSubmit}>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Admission Number</label>
                  <Input 
                    name="admission_number" 
                    placeholder="e.g., 2024/001" 
                    value={form.admission_number || ''} 
                    onChange={handleFormChange} 
                    required 
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Full Name</label>
                  <Input 
                    name="name" 
                    placeholder="Student Name" 
                    value={form.name || ''} 
                    onChange={handleFormChange} 
                    required 
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Date of Birth</label>
                  <Input 
                    name="date_of_birth" 
                    type="date" 
                    value={form.date_of_birth || ''} 
                    onChange={handleFormChange} 
                    required 
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Gender</label>
                  <Input 
                    name="gender" 
                    placeholder="Male/Female" 
                    value={form.gender || ''} 
                    onChange={handleFormChange} 
                    required 
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Email</label>
                  <Input 
                    name="email" 
                    type="email" 
                    placeholder="student@email.com" 
                    value={form.email || ''} 
                    onChange={handleFormChange} 
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Phone</label>
                  <Input 
                    name="phone" 
                    placeholder="Phone Number" 
                    value={form.phone || ''} 
                    onChange={handleFormChange} 
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Course</label>
                  <Input 
                    name="course" 
                    placeholder="e.g., Computer Science" 
                    value={form.course || ''} 
                    onChange={handleFormChange} 
                    required 
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Grade</label>
                  <Input 
                    name="grade" 
                    placeholder="e.g., Grade 12" 
                    value={form.grade || ''} 
                    onChange={handleFormChange} 
                    required 
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Class</label>
                  <Input 
                    name="class" 
                    placeholder="e.g., 12A" 
                    value={form.class || ''} 
                    onChange={handleFormChange} 
                    required 
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Academic Year</label>
                  <Input 
                    name="academic_year" 
                    placeholder="e.g., 2024/2025" 
                    value={form.academic_year || ''} 
                    onChange={handleFormChange} 
                    required 
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Semester</label>
                  <Input 
                    name="semester" 
                    placeholder="e.g., Semester 1" 
                    value={form.semester || ''} 
                    onChange={handleFormChange} 
                    required 
                  />
                </div>
                <div className="col-span-2">
                  <label className="text-sm font-medium">Address</label>
                  <Input 
                    name="address" 
                    placeholder="Student Address" 
                    value={form.address || ''} 
                    onChange={handleFormChange} 
                  />
                </div>
                <div className="col-span-2">
                  <label className="text-sm font-medium">Emergency Contact</label>
                  <Input 
                    name="emergency_contact" 
                    placeholder="Emergency Contact Number" 
                    value={form.emergency_contact || ''} 
                    onChange={handleFormChange} 
                  />
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editStudent ? 'Update Student' : 'Create Student'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search Bar */}
      <Card>
        <CardContent className="p-4">
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search students by name, admission number, or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button type="submit">Search</Button>
          </form>
        </CardContent>
      </Card>

      {/* Students Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Students ({filteredStudents.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading students...</div>
          ) : (
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
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStudents.map((student) => (
                    <TableRow key={student.id}>
                      <TableCell className="font-medium">{student.admission_number}</TableCell>
                      <TableCell>{student.name}</TableCell>
                      <TableCell>{student.grade}</TableCell>
                      <TableCell>{student.course}</TableCell>
                      <TableCell>{student.class}</TableCell>
                      <TableCell>{student.email || '-'}</TableCell>
                      <TableCell>{student.phone || '-'}</TableCell>
                      <TableCell>
                        <Badge variant={student.is_active ? "default" : "secondary"}>
                          {student.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => handleEdit(student)}>
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button size="sm" variant="outline">
                            <Eye className="h-3 w-3" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="destructive" 
                            onClick={() => handleDelete(student.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminStudents; 