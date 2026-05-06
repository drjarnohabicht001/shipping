'use client';

import { useAuth, usePermissions } from '@/contexts/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { 
  LayoutDashboard, 
  Package, 
  Users, 
  BarChart3, 
  Settings, 
  Shield,
  LogIn,
  Monitor,
  LogOut, 
  Menu, 
  X,
  Bell,
  Search,
  User,
  AlertTriangle,
  Download,
  FileText,
  MessageCircle
} from 'lucide-react';
import { Button } from '@/Components/Button';
import Logo from '../../../../public/svg/logo';

interface NavigationItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  permission?: string;
}

const navigation: NavigationItem[] = [
  { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
  // { name: 'Projects', href: '/admin/dashboard/projects', icon: Package, permission: 'projects.read' },
  { name: 'Tracking', href: '/admin/dashboard/tracking', icon: BarChart3, permission: 'tracking.read' },
  { name: 'Quotes', href: '/admin/dashboard/quotes', icon: Package, permission: 'quotes.read' },
  { name: 'Messages', href: '/admin/messages', icon: MessageCircle },
  { name: 'Users', href: '/admin/dashboard/users', icon: Users, permission: 'users.read' },
  { name: 'Security', href: '/admin/dashboard/security', icon: Shield, permission: 'security.read' },
  { name: 'Sessions', href: '/admin/dashboard/sessions', icon: Monitor, permission: 'sessions.read' },
  { name: 'Logins', href: '/admin/dashboard/logins', icon: LogIn, permission: 'logins.read' },
  //{ name: 'Audit Logs', href: '/admin/dashboard/audit', icon: FileText, permission: 'audit.read' },
  //{ name: 'Data Export', href: '/admin/dashboard/export', icon: Download, permission: 'read' },
  { name: 'Settings', href: '/admin/dashboard/settings', icon: Settings, permission: 'settings.read' },
];

export default function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, logout, isAuthenticated, isLoading } = useAuth();
  const { hasPermission } = usePermissions();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/admin/login');
    }
  }, [isAuthenticated, isLoading, router]);

  const handleLogout = async () => {
    await logout();
    router.push('/admin/login');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF5A24]"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const filteredNavigation = navigation.filter(item => 
    !item.permission || hasPermission(item.permission, 'read')
  );
  const requiresSecurityAction =
    user?.mustChangePassword || (user?.mfaRequired && !user?.mfaEnabled);
  const securityRestrictedRoute =
    requiresSecurityAction && pathname !== '/admin/dashboard/settings';
  const restrictedNavigation = filteredNavigation.filter(
    (item) => item.href === '/admin/dashboard/settings'
  );

  return (
    <div className="h-screen bg-gray-50 flex">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        >
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75"></div>
        </div>
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 lg:flex lg:flex-shrink-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center bg-red-600 justify-between h-16 px-6 border-b border-gray-200">
            <div className="flex items-center">
              <Logo />
              {/* <span className="ml-2 text-lg font-semibold text-gray-900">Admin</span> */}
            </div>
            <button
              className="lg:hidden"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-6 w-6 text-gray-400" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            {(securityRestrictedRoute ? restrictedNavigation : filteredNavigation).map((item) => {
              const isActive = pathname === item.href;
              return (
                <a
                  key={item.name}
                  href={item.href}
                  className={`
                    flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors
                    ${isActive 
                      ? 'bg-[#FF5A24] text-white' 
                      : 'text-gray-700 hover:bg-gray-100'
                    }
                  `}
                >
                  <item.icon className={`mr-3 h-5 w-5 ${isActive ? 'text-white' : 'text-gray-400'}`} />
                  {item.name}
                </a>
              );
            })}
          </nav>

          {/* User section */}
          <div className="border-t border-gray-200 p-4">
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 bg-[#FF5A24] rounded-full flex items-center justify-center">
                  <User className="h-4 w-4 text-white" />
                </div>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                <p className="text-xs text-gray-500">{user?.role}</p>
              </div>
            </div>
            <Button
              variant="secondary"
              size="sm"
              fullWidth
              onClick={handleLogout}
              className="flex items-center justify-center"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 lg:ml-0 overflow-x-hidden">
        {requiresSecurityAction && (
          <div className="border-b border-amber-200 bg-amber-50 px-6 py-3">
            <div className="flex flex-col gap-2 text-sm text-amber-900 md:flex-row md:items-center md:justify-between">
              <div className="flex items-start gap-2">
                <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                <div>
                  <p className="font-medium">Security action required on this admin account.</p>
                  <p className="text-amber-800">
                    {user?.mustChangePassword
                      ? 'Your password must be rotated before this account is considered secure.'
                      : 'Multi-factor authentication is required for this account.'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => router.push('/admin/dashboard/settings')}
                className="rounded-md border border-amber-300 px-3 py-2 font-medium text-amber-900 hover:bg-amber-100"
              >
                Review Security Settings
              </button>
            </div>
          </div>
        )}
        {/* Top header */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="flex items-center justify-between h-16 px-6">
            <div className="flex items-center">
              <button
                className="lg:hidden mr-4"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="h-6 w-6 text-gray-400" />
              </button>
              <h1 className="text-xl font-semibold text-gray-900">
                {(securityRestrictedRoute ? 'Security Action Required' : filteredNavigation.find(item => item.href === pathname)?.name) || 'Dashboard'}
              </h1>
            </div>

            <div className="flex items-center space-x-4">
              {/* Search */}
              <div className="hidden md:block relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search..."
                  className="block w-64 pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#FF5A24] focus:border-[#FF5A24]"
                />
              </div>

              {/* Notifications */}
              <button className="relative p-2 text-gray-400 hover:text-gray-500">
                <Bell className="h-5 w-5" />
                <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full"></span>
              </button>

              {/* User menu */}
              <div className="flex items-center">
                <div className="h-8 w-8 bg-[#FF5A24] rounded-full flex items-center justify-center">
                  <User className="h-4 w-4 text-white" />
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-6">
          {securityRestrictedRoute ? (
            <div className="mx-auto max-w-2xl rounded-xl border border-amber-200 bg-white p-8 shadow-sm">
              <div className="flex items-start gap-3">
                <AlertTriangle className="mt-1 h-5 w-5 text-amber-700" />
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Complete Required Security Setup</h2>
                  <p className="mt-2 text-sm text-gray-600">
                    This admin account is restricted until the required security step is completed.
                  </p>
                  <p className="mt-2 text-sm text-gray-700">
                    {user?.mustChangePassword
                      ? 'Rotate your password from the Security tab in Settings before continuing.'
                      : 'Enroll a TOTP authenticator factor from the Security tab in Settings before continuing.'}
                  </p>
                  <Button
                    className="mt-6"
                    onClick={() => router.push('/admin/dashboard/settings')}
                  >
                    Go To Security Settings
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            children
          )}
        </main>
      </div>
    </div>
  );
}
