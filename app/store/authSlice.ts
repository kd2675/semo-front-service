import { createAsyncThunk, createSlice, type PayloadAction } from "@reduxjs/toolkit";

import {
  bootstrapAccessToken,
  clearAccessToken,
  getAccessToken,
  getUserFromToken,
  isUserRole,
  isSessionRestoreSuppressed,
  isTokenExpired,
  logout,
  notifyAuthExpired,
  readAuthSnapshot,
  refreshAccessToken,
  suspendSessionRestore,
} from "@/app/lib/auth";
import type { AuthExpireReason } from "@/app/lib/authEvents";
import type { AuthUser } from "@/app/types/auth";
import type { RootState } from "./store";

export type AuthStatus = "unknown" | "in" | "out";

type AuthSnapshot = {
  status: AuthStatus;
  user: AuthUser | null;
};

type AuthState = {
  isHydrated: boolean;
  isRestoring: boolean;
  status: AuthStatus;
  user: AuthUser | null;
  expireReason: AuthExpireReason | null;
};

const initialState: AuthState = {
  isHydrated: false,
  isRestoring: true,
  status: "unknown",
  user: null,
  expireReason: null,
};

export const syncSession = createAsyncThunk<void, void, { state: RootState }>(
  "auth/syncSession",
  async (_, { dispatch }) => {
    const token = getAccessToken();
    if (!token) {
      if (isSessionRestoreSuppressed()) {
        dispatch(setExpireReason(null));
        dispatch(setSnapshot(readAuthSnapshot()));
        dispatch(setRestoring(false));
        return;
      }
      const restoredToken = await bootstrapAccessToken();
      const restoredUser = getUserFromToken(restoredToken);
      if (restoredToken && !isUserRole(restoredUser?.role)) {
        suspendSessionRestore();
        clearAccessToken();
      }
      dispatch(setExpireReason(null));
      dispatch(setSnapshot(readAuthSnapshot()));
      dispatch(setRestoring(false));
      return;
    }

    const user = getUserFromToken(token);
    if (!user) {
      clearAccessToken();
      const restoredToken = await bootstrapAccessToken();
      const restoredUser = getUserFromToken(restoredToken);
      if (restoredToken && !isUserRole(restoredUser?.role)) {
        suspendSessionRestore();
        clearAccessToken();
      }
      dispatch(setExpireReason(null));
      dispatch(setSnapshot(readAuthSnapshot()));
      dispatch(setRestoring(false));
      return;
    }

    if (!isUserRole(user.role)) {
      suspendSessionRestore();
      clearAccessToken();
      dispatch(setExpireReason(null));
      dispatch(setSnapshot(readAuthSnapshot()));
      dispatch(setRestoring(false));
      return;
    }

    if (user.exp && isTokenExpired(user.exp)) {
      const refreshed = await refreshAccessToken();
      if (!refreshed) {
        suspendSessionRestore();
        clearAccessToken();
        dispatch(setExpireReason("refresh_failed"));
        notifyAuthExpired("refresh_failed");
      } else {
        const refreshedUser = getUserFromToken(refreshed);
        if (!isUserRole(refreshedUser?.role)) {
          suspendSessionRestore();
          clearAccessToken();
        }
        dispatch(setExpireReason(null));
      }
      dispatch(setSnapshot(readAuthSnapshot()));
      dispatch(setRestoring(false));
      return;
    }

    dispatch(setExpireReason(null));
    dispatch(setSnapshot(readAuthSnapshot()));
    dispatch(setRestoring(false));
  },
);

export const signOutSession = createAsyncThunk("auth/signOutSession", async (_, { dispatch }) => {
  try {
    await logout();
  } catch {
    // Local session state still needs to be cleared even if logout API fails.
  }

  suspendSessionRestore();
  clearAccessToken();
  dispatch(setExpireReason(null));
  dispatch(markSignedOut());
});

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setHydrated(state, action: PayloadAction<boolean>) {
      state.isHydrated = action.payload;
    },
    setRestoring(state, action: PayloadAction<boolean>) {
      state.isRestoring = action.payload;
    },
    setSnapshot(state, action: PayloadAction<AuthSnapshot>) {
      state.status = action.payload.status;
      state.user = action.payload.user;
    },
    setExpireReason(state, action: PayloadAction<AuthExpireReason | null>) {
      state.expireReason = action.payload;
    },
    markSignedOut(state) {
      state.status = "out";
      state.user = null;
      state.isRestoring = false;
    },
  },
});

export const {
  markSignedOut,
  setExpireReason,
  setHydrated,
  setRestoring,
  setSnapshot,
} = authSlice.actions;

export const selectAuthStatus = (state: RootState) => state.auth.status;
export const selectAuthUser = (state: RootState) => state.auth.user;
export const selectAuthHydrated = (state: RootState) => state.auth.isHydrated;
export const selectAuthIsRestoring = (state: RootState) => state.auth.isRestoring;
export const selectAuthExpireReason = (state: RootState) => state.auth.expireReason;

export default authSlice.reducer;
