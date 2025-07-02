
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/contexts/AuthContext";
import { api, DashboardData } from "@/lib/api";
import { GraduationCap, Calendar, DollarSign, TrendingUp, User, BookOpen, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function Dashboard() {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const data = await api.getDashboardData();
        setDashboardData(data);
      } catch (error) {
        toast.error("Failed to load dashboard data");
        console.error("Dashboard error:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (isLoading) {
    return (
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center space-x-2">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span>Loading dashboard...</span>
          </div>
        </div>
      </div>
    );
  }

  const stats = [
    {
      title: "Total Students",
      value: dashboardData?.total_students?.toString() || "0",
      description: "Enrolled students",
      icon: User,
      color: "text-emerald-600",
      bgColor: "bg-gradient-to-br from-emerald-50 to-emerald-100",
      iconBg: "bg-emerald-500",
    },
    {
      title: "Total Results",
      value: dashboardData?.total_results?.toString() || "0",
      description: "Academic records",
      icon: GraduationCap,
      color: "text-blue-600",
      bgColor: "bg-gradient-to-br from-blue-50 to-blue-100",
      iconBg: "bg-blue-500",
    },
    {
      title: "Attendance Records",
      value: dashboardData?.total_attendance?.toString() || "0",
      description: "This semester",
      icon: Calendar,
      color: "text-orange-600",
      bgColor: "bg-gradient-to-br from-orange-50 to-orange-100",
      iconBg: "bg-orange-500",
    },
    {
      title: "Outstanding Balance",
      value: `KSh ${dashboardData?.fee_summary?.outstanding_fees?.toLocaleString() || "0"}`,
      description: "Total outstanding",
      icon: DollarSign,
      color: "text-purple-600",
      bgColor: "bg-gradient-to-br from-purple-50 to-purple-100",
      iconBg: "bg-purple-500",
    },
  ];

  const recentActivities = dashboardData?.recent_results?.slice(0, 4) || [];

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
            {recentActivities.length > 0 ? (
              recentActivities.map((activity, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-white/70 rounded-lg shadow-sm border border-slate-200">
              <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-slate-600 rounded-full flex items-center justify-center">
                      <GraduationCap className="h-4 w-4 text-white" />
                </div>
                <div>
                      <p className="font-medium text-slate-800">{activity.subject_name}</p>
                      <p className="text-sm text-slate-600">{activity.assessment_type}</p>
                </div>
              </div>
                  <div className="text-right">
                    <Badge variant={activity.grade?.startsWith('A') ? 'default' : 'secondary'} className="mb-1">
                      {activity.grade || `${activity.score}/${activity.max_score}`}
                    </Badge>
                    <p className="text-xs text-slate-500">{new Date(activity.assessment_date).toLocaleDateString()}</p>
              </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-slate-500">
                <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No recent academic activities</p>
              </div>
            )}
              </div>
            </CardContent>
          </Card>

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
                    <p className="font-medium text-slate-800">{activity.subject_name}</p>
                    <p className="text-sm text-slate-600">{activity.assessment_type}</p>
                  </div>
                </div>
                <div className="text-right">
                  <Badge variant={activity.grade.startsWith('A') ? 'default' : 'secondary'} className="mb-1">
                    {activity.grade}
                  </Badge>
                                      <p className="text-xs text-slate-500">{new Date(activity.assessment_date).toLocaleDateString()}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
