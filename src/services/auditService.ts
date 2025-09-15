import { AuditLog } from '@/types/tracking';

export interface AuditLogEntry {
  id: string;
  userId: string;
  userName: string;
  action: string;
  resource: string;
  resourceId?: string;
  details: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface AuditFilters {
  userId?: string;
  action?: string;
  resource?: string;
  severity?: string;
  dateFrom?: Date;
  dateTo?: Date;
  search?: string;
}

export interface AuditStats {
  totalLogs: number;
  todayLogs: number;
  criticalLogs: number;
  userActions: number;
  systemActions: number;
}

class AuditService {
  private logs: AuditLogEntry[] = [];

  constructor() {
    this.initializeMockData();
  }

  private initializeMockData() {
    const mockLogs: AuditLogEntry[] = [
      {
        id: '1',
        userId: '1',
        userName: 'John Admin',
        action: 'CREATE_TRACKING',
        resource: 'tracking_number',
        resourceId: 'TRK001234567',
        details: {
          trackingNumber: 'TRK001234567',
          serviceType: 'express',
          destination: 'New York'
        },
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        timestamp: new Date('2024-01-20T10:30:00'),
        severity: 'medium'
      },
      {
        id: '2',
        userId: '2',
        userName: 'Sarah User',
        action: 'UPDATE_STATUS',
        resource: 'tracking_number',
        resourceId: 'TRK001234567',
        details: {
          oldStatus: 'in_transit',
          newStatus: 'delivered',
          location: 'New York Distribution Center'
        },
        ipAddress: '192.168.1.101',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        timestamp: new Date('2024-01-20T14:15:00'),
        severity: 'low'
      },
      {
        id: '3',
        userId: '1',
        userName: 'John Admin',
        action: 'DELETE_USER',
        resource: 'user',
        resourceId: '5',
        details: {
          deletedUser: 'test@example.com',
          reason: 'Account cleanup'
        },
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        timestamp: new Date('2024-01-20T09:45:00'),
        severity: 'high'
      },
      {
        id: '4',
        userId: 'system',
        userName: 'System',
        action: 'AUTO_UPDATE',
        resource: 'tracking_number',
        resourceId: 'TRK001234568',
        details: {
          trigger: 'scheduled_update',
          newStatus: 'out_for_delivery'
        },
        timestamp: new Date('2024-01-20T08:00:00'),
        severity: 'low'
      },
      {
        id: '5',
        userId: '3',
        userName: 'Mike User',
        action: 'LOGIN_FAILED',
        resource: 'authentication',
        details: {
          reason: 'invalid_password',
          attempts: 3
        },
        ipAddress: '192.168.1.102',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        timestamp: new Date('2024-01-20T07:30:00'),
        severity: 'critical'
      }
    ];

    this.logs = mockLogs;
  }

  // Log a new audit entry
  async logAction(
    userId: string,
    userName: string,
    action: string,
    resource: string,
    details: Record<string, any>,
    options?: {
      resourceId?: string;
      severity?: 'low' | 'medium' | 'high' | 'critical';
      ipAddress?: string;
      userAgent?: string;
    }
  ): Promise<AuditLogEntry> {
    const logEntry: AuditLogEntry = {
      id: Date.now().toString(),
      userId,
      userName,
      action,
      resource,
      resourceId: options?.resourceId,
      details,
      ipAddress: options?.ipAddress,
      userAgent: options?.userAgent,
      timestamp: new Date(),
      severity: options?.severity || 'low'
    };

    this.logs.unshift(logEntry);
    return logEntry;
  }

  // Get audit logs with filtering
  async getAuditLogs(
    filters?: AuditFilters,
    page: number = 1,
    limit: number = 50
  ): Promise<{ logs: AuditLogEntry[]; total: number; page: number; totalPages: number }> {
    let filteredLogs = [...this.logs];

    if (filters) {
      if (filters.userId) {
        filteredLogs = filteredLogs.filter(log => log.userId === filters.userId);
      }
      if (filters.action) {
        filteredLogs = filteredLogs.filter(log => 
          log.action.toLowerCase().includes(filters.action!.toLowerCase())
        );
      }
      if (filters.resource) {
        filteredLogs = filteredLogs.filter(log => log.resource === filters.resource);
      }
      if (filters.severity) {
        filteredLogs = filteredLogs.filter(log => log.severity === filters.severity);
      }
      if (filters.dateFrom) {
        filteredLogs = filteredLogs.filter(log => log.timestamp >= filters.dateFrom!);
      }
      if (filters.dateTo) {
        filteredLogs = filteredLogs.filter(log => log.timestamp <= filters.dateTo!);
      }
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        filteredLogs = filteredLogs.filter(log => 
          log.userName.toLowerCase().includes(searchTerm) ||
          log.action.toLowerCase().includes(searchTerm) ||
          log.resource.toLowerCase().includes(searchTerm) ||
          (log.resourceId && log.resourceId.toLowerCase().includes(searchTerm))
        );
      }
    }

    const total = filteredLogs.length;
    const totalPages = Math.ceil(total / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedLogs = filteredLogs.slice(startIndex, endIndex);

    return {
      logs: paginatedLogs,
      total,
      page,
      totalPages
    };
  }

  // Get audit statistics
  async getAuditStats(): Promise<AuditStats> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayLogs = this.logs.filter(log => 
      log.timestamp >= today && log.timestamp < tomorrow
    );

    const criticalLogs = this.logs.filter(log => log.severity === 'critical');
    const userActions = this.logs.filter(log => log.userId !== 'system');
    const systemActions = this.logs.filter(log => log.userId === 'system');

    return {
      totalLogs: this.logs.length,
      todayLogs: todayLogs.length,
      criticalLogs: criticalLogs.length,
      userActions: userActions.length,
      systemActions: systemActions.length
    };
  }

  // Get logs by resource ID
  async getLogsByResourceId(resourceId: string): Promise<AuditLogEntry[]> {
    return this.logs.filter(log => log.resourceId === resourceId);
  }

  // Get logs by user ID
  async getLogsByUserId(userId: string): Promise<AuditLogEntry[]> {
    return this.logs.filter(log => log.userId === userId);
  }

  // Export audit logs
  async exportLogs(
    filters?: AuditFilters,
    format: 'csv' | 'json' = 'csv'
  ): Promise<string> {
    const { logs } = await this.getAuditLogs(filters, 1, 10000);

    if (format === 'json') {
      return JSON.stringify(logs, null, 2);
    }

    // CSV format
    const headers = [
      'ID',
      'User ID',
      'User Name',
      'Action',
      'Resource',
      'Resource ID',
      'Details',
      'IP Address',
      'User Agent',
      'Timestamp',
      'Severity'
    ];

    const csvRows = logs.map(log => [
      log.id,
      log.userId,
      log.userName,
      log.action,
      log.resource,
      log.resourceId || '',
      JSON.stringify(log.details),
      log.ipAddress || '',
      log.userAgent || '',
      log.timestamp.toISOString(),
      log.severity
    ]);

    const csvContent = [headers, ...csvRows]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    return csvContent;
  }

  // Clean old logs (retention policy)
  async cleanOldLogs(retentionDays: number = 90): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    const initialCount = this.logs.length;
    this.logs = this.logs.filter(log => log.timestamp >= cutoffDate);
    const removedCount = initialCount - this.logs.length;

    if (removedCount > 0) {
      await this.logAction(
        'system',
        'System',
        'CLEANUP_LOGS',
        'audit_logs',
        {
          removedCount,
          retentionDays,
          cutoffDate: cutoffDate.toISOString()
        },
        { severity: 'low' }
      );
    }

    return removedCount;
  }
}

export const auditService = new AuditService();
export default AuditService;