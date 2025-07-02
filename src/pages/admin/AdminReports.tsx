import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const AdminReports: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Reports & Analytics</h1>
        <p className="text-gray-600">View comprehensive reports and analytics</p>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>System Reports</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500">Reports and analytics functionality coming soon...</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminReports; 