import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { api, getErrorMessage } from "../../api/http";

export const fetchVideos = createAsyncThunk("videos/fetchVideos", async (params = {}, thunkApi) => {
  try {
    const res = await api.get("/videos", { params });
    return res.data;
  } catch (err) {
    return thunkApi.rejectWithValue(getErrorMessage(err));
  }
});

export const createVideo = createAsyncThunk("videos/createVideo", async (formData, thunkApi) => {
  try {
    const res = await api.post("/videos", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  } catch (err) {
    return thunkApi.rejectWithValue(getErrorMessage(err));
  }
});

export const updateVideo = createAsyncThunk("videos/updateVideo", async ({ id, formData }, thunkApi) => {
  try {
    const res = await api.put(`/videos/${id}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  } catch (err) {
    return thunkApi.rejectWithValue(getErrorMessage(err));
  }
});

export const deleteVideo = createAsyncThunk("videos/deleteVideo", async (id, thunkApi) => {
  try {
    await api.delete(`/videos/${id}`);
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

const videosSlice = createSlice({
  name: "videos",
  initialState,
  reducers: {
    clearVideosError(state) { state.error = null; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchVideos.pending, (s) => { s.loading = true; s.error = null; })
      .addCase(fetchVideos.fulfilled, (s, a) => {
        s.loading = false;
        s.items = a.payload.data || [];
        s.total = a.payload.total || 0;
        s.page = a.payload.page || 1;
        s.totalPages = a.payload.totalPages || 1;
      })
      .addCase(fetchVideos.rejected, (s, a) => { s.loading = false; s.error = a.payload; })

      .addCase(createVideo.pending, (s) => { s.saving = true; s.error = null; })
      .addCase(createVideo.fulfilled, (s, a) => { s.saving = false; s.items.unshift(a.payload); s.total += 1; })
      .addCase(createVideo.rejected, (s, a) => { s.saving = false; s.error = a.payload; })

      .addCase(updateVideo.pending, (s) => { s.saving = true; s.error = null; })
      .addCase(updateVideo.fulfilled, (s, a) => {
        s.saving = false;
        s.items = s.items.map((x) => x.id === a.payload.id ? a.payload : x);
      })
      .addCase(updateVideo.rejected, (s, a) => { s.saving = false; s.error = a.payload; })

      .addCase(deleteVideo.pending, (s) => { s.saving = true; s.error = null; })
      .addCase(deleteVideo.fulfilled, (s, a) => { s.saving = false; s.items = s.items.filter((x) => x.id !== a.payload); s.total -= 1; })
      .addCase(deleteVideo.rejected, (s, a) => { s.saving = false; s.error = a.payload; });
  },
});

export const { clearVideosError } = videosSlice.actions;
export default videosSlice.reducer;
