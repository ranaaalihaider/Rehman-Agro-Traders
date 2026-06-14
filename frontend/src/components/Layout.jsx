import React from 'react';
import Sidebar from './Sidebar';

const Layout = ({ children }) => {
  return (
    <div className="flex min-h-screen flex-col md:flex-row bg-slate-50">
      {/* Sidebar (print:hidden) */}
      <Sidebar />
      
      {/* Main Content Viewport */}
      <main className="flex-1 overflow-y-auto px-4 py-6 pb-20 md:pb-8 md:px-8 md:py-8">
        <div className="mx-auto max-w-6xl">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
