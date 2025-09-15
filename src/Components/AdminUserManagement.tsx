'use client';

import React, { useState, useEffect } from 'react';
import { 
  FirestoreAdminUser, 
  AdminPermission, 
  AdminResource, 
  AdminAction,
  DEFAULT_ADMIN_PERMISSIONS 
} from '@/lib/firestore-schema';
import { adminUserService } from '@/services/adminUserService';
import { useAuth } from '@/contexts/AuthContext';

interface AdminUserManagementProps {
  currentAdminUid: string;
}

export const AdminUserManagement: React.FC<AdminUserManagementProps> = ({ currentAdminUid }) => {
  const [adminUsers, setAdminUsers] = useState<FirestoreAdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedUser, setSelectedUser] = useState<FirestoreAdminUser | null>(null);
  const { user } = useAuth();

  // Form state for creating new admin user
  const [newUserForm, setNewUserForm] = useState({
    email: '',
    name: '',
    accessLevel: 'admin' as 'super_admin' | 'admin' | 'limited_admin',
    department: '',
    jobTitle: '',
    employeeId: '',
    twoFactorEnabled: false,
    sessionTimeout: 480
  });

  useEffect(() => {
    loadAdminUsers();
  }, []);

  const loadAdminUsers = async () => {
    try {
      setLoading(true);
      const users = await adminUserService.getAllAdminUsers(currentAdminUid);
      setAdminUsers(users);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load admin users');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError(null);
      
      const userData: Omit<FirestoreAdminUser, 'uid' | 'createdAt' | 'updatedAt' | 'version' | 'auditTrail'> = {
        email: newUserForm.email,
        name: newUserForm.name,
        role: 'admin',
        emailVerified: false,
        twoFactorEnabled: newUserForm.twoFactorEnabled,
        lastPasswordChange: new Date() as any, // Will be converted to Timestamp in service
        permissions: DEFAULT_ADMIN_PERMISSIONS[newUserForm.accessLevel] || [],
        accessLevel: newUserForm.accessLevel,
        sessionTimeout: newUserForm.sessionTimeout,
        isActive: true,
        isLocked: false,
        loginAttempts: 0,
        department: newUserForm.department,
        jobTitle: newUserForm.jobTitle,
        employeeId: newUserForm.employeeId,
        createdBy: currentAdminUid,
        updatedBy: currentAdminUid
      };

      await adminUserService.createAdminUser(userData, currentAdminUid);
      
      // Reset form and reload users
      setNewUserForm({
        email: '',
        name: '',
        accessLevel: 'admin',
        department: '',
        jobTitle: '',
        employeeId: '',
        twoFactorEnabled: false,
        sessionTimeout: 480
      });
      setShowCreateForm(false);
      await loadAdminUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create admin user');
    }
  };

  const handleLockUser = async (uid: string, lock: boolean, reason: string = '') => {
    try {
      setError(null);
      await adminUserService.lockAdminUser(uid, lock, reason, currentAdminUid);
      await loadAdminUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to ${lock ? 'lock' : 'unlock'} user`);
    }
  };

  const getAccessLevelBadge = (level: string) => {
    const colors = {
      super_admin: 'bg-red-100 text-red-800',
      admin: 'bg-blue-100 text-blue-800',
      limited_admin: 'bg-green-100 text-green-800'
    };
    return colors[level as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getStatusBadge = (user: FirestoreAdminUser) => {
    if (user.isLocked) return 'bg-red-100 text-red-800';
    if (!user.isActive) return 'bg-yellow-100 text-yellow-800';
    return 'bg-green-100 text-green-800';
  };

  const getStatusText = (user: FirestoreAdminUser) => {
    if (user.isLocked) return 'Locked';
    if (!user.isActive) return 'Inactive';
    return 'Active';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Admin User Management</h2>
          <p className="text-gray-600">Manage administrator accounts and permissions</p>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Create Admin User
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Create User Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">Create New Admin User</h3>
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={newUserForm.email}
                  onChange={(e) => setNewUserForm({ ...newUserForm, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={newUserForm.name}
                  onChange={(e) => setNewUserForm({ ...newUserForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Access Level</label>
                <select
                  value={newUserForm.accessLevel}
                  onChange={(e) => setNewUserForm({ ...newUserForm, accessLevel: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="limited_admin">Limited Admin</option>
                  <option value="admin">Admin</option>
                  <option value="super_admin">Super Admin</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                <input
                  type="text"
                  value={newUserForm.department}
                  onChange={(e) => setNewUserForm({ ...newUserForm, department: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Job Title</label>
                <input
                  type="text"
                  value={newUserForm.jobTitle}
                  onChange={(e) => setNewUserForm({ ...newUserForm, jobTitle: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="twoFactor"
                  checked={newUserForm.twoFactorEnabled}
                  onChange={(e) => setNewUserForm({ ...newUserForm, twoFactorEnabled: e.target.checked })}
                  className="mr-2"
                />
                <label htmlFor="twoFactor" className="text-sm text-gray-700">Enable Two-Factor Authentication</label>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
                >
                  Create User
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Admin Users Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                User
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Access Level
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Last Login
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {adminUsers.map((adminUser) => (
              <tr key={adminUser.uid} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10">
                      <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold">
                        {adminUser.name.charAt(0).toUpperCase()}
                      </div>
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">{adminUser.name}</div>
                      <div className="text-sm text-gray-500">{adminUser.email}</div>
                      {adminUser.department && (
                        <div className="text-xs text-gray-400">{adminUser.department}</div>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getAccessLevelBadge(adminUser.accessLevel)}`}>
                    {adminUser.accessLevel.replace('_', ' ').toUpperCase()}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadge(adminUser)}`}>
                    {getStatusText(adminUser)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {adminUser.lastLogin ? new Date(adminUser.lastLogin.toDate()).toLocaleDateString() : 'Never'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                  <button
                    onClick={() => setSelectedUser(adminUser)}
                    className="text-blue-600 hover:text-blue-900"
                  >
                    View
                  </button>
                  {adminUser.uid !== currentAdminUid && (
                    <button
                      onClick={() => handleLockUser(adminUser.uid, !adminUser.isLocked, 'Manual lock/unlock')}
                      className={`${adminUser.isLocked ? 'text-green-600 hover:text-green-900' : 'text-red-600 hover:text-red-900'}`}
                    >
                      {adminUser.isLocked ? 'Unlock' : 'Lock'}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* User Details Modal */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Admin User Details</h3>
              <button
                onClick={() => setSelectedUser(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Name</label>
                  <p className="text-sm text-gray-900">{selectedUser.name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <p className="text-sm text-gray-900">{selectedUser.email}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Access Level</label>
                  <p className="text-sm text-gray-900">{selectedUser.accessLevel}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Department</label>
                  <p className="text-sm text-gray-900">{selectedUser.department || 'N/A'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Two-Factor Auth</label>
                  <p className="text-sm text-gray-900">{selectedUser.twoFactorEnabled ? 'Enabled' : 'Disabled'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Login Attempts</label>
                  <p className="text-sm text-gray-900">{selectedUser.loginAttempts}</p>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Permissions</label>
                <div className="space-y-2">
                  {selectedUser.permissions.map((permission, index) => (
                    <div key={index} className="bg-gray-50 p-3 rounded">
                      <div className="font-medium text-sm">{permission.resource}</div>
                      <div className="text-xs text-gray-600">
                        Actions: {permission.actions.join(', ')}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUserManagement;