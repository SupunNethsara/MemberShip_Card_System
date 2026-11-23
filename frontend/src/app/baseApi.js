import { createApi, fetchBaseQuery, retry } from '@reduxjs/toolkit/query/react';
import { logout } from './authSlice';

export const API_URL = `${import.meta.env.VITE_API_URL || ''}/api`;

const rawBaseQuery = fetchBaseQuery({
  baseUrl: API_URL,
  prepareHeaders: (headers, { getState }) => {
    const { auth, locale } = getState();
    if (auth.token) headers.set('Authorization', `Bearer ${auth.token}`);
    headers.set('Accept', 'application/json');
    headers.set('Accept-Language', locale.current);
    return headers;
  },
});

/** Reads time out after 10s so a hung server shows "couldn't load" instead of skeletons forever. Writes (uploads, payments) don't. */
const READ_TIMEOUT_MS = 10000;

const authAwareQuery = async (args, api, extra) => {
  const request = api.type === 'query' ? { timeout: READ_TIMEOUT_MS, ...(typeof args === 'string' ? { url: args } : args) } : args;
  const result = await rawBaseQuery(request, api, extra);
  if (result.error?.status === 401 && api.getState().auth.token) {
    api.dispatch(logout());
  }
  return result;
};

/** Reads only: a network blip or 5xx is retried twice (with backoff) before a page shows its error state. */
const isTransient = (error) =>
  ['FETCH_ERROR', 'TIMEOUT_ERROR'].includes(error?.status) || (typeof error?.status === 'number' && error.status >= 500);

const baseQuery = retry(authAwareQuery, {
  retryCondition: (error, _args, { attempt, baseQueryApi }) => baseQueryApi.type === 'query' && attempt <= 2 && isTransient(error),
});

export const TAGS = [
  'Me', 'Content', 'Tier', 'Partner', 'Category', 'Offer', 'Member', 'Invoice', 'Transaction',
  'PaymentGateway', 'SmsGateway', 'SmsTemplate', 'SmsLog', 'Faq', 'Role', 'Permission', 'Staff',
  'Audit', 'Dashboard', 'MemberArea', 'Settings', 'Notification', 'Inquiry',
];

export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery,
  tagTypes: TAGS,
  refetchOnReconnect: true,
  endpoints: () => ({}),
});

/** Turns a plain object into a querystring, dropping empty values. */
export const qs = (params = {}) => {
  const p = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === null || v === '') return;
    p.set(k, v);
  });
  const s = p.toString();
  return s ? `?${s}` : '';
};

/** Builds multipart FormData from an object; nested objects/arrays use bracket notation. */
export const toFormData = (obj, form = new FormData(), prefix = '') => {
  Object.entries(obj).forEach(([key, value]) => {
    const name = prefix ? `${prefix}[${key}]` : key;
    if (value === undefined) return;
    if (value === null) form.append(name, '');
    else if (value instanceof File || value instanceof Blob) form.append(name, value);
    else if (typeof value === 'boolean') form.append(name, value ? '1' : '0');
    else if (Array.isArray(value)) {
      if (value.length === 0) form.append(`${name}[]`, '');
      value.forEach((v, i) => (typeof v === 'object' && v !== null ? toFormData(v, form, `${name}[${i}]`) : form.append(`${name}[]`, v)));
    } else if (typeof value === 'object') toFormData(value, form, name);
    else form.append(name, value);
  });
  return form;
};
