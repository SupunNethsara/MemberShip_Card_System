import { useDispatch, useSelector } from 'react-redux';
import { Globe } from 'lucide-react';
import { LOCALES, setLocale } from '../../app/localeSlice';
import Icon from '../ui/Icon';

/**
 * Instant language switcher (no reload; CMS content is already loaded in all locales).
 * Shows each language in its own script — full names where the header has room, short labels elsewhere.
 * size: 'lg' for the public header, 'md' for the compact portal header.
 */
export default function LanguageSwitcher({ className = '', size = 'md' }) {
  const dispatch = useDispatch();
  const current = useSelector((s) => s.locale.current);
  const lg = size === 'lg';
  // Full names only where the header has room: tablet (no desktop links yet) and wide desktop.
  const full = lg;

  return (
    <div
      role="radiogroup"
      aria-label="Language / භාෂාව / மொழி"
      className={`inline-flex items-center rounded-full border border-slate-200 bg-slate-50 p-1 ${className}`}
    >
      <Icon icon={Globe} size={lg ? 16 : 14} className={`mx-1.5 hidden shrink-0 text-slate-400 ${lg ? 'md:block' : ''}`} />
      {LOCALES.map((l) => {
        const active = current === l.code;
        return (
          <button
            key={l.code}
            type="button"
            role="radio"
            aria-checked={active}
            lang={l.code}
            title={l.name}
            onClick={() => dispatch(setLocale(l.code))}
            className={`rounded-full font-medium transition-colors ${lg ? 'h-9 px-3 text-[13px] sm:px-3.5' : 'h-8 px-2.5 text-xs'} ${
              active ? 'bg-navy-900 text-white shadow-sm' : 'text-slate-600 hover:bg-white hover:text-navy-900'
            }`}
          >
            <span className={full ? 'md:hidden lg:inline xl:hidden' : ''}>{l.label}</span>
            {full && <span className="hidden md:inline lg:hidden xl:inline">{l.code === 'en' ? 'English' : l.name}</span>}
          </button>
        );
      })}
    </div>
  );
}
