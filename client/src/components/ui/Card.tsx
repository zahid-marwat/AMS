import type { ReactNode } from 'react';
import clsx from 'clsx';

type CardProps = {
  title?: string;
  className?: string;
  children: ReactNode;
  actions?: ReactNode;
  onClick?: () => void;
};

export function Card({ title, className, children, actions, onClick }: CardProps) {
  return (
    <div 
      className={clsx('rounded-xl border border-slate-200 bg-white p-6 shadow-sm', className)}
      onClick={onClick}
    >
      {(title || actions) && (
        <header className="mb-4 flex items-center justify-between gap-4">
          {title && <h3 className="text-lg font-semibold text-slate-800">{title}</h3>}
          {actions}
        </header>
      )}
      {children}
    </div>
  );
}
