import type { ButtonHTMLAttributes, ReactNode } from 'react';
import clsx from 'clsx';

type ButtonVariant = 'primary' | 'secondary' | 'ghost';

type ButtonProps = {
  variant?: ButtonVariant;
  icon?: ReactNode;
} & ButtonHTMLAttributes<HTMLButtonElement>;

const variantStyles: Record<ButtonVariant, string> = {
  primary: 'bg-brand text-white hover:bg-brand-dark focus-visible:ring-brand',
  secondary:
    'bg-white text-brand border border-brand hover:bg-brand/10 focus-visible:ring-brand',
  ghost: 'bg-transparent text-slate-600 hover:bg-slate-100 focus-visible:ring-slate-400',
};

export function Button({ className, children, icon, variant = 'primary', ...props }: ButtonProps) {
  const computedVariant: ButtonVariant = variant ?? 'primary';
  return (
    <button
      type="button"
      className={clsx(
        'inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
        variantStyles[computedVariant],
        className,
      )}
      {...props}
    >
      {icon}
      {children}
    </button>
  );
}
