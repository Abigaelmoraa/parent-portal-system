import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Plus, Edit, Trash2, Eye } from 'lucide-react';
import { api, AcademicResult, Student } from '@/lib/api';
import { toast } from 'sonner';

const AdminResults: React.FC = () => {
  const [results, setResults] = useState<AcademicResult[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudent, setSelectedStudent] = useState('all');
  const [showDialog, setShowDialog] = useState(false);
  const [editResult, setEditResult] = useState<AcademicResult | null>(null);
  const [form, setForm] = useState<Partial<AcademicResult>>({});

  useEffect(() => {
    fetchStudents();
  }, []);

  useEffect(() => {
    fetchResults();
    // eslint-disable-next-line
  }, [searchTerm, selectedStudent]);

  const fetchResults = async () => {
    setLoading(true);
    try {
      const res = await api.getAdminResults({ 
        search: searchTerm,
        studentId: selectedStudent !== 'all' ? parseInt(selectedStudent) : undefined
      });
      setResults(res.data.results || []);
    } catch (e) {
      console.error('Error fetching results:', e);
      toast.error('Failed to fetch results');
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async () => {
    try {
      const res = await api.getAdminStudents();
      setStudents(res.data.students || []);
    } catch (e) {
      console.error('Error fetching students:', e);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchResults();
  };

  const handleEdit = (result: AcademicResult) => {
    setEditResult(result);
    setForm(result);
    setShowDialog(true);
  };

  const handleDelete = async (resultId: number) => {
    if (!window.confirm('Are you sure you want to delete this result?')) return;
    try {
      await api.deleteAdminResult(resultId);
      toast.success('Result deleted successfully');
      fetchResults();
    } catch (e) {
      console.error('Error deleting result:', e);
      toast.error('Failed to delete result');
    }
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editResult) {
        // Clean the payload: remove undefined, null, or empty string fields
        const cleanPayload = Object.fromEntries(
          Object.entries(form).filter(([, v]) => v !== undefined && v !== null && v !== '')
        );
        await api.updateAdminResult(editResult.id, cleanPayload);
        toast.success('Result updated successfully');
      } else {
        await api.createAdminResult(form);
        toast.success('Result created successfully');
      }
      setShowDialog(false);
      setEditResult(null);
      setForm({});
      fetchResults();
    } catch (e) {
      console.error('Error saving result:', e);
      toast.error('Failed to save result');
    }
  };

  const getGradeColor = (score: number) => {
    if (score >= 80) return 'bg-green-100 text-green-800';
    if (score >= 70) return 'bg-blue-100 text-blue-800';
    if (score >= 60) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Results Management</h1>
          <p className="text-gray-600">Manage student academic results</p>
        </div>
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogTrigger asChild>
            <Button onClick={() => { setEditResult(null); setForm({}); setShowDialog(true); }}>
              <Plus className="h-4 w-4 mr-2" />
              Add Result
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogTitle>{editResult ? 'Edit Result' : 'Add New Result'}</DialogTitle>
            <form className="space-y-4" onSubmit={handleFormSubmit}>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Student</label>
                  <Select 
                    value={form.student_id?.toString() || ''} 
                    onValueChange={(value) => setForm({ ...form, student_id: parseInt(value) })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select student" />
                    </SelectTrigger>
                    <SelectContent>
                      {students.map((student) => (
                        <SelectItem key={student.id} value={student.id.toString()}>
                          {student.name} ({student.admission_number})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Subject</label>
                  <Input 
                    name="subject_name" 
                    placeholder="Subject Name" 
                    value={form.subject_name || ''} 
                    onChange={handleFormChange} 
                    required 
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Assessment Type</label>
                  <Select 
                    value={form.assessment_type || ''} 
                    onValueChange={(value) => setForm({ ...form, assessment_type: value as any })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CAT">CAT</SelectItem>
                      <SelectItem value="Assignment">Assignment</SelectItem>
                      <SelectItem value="Presentation">Presentation</SelectItem>
                      <SelectItem value="Quiz">Quiz</SelectItem>
                      <SelectItem value="Final Exam">Final Exam</SelectItem>
                      <SelectItem value="Project">Project</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Score</label>
                  <Input 
                    name="score" 
                    type="number" 
                    placeholder="Score" 
                    value={form.score || ''} 
                    onChange={handleFormChange} 
                    required 
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Max Score</label>
                  <Input 
                    name="max_score" 
                    type="number" 
                    placeholder="Max Score" 
                    value={form.max_score || ''} 
                    onChange={handleFormChange} 
                    required 
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Assessment Date</label>
                  <Input 
                    name="assessment_date" 
                    type="date" 
                    value={form.assessment_date || ''} 
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
                <div className="col-span-2">
                  <label className="text-sm font-medium">Remarks</label>
                  <Input 
                    name="remarks" 
                    placeholder="Additional remarks" 
                    value={form.remarks || ''} 
                    onChange={handleFormChange} 
                  />
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editResult ? 'Update Result' : 'Create Result'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search and Filter */}
      <Card>
        <CardContent className="p-4">
          <form onSubmit={handleSearch} className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search by subject or student name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedStudent} onValueChange={setSelectedStudent}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by student" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Students</SelectItem>
                {students.map((student) => (
                  <SelectItem key={student.id} value={student.id.toString()}>
                    {student.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button type="submit">Search</Button>
          </form>
        </CardContent>
      </Card>

      {/* Results Table */}
      <Card>
        <CardHeader>
          <CardTitle>Academic Results ({results.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading results...</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Assessment</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead>Grade</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Semester</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {results.map((result) => (
                    <TableRow key={result.id}>
                      <TableCell className="font-medium">
                        {students.find(s => s.id === result.student_id)?.name || 'Unknown'}
                      </TableCell>
                      <TableCell>{result.subject_name}</TableCell>
                      <TableCell>{result.assessment_type}</TableCell>
                      <TableCell>
                        <Badge className={getGradeColor(result.score)}>
                          {result.score}/{result.max_score}
                        </Badge>
                      </TableCell>
                      <TableCell>{result.grade || '-'}</TableCell>
                      <TableCell>{new Date(result.assessment_date).toLocaleDateString()}</TableCell>
                      <TableCell>{result.semester}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => handleEdit(result)}>
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="destructive" 
                            onClick={() => handleDelete(result.id)}
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

export default AdminResults; 