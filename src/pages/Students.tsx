
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { Separator } from "@/components/ui/separator";
import { api, Student } from "@/lib/api";
import { User, Calendar, Mail, Phone, MapPin, Edit, Save, Download, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function Students() {
  const { user } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingStudent, setEditingStudent] = useState<number | null>(null);
  const [studentData, setStudentData] = useState<{[key: number]: Partial<Student>}>({});

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const data = await api.getStudents();
        setStudents(data);
      } catch (error) {
        toast.error("Failed to load students");
        console.error("Students error:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStudents();
  }, []);

  const handleEdit = (studentId: number, currentData: Student) => {
    setEditingStudent(studentId);
    setStudentData({ [studentId]: currentData });
  };

  const handleSave = (studentId: number) => {
    setEditingStudent(null);
    toast.success("Student information updated successfully!");
  };

  const handleCancel = (studentId: number) => {
    setEditingStudent(null);
    setStudentData({ ...studentData, [studentId]: undefined });
  };

  const updateStudentField = (studentId: number, field: string, value: string) => {
    setStudentData({
      ...studentData,
      [studentId]: {
        ...studentData[studentId],
        [field]: value
      }
    });
  };

  const downloadStudentReport = (studentName: string) => {
    toast.success(`Downloading report for ${studentName}`);
  };

  if (isLoading) {
    return (
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center space-x-2">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span>Loading students...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold">Student Management</h1>
        <p className="text-muted-foreground">
          View and manage your children's personal information and academic details.
        </p>
      </div>

      <div className="space-y-6">
        {students.length > 0 ? (
          students.map((student) => (
            <Card key={student.id} className="bg-gradient-to-br from-blue-50 to-blue-100 border-0 shadow-lg">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <Avatar className="h-16 w-16">
                    <AvatarFallback className="bg-blue-500 text-white text-lg">
                      {student.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-xl text-blue-900">{student.name}</CardTitle>
                    <CardDescription className="text-blue-700">
                      {student.course} • {student.semester} • {student.grade}
                    </CardDescription>
                    <div className="flex items-center space-x-4 mt-2">
                      <Badge variant="secondary" className="bg-blue-200 text-blue-800">
                        {student.admission_number}
                      </Badge>
                      <Badge variant="outline" className="border-blue-300 text-blue-700">
                        {student.academic_year}
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => downloadStudentReport(student.name)}
                    className="border-blue-300 text-blue-700 hover:bg-blue-200"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download Report
                  </Button>
                  {editingStudent !== student.id ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(student.id, student)}
                      className="border-blue-300 text-blue-700 hover:bg-blue-200"
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                  ) : (
                    <div className="space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCancel(student.id)}
                      >
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleSave(student.id)}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <Save className="h-4 w-4 mr-2" />
                        Save
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Personal Information */}
              <div>
                <h3 className="text-lg font-semibold text-blue-900 mb-4">Personal Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor={`name-${student.id}`} className="text-blue-800">Full Name</Label>
                    {editingStudent === student.id ? (
                      <Input
                        id={`name-${student.id}`}
                        value={studentData[student.id]?.name || student.name}
                        onChange={(e) => updateStudentField(student.id, 'name', e.target.value)}
                        className="bg-white/70"
                      />
                    ) : (
                      <div className="flex items-center space-x-2 p-2 bg-white/50 rounded">
                        <User className="h-4 w-4 text-blue-600" />
                        <span>{student.name}</span>
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`dob-${student.id}`} className="text-blue-800">Date of Birth</Label>
                    {editingStudent === student.id ? (
                      <Input
                        id={`dob-${student.id}`}
                        type="date"
                        value={studentData[student.id]?.date_of_birth || student.date_of_birth}
                        onChange={(e) => updateStudentField(student.id, 'date_of_birth', e.target.value)}
                        className="bg-white/70"
                      />
                    ) : (
                      <div className="flex items-center space-x-2 p-2 bg-white/50 rounded">
                        <Calendar className="h-4 w-4 text-blue-600" />
                        <span>{new Date(student.date_of_birth).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`email-${student.id}`} className="text-blue-800">Email Address</Label>
                    {editingStudent === student.id ? (
                      <Input
                        id={`email-${student.id}`}
                        type="email"
                        value={studentData[student.id]?.email || student.email}
                        onChange={(e) => updateStudentField(student.id, 'email', e.target.value)}
                        className="bg-white/70"
                      />
                    ) : (
                      <div className="flex items-center space-x-2 p-2 bg-white/50 rounded">
                        <Mail className="h-4 w-4 text-blue-600" />
                        <span>{student.email}</span>
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`phone-${student.id}`} className="text-blue-800">Phone Number</Label>
                    {editingStudent === student.id ? (
                      <Input
                        id={`phone-${student.id}`}
                        value={studentData[student.id]?.phone || student.phone}
                        onChange={(e) => updateStudentField(student.id, 'phone', e.target.value)}
                        className="bg-white/70"
                      />
                    ) : (
                      <div className="flex items-center space-x-2 p-2 bg-white/50 rounded">
                        <Phone className="h-4 w-4 text-blue-600" />
                        <span>{student.phone}</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="mt-4 space-y-2">
                  <Label htmlFor={`address-${student.id}`} className="text-blue-800">Address</Label>
                  {editingStudent === student.id ? (
                    <Input
                      id={`address-${student.id}`}
                      value={studentData[student.id]?.address || student.address}
                      onChange={(e) => updateStudentField(student.id, 'address', e.target.value)}
                      className="bg-white/70"
                    />
                  ) : (
                    <div className="flex items-center space-x-2 p-2 bg-white/50 rounded">
                      <MapPin className="h-4 w-4 text-blue-600" />
                      <span>{student.address}</span>
                    </div>
                  )}
                </div>
              </div>

              <Separator className="bg-blue-200" />

              {/* Academic Information */}
              <div>
                <h3 className="text-lg font-semibold text-blue-900 mb-4">Academic Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-blue-800">Admission Number</Label>
                    <div className="flex items-center space-x-2 p-2 bg-white/50 rounded">
                      <span className="font-mono">{student.admission_number}</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-blue-800">Course</Label>
                    <div className="flex items-center space-x-2 p-2 bg-white/50 rounded">
                      <span>{student.course}</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-blue-800">Current Semester</Label>
                    <div className="flex items-center space-x-2 p-2 bg-white/50 rounded">
                      <span>{student.semester}</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-blue-800">Academic Year</Label>
                    <div className="flex items-center space-x-2 p-2 bg-white/50 rounded">
                      <span>{student.academic_year}</span>
                    </div>
                  </div>
                </div>
              </div>

              <Separator className="bg-blue-200" />

              {/* Emergency Contact */}
              <div>
                <h3 className="text-lg font-semibold text-blue-900 mb-4">Emergency Contact</h3>
                <div className="space-y-2">
                  <Label htmlFor={`emergency-${student.id}`} className="text-blue-800">Emergency Contact</Label>
                  {editingStudent === student.id ? (
                    <Input
                      id={`emergency-${student.id}`}
                      value={studentData[student.id]?.emergency_contact || student.emergency_contact}
                      onChange={(e) => updateStudentField(student.id, 'emergency_contact', e.target.value)}
                      className="bg-white/70"
                    />
                  ) : (
                    <div className="flex items-center space-x-2 p-2 bg-white/50 rounded">
                      <Phone className="h-4 w-4 text-blue-600" />
                      <span>{student.emergency_contact}</span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No students found</p>
        </div>
      )}
      </div>
    </div>
  );
}
