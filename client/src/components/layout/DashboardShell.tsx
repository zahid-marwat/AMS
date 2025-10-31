import type { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';

type DashboardShellProps = {
  title: string;
  children: ReactNode;
  role: 'admin' | 'teacher';
};

export function DashboardShell({ title, children, role }: DashboardShellProps) {
  return (
    <div className="flex min-h-screen bg-slate-100">
      <Sidebar role={role} />
      <div className="flex flex-1 flex-col">
        <TopBar title={title} />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
