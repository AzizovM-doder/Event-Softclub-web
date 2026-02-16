import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { api, getErrorMessage } from "../../api/http";

// ── Async thunks ──

export const loginUser = createAsyncThunk("auth/loginUser", async ({ email, password }, thunkApi) => {
  try {
    const res = await api.post("/auth/login", { email, password });
    return res.data;
  } catch (err) {
    return thunkApi.rejectWithValue(getErrorMessage(err));
  }
});

export const registerUser = createAsyncThunk("auth/registerUser", async ({ email, password, name, role }, thunkApi) => {
  try {
    const res = await api.post("/auth/register", { email, password, name, role });
    return res.data;
  } catch (err) {
    return thunkApi.rejectWithValue(getErrorMessage(err));
  }
});

export const fetchMe = createAsyncThunk("auth/fetchMe", async (_, thunkApi) => {
  try {
    const res = await api.get("/auth/me");
    return res.data;
  } catch (err) {
    return thunkApi.rejectWithValue(getErrorMessage(err));
  }
});

// ── Initial state ──

const accessToken = localStorage.getItem("es_accessToken") || null;
const refreshToken = localStorage.getItem("es_refreshToken") || null;
const userRaw = localStorage.getItem("es_user");
const user = userRaw ? JSON.parse(userRaw) : null;

const initialState = {
  accessToken,
  refreshToken,
  user,
  loading: false,
  error: null,
};

// ── Slice ──

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setTokens(state, action) {
      const { accessToken, refreshToken } = action.payload;
      state.accessToken = accessToken;
      state.refreshToken = refreshToken;
      localStorage.setItem("es_accessToken", accessToken);
      localStorage.setItem("es_refreshToken", refreshToken);
    },
    logout(state) {
      state.accessToken = null;
      state.refreshToken = null;
      state.user = null;
      state.error = null;
      localStorage.removeItem("es_accessToken");
      localStorage.removeItem("es_refreshToken");
      localStorage.removeItem("es_user");
    },
    clearAuthError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // login
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.accessToken = action.payload.accessToken;
        state.refreshToken = action.payload.refreshToken;
        state.user = action.payload.user;
        localStorage.setItem("es_accessToken", action.payload.accessToken);
        localStorage.setItem("es_refreshToken", action.payload.refreshToken);
        localStorage.setItem("es_user", JSON.stringify(action.payload.user));
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Login failed";
      })

      // register
      .addCase(registerUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.loading = false;
        state.accessToken = action.payload.accessToken;
        state.refreshToken = action.payload.refreshToken;
        state.user = action.payload.user;
        localStorage.setItem("es_accessToken", action.payload.accessToken);
        localStorage.setItem("es_refreshToken", action.payload.refreshToken);
        localStorage.setItem("es_user", JSON.stringify(action.payload.user));
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Registration failed";
      })

      // fetchMe
      .addCase(fetchMe.fulfilled, (state, action) => {
        state.user = action.payload;
        localStorage.setItem("es_user", JSON.stringify(action.payload));
      });
  },
});

export const { setTokens, logout, clearAuthError } = authSlice.actions;

// Keep backward compat for old "login" action name (used in Login.jsx temporarily)
export const login = loginUser;

export default authSlice.reducer;
