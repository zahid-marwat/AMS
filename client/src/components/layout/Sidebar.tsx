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
};

export function Sidebar({ role }: SidebarProps) {
  const location = useLocation();
  const links = role === 'admin' ? adminLinks : teacherLinks;

  return (
    <aside className="hidden w-72 shrink-0 border-r border-slate-200 bg-white lg:block">
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
              >
                {link.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}
