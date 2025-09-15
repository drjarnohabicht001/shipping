'use client';

import React from 'react';
import { useAuth, usePermissions } from '@/contexts/AuthContext';
import { Shield } from 'lucide-react';
import AdminUserManagement from '@/Components/AdminUserManagement';

const UserManagement = () => {
  const { user } = useAuth();
  const { hasPermission } = usePermissions();

  // Check if user has permission to manage users

  if (!hasPermission('users', 'manage')) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Access Denied</h3>
          <p className="text-gray-500">You don't have permission to manage users.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AdminUserManagement currentAdminUid={user?.id || ''} />
    </div>
  );
};

export default UserManagement;