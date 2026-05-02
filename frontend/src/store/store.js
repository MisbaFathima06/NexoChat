import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice";
import chatReducer from "./slices/chatSlice";
import groupReducer from "./slices/groupSlice";
import notificationReducer from "./slices/notificationSlice";
import themeReducer from "./slices/themeSlice";
import callReducer from "./slices/callSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    chat: chatReducer,
    groups: groupReducer,
    notifications: notificationReducer,
    theme: themeReducer,
    call: callReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types
        ignoredActions: ["auth/connectSocket/fulfilled"],
        // Ignore these field paths in all actions
        ignoredActionPaths: ["payload"],
        // Ignore these paths in the state
        ignoredPaths: ["call.localStream", "call.remoteStream"],
      },
    }),
});

