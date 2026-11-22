import { forwardRef } from 'react';
import { Loader2 } from 'lucide-react';
import Icon from './Icon';

const VARIANTS = {
  primary: 'bg-navy-900 text-white hover:bg-navy-800 border border-navy-900 shadow-[0_1px_0_rgb(255_255_255/0.08)_inset]',
  secondary: 'bg-white text-navy-900 border border-slate-300 hover:bg-slate-50 hover:border-slate-400',
  ghost: 'bg-transparent text-slate-700 border border-transparent hover:bg-slate-100',
  danger: 'bg-rose-600 text-white border border-rose-600 hover:bg-rose-700',
  'danger-ghost': 'bg-transparent text-rose-600 border border-transparent hover:bg-rose-50',
  gold: 'bg-gold-400 text-navy-950 border border-gold-500 hover:bg-gold-300',
  success: 'bg-emerald-600 text-white border border-emerald-600 hover:bg-emerald-700',
};

const SIZES = {
  xs: 'h-7 px-2 text-xs gap-1',
  sm: 'h-8 px-3 text-xs gap-1.5',
  md: 'h-9 px-3.5 text-sm gap-2',
  lg: 'h-11 px-5 text-sm gap-2',
  icon: 'h-8 w-8 justify-center',
};

const Button = forwardRef(function Button(
  { variant = 'primary', size = 'md', icon, iconRight, loading = false, className = '', children, type = 'button', disabled, ...rest },
  ref
) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      className={`inline-flex shrink-0 items-center rounded-md font-medium transition-colors duration-100 disabled:cursor-not-allowed disabled:opacity-50 ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
      {...rest}
    >
      {loading ? <Icon icon={Loader2} size={size === 'lg' ? 16 : 14} className="animate-spin" /> : icon && <Icon icon={icon} size={size === 'lg' ? 16 : 14} />}
      {children}
      {iconRight && !loading && <Icon icon={iconRight} size={14} />}
    </button>
  );
});

export default Button;
