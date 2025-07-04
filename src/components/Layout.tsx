import React, { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  FileText, 
  Settings, 
  Users, 
  LogOut, 
  Menu, 
  X, 
  LayoutDashboard, 
  Briefcase,
  Building2,
  UserCog,
  Shield
} from 'lucide-react';
import { Permission } from '../types';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, userProfile, currentTenant, logout, hasPermission, isRole } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Failed to logout:', error);
    }
  };

  const navigation = [
    { 
      name: 'Dashboard', 
      href: '/dashboard', 
      icon: LayoutDashboard,
      permission: Permission.VIEW_DASHBOARD
    },
    { 
      name: 'Leads', 
      href: '/leads', 
      icon: Briefcase,
      permission: Permission.VIEW_LEADS
    },
    { 
      name: 'Invoices', 
      href: '/invoices', 
      icon: FileText,
      permission: Permission.VIEW_INVOICES
    },
    { 
      name: 'Customers', 
      href: '/customers', 
      icon: Users,
      permission: Permission.VIEW_CUSTOMERS
    },
    { 
      name: 'Settings', 
      href: '/settings', 
      icon: Settings,
      permission: null // Settings page handles its own permission checks
    },
  ];

  // Add admin-only navigation items
  const adminNavigation = [
    { 
      name: 'User Management', 
      href: '/admin/users', 
      icon: UserCog,
      permission: Permission.MANAGE_USERS
    },
    { 
      name: 'Tenant Management', 
      href: '/admin/tenants', 
      icon: Building2,
      permission: Permission.MANAGE_TENANTS
    },
  ];

  const filteredNavigation = navigation.filter(item => 
    !item.permission || hasPermission(item.permission)
  );

  const filteredAdminNavigation = adminNavigation.filter(item => 
    hasPermission(item.permission)
  );

  const displayName = userProfile?.name || currentUser?.email || 'User';
  const tenantName = currentTenant?.name || 'VRITIX Agency';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 z-50 lg:hidden ${sidebarOpen ? 'block' : 'hidden'}`}>
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
        <div className="fixed inset-y-0 left-0 flex w-64 flex-col bg-white">
          <div className="flex h-16 items-center justify-between px-4 border-b">
            <div>
              <h1 className="text-lg font-bold text-primary">{tenantName}</h1>
              {currentTenant && (
                <p className="text-xs text-gray-500">Client Portal</p>
              )}
            </div>
            <button onClick={() => setSidebarOpen(false)} className="text-gray-500 hover:text-gray-700">
              <X className="h-6 w-6" />
            </button>
          </div>
          
          <nav className="flex-1 px-4 py-4 space-y-2">
            {filteredNavigation.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.name}
                  to={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={({ isActive }) => `flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-secondary text-primary'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="mr-3 h-5 w-5" />
                  {item.name}
                </NavLink>
              );
            })}
            
            {filteredAdminNavigation.length > 0 && (
              <>
                <div className="pt-4 pb-2">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Administration
                  </p>
                </div>
                {filteredAdminNavigation.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.name}
                      to={item.href}
                      onClick={() => setSidebarOpen(false)}
                      className={({ isActive }) => `flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-secondary text-primary'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <Icon className="mr-3 h-5 w-5" />
                      {item.name}
                    </NavLink>
                  );
                })}
              </>
            )}
          </nav>
          
          <div className="p-4 border-t">
            <div className="flex items-center mb-3">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
                  <span className="text-white text-sm font-medium">
                    {displayName.charAt(0).toUpperCase()}
                  </span>
                </div>
              </div>
              <div className="ml-3 min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-700 truncate">
                  {displayName}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {userProfile?.role.replace('_', ' ').toUpperCase()}
                </p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center w-full px-3 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-100 transition-colors"
            >
              <LogOut className="mr-3 h-5 w-5" />
              Sign out
            </button>
          </div>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col">
        <div className="flex grow flex-col gap-y-5 overflow-y-auto border-r border-gray-200 bg-white px-6">
          <div className="flex h-16 shrink-0 items-center">
            <div>
              <h1 className="text-xl font-bold text-primary">{tenantName}</h1>
              {currentTenant && (
                <p className="text-xs text-gray-500">Client Portal</p>
              )}
            </div>
          </div>
          
          <nav className="flex flex-1 flex-col">
            <ul role="list" className="flex flex-1 flex-col gap-y-7">
              <li>
                <ul role="list" className="-mx-2 space-y-1">
                  {filteredNavigation.map((item) => {
                    const Icon = item.icon;
                    return (
                      <li key={item.name}>
                        <NavLink
                          to={item.href}
                          className={({ isActive }) => `group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold transition-colors ${
                            isActive
                              ? 'bg-secondary text-primary'
                              : 'text-gray-700 hover:text-primary hover:bg-gray-50'
                          }`}
                        >
                          <Icon className="h-6 w-6 shrink-0" />
                          {item.name}
                        </NavLink>
                      </li>
                    );
                  })}
                </ul>
              </li>
              
              {filteredAdminNavigation.length > 0 && (
                <li>
                  <div className="text-xs font-semibold leading-6 text-gray-400">
                    Administration
                  </div>
                  <ul role="list" className="-mx-2 mt-2 space-y-1">
                    {filteredAdminNavigation.map((item) => {
                      const Icon = item.icon;
                      return (
                        <li key={item.name}>
                          <NavLink
                            to={item.href}
                            className={({ isActive }) => `group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold transition-colors ${
                              isActive
                                ? 'bg-secondary text-primary'
                                : 'text-gray-700 hover:text-primary hover:bg-gray-50'
                            }`}
                          >
                            <Icon className="h-6 w-6 shrink-0" />
                            {item.name}
                          </NavLink>
                        </li>
                      );
                    })}
                  </ul>
                </li>
              )}
              
              <li className="mt-auto">
                <div className="flex items-center gap-x-4 px-2 py-3 text-sm font-semibold leading-6 text-gray-900">
                  <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
                    <span className="text-white text-sm font-medium">
                      {displayName.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="block truncate">{displayName}</span>
                    <span className="block text-xs text-gray-500 truncate">
                      {userProfile?.role.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="group -mx-2 flex w-full gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold text-gray-700 hover:bg-gray-50 hover:text-primary transition-colors"
                >
                  <LogOut className="h-6 w-6 shrink-0" />
                  Sign out
                </button>
              </li>
            </ul>
          </nav>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-72">
        <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
          <button
            type="button"
            className="-m-2.5 p-2.5 text-gray-700 lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <span className="sr-only">Open sidebar</span>
            <Menu className="h-6 w-6" />
          </button>
          
          <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
            <div className="flex flex-1 items-center">
              {userProfile && (
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Shield className="h-4 w-4" />
                  <span>{userProfile.role.replace('_', ' ').toUpperCase()}</span>
                  {currentTenant && (
                    <>
                      <span>•</span>
                      <Building2 className="h-4 w-4" />
                      <span>{currentTenant.name}</span>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <main className="py-10">
          <div className="px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;