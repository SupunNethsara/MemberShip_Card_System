/** Picks a localized value from a {en, si, ta} object, falling back to English. */
export const tr = (value, locale = 'en') => {
  if (value == null) return '';
  if (typeof value === 'string') return value;
  return value[locale] || value.en || Object.values(value).find(Boolean) || '';
};

const LOCALE_TAG = { en: 'en-LK', si: 'si-LK', ta: 'ta-LK' };

export const money = (amount, currency = 'LKR', locale = 'en') => {
  const n = Number(amount ?? 0);
  const num = new Intl.NumberFormat(LOCALE_TAG[locale] || 'en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
  return `${currency} ${num}`;
};

export const compactMoney = (amount, currency = 'LKR') => {
  const n = Number(amount ?? 0);
  if (n >= 1_000_000) return `${currency} ${(n / 1_000_000).toFixed(n >= 10_000_000 ? 0 : 1)}M`;
  if (n >= 10_000) return `${currency} ${(n / 1000).toFixed(0)}K`;
  return money(n, currency);
};

export const number = (n) => new Intl.NumberFormat('en-LK').format(Number(n ?? 0));

export const date = (iso, locale = 'en', opts = { day: '2-digit', month: 'short', year: 'numeric' }) => {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  try {
    return new Intl.DateTimeFormat(LOCALE_TAG[locale] || 'en-LK', opts).format(d);
  } catch {
    return d.toDateString();
  }
};

export const dateTime = (iso, locale = 'en') =>
  date(iso, locale, { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

export const relative = (iso) => {
  if (!iso) return '—';
  const diff = (new Date(iso).getTime() - Date.now()) / 1000;
  const abs = Math.abs(diff);
  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
  if (abs < 60) return rtf.format(Math.round(diff), 'second');
  if (abs < 3600) return rtf.format(Math.round(diff / 60), 'minute');
  if (abs < 86400) return rtf.format(Math.round(diff / 3600), 'hour');
  if (abs < 86400 * 30) return rtf.format(Math.round(diff / 86400), 'day');
  return date(iso);
};

export const duration = (value, unit, t) => {
  if (unit === 'months' && value % 12 === 0) {
    const y = value / 12;
    return `${y} ${t ? t(y === 1 ? 'common.year' : 'common.years') : y === 1 ? 'year' : 'years'}`;
  }
  const key = unit === 'months' ? (value === 1 ? 'common.month' : 'common.months') : value === 1 ? 'common.day' : 'common.days';
  return `${value} ${t ? t(key) : unit}`;
};

export const offerValue = (offer, t) => {
  if (offer.discount_type === 'percentage') return `${Number(offer.discount_value)}% ${t ? t('offers.off') : 'off'}`;
  if (offer.discount_type === 'fixed') return `LKR ${number(offer.discount_value)} ${t ? t('offers.off') : 'off'}`;
  return t ? t('offers.freebie') : 'Complimentary';
};

/** Extracts a human message from an RTK Query error. */
export const errorMessage = (err, fallback = 'Something went wrong. Please try again.') => {
  if (!err) return fallback;
  if (err.status === 'FETCH_ERROR') return 'Cannot reach the server. Is the API running?';
  const d = err.data;
  if (d?.errors) return Object.values(d.errors).flat()[0] || d.message || fallback;
  return d?.message || fallback;
};

/** Maps Laravel validation errors (dot keys) to a flat object for forms. */
export const fieldErrors = (err) => {
  const out = {};
  Object.entries(err?.data?.errors || {}).forEach(([k, v]) => { out[k] = Array.isArray(v) ? v[0] : v; });
  return out;
};

export const initials = (name = '') =>
  name.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join('');

export const emptyTr = () => ({ en: '', si: '', ta: '' });
