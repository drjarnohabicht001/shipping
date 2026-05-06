'use client';

import { useEffect, useState } from 'react';
import { Ban, Monitor, ShieldCheck } from 'lucide-react';

interface AdminSessionView {
  id: string;
  email: string;
  name: string;
  accessLevel: string;
  status: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt?: { seconds: number };
  lastActivityAt?: { seconds: number };
}

function formatTimestamp(timestamp?: { seconds: number }) {
  if (!timestamp?.seconds) return 'N/A';
  return new Date(timestamp.seconds * 1000).toLocaleString();
}

export default function SessionsPage() {
  const [sessions, setSessions] = useState<AdminSessionView[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadSessions = async () => {
    try {
      const response = await fetch('/api/admin/security/sessions', {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to load admin sessions');
      }

      const data = await response.json();
      setSessions(data.sessions ?? []);
    } catch (err) {
      console.error(err);
      setError('Unable to load admin sessions.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSessions();
  }, []);

  const revokeSession = async (sessionId: string) => {
    try {
      const response = await fetch('/api/admin/security/sessions', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ sessionId }),
      });

      if (!response.ok) {
        throw new Error('Failed to revoke session');
      }

      await loadSessions();
    } catch (err) {
      console.error(err);
      setError('Unable to revoke session.');
    }
  };

  if (loading) {
    return <div className="text-sm text-gray-500">Loading admin sessions...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Admin Sessions</h1>
        <p className="text-gray-600">View every active and historical admin dashboard session.</p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
          {error}
        </div>
      )}

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Admin</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Role</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Status</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">IP</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Started</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Last Activity</th>
              <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {sessions.map((session) => (
              <tr key={session.id}>
                <td className="px-4 py-4">
                  <div className="font-medium text-gray-900">{session.name}</div>
                  <div className="text-sm text-gray-500">{session.email}</div>
                </td>
                <td className="px-4 py-4 text-sm text-gray-700">{session.accessLevel}</td>
                <td className="px-4 py-4">
                  <span className="inline-flex items-center gap-2 rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    {session.status}
                  </span>
                </td>
                <td className="px-4 py-4 text-sm text-gray-700">{session.ipAddress ?? 'unknown'}</td>
                <td className="px-4 py-4 text-sm text-gray-700">{formatTimestamp(session.createdAt)}</td>
                <td className="px-4 py-4 text-sm text-gray-700">{formatTimestamp(session.lastActivityAt)}</td>
                <td className="px-4 py-4 text-right">
                  {session.status === 'active' && (
                    <button
                      onClick={() => revokeSession(session.id)}
                      className="inline-flex items-center gap-2 rounded-md border border-red-200 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50"
                    >
                      <Ban className="h-4 w-4" />
                      Revoke
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {sessions.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-sm text-gray-500">
                  <div className="mx-auto flex w-fit items-center gap-2">
                    <Monitor className="h-4 w-4" />
                    No admin sessions recorded yet.
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
