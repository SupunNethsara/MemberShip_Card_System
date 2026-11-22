import { useDispatch, useSelector } from 'react-redux';
import { LOCALES, setLocale } from '../../app/localeSlice';

/** Instant EN | සිං | தமி switcher (no reload; CMS content is already loaded in all locales). */
export default function LanguageSwitcher({ className = '' }) {
  const dispatch = useDispatch();
  const current = useSelector((s) => s.locale.current);
  return (
    <div className={`inline-flex rounded-md border border-slate-200 bg-white p-0.5 ${className}`} role="group" aria-label="Language">
      {LOCALES.map((l) => (
        <button
          key={l.code}
          type="button"
          title={l.name}
          onClick={() => dispatch(setLocale(l.code))}
          className={`rounded-[5px] px-2 py-1 text-xs font-medium transition-colors ${current === l.code ? 'bg-navy-900 text-white' : 'text-slate-600 hover:text-navy-900'}`}
        >
          {l.label}
        </button>
      ))}
    </div>
  );
}
