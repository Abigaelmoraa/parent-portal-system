
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/contexts/AuthContext";
import { GraduationCap, Calendar, DollarSign, TrendingUp, User, BookOpen } from "lucide-react";

export default function Dashboard() {
  const { user } = useAuth();

  const stats = [
    {
      title: "Overall GPA",
      value: "3.2",
      description: "Current semester",
      icon: GraduationCap,
      color: "text-emerald-600",
      bgColor: "bg-gradient-to-br from-emerald-50 to-emerald-100",
      iconBg: "bg-emerald-500",
    },
    {
      title: "Attendance Rate",
      value: "92%",
      description: "This semester",
      icon: Calendar,
      color: "text-blue-600",
      bgColor: "bg-gradient-to-br from-blue-50 to-blue-100",
      iconBg: "bg-blue-500",
    },
    {
      title: "Outstanding Balance",
      value: "KSh 25,000",
      description: "Due next month",
      icon: DollarSign,
      color: "text-orange-600",
      bgColor: "bg-gradient-to-br from-orange-50 to-orange-100",
      iconBg: "bg-orange-500",
    },
    {
      title: "Academic Progress",
      value: "+8%",
      description: "From last semester",
      icon: TrendingUp,
      color: "text-purple-600",
      bgColor: "bg-gradient-to-br from-purple-50 to-purple-100",
      iconBg: "bg-purple-500",
    },
  ];

  const recentActivities = [
    { subject: "Business Statistics", grade: "B+", date: "2024-01-15", type: "CAT 2" },
    { subject: "Financial Accounting", grade: "A-", date: "2024-01-12", type: "Assignment" },
    { subject: "Business Communication", grade: "A", date: "2024-01-10", type: "Presentation" },
    { subject: "Economics", grade: "B", date: "2024-01-08", type: "Quiz" },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold">Welcome back, {user?.name}!</h1>
        <p className="text-muted-foreground">
          Here's an overview of your academic progress at UEAB.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <Card key={index} className={`${stat.bgColor} border-0 shadow-lg hover:shadow-xl transition-shadow`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-700">{stat.title}</CardTitle>
              <div className={`p-2 rounded-lg ${stat.iconBg} shadow-sm`}>
                <stat.icon className="h-4 w-4 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
              <p className="text-xs text-gray-600">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Student Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {user?.children.map((child) => (
          <Card key={child.id} className="bg-gradient-to-br from-indigo-50 to-indigo-100 border-0 shadow-lg">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-indigo-500 rounded-full flex items-center justify-center shadow-sm">
                  <User className="h-5 w-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-lg text-indigo-900">{child.name}</CardTitle>
                  <CardDescription className="text-indigo-700">Year {child.grade} • {child.class}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm text-indigo-800">
                  <span>Academic Performance</span>
                  <span>78%</span>
                </div>
                <Progress value={78} className="h-2" />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm text-indigo-800">
                  <span>Attendance Rate</span>
                  <span>92%</span>
                </div>
                <Progress value={92} className="h-2" />
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-indigo-800">Latest Grade:</span>
                <Badge className="bg-indigo-200 text-indigo-800 hover:bg-indigo-300">B+ Business Statistics</Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Activities */}
      <Card className="bg-gradient-to-br from-slate-50 to-slate-100 border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-slate-800">
            <div className="w-8 h-8 bg-slate-600 rounded-lg flex items-center justify-center">
              <BookOpen className="h-4 w-4 text-white" />
            </div>
            <span>Recent Academic Activities</span>
          </CardTitle>
          <CardDescription className="text-slate-600">Latest grades and assessments</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentActivities.map((activity, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-white/70 rounded-lg shadow-sm border border-slate-200">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-slate-600 rounded-full flex items-center justify-center">
                    <GraduationCap className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-800">{activity.subject}</p>
                    <p className="text-sm text-slate-600">{activity.type}</p>
                  </div>
                </div>
                <div className="text-right">
                  <Badge variant={activity.grade.startsWith('A') ? 'default' : 'secondary'} className="mb-1">
                    {activity.grade}
                  </Badge>
                  <p className="text-xs text-slate-500">{activity.date}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
