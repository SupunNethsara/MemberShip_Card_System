import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
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

const baseQuery = async (args, api, extra) => {
  const result = await rawBaseQuery(args, api, extra);
  if (result.error?.status === 401 && api.getState().auth.token) {
    api.dispatch(logout());
  }
  return result;
};

export const TAGS = [
  'Me', 'Content', 'Tier', 'Partner', 'Category', 'Offer', 'Member', 'Invoice', 'Transaction',
  'PaymentGateway', 'SmsGateway', 'SmsTemplate', 'SmsLog', 'Faq', 'Role', 'Permission', 'Staff',
  'Audit', 'Dashboard', 'MemberArea', 'Settings', 'Notification',
];

export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery,
  tagTypes: TAGS,
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
