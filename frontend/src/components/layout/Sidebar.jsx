import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, Receipt, ShoppingCart, Users, FileBarChart, CheckCircle2, ChevronDown, ChevronRight } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

const NavGroup = ({ item, isActive, pathname }) => {
  const [isOpen, setIsOpen] = useState(
    pathname.startsWith(item.basePath) || item.name === 'Summary' && pathname === '/'
  );

  const toggle = (e) => {
    if (item.subItems) {
      e.preventDefault();
      setIsOpen(!isOpen);
    }
  };

  const isGroupActive = item.subItems 
    ? item.subItems.some(sub => pathname === sub.path)
    : pathname === item.path;

  return (
    <div className="mb-2">
      {item.subItems ? (
        <div 
          onClick={toggle}
          className={`flex items-center justify-between px-5 py-4 rounded-xl cursor-pointer transition-all duration-200 group ${
            isGroupActive ? 'bg-zinc-800/80 text-white shadow-xl' : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900'
          }`}
        >
          <div className="flex items-center space-x-3">
            <item.icon className={`w-4 h-4 ${isGroupActive ? 'text-white' : 'text-zinc-600 group-hover:text-zinc-300'}`} />
            <span className="font-bold text-xs uppercase tracking-widest">{item.name}</span>
          </div>
          {isOpen ? <ChevronDown className="w-3 h-3 opacity-30" /> : <ChevronRight className="w-3 h-3 opacity-30" />}
        </div>
      ) : (
        <NavLink
          to={item.path}
          className={`flex items-center space-x-3 px-5 py-4 rounded-xl transition-all duration-200 group relative ${
            isGroupActive ? 'bg-zinc-800/80 text-white shadow-xl' : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900'
          }`}
        >
          <item.icon className={`w-4 h-4 ${isGroupActive ? 'text-white' : 'text-zinc-600 group-hover:text-zinc-300'}`} />
          <span className="font-bold text-xs uppercase tracking-widest">{item.name}</span>
          {isGroupActive && <div className="absolute right-4 w-1.5 h-1.5 rounded-full bg-zinc-500 shadow-lg shadow-zinc-500/50"></div>}
        </NavLink>
      )}

      {item.subItems && isOpen && (
        <div className="mt-2 ml-4 pl-4 border-l border-zinc-900 space-y-1">
          {item.subItems.map((subItem) => (
            <NavLink
              key={subItem.name}
              to={subItem.path}
              className={({ isActive }) =>
                `block px-4 py-3 rounded-lg text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-200 ${
                  isActive ? 'bg-zinc-700/50 text-white' : 'text-zinc-500 hover:text-zinc-200 hover:bg-zinc-900'
                }`
              }
            >
              {subItem.name}
            </NavLink>
          ))}
        </div>
      )}
    </div>
  );
};

const Sidebar = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const location = useLocation();

  const navItems = [
    { name: 'Summary', path: '/', basePath: '/summary', icon: LayoutDashboard },
    { 
      name: 'Sales Entry', 
      basePath: '/billing',
      icon: Receipt,
      subItems: [
        { name: 'New Bill', path: '/billing' },
        { name: 'Add Product', path: '/inventory/add' },
        { name: 'View Products', path: '/inventory' },
        { name: 'Rate Change', path: '/inventory/rate-change' },
        { name: 'Add Sales Receipt', path: '/sales/receipt' }
      ]
    },
    { 
      name: 'Customers', 
      basePath: '/customers',
      icon: Users,
      subItems: [
        { name: 'View Customers', path: '/customers' }
      ]
    },
    { 
      name: 'Purchases', 
      basePath: '/purchases',
      icon: ShoppingCart,
      subItems: [
        { name: 'Purchase Entry', path: '/purchases/new' },
        { name: 'View Purchases', path: '/purchases' },
        { name: 'Add Purchase Receipt', path: '/purchases/receipt' }
      ]
    },
  ];

  if (isAdmin) {
    navItems.push({ 
      name: 'Sales Report', 
      basePath: '/reports',
      icon: FileBarChart,
      subItems: [
        { name: 'Daily Report', path: '/reports/daily' },
        { name: 'Fortnight Report', path: '/reports/fortnight' },
        { name: 'Monthly Report', path: '/reports/monthly' },
        { name: 'Custom Date Report', path: '/reports/custom' }
      ]
    });
  }

  return (
    <div className="w-72 bg-black text-white h-full flex flex-col shadow-2xl z-10 transition-all duration-300 border-r border-zinc-900">
      <div className="p-8 flex items-center space-x-3 border-b border-zinc-900">
        <div className="bg-white p-2 rounded-xl shadow-xl">
          <CheckCircle2 className="w-5 h-5 text-black" strokeWidth={3} />
        </div>
        <h1 className="text-sm font-black tracking-[0.2em] font-sans">
          <span className="text-white">RITE</span> <span className="text-zinc-400">ELECTRICALS</span>
        </h1>
      </div>
      
      <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar px-4">
        <nav className="py-8">
          {navItems.map((item) => (
            <NavGroup key={item.name} item={item} pathname={location.pathname} />
          ))}
        </nav>
      </div>
      
      <div className="p-6 bg-zinc-900 m-6 rounded-[2rem] border border-zinc-800 shadow-2xl">
        <p className="text-[10px] text-zinc-600 uppercase tracking-[0.3em] font-black mb-4 ml-1">Identity</p>
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-zinc-800 flex items-center justify-center text-white font-bold border border-zinc-700 shadow-inner">
            {user?.full_name?.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-black text-white truncate text-xs uppercase tracking-widest">{user?.full_name}</p>
            <p className="text-[9px] text-zinc-500 font-black uppercase tracking-[0.2em] mt-1">{user?.role}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
