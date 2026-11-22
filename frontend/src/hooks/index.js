import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { messages } from '../i18n/messages';
import { tr } from '../lib/format';
import { selectPermissions, selectUser } from '../app/authSlice';
import { pushToast } from '../app/toastSlice';
import { usePublicContentQuery } from '../app/api';

export const useLocale = () => useSelector((s) => s.locale.current);

/** Translation hook: t('portal.nav.card'), plus tr(obj) for CMS {en,si,ta} values. */
export const useT = () => {
  const locale = useLocale();
  const t = useCallback(
    (key, fallback) => {
      const pick = (dict) => key.split('.').reduce((o, k) => (o == null ? undefined : o[k]), dict);
      return pick(messages[locale]) ?? pick(messages.en) ?? fallback ?? key;
    },
    [locale]
  );
  const trl = useCallback((v) => tr(v, locale), [locale]);
  return { t, tr: trl, locale };
};

/** Permission checks. Accepts a slug, an array (any-of), or "a|b" strings. */
export const usePermission = () => {
  const permissions = useSelector(selectPermissions);
  const set = useMemo(() => new Set(permissions), [permissions]);
  return useCallback(
    (perform) => {
      if (!perform) return true;
      const list = Array.isArray(perform) ? perform : String(perform).split('|');
      return list.some((p) => set.has(p.trim()));
    },
    [set]
  );
};

export const useCurrentUser = () => useSelector(selectUser);

export const useToast = () => {
  const dispatch = useDispatch();
  return useCallback(
    (message, tone = 'success', description) => dispatch(pushToast({ message, tone, description })),
    [dispatch]
  );
};

export const useDebounced = (value, delay = 300) => {
  const [v, setV] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setV(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return v;
};

/** Server-table state: page, per_page, search (debounced), sort, direction, filters. */
export const useTableState = (initial = {}) => {
  const [state, setState] = useState({ page: 1, per_page: 15, search: '', sort: undefined, direction: undefined, ...initial });
  const search = useDebounced(state.search, 300);
  const params = useMemo(() => ({ ...state, search }), [state, search]);
  const update = useCallback((patch) => setState((s) => ({ ...s, ...patch, page: patch.page ?? 1 })), []);
  return [params, update, state];
};

export const useOnClickOutside = (ref, handler) => {
  useEffect(() => {
    const fn = (e) => { if (ref.current && !ref.current.contains(e.target)) handler(e); };
    document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, [ref, handler]);
};

export const useEscape = (handler, active = true) => {
  const saved = useRef(handler);
  saved.current = handler;
  useEffect(() => {
    if (!active) return undefined;
    const fn = (e) => { if (e.key === 'Escape') saved.current(e); };
    window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  }, [active]);
};

export const useDocumentTitle = (title) => {
  const { data: content } = usePublicContentQuery();
  const brandSi = content?.content?.['brand.name']?.si || 'ජීවනසවිය';
  useEffect(() => {
    if (!title || title === 'Home' || title === 'මුල් පිටුව' || title === brandSi) {
      document.title = `${brandSi} · Jeewanasaviya`;
    } else {
      document.title = `${title} · ${brandSi}`;
    }
  }, [title, brandSi]);
};
