import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { api, getErrorMessage } from "../../api/http";

export const fetchPhotos = createAsyncThunk("photos/fetchPhotos", async (params = {}, thunkApi) => {
  try {
    const res = await api.get("/photos", { params });
    return res.data;
  } catch (err) {
    return thunkApi.rejectWithValue(getErrorMessage(err));
  }
});

export const createPhoto = createAsyncThunk("photos/createPhoto", async (formData, thunkApi) => {
  try {
    const res = await api.post("/photos", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  } catch (err) {
    return thunkApi.rejectWithValue(getErrorMessage(err));
  }
});

export const updatePhoto = createAsyncThunk("photos/updatePhoto", async ({ id, formData }, thunkApi) => {
  try {
    const res = await api.put(`/photos/${id}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  } catch (err) {
    return thunkApi.rejectWithValue(getErrorMessage(err));
  }
});

export const deletePhoto = createAsyncThunk("photos/deletePhoto", async (id, thunkApi) => {
  try {
    await api.delete(`/photos/${id}`);
    return id;
  } catch (err) {
    return thunkApi.rejectWithValue(getErrorMessage(err));
  }
});

const initialState = {
  items: [],
  total: 0,
  page: 1,
  totalPages: 1,
  loading: false,
  saving: false,
  error: null,
};

const photosSlice = createSlice({
  name: "photos",
  initialState,
  reducers: {
    clearPhotosError(state) { state.error = null; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPhotos.pending, (s) => { s.loading = true; s.error = null; })
      .addCase(fetchPhotos.fulfilled, (s, a) => {
        s.loading = false;
        s.items = a.payload.data || [];
        s.total = a.payload.total || 0;
        s.page = a.payload.page || 1;
        s.totalPages = a.payload.totalPages || 1;
      })
      .addCase(fetchPhotos.rejected, (s, a) => { s.loading = false; s.error = a.payload; })

      .addCase(createPhoto.pending, (s) => { s.saving = true; s.error = null; })
      .addCase(createPhoto.fulfilled, (s, a) => { s.saving = false; s.items.unshift(a.payload); s.total += 1; })
      .addCase(createPhoto.rejected, (s, a) => { s.saving = false; s.error = a.payload; })

      .addCase(updatePhoto.pending, (s) => { s.saving = true; s.error = null; })
      .addCase(updatePhoto.fulfilled, (s, a) => {
        s.saving = false;
        s.items = s.items.map((x) => x.id === a.payload.id ? a.payload : x);
      })
      .addCase(updatePhoto.rejected, (s, a) => { s.saving = false; s.error = a.payload; })

      .addCase(deletePhoto.pending, (s) => { s.saving = true; s.error = null; })
      .addCase(deletePhoto.fulfilled, (s, a) => { s.saving = false; s.items = s.items.filter((x) => x.id !== a.payload); s.total -= 1; })
      .addCase(deletePhoto.rejected, (s, a) => { s.saving = false; s.error = a.payload; });
  },
});

export const { clearPhotosError } = photosSlice.actions;
export default photosSlice.reducer;
