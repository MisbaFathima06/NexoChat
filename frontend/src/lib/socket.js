import { io } from "socket.io-client";

const BASE_URL = import.meta.env.MODE === "development" ? "http://localhost:5001" : "/";

let socket = null;
let dispatch = null;
let store = null;

// Set dispatch function from store
export const setDispatch = (dispatchFn) => {
  dispatch = dispatchFn;
};

// Set store reference (called after store is created)
export const setStore = (storeInstance) => {
  store = storeInstance;
};

export const connectSocket = (userId) => {
  if (!userId) {
    console.error("Cannot connect socket: userId is required");
    return null;
  }

  if (socket && socket.connected) {
    console.log("Socket already connected");
    return socket;
  }

  if (socket) {
    socket.disconnect();
    socket = null;
  }

  console.log("Connecting socket for user:", userId);

  socket = io(BASE_URL, {
    query: {
      userId: userId,
    },
    transports: ["websocket", "polling"],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 5,
  });

  socket.on("connect", () => {
    console.log("✅ Socket connected:", socket.id, "for user:", userId);
    // Join user's personal room for reliable event delivery
    socket.emit("join-user-room", { userId });
    // Notify Redux that socket is connected
    if (dispatch) {
      dispatch({ type: "auth/setSocketConnected", payload: true });
    } else if (store) {
      store.dispatch({ type: "auth/setSocketConnected", payload: true });
    }
  });

  socket.on("disconnect", (reason) => {
    console.log("❌ Socket disconnected:", reason);
    // Notify Redux that socket is disconnected
    if (dispatch) {
      dispatch({ type: "auth/setSocketConnected", payload: false });
    } else if (store) {
      store.dispatch({ type: "auth/setSocketConnected", payload: false });
    }
  });

  socket.on("connect_error", (error) => {
    console.error("Socket connection error:", error);
  });

  socket.on("getOnlineUsers", (userIds) => {
    console.log("📡 Online users:", userIds);
    if (dispatch) {
      dispatch({ type: "auth/setOnlineUsers", payload: userIds });
    } else if (store) {
      store.dispatch({ type: "auth/setOnlineUsers", payload: userIds });
    }
  });

  socket.on("error", (error) => {
    console.error("Socket error:", error);
  });

  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const getSocket = () => {
  return socket;
};

