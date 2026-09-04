import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./authSlice";
import clinicalReducer from "./clinicalSlice";
import opsReducer from "./opsSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    clinical: clinicalReducer,
    ops: opsReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
