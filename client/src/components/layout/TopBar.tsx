import { useAuth } from '@/hooks/useAuth';
import { Button } from '../ui/Button';

export function TopBar({ title }: { title: string }) {
  const { user, logout } = useAuth();

  return (
    <header className="flex h-20 items-center justify-between border-b border-slate-200 bg-white px-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">{title}</h1>
        <p className="text-sm text-slate-500">{user?.role?.toUpperCase() === 'ADMIN' ? 'Administrator' : 'Teacher'} mode</p>
      </div>
      <div className="flex items-center gap-4">
        <div className="text-right">
          <p className="text-sm font-medium text-slate-900">
            {user ? `${user.firstName} ${user.lastName}` : 'Guest'}
          </p>
          <p className="text-xs text-slate-500">{user?.email ?? ''}</p>
        </div>
        <Button variant="ghost" onClick={logout}>
          Logout
        </Button>
      </div>
    </header>
  );
}
