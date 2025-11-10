import { useAuth } from '@/hooks/useAuth';
import { Button } from '../ui/Button';

type TopBarProps = {
  title: string;
  onToggleSidebar?: () => void;
};

export function TopBar({ title, onToggleSidebar }: TopBarProps) {
  const { user, logout } = useAuth();

  return (
    <header className="flex h-20 items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-6">
      <div className="flex items-center gap-3">
        {onToggleSidebar && (
          <button
            type="button"
            onClick={onToggleSidebar}
            className="rounded-lg p-2 text-slate-500 transition hover:text-slate-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand lg:hidden"
            aria-label="Open navigation menu"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5M3.75 17.25h16.5" />
            </svg>
          </button>
        )}
        <h1 className="text-2xl font-semibold text-slate-900">{title}</h1>
        <p className="hidden text-sm text-slate-500 sm:block">{user?.role?.toUpperCase() === 'ADMIN' ? 'Administrator' : 'Teacher'} mode</p>
      </div>
      <div className="flex items-center gap-4">
        <div className="text-right">
          <p className="text-sm font-medium text-slate-900">
            {user ? `${user.firstName} ${user.lastName}` : 'Guest'}
          </p>
          <p className="hidden text-xs text-slate-500 sm:block">{user?.email ?? ''}</p>
        </div>
        <Button variant="ghost" onClick={logout}>
          Logout
        </Button>
      </div>
    </header>
  );
}
