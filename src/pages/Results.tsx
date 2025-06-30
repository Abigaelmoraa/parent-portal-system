
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { TrendingUp, Award, BookOpen } from "lucide-react";

export default function Results() {
  const subjects = [
    { name: 'Mathematics', current: 88, previous: 85, trend: 'up', tests: 8 },
    { name: 'Science', current: 92, previous: 89, trend: 'up', tests: 6 },
    { name: 'English', current: 85, previous: 87, trend: 'down', tests: 7 },
    { name: 'History', current: 90, previous: 88, trend: 'up', tests: 5 },
    { name: 'Geography', current: 87, previous: 84, trend: 'up', tests: 4 },
    { name: 'Art', current: 94, previous: 92, trend: 'up', tests: 3 },
  ];

  const performanceData = [
    { month: 'Sep', Mathematics: 82, Science: 85, English: 88, History: 86 },
    { month: 'Oct', Mathematics: 85, Science: 87, English: 86, History: 87 },
    { month: 'Nov', Mathematics: 87, Science: 90, English: 85, History: 89 },
    { month: 'Dec', Mathematics: 88, Science: 92, English: 85, History: 90 },
  ];

  const gradeDistribution = [
    { grade: 'A+', count: 12 },
    { grade: 'A', count: 18 },
    { grade: 'A-', count: 8 },
    { grade: 'B+', count: 5 },
    { grade: 'B', count: 2 },
    { grade: 'B-', count: 1 },
  ];

  const getGradeColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 80) return 'text-blue-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getGradeLetter = (score: number) => {
    if (score >= 97) return 'A+';
    if (score >= 93) return 'A';
    if (score >= 90) return 'A-';
    if (score >= 87) return 'B+';
    if (score >= 83) return 'B';
    if (score >= 80) return 'B-';
    if (score >= 77) return 'C+';
    if (score >= 73) return 'C';
    if (score >= 70) return 'C-';
    return 'F';
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold">Academic Results</h1>
        <p className="text-muted-foreground">
          Track your child's academic performance across all subjects.
        </p>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="subjects">Subject Details</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Overall GPA</CardTitle>
                <Award className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">3.7</div>
                <p className="text-xs text-muted-foreground">
                  +0.2 from last semester
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Class Rank</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">8th</div>
                <p className="text-xs text-muted-foreground">
                  Out of 120 students
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Tests</CardTitle>
                <BookOpen className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">33</div>
                <p className="text-xs text-muted-foreground">
                  This semester
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Performance Trend */}
          <Card>
            <CardHeader>
              <CardTitle>Performance Trend</CardTitle>
              <CardDescription>Monthly performance across core subjects</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={performanceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="Mathematics" stroke="#3b82f6" strokeWidth={2} />
                  <Line type="monotone" dataKey="Science" stroke="#10b981" strokeWidth={2} />
                  <Line type="monotone" dataKey="English" stroke="#f59e0b" strokeWidth={2} />
                  <Line type="monotone" dataKey="History" stroke="#ef4444" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="subjects" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {subjects.map((subject, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="text-lg">{subject.name}</CardTitle>
                  <CardDescription>{subject.tests} tests completed</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-3xl font-bold">
                      {getGradeLetter(subject.current)}
                    </span>
                    <Badge variant={subject.trend === 'up' ? 'default' : 'secondary'}>
                      {subject.trend === 'up' ? '↗' : '↘'} {Math.abs(subject.current - subject.previous)}%
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Current Score</span>
                      <span className={getGradeColor(subject.current)}>{subject.current}%</span>
                    </div>
                    <Progress value={subject.current} className="h-2" />
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Previous: {subject.previous}%
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Grade Distribution</CardTitle>
                <CardDescription>Distribution of grades received this semester</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={gradeDistribution}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="grade" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Subject Performance</CardTitle>
                <CardDescription>Average scores by subject</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {subjects.map((subject, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm font-medium">{subject.name}</span>
                        <span className={`text-sm font-bold ${getGradeColor(subject.current)}`}>
                          {subject.current}%
                        </span>
                      </div>
                      <Progress value={subject.current} className="h-2" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
