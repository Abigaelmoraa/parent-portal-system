import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { api } from '@/lib/api';

const semesters = ['Semester 1', 'Semester 2'];

const AdminFinancials: React.FC = () => {
  // Fee Structure State
  const [feeStructure, setFeeStructure] = useState<any[]>([]);
  const [feeLoading, setFeeLoading] = useState(false);
  const [showFeeDialog, setShowFeeDialog] = useState(false);
  const [editFee, setEditFee] = useState<any | null>(null);
  const [feeForm, setFeeForm] = useState<any>({});

  // Summary State
  const [summary, setSummary] = useState<any[]>([]);
  const [summaryLoading, setSummaryLoading] = useState(false);

  // Fetch Fee Structure
  const fetchFeeStructure = async () => {
    setFeeLoading(true);
    try {
      const res = await api.getFeeStructure();
      setFeeStructure(res.data.feeStructure);
    } catch (e) {
      // handle error
    }
    setFeeLoading(false);
  };

  // Fetch Summary
  const fetchSummary = async () => {
    setSummaryLoading(true);
    try {
      const res = await api.getFinancialSummary();
      setSummary(res.data.summary);
    } catch (e) {
      // handle error
    }
    setSummaryLoading(false);
  };

  useEffect(() => {
    fetchFeeStructure();
    fetchSummary();
  }, []);

  // Fee Structure Handlers
  const handleFeeFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFeeForm({ ...feeForm, [e.target.name]: e.target.value });
  };
  const handleFeeDialogOpen = (fee?: any) => {
    setEditFee(fee || null);
    setFeeForm(fee || {});
    setShowFeeDialog(true);
  };
  const handleFeeFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editFee) {
        await api.updateFeeItem(editFee.id, feeForm);
      } else {
        await api.addFeeItem(feeForm);
      }
      setShowFeeDialog(false);
      fetchFeeStructure();
    } catch (e) {}
  };
  const handleDeleteFee = async (id: number) => {
    if (!window.confirm('Delete this fee item?')) return;
    await api.deleteFeeItem(id);
    fetchFeeStructure();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Financial Management</h1>
        <p className="text-gray-600">Manage student fees and financial records</p>
      </div>
      <Tabs defaultValue="fee-structure">
        <TabsList className="mb-4">
          <TabsTrigger value="fee-structure">Fee Structure</TabsTrigger>
          <TabsTrigger value="summary">Student Balances</TabsTrigger>
        </TabsList>
        {/* Fee Structure Tab */}
        <TabsContent value="fee-structure">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Fee Structure</CardTitle>
              <Dialog open={showFeeDialog} onOpenChange={setShowFeeDialog}>
                <DialogTrigger asChild>
                  <Button onClick={() => handleFeeDialogOpen()}><Plus className="h-4 w-4 mr-2" />Add Fee Item</Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg">
                  <DialogTitle>{editFee ? 'Edit Fee Item' : 'Add Fee Item'}</DialogTitle>
                  <form className="space-y-4" onSubmit={handleFeeFormSubmit}>
                    <Input name="fee_type" placeholder="Fee Type" value={feeForm.fee_type || ''} onChange={handleFeeFormChange} required />
                    <Input name="amount" type="number" placeholder="Amount" value={feeForm.amount || ''} onChange={handleFeeFormChange} required />
                    <Select value={feeForm.semester || ''} onValueChange={v => setFeeForm((f: any) => ({ ...f, semester: v }))}>
                      <SelectTrigger><SelectValue placeholder="Semester" /></SelectTrigger>
                      <SelectContent>
                        {semesters.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <Input name="academic_year" placeholder="Academic Year" value={feeForm.academic_year || ''} onChange={handleFeeFormChange} required />
                    <Input name="due_date" type="date" placeholder="Due Date" value={feeForm.due_date || ''} onChange={handleFeeFormChange} required />
                    <Input name="description" placeholder="Description" value={feeForm.description || ''} onChange={handleFeeFormChange} />
                    <div className="flex justify-end gap-2">
                      <Button type="button" variant="outline" onClick={() => setShowFeeDialog(false)}>Cancel</Button>
                      <Button type="submit">{editFee ? 'Update' : 'Add'}</Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Semester</TableHead>
                    <TableHead>Year</TableHead>
                    <TableHead>Due</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {feeStructure.map(fee => (
                    <TableRow key={fee.id}>
                      <TableCell>{fee.fee_type}</TableCell>
                      <TableCell>{fee.amount}</TableCell>
                      <TableCell>{fee.semester}</TableCell>
                      <TableCell>{fee.academic_year}</TableCell>
                      <TableCell>{fee.due_date}</TableCell>
                      <TableCell>{fee.description}</TableCell>
                      <TableCell className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => handleFeeDialogOpen(fee)}><Edit className="h-4 w-4" /></Button>
                        <Button size="sm" variant="destructive" onClick={() => handleDeleteFee(fee.id)}><Trash2 className="h-4 w-4" /></Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        {/* Summary Tab */}
        <TabsContent value="summary">
          <Card>
            <CardHeader>
              <CardTitle>Student Balances</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Admission #</TableHead>
                    <TableHead>Total Fees</TableHead>
                    <TableHead>Paid</TableHead>
                    <TableHead>Outstanding</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {summary.map(s => (
                    <TableRow key={s.student_id}>
                      <TableCell>{s.student_name}</TableCell>
                      <TableCell>{s.admission_number}</TableCell>
                      <TableCell>{s.total_fees}</TableCell>
                      <TableCell>{s.paid_fees}</TableCell>
                      <TableCell>{s.outstanding_fees}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminFinancials; 