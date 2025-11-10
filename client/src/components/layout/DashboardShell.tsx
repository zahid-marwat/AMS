import { useState, type ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';

type DashboardShellProps = {
  title: string;
  children: ReactNode;
  role: 'admin' | 'teacher';
};

export function DashboardShell({ title, children, role }: DashboardShellProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleCloseSidebar = () => setIsSidebarOpen(false);

  return (
    <div className="flex min-h-screen bg-slate-100">
      <Sidebar role={role} isOpen={isSidebarOpen} onClose={handleCloseSidebar} />
      <div className="flex flex-1 flex-col">
        <TopBar title={title} onToggleSidebar={() => setIsSidebarOpen(true)} />
        <main className="flex-1 px-4 py-6 sm:px-6">
          <div className="mx-auto w-full max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
