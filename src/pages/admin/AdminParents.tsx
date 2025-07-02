import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { api, Student } from '@/lib/api';
import { toast } from 'sonner';

interface Parent {
  id: number;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  created_at: string;
  students: Array<{
    student_id: number;
    student_name: string;
    admission_number: string;
    relationship_type: string;
    is_primary_guardian: boolean;
  }>;
}

const relationshipTypes = [
  'Father', 'Mother', 'Guardian', 'Sponsor', 'Other'
];

const AdminParents: React.FC = () => {
  const [parents, setParents] = useState<Parent[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [selectedParent, setSelectedParent] = useState<Parent | null>(null);
  const [assignForm, setAssignForm] = useState({
    student_id: '',
    relationship_type: 'Father',
    is_primary_guardian: false
  });
  const [unassigning, setUnassigning] = useState<{ parentId: number; studentId: number } | null>(null);

  useEffect(() => {
    loadParents();
    loadStudents();
  }, []);

  const loadParents = async () => {
    setLoading(true);
    try {
      const res = await api.getAdminParents();
      setParents(res.data.parents || []);
    } catch (e) {
      toast.error('Failed to load parents');
    } finally {
      setLoading(false);
    }
  };

  const loadStudents = async () => {
    try {
      const res = await api.getAdminStudents({ page: 1, limit: 100 });
      setStudents(res.data.students || []);
    } catch (e) {
      toast.error('Failed to load students');
    }
  };

  const openAssignDialog = (parent: Parent) => {
    setSelectedParent(parent);
    setAssignForm({ student_id: '', relationship_type: 'Father', is_primary_guardian: false });
    setAssignDialogOpen(true);
  };

  const handleAssign = async () => {
    if (!selectedParent || !assignForm.student_id || !assignForm.relationship_type) {
      toast.error('Please fill all fields');
      return;
    }
    try {
      await api.assignStudentToParent(selectedParent.id, {
        student_id: parseInt(assignForm.student_id),
        relationship_type: assignForm.relationship_type,
        is_primary_guardian: assignForm.is_primary_guardian
      });
      toast.success('Student assigned to parent');
      setAssignDialogOpen(false);
      loadParents();
    } catch (e: any) {
      toast.error(e.message || 'Failed to assign student');
    }
  };

  const handleUnassign = async (parentId: number, studentId: number) => {
    setUnassigning({ parentId, studentId });
    try {
      await api.unassignStudentFromParent(parentId, studentId);
      toast.success('Student unassigned from parent');
      loadParents();
    } catch (e: any) {
      toast.error(e.message || 'Failed to unassign student');
    } finally {
      setUnassigning(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Parent-Student Management</h1>
          <p className="text-muted-foreground">View and manage parent-student relationships</p>
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Parents</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Students</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {parents.map((parent) => (
                  <TableRow key={parent.id}>
                    <TableCell>{parent.name}</TableCell>
                    <TableCell>{parent.email}</TableCell>
                    <TableCell>{parent.phone || '-'}</TableCell>
                    <TableCell>
                      {parent.students.length === 0 ? (
                        <span className="text-muted-foreground">No students</span>
                      ) : (
                        <ul className="space-y-1">
                          {parent.students.map((s) => (
                            <li key={s.student_id} className="flex items-center gap-2">
                              <span className="font-medium">{s.student_name}</span>
                              <span className="text-xs text-muted-foreground">({s.admission_number})</span>
                              <span className="text-xs bg-gray-100 px-2 py-0.5 rounded">
                                {s.relationship_type}{s.is_primary_guardian ? ' (Primary)' : ''}
                              </span>
                              <Button
                                size="xs"
                                variant="destructive"
                                disabled={unassigning?.parentId === parent.id && unassigning?.studentId === s.student_id}
                                onClick={() => handleUnassign(parent.id, s.student_id)}
                              >
                                Unassign
                              </Button>
                            </li>
                          ))}
                        </ul>
                      )}
                    </TableCell>
                    <TableCell>
                      <Dialog open={assignDialogOpen && selectedParent?.id === parent.id} onOpenChange={setAssignDialogOpen}>
                        <DialogTrigger asChild>
                          <Button size="sm" onClick={() => openAssignDialog(parent)}>
                            Assign Student
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Assign Student to {parent.name}</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <label className="block text-sm font-medium mb-1">Student</label>
                              <Select value={assignForm.student_id} onValueChange={value => setAssignForm(f => ({ ...f, student_id: value }))}>
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
                              <label className="block text-sm font-medium mb-1">Relationship Type</label>
                              <Select value={assignForm.relationship_type} onValueChange={value => setAssignForm(f => ({ ...f, relationship_type: value }))}>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {relationshipTypes.map(type => (
                                    <SelectItem key={type} value={type}>{type}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="flex items-center gap-2">
                              <Checkbox
                                checked={assignForm.is_primary_guardian}
                                onCheckedChange={checked => setAssignForm(f => ({ ...f, is_primary_guardian: !!checked }))}
                                id="primary-guardian"
                              />
                              <label htmlFor="primary-guardian" className="text-sm">Primary Guardian</label>
                            </div>
                          </div>
                          <DialogFooter>
                            <Button variant="outline" onClick={() => setAssignDialogOpen(false)}>Cancel</Button>
                            <Button onClick={handleAssign}>Assign</Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminParents; 