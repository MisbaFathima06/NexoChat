import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  status: "idle", // idle | dialing | calling | ringing | connecting | in-call
  callType: null,
  callId: null,
  peerUser: null,
  incomingCall: null,
  localStream: null,
  remoteStream: null,
  isMuted: false,
  isCameraOff: false,
  error: null,
};

const callSlice = createSlice({
  name: "call",
  initialState,
  reducers: {
    startOutgoingCall(state, action) {
      state.status = "dialing";
      state.callType = action.payload.callType;
      state.callId = action.payload.callId;
      state.peerUser = action.payload.peerUser;
      state.incomingCall = null;
      state.isMuted = false;
      state.isCameraOff = action.payload.callType === "audio";
      state.error = null;
    },
    setIncomingCall(state, action) {
      state.status = "ringing";
      state.callType = action.payload.callType;
      state.callId = action.payload.callId;
      state.incomingCall = action.payload;
      state.peerUser = action.payload.from;
      state.isMuted = false;
      state.isCameraOff = action.payload.callType === "audio";
    },
    clearIncomingCall(state) {
      state.incomingCall = null;
      if (state.status === "ringing") {
        state.status = "idle";
        state.callId = null;
        state.peerUser = null;
        state.callType = null;
      }
    },
    setCallStatus(state, action) {
      state.status = action.payload;
    },
    setLocalStream(state, action) {
      state.localStream = action.payload;
    },
    setRemoteStream(state, action) {
      state.remoteStream = action.payload;
    },
    setMuted(state, action) {
      state.isMuted = action.payload;
    },
    setCameraOff(state, action) {
      state.isCameraOff = action.payload;
    },
    setCallError(state, action) {
      state.error = action.payload;
    },
    resetCallState() {
      return initialState;
    },
  },
});

export const {
  startOutgoingCall,
  setIncomingCall,
  clearIncomingCall,
  setCallStatus,
  setLocalStream,
  setRemoteStream,
  setMuted,
  setCameraOff,
  setCallError,
  resetCallState,
} = callSlice.actions;

export default callSlice.reducer;

