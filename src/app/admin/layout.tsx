import React from 'react';
import AdminNavbar from '@/components/admin/Navbar';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-brand-dark flex text-white font-sans">
      <AdminNavbar />
      <main className="flex-1 overflow-y-auto p-6 sm:p-10">{children}</main>
    </div>
  );
}
