'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle2, LogIn } from 'lucide-react';

interface AdminLoginEventView {
  id: string;
  email: string;
  name: string;
  accessLevel: string;
  success: boolean;
  ipAddress?: string;
  userAgent?: string;
  reason?: string;
  timestamp?: { seconds: number };
}

function formatTimestamp(timestamp?: { seconds: number }) {
  if (!timestamp?.seconds) return 'N/A';
  return new Date(timestamp.seconds * 1000).toLocaleString();
}

export default function LoginsPage() {
  const [logins, setLogins] = useState<AdminLoginEventView[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadLogins = async () => {
      try {
        const response = await fetch('/api/admin/security/logins', {
          credentials: 'include',
        });

        if (!response.ok) {
          throw new Error('Failed to load login activity');
        }

        const data = await response.json();
        setLogins(data.logins ?? []);
      } catch (err) {
        console.error(err);
        setError('Unable to load login activity.');
      } finally {
        setLoading(false);
      }
    };

    loadLogins();
  }, []);

  if (loading) {
    return <div className="text-sm text-gray-500">Loading login activity...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Login Activity</h1>
        <p className="text-gray-600">Review every recorded admin login attempt and its source metadata.</p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
          {error}
        </div>
      )}

      <div className="space-y-4">
        {logins.map((login) => (
          <div key={login.id} className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  {login.success ? (
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  ) : (
                    <AlertTriangle className="h-5 w-5 text-red-600" />
                  )}
                  <h2 className="font-semibold text-gray-900">{login.name}</h2>
                  <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700">
                    {login.accessLevel}
                  </span>
                </div>
                <p className="mt-1 text-sm text-gray-600">{login.email}</p>
                <p className="mt-2 text-sm text-gray-500">{formatTimestamp(login.timestamp)}</p>
              </div>

              <div className="text-sm text-gray-600 md:text-right">
                <p>IP: {login.ipAddress ?? 'unknown'}</p>
                <p className="mt-1 max-w-xl break-all">UA: {login.userAgent ?? 'unknown'}</p>
                {!login.success && login.reason && (
                  <p className="mt-1 text-red-600">Reason: {login.reason}</p>
                )}
              </div>
            </div>
          </div>
        ))}

        {logins.length === 0 && (
          <div className="rounded-lg border border-gray-200 bg-white p-12 text-center text-sm text-gray-500">
            <div className="mx-auto flex w-fit items-center gap-2">
              <LogIn className="h-4 w-4" />
              No login activity recorded yet.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
