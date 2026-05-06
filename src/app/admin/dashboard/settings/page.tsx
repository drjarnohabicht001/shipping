'use client';

import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/Components/Button';
import { auth } from '@/lib/firebase';
import { multiFactor, TotpMultiFactorGenerator, TotpSecret } from 'firebase/auth';
import { 
  User, 
  Bell, 
  Shield, 
  Database,
  Mail,
  Lock,
  Save,
  TriangleAlert,
  KeyRound,
  Clock3,
  ShieldCheck,
  Monitor,
  Ban,
  QrCode,
  Smartphone
} from 'lucide-react';

interface SecurityProfile {
  uid: string;
  email: string;
  name: string;
  accessLevel: string;
  sessionId: string | null;
  lastLogin: string | null;
  lastActivity: string | null;
  lastPasswordChange: string | null;
  passwordRotationDueAt: string | null;
  mfaEnabled: boolean;
  mfaRequired: boolean;
  mustChangePassword: boolean;
  sessionTimeout: number;
  allowedIpRanges: string[];
}

interface MySession {
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

interface MfaStatus {
  projectTotpEnabled: boolean;
  enrolledFactors: Array<{
    uid: string;
    displayName?: string | null;
    factorId: string;
    enrollmentTime?: string | null;
  }>;
}

export default function SettingsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [securityProfile, setSecurityProfile] = useState<SecurityProfile | null>(null);
  const [securityLoading, setSecurityLoading] = useState(true);
  const [securityError, setSecurityError] = useState<string | null>(null);
  const [generatedResetLink, setGeneratedResetLink] = useState<string | null>(null);
  const [isGeneratingResetLink, setIsGeneratingResetLink] = useState(false);
  const [sessions, setSessions] = useState<MySession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [sessionActionLoading, setSessionActionLoading] = useState(false);
  const [mfaStatus, setMfaStatus] = useState<MfaStatus | null>(null);
  const [mfaLoading, setMfaLoading] = useState(true);
  const [mfaActionLoading, setMfaActionLoading] = useState(false);
  const [totpSecret, setTotpSecret] = useState<TotpSecret | null>(null);
  const [totpQrUrl, setTotpQrUrl] = useState<string | null>(null);
  const [totpVerificationCode, setTotpVerificationCode] = useState('');
  const [mfaDisplayName, setMfaDisplayName] = useState('Shipping Admin TOTP');
  const [settings, setSettings] = useState({
    emailNotifications: true,
    pushNotifications: false,
    twoFactorAuth: user?.mfaEnabled ?? false,
    dataRetention: '90',
    timezone: 'UTC',
    language: 'en'
  });

  useEffect(() => {
    const loadSecurityProfile = async () => {
      try {
        const response = await fetch('/api/admin/security/profile', {
          credentials: 'include',
        });

        if (!response.ok) {
          throw new Error('Failed to load security profile');
        }

        const data = await response.json();
        setSecurityProfile(data.profile);
        setCurrentSessionId(data.profile?.sessionId ?? null);
        setSettings((current) => ({
          ...current,
          twoFactorAuth: data.profile?.mfaEnabled ?? current.twoFactorAuth,
        }));
      } catch (error) {
        console.error(error);
        setSecurityError('Unable to load security profile.');
      } finally {
        setSecurityLoading(false);
      }
    };

    loadSecurityProfile();
  }, []);

  useEffect(() => {
    const loadMySessions = async () => {
      try {
        const response = await fetch('/api/admin/security/my-sessions', {
          credentials: 'include',
        });

        if (!response.ok) {
          throw new Error('Failed to load your sessions');
        }

        const data = await response.json();
        setSessions(data.sessions ?? []);
        setCurrentSessionId(data.currentSessionId ?? null);
      } catch (error) {
        console.error(error);
        setSecurityError('Unable to load your active sessions.');
      }
    };

    loadMySessions();
  }, []);

  useEffect(() => {
    const loadMfaStatus = async () => {
      try {
        const response = await fetch('/api/admin/security/mfa', {
          credentials: 'include',
        });

        if (!response.ok) {
          throw new Error('Failed to load MFA status');
        }

        const data = await response.json();
        setMfaStatus({
          projectTotpEnabled: data.projectTotpEnabled,
          enrolledFactors: data.enrolledFactors ?? [],
        });
      } catch (error) {
        console.error(error);
        setSecurityError('Unable to load MFA configuration.');
      } finally {
        setMfaLoading(false);
      }
    };

    loadMfaStatus();
  }, []);

  const tabs = [
    { id: 'profile', name: 'Profile', icon: User },
    { id: 'notifications', name: 'Notifications', icon: Bell },
    { id: 'security', name: 'Security', icon: Shield },
    { id: 'system', name: 'System', icon: Database },
  ];

  const handleSave = () => {
    // In a real app, this would save to backend
    console.log('Settings saved:', settings);
  };

  const generatePasswordResetLink = async () => {
    try {
      setIsGeneratingResetLink(true);
      setSecurityError(null);
      const response = await fetch('/api/admin/security/password-reset', {
        method: 'POST',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to generate password reset link');
      }

      const data = await response.json();
      setGeneratedResetLink(data.resetLink);
    } catch (error) {
      console.error(error);
      setSecurityError('Unable to generate a password reset link.');
    } finally {
      setIsGeneratingResetLink(false);
    }
  };

  const loadMySessions = async () => {
    const response = await fetch('/api/admin/security/my-sessions', {
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Failed to load your sessions');
    }

    const data = await response.json();
    setSessions(data.sessions ?? []);
    setCurrentSessionId(data.currentSessionId ?? null);
  };

  const loadMfaStatus = async () => {
    const response = await fetch('/api/admin/security/mfa', {
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Failed to load MFA status');
    }

    const data = await response.json();
    setMfaStatus({
      projectTotpEnabled: data.projectTotpEnabled,
      enrolledFactors: data.enrolledFactors ?? [],
    });
  };

  const syncMfaState = async () => {
    const response = await fetch('/api/admin/security/mfa', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ action: 'sync_status' }),
    });

    if (!response.ok) {
      throw new Error('Failed to sync MFA state');
    }

    const data = await response.json();
    setMfaStatus({
      projectTotpEnabled: data.projectTotpEnabled,
      enrolledFactors: data.enrolledFactors ?? [],
    });
  };

  const enableProjectTotp = async () => {
    try {
      setMfaActionLoading(true);
      setSecurityError(null);
      const response = await fetch('/api/admin/security/mfa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ action: 'enable_project_totp' }),
      });

      if (!response.ok) {
        throw new Error('Failed to enable TOTP MFA');
      }

      const data = await response.json();
      setMfaStatus({
        projectTotpEnabled: data.projectTotpEnabled,
        enrolledFactors: data.enrolledFactors ?? [],
      });
    } catch (error) {
      console.error(error);
      setSecurityError('Unable to enable TOTP MFA for this Firebase project.');
    } finally {
      setMfaActionLoading(false);
    }
  };

  const beginTotpEnrollment = async () => {
    try {
      if (!auth.currentUser) {
        throw new Error('You must be signed in to enroll MFA.');
      }

      if (!mfaStatus?.projectTotpEnabled) {
        throw new Error('TOTP MFA is not enabled for this project yet.');
      }

      setMfaActionLoading(true);
      setSecurityError(null);
      const enrollmentSession = await multiFactor(auth.currentUser).getSession();
      const secret = await TotpMultiFactorGenerator.generateSecret(enrollmentSession);
      setTotpSecret(secret);
      setTotpQrUrl(
        secret.generateQrCodeUrl(
          securityProfile?.email ?? user?.email ?? 'admin',
          'Shipping Admin'
        )
      );
      setTotpVerificationCode('');
    } catch (error) {
      console.error(error);
      setSecurityError(
        error instanceof Error ? error.message : 'Unable to start MFA enrollment.'
      );
    } finally {
      setMfaActionLoading(false);
    }
  };

  const confirmTotpEnrollment = async () => {
    try {
      if (!auth.currentUser || !totpSecret) {
        throw new Error('No TOTP enrollment is pending.');
      }

      setMfaActionLoading(true);
      setSecurityError(null);
      const assertion = TotpMultiFactorGenerator.assertionForEnrollment(
        totpSecret,
        totpVerificationCode.trim()
      );

      await multiFactor(auth.currentUser).enroll(
        assertion,
        mfaDisplayName.trim() || 'Shipping Admin TOTP'
      );

      await syncMfaState();
      const profileResponse = await fetch('/api/admin/security/profile', {
        credentials: 'include',
      });
      if (profileResponse.ok) {
        const data = await profileResponse.json();
        setSecurityProfile(data.profile);
      }
      setTotpSecret(null);
      setTotpQrUrl(null);
      setTotpVerificationCode('');
    } catch (error) {
      console.error(error);
      setSecurityError(
        error instanceof Error ? error.message : 'Unable to confirm MFA enrollment.'
      );
    } finally {
      setMfaActionLoading(false);
    }
  };

  const cancelTotpEnrollment = () => {
    setTotpSecret(null);
    setTotpQrUrl(null);
    setTotpVerificationCode('');
  };

  const unenrollFactor = async (factorUid: string) => {
    try {
      if (!auth.currentUser) {
        throw new Error('You must be signed in to manage MFA factors.');
      }

      setMfaActionLoading(true);
      setSecurityError(null);
      await multiFactor(auth.currentUser).unenroll(factorUid);
      await syncMfaState();
      const profileResponse = await fetch('/api/admin/security/profile', {
        credentials: 'include',
      });
      if (profileResponse.ok) {
        const data = await profileResponse.json();
        setSecurityProfile(data.profile);
      }
    } catch (error) {
      console.error(error);
      setSecurityError(
        error instanceof Error ? error.message : 'Unable to remove the MFA factor.'
      );
    } finally {
      setMfaActionLoading(false);
    }
  };

  const revokeSession = async (sessionId: string) => {
    try {
      setSessionActionLoading(true);
      setSecurityError(null);
      const response = await fetch('/api/admin/security/my-sessions', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ sessionId }),
      });

      if (!response.ok) {
        throw new Error('Failed to revoke session');
      }

      const data = await response.json();
      if (data.revokedCurrentSession) {
        window.location.href = '/admin/login';
        return;
      }

      await loadMySessions();
    } catch (error) {
      console.error(error);
      setSecurityError('Unable to revoke the selected session.');
    } finally {
      setSessionActionLoading(false);
    }
  };

  const revokeOtherSessions = async () => {
    try {
      setSessionActionLoading(true);
      setSecurityError(null);
      const response = await fetch('/api/admin/security/my-sessions', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ scope: 'others' }),
      });

      if (!response.ok) {
        throw new Error('Failed to revoke other sessions');
      }

      await loadMySessions();
    } catch (error) {
      console.error(error);
      setSecurityError('Unable to revoke your other sessions.');
    } finally {
      setSessionActionLoading(false);
    }
  };

  const securityAlerts = useMemo(() => {
    if (!securityProfile) return [];

    const alerts: string[] = [];
    if (securityProfile.mustChangePassword) {
      alerts.push('Password rotation is required before this account is considered compliant.');
    }
    if (securityProfile.mfaRequired && !securityProfile.mfaEnabled) {
      alerts.push('Multi-factor authentication is required but is not yet enabled on this account.');
    }
    if (securityProfile.passwordRotationDueAt) {
      const dueDate = new Date(securityProfile.passwordRotationDueAt);
      if (dueDate.getTime() < Date.now()) {
        alerts.push('Password rotation due date has passed.');
      }
    }
    return alerts;
  }, [securityProfile]);

  const formatDate = (value: string | null | undefined) =>
    value ? new Date(value).toLocaleString() : 'Not available';
  const formatTimestamp = (timestamp?: { seconds: number }) =>
    timestamp?.seconds ? new Date(timestamp.seconds * 1000).toLocaleString() : 'Not available';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600">Manage your account and system preferences</p>
        </div>
        <Button onClick={handleSave} className="flex items-center gap-2">
          <Save className="h-4 w-4" />
          Save Changes
        </Button>
      </div>

      {securityAlerts.length > 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
          <div className="mb-2 flex items-center gap-2 text-amber-900">
            <TriangleAlert className="h-4 w-4" />
            <p className="font-medium">Security actions required</p>
          </div>
          <div className="space-y-1 text-sm text-amber-800">
            {securityAlerts.map((alert) => (
              <p key={alert}>{alert}</p>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow">
        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-[#FF5A24] text-[#FF5A24]'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.name}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'profile' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900">Profile Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    defaultValue={user?.name}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-[#FF5A24] focus:border-[#FF5A24]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    defaultValue={user?.email}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-[#FF5A24] focus:border-[#FF5A24]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Role
                  </label>
                  <input
                    type="text"
                    value={user?.role}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Last Login
                  </label>
                  <input
                    type="text"
                    value={user?.lastLogin?.toLocaleString()}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900">Notification Preferences</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="font-medium text-gray-900">Email Notifications</p>
                      <p className="text-sm text-gray-500">Receive notifications via email</p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.emailNotifications}
                    onChange={(e) => setSettings({...settings, emailNotifications: e.target.checked})}
                    className="h-4 w-4 text-[#FF5A24] focus:ring-[#FF5A24] border-gray-300 rounded"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Bell className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="font-medium text-gray-900">Push Notifications</p>
                      <p className="text-sm text-gray-500">Receive push notifications in browser</p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.pushNotifications}
                    onChange={(e) => setSettings({...settings, pushNotifications: e.target.checked})}
                    className="h-4 w-4 text-[#FF5A24] focus:ring-[#FF5A24] border-gray-300 rounded"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900">Security Settings</h3>
              {securityError && (
                <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {securityError}
                </div>
              )}

              {securityLoading ? (
                <div className="text-sm text-gray-500">Loading security profile...</div>
              ) : (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="rounded-lg border border-gray-200 p-4">
                      <div className="flex items-center gap-2 text-gray-800">
                        <ShieldCheck className="h-4 w-4 text-[#FF5A24]" />
                        <p className="font-medium">Security Posture</p>
                      </div>
                      <div className="mt-3 space-y-2 text-sm text-gray-600">
                        <p>MFA enabled: <span className="font-medium text-gray-900">{securityProfile?.mfaEnabled ? 'Yes' : 'No'}</span></p>
                        <p>MFA required: <span className="font-medium text-gray-900">{securityProfile?.mfaRequired ? 'Yes' : 'No'}</span></p>
                        <p>Must change password: <span className="font-medium text-gray-900">{securityProfile?.mustChangePassword ? 'Yes' : 'No'}</span></p>
                        <p>Access level: <span className="font-medium text-gray-900">{securityProfile?.accessLevel}</span></p>
                      </div>
                    </div>

                    <div className="rounded-lg border border-gray-200 p-4">
                      <div className="flex items-center gap-2 text-gray-800">
                        <Clock3 className="h-4 w-4 text-[#FF5A24]" />
                        <p className="font-medium">Session And Password</p>
                      </div>
                      <div className="mt-3 space-y-2 text-sm text-gray-600">
                        <p>Session timeout: <span className="font-medium text-gray-900">{securityProfile?.sessionTimeout} minutes</span></p>
                        <p>Last login: <span className="font-medium text-gray-900">{formatDate(securityProfile?.lastLogin)}</span></p>
                        <p>Last password change: <span className="font-medium text-gray-900">{formatDate(securityProfile?.lastPasswordChange)}</span></p>
                        <p>Password rotation due: <span className="font-medium text-gray-900">{formatDate(securityProfile?.passwordRotationDueAt)}</span></p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Lock className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="font-medium text-gray-900">Two-Factor Authentication</p>
                        <p className="text-sm text-gray-500">Add an extra layer of security</p>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.twoFactorAuth}
                      readOnly
                      className="h-4 w-4 text-[#FF5A24] focus:ring-[#FF5A24] border-gray-300 rounded"
                    />
                  </div>

                  <div className="rounded-lg border border-gray-200 p-4">
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div>
                        <p className="font-medium text-gray-900">Authenticator App (TOTP)</p>
                        <p className="text-sm text-gray-500">
                          Use an authenticator app such as Google Authenticator, 1Password, or Authy.
                        </p>
                      </div>
                      {!mfaStatus?.projectTotpEnabled && user?.accessLevel === 'system_admin' && (
                        <Button
                          variant="outline"
                          onClick={enableProjectTotp}
                          isLoading={mfaActionLoading}
                        >
                          Enable Project TOTP
                        </Button>
                      )}
                    </div>

                    <div className="mt-4 space-y-4">
                      <div className="rounded-md bg-gray-50 p-3 text-sm text-gray-700">
                        Project TOTP provider: <span className="font-medium">{mfaLoading ? 'Loading...' : mfaStatus?.projectTotpEnabled ? 'Enabled' : 'Disabled'}</span>
                      </div>

                      {(mfaStatus?.enrolledFactors?.length ?? 0) > 0 ? (
                        <div className="space-y-3">
                          {mfaStatus?.enrolledFactors.map((factor) => (
                            <div
                              key={factor.uid}
                              className="flex flex-col gap-3 rounded-md border border-gray-200 p-4 md:flex-row md:items-center md:justify-between"
                            >
                              <div>
                                <div className="flex items-center gap-2">
                                  <Smartphone className="h-4 w-4 text-[#FF5A24]" />
                                  <p className="font-medium text-gray-900">
                                    {factor.displayName || 'Authenticator App'}
                                  </p>
                                </div>
                                <p className="mt-1 text-sm text-gray-500">Factor ID: {factor.factorId}</p>
                                <p className="mt-1 text-sm text-gray-500">
                                  Enrolled: {formatDate(factor.enrollmentTime)}
                                </p>
                              </div>
                              <Button
                                variant="outline"
                                onClick={() => unenrollFactor(factor.uid)}
                                isLoading={mfaActionLoading}
                                className="border-red-200 text-red-700 hover:bg-red-50"
                              >
                                <Ban className="mr-2 h-4 w-4" />
                                Remove Factor
                              </Button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="rounded-md border border-dashed border-gray-200 p-4 text-sm text-gray-500">
                          No MFA factor is enrolled on this account yet.
                        </div>
                      )}

                      {totpSecret ? (
                        <div className="space-y-4 rounded-lg border border-[#FF5A24]/20 bg-orange-50 p-4">
                          <div className="flex items-center gap-2 text-[#FF5A24]">
                            <QrCode className="h-4 w-4" />
                            <p className="font-medium">Complete TOTP Enrollment</p>
                          </div>
                          <div className="space-y-2 text-sm text-gray-700">
                            <p>1. Scan this QR code URL in your authenticator app, or copy the secret key manually.</p>
                            <a
                              href={totpQrUrl ?? '#'}
                              target="_blank"
                              rel="noreferrer"
                              className="break-all text-[#FF5A24] underline"
                            >
                              {totpQrUrl}
                            </a>
                            <p>Secret key: <span className="font-mono">{totpSecret.secretKey}</span></p>
                          </div>
                          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <input
                              type="text"
                              value={mfaDisplayName}
                              onChange={(e) => setMfaDisplayName(e.target.value)}
                              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-[#FF5A24] focus:ring-[#FF5A24]"
                              placeholder="Factor display name"
                            />
                            <input
                              type="text"
                              inputMode="numeric"
                              autoComplete="one-time-code"
                              value={totpVerificationCode}
                              onChange={(e) => setTotpVerificationCode(e.target.value.replace(/\s+/g, ''))}
                              className="w-full rounded-md border border-gray-300 px-3 py-2 tracking-[0.3em] focus:border-[#FF5A24] focus:ring-[#FF5A24]"
                              placeholder="123456"
                            />
                          </div>
                          <div className="flex gap-3">
                            <Button variant="outline" onClick={cancelTotpEnrollment} fullWidth>
                              Cancel
                            </Button>
                            <Button
                              onClick={confirmTotpEnrollment}
                              isLoading={mfaActionLoading}
                              fullWidth
                            >
                              Verify And Enroll
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <Button
                          variant="outline"
                          onClick={beginTotpEnrollment}
                          isLoading={mfaActionLoading}
                          disabled={!mfaStatus?.projectTotpEnabled}
                        >
                          Start TOTP Setup
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="rounded-lg border border-gray-200 p-4">
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div>
                        <p className="font-medium text-gray-900">Password Rotation</p>
                        <p className="text-sm text-gray-500">
                          Generate a secure reset link for your own admin account.
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        onClick={generatePasswordResetLink}
                        isLoading={isGeneratingResetLink}
                        className="text-red-600 border-red-600 hover:bg-red-50"
                      >
                        <KeyRound className="mr-2 h-4 w-4" />
                        Generate Reset Link
                      </Button>
                    </div>
                    {generatedResetLink && (
                      <div className="mt-4 rounded-md bg-gray-50 p-3">
                        <p className="mb-2 text-sm font-medium text-gray-900">One-time reset link</p>
                        <a
                          href={generatedResetLink}
                          target="_blank"
                          rel="noreferrer"
                          className="break-all text-sm text-[#FF5A24] underline"
                        >
                          {generatedResetLink}
                        </a>
                      </div>
                    )}
                  </div>

                  <div className="rounded-lg border border-gray-200 p-4">
                    <p className="font-medium text-gray-900">Session Metadata</p>
                    <div className="mt-3 space-y-2 text-sm text-gray-600">
                      <p>Current session ID: <span className="font-medium text-gray-900">{securityProfile?.sessionId ?? 'Unavailable'}</span></p>
                      <p>Last activity: <span className="font-medium text-gray-900">{formatDate(securityProfile?.lastActivity)}</span></p>
                      <p>Allowed IP ranges: <span className="font-medium text-gray-900">{securityProfile?.allowedIpRanges?.length ? securityProfile.allowedIpRanges.join(', ') : 'No IP restrictions configured'}</span></p>
                    </div>
                  </div>

                  <div className="rounded-lg border border-gray-200 p-4">
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div>
                        <p className="font-medium text-gray-900">Your Active Sessions</p>
                        <p className="text-sm text-gray-500">
                          Review devices currently signed in to this admin account.
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        onClick={revokeOtherSessions}
                        isLoading={sessionActionLoading}
                        className="border-gray-300"
                      >
                        <Ban className="mr-2 h-4 w-4" />
                        Sign Out Other Sessions
                      </Button>
                    </div>

                    <div className="mt-4 space-y-3">
                      {sessions.length === 0 ? (
                        <div className="rounded-md border border-dashed border-gray-200 p-4 text-sm text-gray-500">
                          No recorded sessions for this account.
                        </div>
                      ) : (
                        sessions.map((session) => {
                          const isCurrentSession = session.id === currentSessionId;
                          return (
                            <div
                              key={session.id}
                              className="rounded-md border border-gray-200 p-4"
                            >
                              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2">
                                    <Monitor className="h-4 w-4 text-[#FF5A24]" />
                                    <p className="font-medium text-gray-900">
                                      {isCurrentSession ? 'Current Session' : 'Other Session'}
                                    </p>
                                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700">
                                      {session.status}
                                    </span>
                                  </div>
                                  <p className="mt-1 text-sm text-gray-500">
                                    IP: {session.ipAddress ?? 'unknown'}
                                  </p>
                                  <p className="mt-1 text-sm text-gray-500 break-all">
                                    Started: {formatTimestamp(session.createdAt)}
                                  </p>
                                  <p className="mt-1 text-sm text-gray-500 break-all">
                                    Last activity: {formatTimestamp(session.lastActivityAt)}
                                  </p>
                                  <p className="mt-1 text-xs text-gray-400 break-all">
                                    {session.userAgent ?? 'No user agent recorded'}
                                  </p>
                                </div>
                                {session.status === 'active' && (
                                  <Button
                                    variant="outline"
                                    onClick={() => revokeSession(session.id)}
                                    isLoading={sessionActionLoading}
                                    className="border-red-200 text-red-700 hover:bg-red-50"
                                  >
                                    <Ban className="mr-2 h-4 w-4" />
                                    {isCurrentSession ? 'Sign Out This Session' : 'Revoke'}
                                  </Button>
                                )}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'system' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900">System Settings</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Data Retention (days)
                  </label>
                  <select
                    value={settings.dataRetention}
                    onChange={(e) => setSettings({...settings, dataRetention: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-[#FF5A24] focus:border-[#FF5A24]"
                  >
                    <option value="30">30 days</option>
                    <option value="60">60 days</option>
                    <option value="90">90 days</option>
                    <option value="365">1 year</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Timezone
                  </label>
                  <select
                    value={settings.timezone}
                    onChange={(e) => setSettings({...settings, timezone: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-[#FF5A24] focus:border-[#FF5A24]"
                  >
                    <option value="UTC">UTC</option>
                    <option value="EST">Eastern Time</option>
                    <option value="PST">Pacific Time</option>
                    <option value="GMT">Greenwich Mean Time</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Language
                  </label>
                  <select
                    value={settings.language}
                    onChange={(e) => setSettings({...settings, language: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-[#FF5A24] focus:border-[#FF5A24]"
                  >
                    <option value="en">English</option>
                    <option value="es">Spanish</option>
                    <option value="fr">French</option>
                    <option value="de">German</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
