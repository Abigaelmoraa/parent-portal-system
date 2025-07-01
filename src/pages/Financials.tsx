import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api, FeeStructure, FeePayment } from "@/lib/api";
import { DollarSign, AlertTriangle, Download, Calendar, Receipt, FileText, Loader2 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { toast } from "sonner";

export default function Financials() {
  const [feeStructure, setFeeStructure] = useState<FeeStructure[]>([]);
  const [feePayments, setFeePayments] = useState<FeePayment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchFinancialData = async () => {
      try {
        const [structureData, paymentsData] = await Promise.all([
          api.getFeeStructure(),
          api.getFeePayments()
        ]);
        console.log('Fee Structure Data:', structureData);
        console.log('Fee Payments Data:', paymentsData);
        setFeeStructure(structureData);
        setFeePayments(paymentsData);
      } catch (error) {
        toast.error("Failed to load financial data");
        console.error("Financials error:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFinancialData();
  }, []);

  // Calculate financial summary
  const totalFees = Array.isArray(feeStructure) ? feeStructure.reduce((sum, fee) => sum + (Number(fee.amount) || 0), 0) : 0;
  const totalPaid = Array.isArray(feePayments) ? feePayments.filter(p => p.status === 'Paid').reduce((sum, p) => sum + (Number(p.amount_paid) || 0), 0) : 0;
  const outstandingFees = Math.max(0, totalFees - totalPaid);

  const financialSummary = [
    { 
      title: "Total Fees Paid", 
      value: `KSh ${Number(totalPaid).toLocaleString()}`,
      description: "This academic year", 
      icon: DollarSign, 
      color: "text-emerald-600", 
      bgColor: "bg-gradient-to-br from-emerald-50 to-emerald-100",
      iconBg: "bg-emerald-500"
    },
    { 
      title: "Outstanding Fees", 
      value: `KSh ${Number(outstandingFees).toLocaleString()}`,
      description: "Total outstanding", 
      icon: AlertTriangle, 
      color: "text-orange-600", 
      bgColor: "bg-gradient-to-br from-orange-50 to-orange-100",
      iconBg: "bg-orange-500"
    },
    { 
      title: "Total Fee Structure", 
      value: `KSh ${Number(totalFees).toLocaleString()}`,
      description: "Full academic year", 
      icon: Calendar, 
      color: "text-blue-600", 
      bgColor: "bg-gradient-to-br from-blue-50 to-blue-100",
      iconBg: "bg-blue-500"
    },
    { 
      title: "Payment Rate", 
      value: `${totalFees > 0 ? Math.round((totalPaid / totalFees) * 100) : 0}%`, 
      description: "Completion rate", 
      icon: Receipt, 
      color: "text-purple-600", 
      bgColor: "bg-gradient-to-br from-purple-50 to-purple-100",
      iconBg: "bg-purple-500"
    },
  ];

  const feeTransactions = Array.isArray(feePayments) ? feePayments.map(payment => ({
    id: payment.transaction_id,
    date: payment.payment_date,
    description: payment.fee_type,
    amount: payment.amount_paid,
    status: payment.status,
    type: payment.payment_method
  })) : [];

  // Generate semester data from fee structure
  const semesterData = Array.isArray(feeStructure) ? feeStructure.reduce((acc, fee) => {
    const semester = `${fee.semester} ${fee.academic_year}`;
    if (!acc[semester]) {
      acc[semester] = 0;
    }
    acc[semester] += fee.amount;
    return acc;
  }, {} as Record<string, number>) : {};

  const semesterDataArray = Object.entries(semesterData).map(([semester, amount]) => ({
    semester,
    amount
  }));

  // Generate fee breakdown from fee structure
  const feeBreakdown = Array.isArray(feeStructure) ? feeStructure.reduce((acc, fee) => {
    if (!acc[fee.fee_type]) {
      acc[fee.fee_type] = 0;
    }
    acc[fee.fee_type] += fee.amount;
    return acc;
  }, {} as Record<string, number>) : {};

  const feeBreakdownArray = Object.entries(feeBreakdown).map(([name, value], index) => ({
    name,
    value,
    color: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'][index % 6]
  }));

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Paid": return "bg-green-100 text-green-800";
      case "Pending": return "bg-yellow-100 text-yellow-800";
      case "Due": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const handleDownloadReport = (reportType: string) => {
    // Mock download functionality
    console.log(`Downloading ${reportType} report...`);
    // In a real app, this would generate and download a PDF
  };

  if (isLoading) {
    return (
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center space-x-2">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span>Loading financial data...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold">School Fees Overview</h1>
        <p className="text-muted-foreground">
          Track university fees, payments, and financial activities for UEAB education.
        </p>
      </div>

      {/* Financial Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {financialSummary.map((item, index) => (
          <Card key={index} className={`${item.bgColor} border-0 shadow-lg hover:shadow-xl transition-shadow`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-700">{item.title}</CardTitle>
              <div className={`p-2 rounded-lg ${item.iconBg} shadow-sm`}>
                <item.icon className="h-4 w-4 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${item.color}`}>{item.value}</div>
              <p className="text-xs text-gray-600">{item.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="transactions" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="transactions">Fee Payments</TabsTrigger>
          <TabsTrigger value="analytics">Fee Analytics</TabsTrigger>
          <TabsTrigger value="reports">Fee Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="transactions" className="space-y-6">
          <Card className="bg-gradient-to-br from-slate-50 to-slate-100 border-0 shadow-lg">
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-slate-800">School Fee Payments</CardTitle>
                  <CardDescription className="text-slate-600">All university fee payments and transactions</CardDescription>
                </div>
                <Button variant="outline" onClick={() => handleDownloadReport('fee-statement')} className="bg-white">
                  <Download className="h-4 w-4 mr-2" />
                  Download Statement
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {feeTransactions.map((transaction) => (
                  <div key={transaction.id} className="flex items-center justify-between p-4 bg-white/70 rounded-lg shadow-sm border border-slate-200">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-slate-600 rounded-full flex items-center justify-center">
                        <Receipt className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-800">{transaction.description}</p>
                        <p className="text-sm text-slate-600">
                          {transaction.date} • ID: {transaction.id}
                        </p>
                      </div>
                    </div>
                    <div className="text-right space-y-1">
                      <p className="font-bold text-slate-800">KSh {transaction.amount.toLocaleString()}</p>
                      <Badge className={getStatusColor(transaction.status)}>
                        {transaction.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-0 shadow-lg">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="text-blue-900">Semester Fee Payments</CardTitle>
                    <CardDescription className="text-blue-700">Track payments by semester</CardDescription>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => handleDownloadReport('semester-analysis')} className="bg-white/50">
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={semesterDataArray}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="semester" />
                    <YAxis tickFormatter={(value) => `KSh ${value/1000}k`}/>
                    <Tooltip formatter={(value) => [`KSh ${value.toLocaleString()}`, 'Amount']} />
                    <Bar dataKey="amount" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-50 to-green-100 border-0 shadow-lg">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="text-green-900">Fee Structure Breakdown</CardTitle>
                    <CardDescription className="text-green-700">Distribution of university fees</CardDescription>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => handleDownloadReport('fee-breakdown')} className="bg-white/50">
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={feeBreakdownArray}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {feeBreakdownArray.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`KSh ${value.toLocaleString()}`, 'Amount']} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="reports" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="bg-gradient-to-br from-indigo-50 to-indigo-100 border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-indigo-900">Academic Year Fee Report</CardTitle>
                <CardDescription className="text-indigo-700">Complete financial summary for the academic year</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between text-indigo-800">
                  <span>Total Fees Paid:</span>
                  <span className="font-bold">KSh 180,000.00</span>
                </div>
                <div className="flex justify-between text-indigo-800">
                  <span>Outstanding Balance:</span>
                  <span className="font-bold text-orange-600">KSh 45,000.00</span>
                </div>
                <div className="flex justify-between text-indigo-800">
                  <span>Total Annual Fees:</span>
                  <span className="font-bold">KSh 225,000.00</span>
                </div>
                <Button className="w-full mt-4 bg-indigo-600 hover:bg-indigo-700" onClick={() => handleDownloadReport('annual-report')}>
                  <Download className="h-4 w-4 mr-2" />
                  Download Annual Fee Report
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-purple-900">Fee Receipts & Records</CardTitle>
                <CardDescription className="text-purple-700">Official payment receipts and documentation</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <p className="text-sm text-purple-800">Available documents:</p>
                  <ul className="text-sm space-y-1 text-purple-700">
                    <li className="flex items-center space-x-2">
                      <FileText className="h-4 w-4" />
                      <span>• 2024 Fee Payment Receipts</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <FileText className="h-4 w-4" />
                      <span>• Fee Structure Document</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <FileText className="h-4 w-4" />
                      <span>• Payment Schedule</span>
                    </li>
                  </ul>
                </div>
                <Button variant="outline" className="w-full bg-white/50" onClick={() => handleDownloadReport('all-receipts')}>
                  <Download className="h-4 w-4 mr-2" />
                  Download All Receipts
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
