import {configureStore} from '@reduxjs/toolkit';

import {drugsCreateReducer} from './drugsCreate/drugsCreateSlice';

export const store = configureStore({
  reducer: {
    drugsCreate: drugsCreateReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
