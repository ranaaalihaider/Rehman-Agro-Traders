import React, { useState, useContext, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import API from '../utils/axiosConfig';
import {
  LayoutDashboard,
  Building2,
  Layers,
  ArrowDownLeft,
  ArrowUpRight,
  FileText,
  ClipboardList,
  BarChart3,
  History,
  Settings,
  LogOut,
  Menu,
  X,
  Sprout
} from 'lucide-react';

const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { logout, user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [businessProfile, setBusinessProfile] = useState({ name: 'Rehman Agro Traders' });

  useEffect(() => {
    const fetchBusiness = async () => {
      try {
        const { data } = await API.get('/settings/profile');
        if (data) setBusinessProfile(data);
      } catch (err) {
        console.error('Failed to load business profile', err);
      }
    };
    fetchBusiness();
  }, []);

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Companies', path: '/companies', icon: Building2 },
    { name: 'Items', path: '/items', icon: Layers },
    { name: 'Stock In', path: '/stock-in', icon: ArrowDownLeft },
    { name: 'Stock Out', path: '/stock-out', icon: ArrowUpRight },
    { name: 'Invoices', path: '/invoices', icon: FileText },
    { name: 'Stock Summary', path: '/stock-summary', icon: ClipboardList },
    { name: 'Reports', path: '/reports', icon: BarChart3 },
    { name: 'Activity Logs', path: '/activity-logs', icon: History },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const toggleSidebar = () => setIsOpen(!isOpen);

  return (
    <>
      {/* Mobile Top Bar (print:hidden) */}
      <div className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 md:hidden print-hide">
        <div className="flex items-center gap-2">
          <div className="rounded-lg bg-primary-700 p-2 text-white">
            <Sprout size={20} />
          </div>
          <span className="font-sans text-lg font-bold text-slate-800 tracking-wide">
            {businessProfile.name}
          </span>
        </div>
        <button
          onClick={toggleSidebar}
          className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50 transition-colors"
        >
          {isOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Backdrop overlay for mobile (print:hidden) */}
      {isOpen && (
        <div
          onClick={toggleSidebar}
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm md:hidden print-hide"
        />
      )}

      {/* Sidebar Container (print:hidden) */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-slate-200/60 bg-white px-4 py-6 transition-all duration-300 md:translate-x-0 md:static print-hide ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="mb-8 flex items-center gap-3 px-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-700 text-white shadow-md shadow-primary-700/20">
            <Sprout size={22} className="animate-pulse" />
          </div>
          <div>
            <h1 className="font-sans font-bold text-slate-800 leading-tight text-[15px] tracking-wide">
              {businessProfile.name}
            </h1>
            <span className="text-[11px] font-medium text-primary-700 uppercase tracking-widest">
              Stock Manager
            </span>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setIsOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-2.5 rounded-xl text-[14px] font-medium tracking-wide transition-all duration-150 ${
                    isActive
                      ? 'bg-primary-50 text-primary-800 border-l-4 border-primary-700 pl-3'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-800'
                  }`
                }
              >
                <Icon size={18} />
                {item.name}
              </NavLink>
            );
          })}
        </nav>

        {/* Footer Admin Details & Logout */}
        <div className="mt-auto border-t border-slate-100 pt-4">
          <div className="mb-3 flex items-center gap-3 px-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 text-primary-800 font-bold text-sm">
              {user?.username?.substring(0, 2).toUpperCase() || 'AD'}
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-700 capitalize">
                {user?.username || 'Admin'}
              </p>
              <span className="text-[10px] text-slate-400">System Operator</span>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-[14px] font-medium text-red-600 hover:bg-red-50 hover:text-red-700 transition-all duration-150"
          >
            <LogOut size={18} />
            Log Out
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
