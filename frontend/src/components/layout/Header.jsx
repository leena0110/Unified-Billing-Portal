import React from 'react';
import { LogOut, Bell, Search, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

const Header = () => {
  const { logout } = useAuth();

  return (
    <header className="bg-white h-16 border-b border-zinc-200 flex items-center justify-between px-6 shadow-sm z-10">
      <div className="flex items-center space-x-8">
        <div className="flex items-center space-x-3 group cursor-default">
          <div className="bg-black p-1.5 rounded-lg shadow-lg group-hover:rotate-12 transition-transform duration-500">
            <CheckCircle2 className="w-4 h-4 text-white" strokeWidth={3} />
          </div>
          <h1 className="text-sm font-black tracking-[0.2em] uppercase">
            Rite <span className="text-zinc-400">Electricals</span>
          </h1>
        </div>

        <div className="flex items-center bg-zinc-50 px-4 py-2.5 rounded-xl w-80 border border-zinc-100 focus-within:border-zinc-900 transition-all">
          <Search className="w-5 h-5 text-zinc-300" />
          <input 
            type="text" 
            placeholder="GLOBAL SEARCH" 
            className="bg-transparent border-none outline-none ml-3 w-full text-[10px] font-black tracking-widest placeholder-zinc-300 text-zinc-900 uppercase"
          />
        </div>
      </div>
      
      <div className="flex items-center space-x-4">
        <button className="p-2.5 text-zinc-300 hover:text-zinc-900 hover:bg-zinc-50 rounded-xl transition-all relative">
          <Bell className="w-5 h-5" />
          <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-black rounded-full ring-2 ring-white"></span>
        </button>
        
        <div className="h-8 w-px bg-zinc-200 mx-2"></div>
        
        <button 
          onClick={logout}
          className="flex items-center space-x-2 text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-zinc-900 hover:bg-zinc-50 px-4 py-2.5 rounded-xl transition-all"
        >
          <LogOut className="w-4 h-4" />
          <span>Exit System</span>
        </button>
      </div>
    </header>
  );
};

export default Header;
