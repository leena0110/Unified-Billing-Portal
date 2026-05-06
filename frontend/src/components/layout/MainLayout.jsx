import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';

const MainLayout = () => {
  return (
    <div className="flex flex-col h-screen bg-zinc-50 overflow-hidden">
      <Navbar />
      <main className="flex-1 overflow-y-auto p-4 scroll-smooth">
        <div className="max-w-[1600px] mx-auto h-full">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default MainLayout;
