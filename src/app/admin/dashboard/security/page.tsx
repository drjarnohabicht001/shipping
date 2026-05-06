'use client';

import { useEffect, useState } from 'react';
import { AlertCircle, Activity, Shield, Users, Clock, TriangleAlert } from 'lucide-react';

interface SecurityOverview {
  activeSessions: number;
  totalSessions: number;
  recentLogins: number;
  failedLogins: number;
  uniqueAdmins: number;
  openAlerts: number;
}

interface SecurityAlert {
  id: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  status: 'open' | 'investigating' | 'resolved';
  relatedUserId?: string;
}

export default function SecurityPage() {
  const [overview, setOverview] = useState<SecurityOverview | null>(null);
  const [alerts, setAlerts] = useState<SecurityAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadOverview = async () => {
      try {
        const [overviewResponse, alertsResponse] = await Promise.all([
          fetch('/api/admin/security/overview', {
            credentials: 'include',
          }),
          fetch('/api/admin/security/alerts', {
            credentials: 'include',
          }),
        ]);

        if (!overviewResponse.ok) {
          throw new Error('Failed to load security overview');
        }

        if (!alertsResponse.ok) {
          throw new Error('Failed to load security alerts');
        }

        const overviewData = await overviewResponse.json();
        const alertsData = await alertsResponse.json();

        setOverview(overviewData.overview);
        setAlerts(alertsData.alerts ?? []);
      } catch (err) {
        console.error(err);
        setError('Unable to load security overview.');
      } finally {
        setLoading(false);
      }
    };

    loadOverview();
  }, []);

  if (loading) {
    return <div className="text-sm text-gray-500">Loading security overview...</div>;
  }

  if (error || !overview) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
        {error ?? 'Security overview unavailable.'}
      </div>
    );
  }

  const cards = [
    { label: 'Active Sessions', value: overview.activeSessions, icon: Shield },
    { label: 'Total Sessions', value: overview.totalSessions, icon: Activity },
    { label: 'Recent Logins (24h)', value: overview.recentLogins, icon: Clock },
    { label: 'Failed Logins (24h)', value: overview.failedLogins, icon: AlertCircle },
    { label: 'Unique Admins Online', value: overview.uniqueAdmins, icon: Users },
    { label: 'Open Alerts', value: overview.openAlerts, icon: TriangleAlert },
  ];

  const severityClasses: Record<SecurityAlert['severity'], string> = {
    low: 'border-green-200 bg-green-50 text-green-800',
    medium: 'border-yellow-200 bg-yellow-50 text-yellow-800',
    high: 'border-orange-200 bg-orange-50 text-orange-800',
    critical: 'border-red-200 bg-red-50 text-red-800',
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Security Overview</h1>
        <p className="text-gray-600">Monitor admin access, session health, and suspicious login activity.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">{card.label}</p>
                  <p className="mt-2 text-2xl font-semibold text-gray-900">{card.value}</p>
                </div>
                <div className="rounded-full bg-orange-50 p-3 text-[#FF5A24]">
                  <Icon className="h-5 w-5" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Security Alerts</h2>
            <p className="text-sm text-gray-500">Derived from recent admin logins and active session behavior.</p>
          </div>
        </div>

        {alerts.length === 0 ? (
          <div className="rounded-lg border border-dashed border-gray-200 p-6 text-sm text-gray-500">
            No active anomalies detected in the current analysis window.
          </div>
        ) : (
          <div className="space-y-3">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className={`rounded-lg border p-4 ${severityClasses[alert.severity]}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-medium capitalize">
                      {alert.severity} severity
                    </p>
                    <p className="mt-1 text-sm">{alert.message}</p>
                    {alert.relatedUserId && (
                      <p className="mt-2 text-xs opacity-80">User: {alert.relatedUserId}</p>
                    )}
                  </div>
                  <span className="rounded-full bg-white/70 px-2.5 py-1 text-xs font-medium capitalize">
                    {alert.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
