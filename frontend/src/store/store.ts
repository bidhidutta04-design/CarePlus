import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./authSlice";

// Only UI session state lives here (active role + display name).
// All clinical data comes from the API via TanStack Query hooks in src/hooks/.
export const store = configureStore({
  reducer: {
    auth: authReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
