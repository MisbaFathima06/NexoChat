import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { axiosInstance } from "../../lib/axios";
import { connectSocket as connectSocketService } from "../../lib/socket";

// Async thunks
export const checkAuth = createAsyncThunk("auth/checkAuth", async () => {
  const res = await axiosInstance.get("/auth/check");
  return res.data;
});

export const sendOTP = createAsyncThunk("auth/sendOTP", async (data) => {
  const res = await axiosInstance.post("/auth/send-otp", data);
  return res.data;
});

export const signup = createAsyncThunk("auth/signup", async (data) => {
  const res = await axiosInstance.post("/auth/signup", data);
  return res.data;
});

export const login = createAsyncThunk("auth/login", async (data) => {
  const res = await axiosInstance.post("/auth/login", data);
  return res.data;
});

export const logout = createAsyncThunk("auth/logout", async () => {
  await axiosInstance.post("/auth/logout");
});

export const updateProfile = createAsyncThunk("auth/updateProfile", async (data) => {
  const res = await axiosInstance.put("/auth/update-profile", data);
  return res.data;
});

export const updatePrivacy = createAsyncThunk("auth/updatePrivacy", async (data) => {
  const res = await axiosInstance.put("/auth/update-privacy", { privacy: data });
  return res.data;
});

export const updateAutoReply = createAsyncThunk("auth/updateAutoReply", async (data) => {
  const res = await axiosInstance.put("/auth/update-auto-reply", data);
  return res.data;
});

const initialState = {
  user: null,
  onlineUsers: [],
  isAuthenticated: false,
  isLoading: true,
  error: null,
  socketConnected: false,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setOnlineUsers: (state, action) => {
      state.onlineUsers = action.payload;
    },
    setSocketConnected: (state, action) => {
      state.socketConnected = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(checkAuth.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(checkAuth.fulfilled, (state, action) => {
        state.user = action.payload;
        state.isAuthenticated = true;
        state.isLoading = false;
      })
      .addCase(checkAuth.rejected, (state) => {
        state.user = null;
        state.isAuthenticated = false;
        state.isLoading = false;
      })
      .addCase(signup.fulfilled, (state, action) => {
        state.user = action.payload;
        state.isAuthenticated = true;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.user = action.payload;
        state.isAuthenticated = true;
      })
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.isAuthenticated = false;
        state.onlineUsers = [];
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.user = action.payload;
      })
      .addCase(updatePrivacy.fulfilled, (state, action) => {
        state.user = action.payload;
      })
      .addCase(updateAutoReply.fulfilled, (state, action) => {
        state.user = action.payload;
      });
  },
});

export const connectSocket = createAsyncThunk("auth/connectSocket", async (_, { getState }) => {
  const state = getState().auth;
  if (state.user) {
    const socket = connectSocketService(state.user._id);
    return socket ? true : false;
  }
  return false;
});

export const { setOnlineUsers, setSocketConnected } = authSlice.actions;
export default authSlice.reducer;


