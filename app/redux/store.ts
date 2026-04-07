import { configureStore } from "@reduxjs/toolkit";
import modalReducer from "@/app/redux/slices/modal-slice";
import authReducer from "@/app/redux/slices/auth-slice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    modal: modalReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
