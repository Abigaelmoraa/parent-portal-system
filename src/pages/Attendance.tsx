
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar as CalendarIcon, Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { useState } from "react";

export default function Attendance() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

  const attendanceStats = [
    { title: "Present", value: "92", percentage: 96, color: "text-green-600", bgColor: "bg-green-50", icon: CheckCircle },
    { title: "Absent", value: "3", percentage: 3, color: "text-red-600", bgColor: "bg-red-50", icon: XCircle },
    { title: "Late", value: "1", percentage: 1, color: "text-yellow-600", bgColor: "bg-yellow-50", icon: AlertCircle },
    { title: "Total Days", value: "96", percentage: 100, color: "text-blue-600", bgColor: "bg-blue-50", icon: CalendarIcon },
  ];

  const recentAttendance = [
    { date: "2024-01-15", status: "Present", time: "8:00 AM", subject: "Mathematics" },
    { date: "2024-01-12", status: "Present", time: "8:00 AM", subject: "Science" },
    { date: "2024-01-11", status: "Late", time: "8:15 AM", subject: "English" },
    { date: "2024-01-10", status: "Present", time: "8:00 AM", subject: "History" },
    { date: "2024-01-09", status: "Absent", time: "-", subject: "Geography" },
    { date: "2024-01-08", status: "Present", time: "8:00 AM", subject: "Art" },
  ];

  const monthlyAttendance = [
    { month: "September", present: 20, absent: 2, late: 0, total: 22 },
    { month: "October", present: 21, absent: 1, late: 1, total: 23 },
    { month: "November", present: 22, absent: 0, late: 0, total: 22 },
    { month: "December", present: 19, absent: 0, late: 0, total: 19 },
    { month: "January", present: 10, absent: 0, late: 0, total: 10 },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Present": return "bg-green-100 text-green-800";
      case "Absent": return "bg-red-100 text-red-800";
      case "Late": return "bg-yellow-100 text-yellow-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Present": return <CheckCircle className="h-4 w-4" />;
      case "Absent": return <XCircle className="h-4 w-4" />;
      case "Late": return <AlertCircle className="h-4 w-4" />;
      default: return <CalendarIcon className="h-4 w-4" />;
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold">Attendance Tracking</h1>
        <p className="text-muted-foreground">
          Monitor your child's school attendance and punctuality.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {attendanceStats.map((stat, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <div className={`p-2 rounded-md ${stat.bgColor}`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.percentage}% of total</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar View */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Calendar View</CardTitle>
            <CardDescription>Select a date to view attendance details</CardDescription>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              className="rounded-md border"
            />
          </CardContent>
        </Card>

        {/* Recent Attendance */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Recent Attendance</CardTitle>
            <CardDescription>Latest attendance records</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentAttendance.map((record, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-full ${record.status === 'Present' ? 'bg-green-100' : record.status === 'Absent' ? 'bg-red-100' : 'bg-yellow-100'}`}>
                      {getStatusIcon(record.status)}
                    </div>
                    <div>
                      <p className="font-medium">{record.subject}</p>
                      <p className="text-sm text-muted-foreground">{record.date}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge className={getStatusColor(record.status)}>
                      {record.status}
                    </Badge>
                    <p className="text-xs text-muted-foreground mt-1 flex items-center">
                      <Clock className="h-3 w-3 mr-1" />
                      {record.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly Attendance Summary</CardTitle>
          <CardDescription>Attendance breakdown by month</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {monthlyAttendance.map((month, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                    <CalendarIcon className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{month.month}</h3>
                    <p className="text-sm text-muted-foreground">{month.total} total days</p>
                  </div>
                </div>
                <div className="flex space-x-4">
                  <div className="text-center">
                    <p className="text-lg font-bold text-green-600">{month.present}</p>
                    <p className="text-xs text-muted-foreground">Present</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-red-600">{month.absent}</p>
                    <p className="text-xs text-muted-foreground">Absent</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-yellow-600">{month.late}</p>
                    <p className="text-xs text-muted-foreground">Late</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold">{Math.round((month.present / month.total) * 100)}%</p>
                    <p className="text-xs text-muted-foreground">Rate</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
