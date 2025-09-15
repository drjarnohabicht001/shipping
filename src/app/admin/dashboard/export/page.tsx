'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/Components/Button';
import { useAuth, usePermissions } from '@/contexts/AuthContext';
import { exportService } from '@/services/exportService';
import { auditService } from '@/services/auditService';
import { trackingService } from '@/services/trackingService';
import { ExportOptions, ExportResult, ExportStats } from '@/services/exportService';
import { 
  Download, 
  FileText, 
  Database, 
  Users, 
  Calendar, 
  Filter,
  CheckCircle,
  AlertCircle,
  Clock,
  Trash2,
  RefreshCw
} from 'lucide-react';

const DataExport = () => {
  const { user } = useAuth();
  const { hasPermission } = usePermissions();
  const [stats, setStats] = useState<ExportStats | null>(null);
  const [recentExports, setRecentExports] = useState<ExportResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState<string | null>(null);
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    format: 'csv',
    dateRange: {
      from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
      to: new Date(),
      start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      end: new Date()
    },
    includeHeaders: true,
    compression: false
  });

  useEffect(() => {
    if (hasPermission('export', 'read')) {
      loadData();
    }
  }, [hasPermission]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [exportStats, exports] = await Promise.all([
        exportService.getExportStats(),
        exportService.getRecentExports(10)
      ]);
      
      setStats(exportStats);
      setRecentExports(exports);
    } catch (error) {
      console.error('Failed to load export data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (type: 'tracking' | 'audit' | 'users') => {
    if (!user || !hasPermission('export', 'read')) return;
    
    setExporting(type);
    try {
      let result: ExportResult;
      
      switch (type) {
        case 'tracking':
          const trackingData = await trackingService.getAllTrackings();
          result = await exportService.exportTrackingNumbers(trackingData.trackings, exportOptions);
          break;
        case 'audit':
          const auditData = await auditService.getAuditLogs();
          result = await exportService.exportAuditLogs(auditData.logs, exportOptions);
          break;
        case 'users':
          // For now, use empty array as users data is not available
          result = await exportService.exportUsers([], exportOptions);
          break;
        default:
          throw new Error('Invalid export type');
      }

      // Log the export action
      await auditService.logAction(
        user.id,
        user.name,
        'EXPORT_DATA',
        type,
        {
          exportType: type,
          format: exportOptions.format,
          recordCount: result.recordCount,
          fileSize: result.fileSize
        },
        {
          resourceId: result.id,
          severity: 'low'
        }
      );

      // Download the file
      if (result.downloadUrl) {
        const a = document.createElement('a');
        a.href = result.downloadUrl;
        a.download = result.filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }

      // Refresh the recent exports list
      await loadData();
    } catch (error) {
      console.error(`Failed to export ${type}:`, error);
    } finally {
      setExporting(null);
    }
  };

  const handleDeleteExport = async (exportId: string) => {
    if (!user || !hasPermission('export', 'write')) return;
    
    try {
      await exportService.deleteExport(exportId);
      
      // Log the deletion
      await auditService.logAction(
        user.id,
        user.name,
        'DELETE_EXPORT',
        'export',
        { exportId },
        {
          resourceId: exportId,
          severity: 'low'
        }
      );
      
      await loadData();
    } catch (error) {
      console.error('Failed to delete export:', error);
    }
  };

  const handleCleanupOldExports = async () => {
    if (!user || !hasPermission('export', 'write')) return;
    
    try {
      const cleaned = await exportService.cleanupOldExports();
      
      // Log the cleanup
      await auditService.logAction(
        user.id,
        user.name,
        'CLEANUP_EXPORTS',
        'system',
        { cleanedCount: cleaned },
        {
          resourceId: 'system',
          severity: 'low'
        }
      );
      
      await loadData();
    } catch (error) {
      console.error('Failed to cleanup exports:', error);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed': return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'processing': return <Clock className="h-4 w-4 text-yellow-500" />;
      default: return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  if (!hasPermission('export', 'read')) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Access Denied</h3>
          <p className="text-gray-500">You don't have permission to access data export functionality.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-500">Loading export data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Data Export</h1>
          <p className="text-gray-600">Export system data in various formats</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={loadData} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          {hasPermission('export', 'write') && (
            <Button onClick={handleCleanupOldExports} variant="outline" size="sm">
              <Trash2 className="h-4 w-4 mr-2" />
              Cleanup Old
            </Button>
          )}
        </div>
      </div>

      {/* Export Statistics */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Download className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Exports</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalExports}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Successful</p>
                <p className="text-2xl font-bold text-gray-900">{stats.successfulExports}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertCircle className="h-6 w-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Failed</p>
                <p className="text-2xl font-bold text-gray-900">{stats.failedExports}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Database className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Size</p>
                <p className="text-2xl font-bold text-gray-900">{formatFileSize(stats.totalSize)}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Export Options */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Export Options</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Format</label>
            <select
              value={exportOptions.format}
              onChange={(e) => setExportOptions(prev => ({ ...prev, format: e.target.value as any }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="csv">CSV</option>
              <option value="json">JSON</option>
              <option value="xlsx">Excel (XLSX)</option>
              <option value="pdf">PDF</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <input
              type="date"
              value={exportOptions.dateRange?.start?.toISOString().split('T')[0] || ''}
              onChange={(e) => setExportOptions(prev => ({
                ...prev,
                dateRange: {
                  ...prev.dateRange!,
                  from: new Date(e.target.value),
                  start: new Date(e.target.value)
                }
              }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
            <input
              type="date"
              value={exportOptions.dateRange?.end?.toISOString().split('T')[0] || ''}
              onChange={(e) => setExportOptions(prev => ({
                ...prev,
                dateRange: {
                  ...prev.dateRange!,
                  to: new Date(e.target.value),
                  end: new Date(e.target.value)
                }
              }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
        
        <div className="flex items-center gap-4 mb-6">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={exportOptions.includeHeaders}
              onChange={(e) => setExportOptions(prev => ({ ...prev, includeHeaders: e.target.checked }))}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="ml-2 text-sm text-gray-700">Include Headers</span>
          </label>
          
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={exportOptions.compression}
              onChange={(e) => setExportOptions(prev => ({ ...prev, compression: e.target.checked }))}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="ml-2 text-sm text-gray-700">Compress Files</span>
          </label>
        </div>

        {/* Export Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Button
            onClick={() => handleExport('tracking')}
            disabled={exporting === 'tracking'}
            className="flex items-center justify-center gap-2"
          >
            <FileText className="h-4 w-4" />
            {exporting === 'tracking' ? 'Exporting...' : 'Export Tracking Data'}
          </Button>
          
          <Button
            onClick={() => handleExport('audit')}
            disabled={exporting === 'audit'}
            className="flex items-center justify-center gap-2"
          >
            <Database className="h-4 w-4" />
            {exporting === 'audit' ? 'Exporting...' : 'Export Audit Logs'}
          </Button>
          
          <Button
            onClick={() => handleExport('users')}
            disabled={exporting === 'users'}
            className="flex items-center justify-center gap-2"
          >
            <Users className="h-4 w-4" />
            {exporting === 'users' ? 'Exporting...' : 'Export User Data'}
          </Button>
        </div>
      </div>

      {/* Recent Exports */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Recent Exports</h3>
          <p className="text-sm text-gray-600">Latest export operations and their status</p>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Export Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Records
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Size
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {recentExports.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Exports Yet</h3>
                    <p className="text-gray-500">Start by exporting some data using the options above.</p>
                  </td>
                </tr>
              ) : (
                recentExports.map((exportResult) => (
                  <tr key={exportResult.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{exportResult.filename}</div>
                        <div className="text-sm text-gray-500 capitalize">{exportResult.type} • {exportResult.format.toUpperCase()}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {getStatusIcon(exportResult.status)}
                        <span className="ml-2 text-sm text-gray-900 capitalize">{exportResult.status}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {exportResult.recordCount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatFileSize(exportResult.fileSize)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(exportResult.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex gap-2">
                        {exportResult.downloadUrl && exportResult.status === 'completed' && (
                          <a
                            href={exportResult.downloadUrl}
                            download={exportResult.filename}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            <Download className="h-4 w-4" />
                          </a>
                        )}
                        {hasPermission('export', 'write') && (
                          <button
                            onClick={() => handleDeleteExport(exportResult.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DataExport;