import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { AuthExpireReason, AuthUser } from "@/app/types/auth";

export type AuthStatus = "unknown" | "in" | "out";

type AuthSnapshot = {
  status: AuthStatus;
  user: AuthUser | null;
};

export type AuthState = AuthSnapshot & {
  isHydrated: boolean;
  isRestoring: boolean;
  expiredReason: AuthExpireReason | null;
};

const initialState: AuthState = {
  status: "unknown",
  user: null,
  isHydrated: false,
  isRestoring: true,
  expiredReason: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setAuthSnapshot(state, action: PayloadAction<AuthSnapshot>) {
      state.status = action.payload.status;
      state.user = action.payload.user;
    },
    setHydrated(state) {
      state.isHydrated = true;
    },
    setRestoring(state, action: PayloadAction<boolean>) {
      state.isRestoring = action.payload;
    },
    setAuthExpired(state, action: PayloadAction<AuthExpireReason>) {
      state.expiredReason = action.payload;
    },
    clearAuthExpired(state) {
      state.expiredReason = null;
    },
    clearAuth(state) {
      state.status = "out";
      state.user = null;
      state.isRestoring = false;
      state.expiredReason = null;
    },
  },
});

export const {
  clearAuth,
  clearAuthExpired,
  setAuthExpired,
  setAuthSnapshot,
  setHydrated,
  setRestoring,
} = authSlice.actions;

export default authSlice.reducer;
