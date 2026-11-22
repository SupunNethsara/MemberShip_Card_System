import { createSlice } from '@reduxjs/toolkit';

export const LOCALES = [
  { code: 'en', label: 'EN', name: 'English' },
  { code: 'si', label: 'සිං', name: 'සිංහල' },
  { code: 'ta', label: 'தமி', name: 'தமிழ்' },
];

const initial = (() => { try { return localStorage.getItem('mp_locale') || 'en'; } catch { return 'en'; } })();

const localeSlice = createSlice({
  name: 'locale',
  initialState: { current: ['en', 'si', 'ta'].includes(initial) ? initial : 'en' },
  reducers: {
    setLocale(state, { payload }) {
      state.current = payload;
      try { localStorage.setItem('mp_locale', payload); } catch { /* ignore */ }
      document.documentElement.lang = payload;
    },
  },
});

export const { setLocale } = localeSlice.actions;
export default localeSlice.reducer;
