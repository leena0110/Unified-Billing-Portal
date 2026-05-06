import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { LogOut, User, ChevronDown } from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useAuth();
  const [activeDropdown, setActiveDropdown] = useState(null);
  const isAdmin = user?.role === 'admin';

  let menuItems = [];

  if (isAdmin) {
    menuItems = [
      {
        name: 'Sales Entry',
        path: '/billing',
        subItems: [
          { name: 'Billing Portal', path: '/billing' },
          { name: 'Add Product', path: '/inventory' },
          { name: 'View Products', path: '/inventory' },
          { name: 'Rate Change', path: '/rate-change' },
          { name: 'Add Sales Receipt', path: '/sales-receipt' },
        ]
      },
      {
        name: 'Customers',
        path: '/customers',
        subItems: [
          { name: 'View Customers', path: '/customers' },
        ]
      },
      {
        name: 'Purchases',
        path: '/purchases',
        subItems: [
          { name: 'Purchase Entry', path: '/purchases' },
          { name: 'Purchase Summary', path: '/purchase-summary' },
          { name: 'Add Purchase Receipt', path: '/purchases-receipt' },
        ]
      },
      {
        name: 'Summary',
        path: '/',
        subItems: [
          { name: 'Dashboard', path: '/' },
          { name: 'Stock Summary', path: '/inventory' },
          { name: 'Purchase Receipt Summary', path: '/purchase-summary' },
          { name: 'Sales Receipt Summary', path: '/sales-summary' },
        ]
      },
      {
        name: 'Sales Report',
        path: '/reports',
        subItems: []
      }
    ];
  } else {
    // Standard User - Billing Only
    menuItems = [
      {
        name: 'Sales Entry',
        path: '/billing',
        subItems: [
          { name: 'Billing Portal', path: '/billing' },
          { name: 'Add Sales Receipt', path: '/sales-receipt' },
        ]
      }
    ];
  }

  return (
    <nav className="bg-white border-b border-zinc-200 shadow-sm flex items-center justify-between px-6 h-12 z-50">
      <div className="flex items-center h-full">
        {menuItems.map((item) => (
          <div 
            key={item.name}
            className="h-full relative group"
            onMouseEnter={() => setActiveDropdown(item.name)}
            onMouseLeave={() => setActiveDropdown(null)}
          >
            <NavLink
              to={item.path}
              className={({ isActive }) =>
                `h-full flex items-center px-6 text-[10px] font-black uppercase tracking-[0.2em] transition-all border-b-2 ${
                  isActive || activeDropdown === item.name
                    ? 'border-zinc-900 text-zinc-900 bg-zinc-50' 
                    : 'border-transparent text-zinc-400 hover:text-zinc-900 hover:bg-zinc-50'
                }`
              }
            >
              {item.name}
              {item.subItems.length > 0 && (
                <ChevronDown className={`ml-2 w-3 h-3 transition-transform duration-300 ${activeDropdown === item.name ? 'rotate-180' : ''}`} />
              )}
            </NavLink>

            {/* Dropdown Menu */}
            <div className={`absolute top-full left-0 w-64 bg-white border border-zinc-100 shadow-2xl rounded-b-2xl overflow-hidden transition-all duration-300 transform origin-top ${
              activeDropdown === item.name ? 'opacity-100 scale-y-100' : 'opacity-0 scale-y-0 pointer-events-none'
            }`}>
              <div className="py-3 bg-zinc-50/50">
                {item.subItems.map((subItem) => (
                  <NavLink
                    key={subItem.name}
                    to={subItem.path}
                    className={({ isActive }) => 
                      `block px-8 py-3.5 text-[10px] font-black uppercase tracking-widest transition-all ${
                        isActive 
                          ? 'bg-zinc-900 text-white' 
                          : 'text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900'
                      }`
                    }
                  >
                    {subItem.name}
                  </NavLink>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center space-x-8">
        <div className="flex items-center space-x-3 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 px-4 py-1.5 bg-zinc-50 rounded-full border border-zinc-100">
          <User className="w-3.5 h-3.5" />
          <span className="text-zinc-900">{user?.full_name || 'Staff Member'}</span>
        </div>
        <button 
          onClick={logout}
          className="group flex items-center space-x-2 text-[10px] font-black uppercase tracking-[0.2em] text-red-500 hover:text-red-700 transition-all"
        >
          <div className="p-1.5 rounded-lg group-hover:bg-red-50 transition-all">
            <LogOut className="w-4 h-4" />
          </div>
          <span>Exit System</span>
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
