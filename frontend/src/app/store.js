import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import { baseApi } from './baseApi';
import auth from './authSlice';
import locale from './localeSlice';
import toast from './toastSlice';

export const store = configureStore({
  reducer: { [baseApi.reducerPath]: baseApi.reducer, auth, locale, toast },
  middleware: (gDM) => gDM().concat(baseApi.middleware),
});

// Lets queries refetch when the tab regains focus or the connection comes back (refetchOnReconnect/Focus).
setupListeners(store.dispatch);
