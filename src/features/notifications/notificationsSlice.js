import { createSlice, nanoid } from "@reduxjs/toolkit";

const initialState = {
  items: [], // newest first
};

export const notificationsSlice = createSlice({
  name: "notifications",
  initialState,
  reducers: {
    pushNotification: {
      reducer(state, action) {
        state.items.unshift(action.payload);
        // keep it clean
        if (state.items.length > 50) state.items.pop();
      },
      prepare(payload) {
        return {
          payload: {
            id: nanoid(),
            createdAt: Date.now(),
            read: false,
            ...payload, // { title, body, eventId, fireKey, eventStart, location }
          },
        };
      },
    },
    markAllRead(state) {
      state.items.forEach((n) => (n.read = true));
    },
    markRead(state, action) {
      const n = state.items.find((x) => x.id === action.payload);
      if (n) n.read = true;
    },
    clearAll(state) {
      state.items = [];
    },
  },
});

export const { pushNotification, markAllRead, markRead, clearAll } =
  notificationsSlice.actions;

export default notificationsSlice.reducer;
