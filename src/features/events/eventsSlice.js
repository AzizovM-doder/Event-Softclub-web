import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { api, getErrorMessage } from "../../api/http";

export const fetchEvents = createAsyncThunk("events/fetchEvents", async (_, thunkApi) => {
  try {
    const res = await api.get("/events");
    return res.data;
  } catch (err) {
    return thunkApi.rejectWithValue(getErrorMessage(err));
  }
});

export const createEvent = createAsyncThunk("events/createEvent", async (payload, thunkApi) => {
  try {
    const res = await api.post("/events", payload);
    return res.data;
  } catch (err) {
    return thunkApi.rejectWithValue(getErrorMessage(err));
  }
});

export const updateEvent = createAsyncThunk("events/updateEvent", async ({ id, payload }, thunkApi) => {
  try {
    const res = await api.put(`/events/${id}`, payload);
    return res.data;
  } catch (err) {
    return thunkApi.rejectWithValue(getErrorMessage(err));
  }
});

export const deleteEvent = createAsyncThunk("events/deleteEvent", async (id, thunkApi) => {
  try {
    await api.delete(`/events/${id}`);
    return id;
  } catch (err) {
    return thunkApi.rejectWithValue(getErrorMessage(err));
  }
});

const initialState = {
  items: [],
  loading: false,
  saving: false,
  error: null,
};

const eventsSlice = createSlice({
  name: "events",
  initialState,
  reducers: {
    clearEventsError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // fetch
      .addCase(fetchEvents.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchEvents.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload || [];
      })
      .addCase(fetchEvents.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to load events";
      })

      // create
      .addCase(createEvent.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(createEvent.fulfilled, (state, action) => {
        state.saving = false;
        state.items = [action.payload, ...state.items];
      })
      .addCase(createEvent.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload || "Failed to create event";
      })

      // update
      .addCase(updateEvent.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(updateEvent.fulfilled, (state, action) => {
        state.saving = false;
        const updated = action.payload;
        state.items = state.items.map((x) => (String(x.id) === String(updated.id) ? updated : x));
      })
      .addCase(updateEvent.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload || "Failed to update event";
      })

      // delete
      .addCase(deleteEvent.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(deleteEvent.fulfilled, (state, action) => {
        state.saving = false;
        const id = action.payload;
        state.items = state.items.filter((x) => String(x.id) !== String(id));
      })
      .addCase(deleteEvent.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload || "Failed to delete event";
      });
  },
});

export const { clearEventsError } = eventsSlice.actions;
export default eventsSlice.reducer;
