import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { api, getErrorMessage } from "../../api/http";

// ── Async thunks ──

export const fetchUsers = createAsyncThunk("users/fetchUsers", async (params = {}, thunkApi) => {
  try {
    const res = await api.get("/users", { params });
    return res.data;
  } catch (err) {
    return thunkApi.rejectWithValue(getErrorMessage(err));
  }
});

export const fetchUserById = createAsyncThunk("users/fetchUserById", async (id, thunkApi) => {
  try {
    const res = await api.get(`/users/${id}`);
    return res.data;
  } catch (err) {
    return thunkApi.rejectWithValue(getErrorMessage(err));
  }
});

export const createUser = createAsyncThunk("users/createUser", async (payload, thunkApi) => {
  try {
    const res = await api.post("/users", payload);
    return res.data;
  } catch (err) {
    return thunkApi.rejectWithValue(getErrorMessage(err));
  }
});

export const updateUser = createAsyncThunk("users/updateUser", async ({ id, payload }, thunkApi) => {
  try {
    const res = await api.put(`/users/${id}`, payload);
    return res.data;
  } catch (err) {
    return thunkApi.rejectWithValue(getErrorMessage(err));
  }
});

export const deleteUser = createAsyncThunk("users/deleteUser", async (id, thunkApi) => {
  try {
    await api.delete(`/users/${id}`);
    return id;
  } catch (err) {
    return thunkApi.rejectWithValue(getErrorMessage(err));
  }
});

// ── Slice ──

const usersSlice = createSlice({
  name: "users",
  initialState: {
    items: [],
    loading: false,
    saving: false,
    error: null,
  },
  reducers: {
    clearUsersError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchUsers
      .addCase(fetchUsers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // createUser
      .addCase(createUser.pending, (state) => { state.saving = true; })
      .addCase(createUser.fulfilled, (state, action) => {
        state.saving = false;
        state.items.unshift(action.payload);
      })
      .addCase(createUser.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload;
      })

      // updateUser
      .addCase(updateUser.pending, (state) => { state.saving = true; })
      .addCase(updateUser.fulfilled, (state, action) => {
        state.saving = false;
        const idx = state.items.findIndex((u) => u.id === action.payload.id);
        if (idx !== -1) state.items[idx] = action.payload;
      })
      .addCase(updateUser.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload;
      })

      // deleteUser
      .addCase(deleteUser.pending, (state) => { state.saving = true; })
      .addCase(deleteUser.fulfilled, (state, action) => {
        state.saving = false;
        state.items = state.items.filter((u) => u.id !== action.payload);
      })
      .addCase(deleteUser.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload;
      });
  },
});

export const { clearUsersError } = usersSlice.actions;
export default usersSlice.reducer;
