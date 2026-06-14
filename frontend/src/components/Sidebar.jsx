import React, { useState, useContext, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
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
  const location = useLocation();
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

  const bottomNavItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Stock In', path: '/stock-in', icon: ArrowDownLeft },
    { name: 'Stock Out', path: '/stock-out', icon: ArrowUpRight },
    { name: 'Invoices', path: '/invoices', icon: FileText },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const toggleSidebar = () => setIsOpen(!isOpen);

  return (
    <>
      {/* Mobile Top Bar (print:hidden) */}
      <div className="flex h-16 items-center justify-between border-b border-slate-200/80 bg-white px-4 md:hidden print-hide">
        <div className="flex items-center gap-2">
          <div className="rounded-lg bg-primary-700 p-2 text-white">
            <Sprout size={20} />
          </div>
          <span className="font-sans text-md font-bold text-slate-800 tracking-wide">
            {businessProfile.name}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 text-primary-800 font-bold text-xs uppercase shadow-sm">
            {user?.username?.substring(0, 2).toUpperCase() || 'AD'}
          </div>
        </div>
      </div>

      {/* Backdrop overlay for mobile (print:hidden) */}
      {isOpen && (
        <div
          onClick={toggleSidebar}
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm md:hidden print-hide"
        />
      )}

      {/* Sidebar Drawer Container (print:hidden) */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-66 flex-col border-r border-slate-200/60 bg-white px-4 py-6 transition-all duration-300 md:translate-x-0 md:static print-hide ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="mb-8 flex items-center justify-between px-2">
          <div className="flex items-center gap-3">
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
          {/* Close button inside mobile menu */}
          <button 
            onClick={toggleSidebar}
            className="md:hidden p-1.5 rounded-lg border border-slate-100 text-slate-500 hover:bg-slate-50"
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 space-y-1 overflow-y-auto pr-1">
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

      {/* Mobile Bottom Navigation Bar (print:hidden) */}
      <div className="fixed bottom-0 left-0 right-0 z-40 flex h-16 items-center justify-around border-t border-slate-200 bg-white/95 backdrop-blur-md px-2 pb-safe md:hidden print-hide shadow-[0_-4px_16px_-4px_rgba(0,0,0,0.08)]">
        {bottomNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setIsOpen(false)}
              className={`flex flex-col items-center justify-center flex-1 h-full py-1 text-center transition-all duration-150 relative ${
                isActive ? 'text-primary-700' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <div className={`p-1.5 rounded-xl transition-all duration-200 ${isActive ? 'bg-primary-50 scale-105' : ''}`}>
                <Icon size={20} />
              </div>
              <span className="text-[10px] font-medium mt-0.5 tracking-wide leading-none">{item.name}</span>
              {isActive && (
                <span className="absolute top-0 w-8 h-0.5 rounded-b bg-primary-700 shadow shadow-primary-700/50" />
              )}
            </NavLink>
          );
        })}
        {/* Menu/More Toggle Button */}
        <button
          onClick={toggleSidebar}
          className={`flex flex-col items-center justify-center flex-1 h-full py-1 text-center transition-all duration-150 relative ${
            isOpen ? 'text-primary-700' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <div className={`p-1.5 rounded-xl transition-all duration-200 ${isOpen ? 'bg-primary-50 scale-105' : ''}`}>
            {isOpen ? <X size={20} /> : <Menu size={20} />}
          </div>
          <span className="text-[10px] font-medium mt-0.5 tracking-wide leading-none">Menu</span>
        </button>
      </div>
    </>
  );
};

export default Sidebar;
