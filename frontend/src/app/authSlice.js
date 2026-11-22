import { createSlice } from '@reduxjs/toolkit';

const read = (k) => { try { return localStorage.getItem(k); } catch { return null; } };
const write = (k, v) => { try { v === null ? localStorage.removeItem(k) : localStorage.setItem(k, v); } catch { /* storage unavailable */ } };

const authSlice = createSlice({
  name: 'auth',
  initialState: { token: read('mp_token'), user: null },
  reducers: {
    setCredentials(state, { payload }) {
      state.token = payload.token ?? state.token;
      if (payload.user) state.user = payload.user;
      write('mp_token', state.token);
    },
    setUser(state, { payload }) { state.user = payload; },
    logout(state) { state.token = null; state.user = null; write('mp_token', null); },
  },
});

export const { setCredentials, setUser, logout } = authSlice.actions;
export default authSlice.reducer;

export const selectUser = (s) => s.auth.user;
export const selectToken = (s) => s.auth.token;
export const selectPermissions = (s) => s.auth.user?.permissions ?? [];
