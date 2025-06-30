
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DollarSign, CreditCard, AlertTriangle, Download, Calendar, Receipt } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

export default function Financials() {
  const financialSummary = [
    { title: "Total Paid", value: "$2,450", description: "This year", icon: DollarSign, color: "text-green-600", bgColor: "bg-green-50" },
    { title: "Outstanding", value: "$250", description: "Due soon", icon: AlertTriangle, color: "text-orange-600", bgColor: "bg-orange-50" },
    { title: "Next Payment", value: "$125", description: "Feb 1st", icon: Calendar, color: "text-blue-600", bgColor: "bg-blue-50" },
    { title: "Payment Method", value: "Auto", description: "Credit Card", icon: CreditCard, color: "text-purple-600", bgColor: "bg-purple-50" },
  ];

  const transactions = [
    { id: "TXN001", date: "2024-01-15", description: "Tuition Fee - January", amount: 450, status: "Paid", type: "Tuition" },
    { id: "TXN002", date: "2024-01-10", description: "Library Fee", amount: 25, status: "Paid", type: "Library" },
    { id: "TXN003", date: "2024-01-08", description: "Sports Equipment", amount: 85, status: "Paid", type: "Equipment" },
    { id: "TXN004", date: "2024-01-05", description: "Lab Fee - Chemistry", amount: 35, status: "Paid", type: "Lab" },
    { id: "TXN005", date: "2024-02-01", description: "Tuition Fee - February", amount: 450, status: "Pending", type: "Tuition" },
    { id: "TXN006", date: "2024-02-01", description: "Activity Fee", amount: 75, status: "Pending", type: "Activity" },
  ];

  const monthlyData = [
    { month: 'Sep', amount: 525 },
    { month: 'Oct', amount: 485 },
    { month: 'Nov', amount: 510 },
    { month: 'Dec', amount: 495 },
    { month: 'Jan', amount: 595 },
  ];

  const expenseBreakdown = [
    { name: 'Tuition', value: 1800, color: '#3b82f6' },
    { name: 'Books & Supplies', value: 350, color: '#10b981' },
    { name: 'Activities', value: 200, color: '#f59e0b' },
    { name: 'Lab Fees', value: 150, color: '#ef4444' },
    { name: 'Others', value: 100, color: '#8b5cf6' },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Paid": return "bg-green-100 text-green-800";
      case "Pending": return "bg-yellow-100 text-yellow-800";
      case "Overdue": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getTypeColor = (type: string) => {
    const colors: { [key: string]: string } = {
      "Tuition": "bg-blue-100 text-blue-800",
      "Library": "bg-purple-100 text-purple-800",
      "Equipment": "bg-green-100 text-green-800",
      "Lab": "bg-orange-100 text-orange-800",
      "Activity": "bg-pink-100 text-pink-800",
    };
    return colors[type] || "bg-gray-100 text-gray-800";
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold">Financial Overview</h1>
        <p className="text-muted-foreground">
          Track school fees, payments, and financial activities for your child's education.
        </p>
      </div>

      {/* Financial Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {financialSummary.map((item, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{item.title}</CardTitle>
              <div className={`p-2 rounded-md ${item.bgColor}`}>
                <item.icon className={`h-4 w-4 ${item.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{item.value}</div>
              <p className="text-xs text-muted-foreground">{item.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="transactions" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="transactions" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Recent Transactions</CardTitle>
                  <CardDescription>All payment activities and school fees</CardDescription>
                </div>
                <Button variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {transactions.map((transaction) => (
                  <div key={transaction.id} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                        <Receipt className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{transaction.description}</p>
                        <p className="text-sm text-muted-foreground">
                          {transaction.date} • ID: {transaction.id}
                        </p>
                      </div>
                    </div>
                    <div className="text-right space-y-1">
                      <p className="font-bold">${transaction.amount}</p>
                      <div className="flex space-x-2">
                        <Badge className={getStatusColor(transaction.status)}>
                          {transaction.status}
                        </Badge>
                        <Badge variant="outline" className={getTypeColor(transaction.type)}>
                          {transaction.type}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Monthly Spending</CardTitle>
                <CardDescription>Track monthly educational expenses</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`$${value}`, 'Amount']} />
                    <Bar dataKey="amount" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Expense Breakdown</CardTitle>
                <CardDescription>Distribution of educational expenses</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={expenseBreakdown}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {expenseBreakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`$${value}`, 'Amount']} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Expense Categories</CardTitle>
              <CardDescription>Detailed breakdown of spending categories</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {expenseBreakdown.map((category, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div 
                        className="w-4 h-4 rounded-full" 
                        style={{ backgroundColor: category.color }}
                      />
                      <span className="font-medium">{category.name}</span>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">${category.value}</p>
                      <p className="text-xs text-muted-foreground">
                        {((category.value / expenseBreakdown.reduce((a, b) => a + b.value, 0)) * 100).toFixed(1)}%
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Annual Report</CardTitle>
                <CardDescription>Complete financial summary for the academic year</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span>Total Paid:</span>
                  <span className="font-bold">$2,450.00</span>
                </div>
                <div className="flex justify-between">
                  <span>Outstanding:</span>
                  <span className="font-bold text-orange-600">$250.00</span>
                </div>
                <div className="flex justify-between">
                  <span>Total Due:</span>
                  <span className="font-bold">$2,700.00</span>
                </div>
                <Button className="w-full mt-4">
                  <Download className="h-4 w-4 mr-2" />
                  Download Annual Report
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Tax Documents</CardTitle>
                <CardDescription>Educational expense documents for tax purposes</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <p className="text-sm">Available documents:</p>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• 2024 Tuition Statement</li>
                    <li>• Educational Expense Summary</li>
                    <li>• Payment Receipt Archive</li>
                  </ul>
                </div>
                <Button variant="outline" className="w-full">
                  <Download className="h-4 w-4 mr-2" />
                  Download Tax Documents
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
