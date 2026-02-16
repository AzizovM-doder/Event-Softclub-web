import { configureStore } from "@reduxjs/toolkit";
import authReducer from "../features/auth/authSlice";
import eventsReducer from "../features/events/eventsSlice";
import notificationsReducer from "@/features/notifications/notificationsSlice";
import photosReducer from "../features/photos/photosSlice";
import videosReducer from "../features/videos/videosSlice";
import usersReducer from "../features/users/usersSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    events: eventsReducer,
    notifications: notificationsReducer,
    photos: photosReducer,
    videos: videosReducer,
    users: usersReducer,
  },
});
