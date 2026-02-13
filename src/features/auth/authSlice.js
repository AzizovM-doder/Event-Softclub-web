import { createSlice } from "@reduxjs/toolkit";

const USER = {
  username: "adminEventSoftclub",
  password: "123456",
};

const tokenFromStorage = localStorage.getItem("es_token");

const initialState = {
  token: tokenFromStorage || null,
  user: tokenFromStorage ? { username: USER.username } : null,
  error: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    login(state, action) {
      const { username, password } = action.payload;

      if (username === USER.username && password === USER.password) {
        const token = "events-softclub-token";
        state.token = token;
        state.user = { username };
        state.error = null;
        localStorage.setItem("es_token", token);
      } else {
        state.error = "Wrong username or password";
      }
    },
    logout(state) {
      state.token = null;
      state.user = null;
      state.error = null;
      localStorage.removeItem("es_token");
    },
    clearAuthError(state) {
      state.error = null;
    },
  },
});

export const { login, logout, clearAuthError } = authSlice.actions;
export default authSlice.reducer;
