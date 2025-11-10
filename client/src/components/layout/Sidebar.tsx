import { NavLink, useLocation } from 'react-router-dom';
import clsx from 'clsx';

const adminLinks = [
  { to: '/admin', label: 'Overview' },
  { to: '/admin/classes', label: 'Classes' },
  { to: '/admin/students', label: 'Students' },
  { to: '/admin/teachers', label: 'Teachers' },
  { to: '/admin/attendance', label: 'Attendance' },
];

const teacherLinks = [
  { to: '/teacher', label: 'Today\'s Attendance' },
  { to: '/teacher/history', label: 'History' },
  { to: '/teacher/students', label: 'Students' },
];

type SidebarProps = {
  role: 'admin' | 'teacher';
  isOpen?: boolean;
  onClose?: () => void;
};

export function Sidebar({ role, isOpen = false, onClose }: SidebarProps) {
  const location = useLocation();
  const links = role === 'admin' ? adminLinks : teacherLinks;

  const sidebarContent = (
    <>
      <div className="flex h-20 items-center border-b border-slate-200 px-6">
        <span className="text-xl font-semibold text-brand">AMS Dashboard</span>
      </div>
      <nav className="px-4 py-6">
        <ul className="space-y-1">
          {links.map((link) => (
            <li key={link.to}>
              <NavLink
                to={link.to}
                className={() =>
                  clsx(
                    'flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    location.pathname === link.to
                      ? 'bg-brand text-white shadow-sm'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
                  )
                }
                onClick={onClose}
              >
                {link.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden w-72 shrink-0 border-r border-slate-200 bg-white lg:block">
        {sidebarContent}
      </aside>

      {/* Mobile sidebar */}
      <div className={clsx('lg:hidden', isOpen ? 'pointer-events-auto' : 'pointer-events-none')}>
        <div
          className={clsx(
            'fixed inset-0 z-40 bg-slate-900/40 transition-opacity',
            isOpen ? 'opacity-100' : 'opacity-0',
          )}
          onClick={onClose}
        />
        <aside
          className={clsx(
            'fixed inset-y-0 left-0 z-50 w-72 bg-white shadow-lg transition-transform',
            isOpen ? 'translate-x-0' : '-translate-x-full',
          )}
        >
          <div className="flex h-20 items-center justify-between border-b border-slate-200 px-6">
            <span className="text-xl font-semibold text-brand">AMS Dashboard</span>
            <button
              type="button"
              onClick={onClose}
              className="rounded p-2 text-slate-500 transition hover:text-slate-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
              aria-label="Close navigation"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <nav className="px-4 py-6">
            <ul className="space-y-1">
              {links.map((link) => (
                <li key={link.to}>
                  <NavLink
                    to={link.to}
                    className={() =>
                      clsx(
                        'flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                        location.pathname === link.to
                          ? 'bg-brand text-white shadow-sm'
                          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
                      )
                    }
                    onClick={onClose}
                  >
                    {link.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>
        </aside>
      </div>
    </>
  );
}
