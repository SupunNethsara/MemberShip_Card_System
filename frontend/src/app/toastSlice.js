import { createSlice, nanoid } from '@reduxjs/toolkit';

const toastSlice = createSlice({
  name: 'toast',
  initialState: [],
  reducers: {
    pushToast: {
      reducer(state, { payload }) { state.push(payload); },
      prepare: (t) => ({ payload: { id: nanoid(), tone: 'success', ...t } }),
    },
    dismissToast(state, { payload }) { return state.filter((t) => t.id !== payload); },
  },
});

export const { pushToast, dismissToast } = toastSlice.actions;
export default toastSlice.reducer;
