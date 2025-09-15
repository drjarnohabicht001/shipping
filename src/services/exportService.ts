import { TrackingNumber, TrackingHistory } from '@/types/tracking';
import { AuditLogEntry } from './auditService';
import { User } from '@/types/auth';

export interface ExportOptions {
  format: 'csv' | 'json' | 'xlsx' | 'pdf';
  dateRange?: {
    from: Date;
    to: Date;
    start?: Date;
    end?: Date;
  };
  filters?: Record<string, any>;
  includeHeaders?: boolean;
  customFields?: string[];
  compression?: boolean;
}

export interface ExportResult {
  id: string;
  type: string;
  format: string;
  status: 'pending' | 'completed' | 'failed';
  data: string | Uint8Array;
  filename: string;
  mimeType: string;
  size: number;
  fileSize: number;
  recordCount: number;
  createdAt: Date;
  downloadUrl: string;
}

export interface ExportStats {
  totalExports: number;
  todayExports: number;
  successfulExports: number;
  failedExports: number;
  popularFormats: { format: string; count: number }[];
  averageSize: number;
  totalSize: number;
}

class ExportService {
  private exportHistory: Array<{
    id: string;
    type: string;
    format: string;
    timestamp: Date;
    size: number;
    userId: string;
  }> = [];

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // Export tracking numbers
  async exportTrackingNumbers(
    trackingNumbers: TrackingNumber[],
    options: ExportOptions
  ): Promise<ExportResult> {
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `tracking-numbers-${timestamp}.${options.format}`;

    switch (options.format) {
      case 'csv':
        return this.exportTrackingToCSV(trackingNumbers, filename);
      case 'json':
        return this.exportTrackingToJSON(trackingNumbers, filename);
      case 'xlsx':
        return this.exportTrackingToXLSX(trackingNumbers, filename);
      case 'pdf':
        return this.exportTrackingToPDF(trackingNumbers, filename);
      default:
        throw new Error(`Unsupported format: ${options.format}`);
    }
  }

  // Export audit logs
  async exportAuditLogs(
    auditLogs: AuditLogEntry[],
    options: ExportOptions
  ): Promise<ExportResult> {
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `audit-logs-${timestamp}.${options.format}`;

    switch (options.format) {
      case 'csv':
        return this.exportAuditToCSV(auditLogs, filename);
      case 'json':
        return this.exportAuditToJSON(auditLogs, filename);
      case 'xlsx':
        return this.exportAuditToXLSX(auditLogs, filename);
      case 'pdf':
        return this.exportAuditToPDF(auditLogs, filename);
      default:
        throw new Error(`Unsupported format: ${options.format}`);
    }
  }

  // Export users
  async exportUsers(
    users: User[],
    options: ExportOptions
  ): Promise<ExportResult> {
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `users-${timestamp}.${options.format}`;

    switch (options.format) {
      case 'csv':
        return this.exportUsersToCSV(users, filename);
      case 'json':
        return this.exportUsersToJSON(users, filename);
      case 'xlsx':
        return this.exportUsersToXLSX(users, filename);
      case 'pdf':
        return this.exportUsersToPDF(users, filename);
      default:
        throw new Error(`Unsupported format: ${options.format}`);
    }
  }

  // CSV Export Methods
  private exportTrackingToCSV(trackingNumbers: TrackingNumber[], filename: string): ExportResult {
    const headers = [
      'Tracking Number',
      'Service Type',
      'Status',
      'Priority',
      'Sender Address',
      'Recipient Address',
      'Created Date',
      'Estimated Delivery',
      'Actual Delivery',
      'Cost',
      'Weight',
      'Dimensions'
    ];

    const rows = trackingNumbers.map(tracking => [
      tracking.trackingNumber,
      tracking.serviceType,
      tracking.status,
      tracking.priority,
      tracking.sender.address,
      tracking.recipient.address,
      new Date(tracking.createdAt).toISOString(),
      new Date(tracking.estimatedDelivery).toISOString() || '',
      tracking.actualDelivery ? new Date(tracking.actualDelivery).toISOString() : '',
      tracking.cost?.toString() || '',
      tracking.weight?.toString() || '',
      tracking.dimensions ? `${tracking.dimensions.length}x${tracking.dimensions.width}x${tracking.dimensions.height}` : ''
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    const data = new TextEncoder().encode(csvContent);
    const exportId = this.generateId();
    
    this.recordExport('tracking', 'csv', data.length, 'user-id');

    return {
      id: exportId,
      type: 'tracking',
      format: 'csv',
      status: 'completed',
      data: csvContent,
      filename,
      mimeType: 'text/csv',
      size: data.length,
      fileSize: data.length,
      recordCount: trackingNumbers.length,
      createdAt: new Date(),
      downloadUrl: `data:text/csv;base64,${btoa(csvContent)}`
    };
  }

  private exportAuditToCSV(auditLogs: AuditLogEntry[], filename: string): ExportResult {
    const headers = [
      'ID',
      'Timestamp',
      'User ID',
      'User Name',
      'Action',
      'Resource',
      'Resource ID',
      'Severity',
      'IP Address',
      'Details'
    ];

    const rows = auditLogs.map(log => [
      log.id,
      log.timestamp.toISOString(),
      log.userId,
      log.userName,
      log.action,
      log.resource,
      log.resourceId || '',
      log.severity,
      log.ipAddress || '',
      JSON.stringify(log.details)
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    const data = new TextEncoder().encode(csvContent);
    
    this.recordExport('audit', 'csv', data.length, 'user-id');

    const exportId = this.generateId();
    
    return {
      id: exportId,
      type: 'audit',
      format: 'csv',
      status: 'completed' as const,
      data: csvContent,
      filename,
      mimeType: 'text/csv',
      size: data.length,
      fileSize: data.length,
      recordCount: auditLogs.length,
      createdAt: new Date(),
      downloadUrl: `data:text/csv;base64,${btoa(csvContent)}`
    };
  }

  private exportUsersToCSV(users: User[], filename: string): ExportResult {
    const headers = [
      'ID',
      'Name',
      'Email',
      'Role',
      'Status',
      'Created Date',
      'Last Login',
      'Permissions'
    ];

    const rows = users.map(user => [
      user.id,
      user.name,
      user.email,
      user.role,
      user.isActive ? 'Active' : 'Inactive',
      user.createdAt.toISOString(),
      user.lastLogin?.toISOString() || '',
      user.permissions?.join('; ') || 'No permissions'
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    const data = new TextEncoder().encode(csvContent);
    
    this.recordExport('users', 'csv', data.length, 'user-id');

    const exportId = this.generateId();
    
    return {
      id: exportId,
      type: 'users',
      format: 'csv',
      status: 'completed' as const,
      data: csvContent,
      filename,
      mimeType: 'text/csv',
      size: data.length,
      fileSize: data.length,
      recordCount: users.length,
      createdAt: new Date(),
      downloadUrl: `data:text/csv;base64,${btoa(csvContent)}`
    };
  }

  // JSON Export Methods
  private exportTrackingToJSON(trackingNumbers: TrackingNumber[], filename: string): ExportResult {
    const jsonData = {
      exportDate: new Date().toISOString(),
      totalRecords: trackingNumbers.length,
      data: trackingNumbers
    };

    const jsonString = JSON.stringify(jsonData, null, 2);
    const data = new TextEncoder().encode(jsonString);
    
    this.recordExport('tracking', 'json', data.length, 'user-id');

    const exportId = this.generateId();
    
    return {
      id: exportId,
      type: 'tracking',
      format: 'json',
      status: 'completed' as const,
      data: jsonString,
      filename,
      mimeType: 'application/json',
      size: data.length,
      fileSize: data.length,
      recordCount: trackingNumbers.length,
      createdAt: new Date(),
      downloadUrl: `data:application/json;base64,${btoa(jsonString)}`
    };
  }

  private exportAuditToJSON(auditLogs: AuditLogEntry[], filename: string): ExportResult {
    const jsonData = {
      exportDate: new Date().toISOString(),
      totalRecords: auditLogs.length,
      data: auditLogs
    };

    const jsonString = JSON.stringify(jsonData, null, 2);
    const data = new TextEncoder().encode(jsonString);
    
    this.recordExport('audit', 'json', data.length, 'user-id');

    const exportId = this.generateId();
    
    return {
      id: exportId,
      type: 'audit',
      format: 'json',
      status: 'completed' as const,
      data: jsonString,
      filename,
      mimeType: 'application/json',
      size: data.length,
      fileSize: data.length,
      recordCount: auditLogs.length,
      createdAt: new Date(),
      downloadUrl: `data:application/json;base64,${btoa(jsonString)}`
    };
  }

  private exportUsersToJSON(users: User[], filename: string): ExportResult {
    const jsonData = {
      exportDate: new Date().toISOString(),
      totalRecords: users.length,
      data: users.map(user => ({
        ...user,
        // Remove sensitive information
        password: undefined
      }))
    };

    const jsonString = JSON.stringify(jsonData, null, 2);
    const data = new TextEncoder().encode(jsonString);
    
    this.recordExport('users', 'json', data.length, 'user-id');

    const exportId = this.generateId();
    
    return {
      id: exportId,
      type: 'users',
      format: 'json',
      status: 'completed' as const,
      data: jsonString,
      filename,
      mimeType: 'application/json',
      size: data.length,
      fileSize: data.length,
      recordCount: users.length,
      createdAt: new Date(),
      downloadUrl: `data:application/json;base64,${btoa(jsonString)}`
    };
  }

  // XLSX Export Methods (simplified - in production, use a library like xlsx)
  private exportTrackingToXLSX(trackingNumbers: TrackingNumber[], filename: string): ExportResult {
    // This is a simplified implementation
    // In production, use libraries like 'xlsx' or 'exceljs'
    const csvData = this.exportTrackingToCSV(trackingNumbers, filename.replace('.xlsx', '.csv'));
    
    return {
      ...csvData,
      type: 'tracking',
      format: 'xlsx',
      filename,
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    };
  }

  private exportAuditToXLSX(auditLogs: AuditLogEntry[], filename: string): ExportResult {
    const csvData = this.exportAuditToCSV(auditLogs, filename.replace('.xlsx', '.csv'));
    
    return {
      ...csvData,
      type: 'audit',
      format: 'xlsx',
      filename,
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    };
  }

  private exportUsersToXLSX(users: User[], filename: string): ExportResult {
    const csvData = this.exportUsersToCSV(users, filename.replace('.xlsx', '.csv'));
    
    return {
      ...csvData,
      type: 'users',
      format: 'xlsx',
      filename,
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    };
  }

  // PDF Export Methods (simplified - in production, use a library like jsPDF)
  private exportTrackingToPDF(trackingNumbers: TrackingNumber[], filename: string): ExportResult {
    // This is a simplified implementation
    // In production, use libraries like 'jsPDF' or 'puppeteer'
    const htmlContent = this.generateTrackingHTML(trackingNumbers);
    const data = new TextEncoder().encode(htmlContent);
    
    this.recordExport('tracking', 'pdf', data.length, 'user-id');

    const exportId = this.generateId();
    
    return {
      id: exportId,
      type: 'tracking',
      format: 'pdf',
      status: 'completed' as const,
      data: htmlContent,
      filename,
      mimeType: 'application/pdf',
      size: data.length,
      fileSize: data.length,
      recordCount: trackingNumbers.length,
      createdAt: new Date(),
      downloadUrl: `data:application/pdf;base64,${btoa(htmlContent)}`
    };
  }

  private exportAuditToPDF(auditLogs: AuditLogEntry[], filename: string): ExportResult {
    const htmlContent = this.generateAuditHTML(auditLogs);
    const data = new TextEncoder().encode(htmlContent);
    
    this.recordExport('audit', 'pdf', data.length, 'user-id');

    const exportId = this.generateId();
    
    return {
      id: exportId,
      type: 'audit',
      format: 'pdf',
      status: 'completed' as const,
      data: htmlContent,
      filename,
      mimeType: 'application/pdf',
      size: data.length,
      fileSize: data.length,
      recordCount: auditLogs.length,
      createdAt: new Date(),
      downloadUrl: `data:application/pdf;base64,${btoa(htmlContent)}`
    };
  }

  private exportUsersToPDF(users: User[], filename: string): ExportResult {
    const htmlContent = this.generateUsersHTML(users);
    const data = new TextEncoder().encode(htmlContent);
    
    this.recordExport('users', 'pdf', data.length, 'user-id');

    const exportId = this.generateId();
    
    return {
      id: exportId,
      type: 'users',
      format: 'pdf',
      status: 'completed' as const,
      data: htmlContent,
      filename,
      mimeType: 'application/pdf',
      size: data.length,
      fileSize: data.length,
      recordCount: users.length,
      createdAt: new Date(),
      downloadUrl: `data:application/pdf;base64,${btoa(htmlContent)}`
    };
  }

  // HTML generation for PDF
  private generateTrackingHTML(trackingNumbers: TrackingNumber[]): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Tracking Numbers Report</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; }
          .header { text-align: center; margin-bottom: 30px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Tracking Numbers Report</h1>
          <p>Generated on: ${new Date().toLocaleString()}</p>
          <p>Total Records: ${trackingNumbers.length}</p>
        </div>
        <table>
          <thead>
            <tr>
              <th>Tracking Number</th>
              <th>Service Type</th>
              <th>Status</th>
              <th>Sender Address</th>
              <th>Recipient Address</th>
              <th>Created Date</th>
            </tr>
          </thead>
          <tbody>
            ${trackingNumbers.map(tracking => `
              <tr>
                <td>${tracking.trackingNumber}</td>
                <td>${tracking.serviceType}</td>
                <td>${tracking.status}</td>
                <td>${tracking.sender.address}</td>
                <td>${tracking.recipient.address}</td>
                <td>${new Date(tracking.createdAt).toLocaleDateString()}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </body>
      </html>
    `;
  }

  private generateAuditHTML(auditLogs: AuditLogEntry[]): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Audit Logs Report</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; }
          .header { text-align: center; margin-bottom: 30px; }
          .severity-critical { background-color: #fee; }
          .severity-high { background-color: #fef0e6; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Audit Logs Report</h1>
          <p>Generated on: ${new Date().toLocaleString()}</p>
          <p>Total Records: ${auditLogs.length}</p>
        </div>
        <table>
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>User</th>
              <th>Action</th>
              <th>Resource</th>
              <th>Severity</th>
            </tr>
          </thead>
          <tbody>
            ${auditLogs.map(log => `
              <tr class="severity-${log.severity}">
                <td>${log.timestamp.toLocaleString()}</td>
                <td>${log.userName}</td>
                <td>${log.action}</td>
                <td>${log.resource}</td>
                <td>${log.severity}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </body>
      </html>
    `;
  }

  private generateUsersHTML(users: User[]): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Users Report</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; }
          .header { text-align: center; margin-bottom: 30px; }
          .inactive { background-color: #f9f9f9; color: #666; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Users Report</h1>
          <p>Generated on: ${new Date().toLocaleString()}</p>
          <p>Total Records: ${users.length}</p>
        </div>
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th>Created Date</th>
              <th>Last Login</th>
            </tr>
          </thead>
          <tbody>
            ${users.map(user => `
              <tr class="${!user.isActive ? 'inactive' : ''}">
                <td>${user.name}</td>
                <td>${user.email}</td>
                <td>${user.role}</td>
                <td>${user.isActive ? 'Active' : 'Inactive'}</td>
                <td>${new Date(user.createdAt).toLocaleDateString()}</td>
               <td>${user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </body>
      </html>
    `;
  }

  // Record export for analytics
  private recordExport(type: string, format: string, size: number, userId: string): void {
    this.exportHistory.push({
      id: Date.now().toString(),
      type,
      format,
      timestamp: new Date(),
      size,
      userId
    });
  }

  // Get export statistics
  async getExportStats(): Promise<ExportStats> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayExports = this.exportHistory.filter(exp => 
      exp.timestamp >= today && exp.timestamp < tomorrow
    );

    const formatCounts = this.exportHistory.reduce((acc, exp) => {
      acc[exp.format] = (acc[exp.format] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const popularFormats = Object.entries(formatCounts)
      .map(([format, count]) => ({ format, count }))
      .sort((a, b) => b.count - a.count);

    const totalSize = this.exportHistory.reduce((sum, exp) => sum + exp.size, 0);
    const averageSize = this.exportHistory.length > 0 ? totalSize / this.exportHistory.length : 0;

    const successfulExports = this.exportHistory.length; // All exports are successful in this mock
    const failedExports = 0;

    return {
      totalExports: this.exportHistory.length,
      todayExports: todayExports.length,
      successfulExports,
      failedExports,
      popularFormats,
      averageSize,
      totalSize
    };
  }

  // Get recent exports
  async getRecentExports(limit: number = 10): Promise<ExportResult[]> {
    return this.exportHistory
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit)
      .map(exp => ({
        id: exp.id,
        type: exp.type,
        format: exp.format,
        status: 'completed' as const,
        data: '',
        filename: `${exp.type}_export_${exp.id}.${exp.format}`,
        mimeType: exp.format === 'csv' ? 'text/csv' : 'application/json',
        size: exp.size,
        fileSize: exp.size,
        recordCount: 0, // Not tracked in history
        createdAt: exp.timestamp,
        downloadUrl: `/api/exports/${exp.id}/download`
      }));
  }

  // Delete a specific export
  async deleteExport(exportId: string): Promise<void> {
    const index = this.exportHistory.findIndex(e => e.id === exportId);
    if (index !== -1) {
      this.exportHistory.splice(index, 1);
    }
  }

  // Clean old export records
  async cleanupExportHistory(retentionDays: number = 30): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    const initialCount = this.exportHistory.length;
    this.exportHistory = this.exportHistory.filter(exp => exp.timestamp >= cutoffDate);
    const removedCount = initialCount - this.exportHistory.length;

    return removedCount;
  }

  // Clean up old exports (alias for cleanupExportHistory)
  async cleanupOldExports(daysOld: number = 30): Promise<number> {
    return this.cleanupExportHistory(daysOld);
  }
}

export const exportService = new ExportService();
export default ExportService;