import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  notifications: [],
  soundEnabled: true,
  unreadCount: 0,
};

const notificationSlice = createSlice({
  name: "notifications",
  initialState,
  reducers: {
    addNotification: (state, action) => {
      state.notifications.unshift(action.payload);
      state.unreadCount += 1;
      
      // Play sound if enabled
      if (state.soundEnabled && action.payload.sound) {
        const audio = new Audio("/notification-sound.mp3");
        audio.play().catch(console.error);
      }
    },
    removeNotification: (state, action) => {
      state.notifications = state.notifications.filter((n) => n.id !== action.payload);
      if (state.unreadCount > 0) {
        state.unreadCount -= 1;
      }
    },
    clearNotifications: (state) => {
      state.notifications = [];
      state.unreadCount = 0;
    },
    toggleSound: (state) => {
      state.soundEnabled = !state.soundEnabled;
    },
    markAsRead: (state) => {
      state.unreadCount = 0;
    },
  },
});

export const {
  addNotification,
  removeNotification,
  clearNotifications,
  toggleSound,
  markAsRead,
} = notificationSlice.actions;
export default notificationSlice.reducer;

