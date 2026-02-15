import { createSlice } from "@reduxjs/toolkit";

const tokenFromStorage = localStorage.getItem("es_token");
const userFromStorage = localStorage.getItem("es_user");

const initialState = {
  token: tokenFromStorage || null,
  user: userFromStorage ? JSON.parse(userFromStorage) : (tokenFromStorage ? { name: "Admin User", email: "admin@softclub.tj" } : null),
  error: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    login(state, action) {
      // Expecting payload: { name, email, ... }
      const user = action.payload;
      // Generate a mock token
      const token = "mock-token-" + Date.now();

      state.token = token;
      state.user = user;
      state.error = null;

      localStorage.setItem("es_token", token);
      localStorage.setItem("es_user", JSON.stringify(user));
    },
    logout(state) {
      state.token = null;
      state.user = null;
      state.error = null;
      localStorage.removeItem("es_token");
      localStorage.removeItem("es_user");
    },
    clearAuthError(state) {
      state.error = null;
    },
  },
});

export const { login, logout, clearAuthError } = authSlice.actions;
export default authSlice.reducer;
