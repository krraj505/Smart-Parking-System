import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Search,
  CalendarCheck,
  Building2,
  Grid,
  Car,
  DoorOpen,
  CreditCard,
  BarChart3,
  Bell,
  Settings,
  HelpCircle,
  ShieldAlert,
  Users,
  Coins,
  FileText,
  ChevronLeft,
  ChevronRight,
  Zap,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const Sidebar: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const { user } = useAuth();

  const mainNav = [
    { name: 'Overview Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Find Parking', path: '/find-parking', icon: Search },
    { name: 'My Reservations', path: '/reservations', icon: CalendarCheck },
    { name: 'Parking Lots', path: '/parking-lots', icon: Building2 },
    { name: 'Smart Slot Management', path: '/slot-management', icon: Grid },
    { name: 'Vehicle Management', path: '/vehicles', icon: Car },
    { name: 'Entry & Exit Gate', path: '/entry-exit', icon: DoorOpen },
    { name: 'Payments', path: '/payments', icon: CreditCard },
    { name: 'Analytics & Reports', path: '/analytics', icon: BarChart3 },
    { name: 'Notifications', path: '/notifications', icon: Bell },
    { name: 'Settings', path: '/settings', icon: Settings },
    { name: 'Help & Support', path: '/help', icon: HelpCircle },
  ];

  const adminNav = [
    { name: 'Admin Dashboard', path: '/admin', icon: ShieldAlert },
    { name: 'User Management', path: '/admin/users', icon: Users },
    { name: 'Pricing Rules', path: '/admin/pricing', icon: Coins },
    { name: 'Audit Logs', path: '/admin/audit-logs', icon: FileText },
  ];

  return (
    <aside
      className={`relative flex flex-col border-r border-slate-200 dark:border-navy-800 bg-white dark:bg-navy-900 transition-all duration-300 ease-in-out z-30 ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-slate-200 dark:border-navy-800">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-10 h-10 rounded-xl bg-electric-600 flex items-center justify-center text-white shadow-glow-blue flex-shrink-0">
            <Zap className="w-5 h-5" />
          </div>
          {!collapsed && (
            <div className="leading-tight truncate">
              <span className="font-bold text-base tracking-tight text-slate-900 dark:text-white">
                PARK<span className="text-electric-500">PULSE</span>
              </span>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-widest font-semibold">
                Smart Mobility
              </p>
            </div>
          )}
        </div>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-navy-800 transition-colors"
          title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
        <div>
          {!collapsed && (
            <p className="px-3 mb-2 text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              Main Operations
            </p>
          )}
          <nav className="space-y-1">
            {mainNav.map(item => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === '/'}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-electric-500/10 text-electric-600 dark:text-electric-400 border border-electric-500/20 font-semibold shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-navy-800 hover:text-slate-900 dark:hover:text-white'
                    }`
                  }
                  title={collapsed ? item.name : undefined}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  {!collapsed && <span className="truncate">{item.name}</span>}
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Administrator Section */}
        <div>
          {!collapsed && (
            <p className="px-3 mb-2 text-[11px] font-semibold text-amber-500 uppercase tracking-wider">
              System Administration
            </p>
          )}
          <nav className="space-y-1">
            {adminNav.map(item => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20 font-semibold shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-navy-800 hover:text-slate-900 dark:hover:text-white'
                    }`
                  }
                  title={collapsed ? item.name : undefined}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  {!collapsed && <span className="truncate">{item.name}</span>}
                </NavLink>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Footer Profile Pill (Neutral Console Operator Display) */}
      <div className="p-3 border-t border-slate-200 dark:border-navy-800 bg-slate-50 dark:bg-navy-950/40">
        <div className="flex items-center gap-2.5 overflow-hidden">
          <div className="w-9 h-9 rounded-xl bg-electric-500/10 dark:bg-electric-500/20 text-electric-500 flex items-center justify-center font-bold text-sm flex-shrink-0">
            {user?.full_name?.charAt(0) || 'A'}
          </div>
          {!collapsed && (
            <div className="leading-tight truncate">
              <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                {user?.full_name || 'Smart Parking Admin'}
              </p>
              <span className="inline-block px-1.5 py-0.2 text-[10px] rounded uppercase font-bold tracking-wider mt-0.5 bg-amber-500/20 text-amber-400">
                ADMIN
              </span>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};
