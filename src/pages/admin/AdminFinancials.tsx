import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const AdminFinancials: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Financial Management</h1>
        <p className="text-gray-600">Manage student fees and financial records</p>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Financial Records</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500">Financial management functionality coming soon...</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminFinancials; 