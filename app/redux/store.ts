import { configureStore } from "@reduxjs/toolkit";
import modalReducer from "@/app/redux/slices/modalSlice";
import authReducer from "@/app/redux/slices/authSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    modal: modalReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
