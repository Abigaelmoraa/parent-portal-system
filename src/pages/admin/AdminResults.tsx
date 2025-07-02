import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const AdminResults: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Results Management</h1>
        <p className="text-gray-600">Manage student academic results</p>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Academic Results</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500">Results management functionality coming soon...</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminResults; 