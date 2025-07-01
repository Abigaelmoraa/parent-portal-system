
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { api, AcademicResult } from "@/lib/api";
import { TrendingUp, Award, BookOpen, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function Results() {
  const [results, setResults] = useState<AcademicResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const data = await api.getResults();
        setResults(data);
      } catch (error) {
        toast.error("Failed to load academic results");
        console.error("Results error:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchResults();
  }, []);

  // Group results by subject
  const subjectResults = results.reduce((acc, result) => {
    if (!acc[result.subject_name]) {
      acc[result.subject_name] = [];
    }
    acc[result.subject_name].push(result);
    return acc;
  }, {} as Record<string, AcademicResult[]>);

  // Calculate subject averages
  const subjects = Object.entries(subjectResults).map(([name, results]) => {
    const avgScore = results.reduce((sum, r) => sum + r.score, 0) / results.length;
    const avgPercentage = (avgScore / results[0]?.max_score || 100) * 100;
    return {
      name,
      current: Math.round(avgPercentage),
      previous: Math.round(avgPercentage - 2), // Mock previous
      trend: 'up' as const,
      tests: results.length
    };
  });

  // Generate performance data from actual results
  const performanceData = Object.entries(subjectResults).map(([subject, results]) => {
    const monthlyData: Record<string, string | number> = { month: subject };
    results.forEach(result => {
      const month = new Date(result.assessment_date).toLocaleDateString('en-US', { month: 'short' });
      const percentage = (result.score / result.max_score) * 100;
      monthlyData[month] = Math.round(percentage);
    });
    return monthlyData;
  }).slice(0, 4); // Limit to 4 subjects for chart

  // Calculate grade distribution from actual results
  const gradeCounts = results.reduce((acc, result) => {
    const grade = result.grade || getGradeLetter((result.score / result.max_score) * 100);
    acc[grade] = (acc[grade] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const gradeDistribution = Object.entries(gradeCounts).map(([grade, count]) => ({
    grade,
    count
  }));

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

  if (isLoading) {
    return (
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center space-x-2">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span>Loading academic results...</span>
          </div>
        </div>
      </div>
    );
  }

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
