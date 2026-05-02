import { useCallback, useEffect, useRef } from "react";
import toast from "react-hot-toast";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import {
  clearIncomingCall,
  resetCallState,
  setCallStatus,
  setCallError,
  setIncomingCall,
  setLocalStream,
  setMuted,
  setRemoteStream,
  setCameraOff,
} from "../store/slices/callSlice";
import IncomingCallModal from "./call/IncomingCallModal";
import CallOverlay from "./call/CallOverlay";
import { getSocket } from "../lib/socket";

const ICE_SERVERS = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
];

const normalizeId = (value) => {
  if (!value) return null;
  if (typeof value === "string") return value;
  if (typeof value === "object" && value._id) return value._id.toString();
  if (typeof value === "number") return value.toString();
  return value?.toString ? value.toString() : value;
};

const CallManager = () => {
  const dispatch = useAppDispatch();
  const { user, socketConnected } = useAppSelector((state) => state.auth);
  const callState = useAppSelector((state) => state.call);

  const peerConnectionRef = useRef(null);
  const localStreamRef = useRef(null);
  const remoteStreamRef = useRef(null);
  const callMetaRef = useRef({
    callId: null,
    peerUserId: null,
    callType: null,
  });
  const stateRef = useRef(callState);
  const localStreamReadyRef = useRef(false);
  const localStreamWaitersRef = useRef([]);

  useEffect(() => {
    stateRef.current = callState;
    callMetaRef.current = {
      callId: callState.callId,
      peerUserId: normalizeId(callState.peerUser?._id || callState.peerUser),
      callType: callState.callType,
    };
  }, [callState]);

  const markLocalStreamReady = useCallback(() => {
    localStreamReadyRef.current = true;
    localStreamWaitersRef.current.forEach((resolve) => resolve());
    localStreamWaitersRef.current = [];
  }, []);

  const resetLocalStreamReady = useCallback(() => {
    localStreamReadyRef.current = false;
    localStreamWaitersRef.current = [];
  }, []);

  const waitForLocalStream = useCallback(() => {
    if (localStreamReadyRef.current) {
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      let timeoutId;
      const resolver = () => {
        if (timeoutId) clearTimeout(timeoutId);
        localStreamWaitersRef.current = localStreamWaitersRef.current.filter(
          (fn) => fn !== resolver
        );
        resolve();
      };
      timeoutId = setTimeout(() => {
        localStreamWaitersRef.current = localStreamWaitersRef.current.filter(
          (fn) => fn !== resolver
        );
        reject(new Error("Local stream timeout"));
      }, 10000);
      localStreamWaitersRef.current.push(resolver);
    });
  }, []);

  const stopStream = useCallback((stream) => {
    if (!stream) return;
    stream.getTracks().forEach((track) => track.stop());
  }, []);

  const cleanupCall = useCallback(
    ({ notifyPeer = false, reason = "end" } = {}) => {
      const socket = getSocket();
      if (
        notifyPeer &&
        callMetaRef.current.callId &&
        callMetaRef.current.peerUserId
      ) {
        const eventName = reason === "cancel" ? "call:cancel" : "call:end";
        socket?.emit(eventName, {
          callId: callMetaRef.current.callId,
          targetUserId: callMetaRef.current.peerUserId,
        });
      }

      peerConnectionRef.current?.close();
      peerConnectionRef.current = null;
      stopStream(localStreamRef.current);
      resetLocalStreamReady();
      stopStream(remoteStreamRef.current);
      localStreamRef.current = null;
      remoteStreamRef.current = null;
      dispatch(setLocalStream(null));
      dispatch(setRemoteStream(null));
      dispatch(setMuted(false));
      dispatch(setCameraOff(false));
      dispatch(resetCallState());
    },
    [dispatch, resetLocalStreamReady, stopStream],
  );

  const createPeerConnection = useCallback(() => {
    if (peerConnectionRef.current) return peerConnectionRef.current;
    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });

    pc.ontrack = (event) => {
      remoteStreamRef.current = event.streams[0];
      dispatch(setRemoteStream(event.streams[0]));
    };

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        const socket = getSocket();
        socket?.emit("call:ice", {
          callId: callMetaRef.current.callId,
          targetUserId: callMetaRef.current.peerUserId,
          candidate: event.candidate,
        });
      }
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === "connected") {
        dispatch(setCallStatus("in-call"));
      }
      if (["failed", "disconnected", "closed"].includes(pc.connectionState)) {
        cleanupCall();
      }
    };

    peerConnectionRef.current = pc;
    return pc;
  }, [cleanupCall, dispatch]);

  const getMediaConstraints = useCallback((callType) => {
    if (callType === "video") {
      return {
        audio: true,
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: "user",
        },
      };
    }
    return { audio: true, video: false };
  }, []);

  const prepareLocalStream = useCallback(
    async (callType) => {
      const constraints = getMediaConstraints(callType);
      let stream;
      
      try {
        stream = await navigator.mediaDevices.getUserMedia(constraints);
      } catch (error) {
        console.warn("[Call] Failed to get media with constraints:", constraints, error);
        
        // If video call failed, try audio-only as fallback
        if (callType === "video") {
          console.log("[Call] Falling back to audio-only");
          toast("Camera unavailable, using audio only");
          stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
          dispatch(setCameraOff(true));
          localStreamRef.current = stream;
          dispatch(setLocalStream(stream));
          markLocalStreamReady();
          return stream;
        }
        throw error;
      }
      
      localStreamRef.current = stream;
      dispatch(setLocalStream(stream));
      markLocalStreamReady();

      if (callType === "audio") {
        dispatch(setCameraOff(true));
      } else {
        dispatch(setCameraOff(false));
      }

      return stream;
    },
    [dispatch, getMediaConstraints, markLocalStreamReady],
  );

  const attachLocalTracks = useCallback((stream, pc) => {
    stream.getTracks().forEach((track) => {
      pc.addTrack(track, stream);
    });
  }, []);

  const handleAcceptCall = useCallback(async () => {
    const socket = getSocket();
    console.log("[Call] handleAcceptCall called", { socket: !!socket, incomingCall: callState.incomingCall });
    
    if (!socket || !callState.incomingCall) {
      console.log("[Call] Missing socket or incomingCall, aborting accept");
      return;
    }

    const callerId = normalizeId(callState.incomingCall.from?._id || callState.incomingCall.from);
    const currentCallId = callState.callId;
    
    console.log("[Call] Accepting call", { callId: currentCallId, callerId, callType: callState.callType });

    try {
      dispatch(setCallStatus("connecting"));
      
      // Update call metadata
      callMetaRef.current = {
        callId: currentCallId,
        peerUserId: callerId,
        callType: callState.callType,
      };
      
      console.log("[Call] Getting media stream...");
      const stream = await prepareLocalStream(callState.callType);
      console.log("[Call] Got media stream, creating peer connection...");
      
      const pc = createPeerConnection();
      attachLocalTracks(stream, pc);
      
      console.log("[Call] Emitting call:accept to", callerId);
      socket.emit("call:accept", {
        callId: currentCallId,
        targetUserId: callerId,
      });
      
      dispatch(clearIncomingCall());
      console.log("[Call] Accept flow complete, waiting for offer...");
    } catch (error) {
      console.error("[Call] Accept failed:", error);
      toast.error("Unable to accept call: " + (error.message || "Unknown error"));
      dispatch(setCallError(error.message));
      cleanupCall();
    }
  }, [
    attachLocalTracks,
    callState.callId,
    callState.callType,
    callState.incomingCall,
    cleanupCall,
    createPeerConnection,
    dispatch,
    prepareLocalStream,
  ]);

  const handleRejectCall = useCallback(() => {
    const socket = getSocket();
    if (!socket || !callState.incomingCall) return;
    socket.emit("call:reject", {
      callId: callState.callId,
      targetUserId: normalizeId(
        callState.incomingCall.from?._id || callState.incomingCall.from,
      ),
    });
    dispatch(clearIncomingCall());
    dispatch(resetCallState());
  }, [callState.callId, callState.incomingCall, dispatch]);

  const handleHangUp = useCallback(() => {
    const status = stateRef.current.status;
    const isConnected = ["connecting", "in-call"].includes(status);
    cleanupCall({
      notifyPeer: true,
      reason: isConnected ? "end" : "cancel",
    });
  }, [cleanupCall]);

  const handleToggleMute = useCallback(() => {
    const stream = localStreamRef.current;
    if (!stream) return;
    const audioTrack = stream.getAudioTracks()[0];
    if (!audioTrack) return;
    audioTrack.enabled = !audioTrack.enabled;
    dispatch(setMuted(!audioTrack.enabled));
  }, [dispatch]);

  const handleToggleCamera = useCallback(() => {
    const stream = localStreamRef.current;
    if (!stream) return;
    const videoTrack = stream.getVideoTracks()[0];
    if (!videoTrack) return;
    videoTrack.enabled = !videoTrack.enabled;
    dispatch(setCameraOff(!videoTrack.enabled));
  }, [dispatch]);

  // Listen for incoming/outgoing call events
  useEffect(() => {
    const socket = getSocket();
    console.log("🔴🔴🔴 [CallManager] useEffect RAN - socket:", !!socket, "socket.id:", socket?.id, "user:", !!user, "user._id:", user?._id, "socketConnected:", socketConnected);
    
    if (!socket || !user || !socketConnected) {
      console.log("🔴 [CallManager] Exiting early - missing socket, user, or not connected");
      return;
    }
    
    console.log("🟢🟢🟢 [CallManager] Setting up socket listeners - SOCKET IS READY!");

    const handleIncoming = (payload) => {
      console.log("[Call] handleIncoming received", payload);
      if (!payload) return;
      
      const normalizedTargetId = normalizeId(payload.targetUserId);
      const normalizedUserId = normalizeId(user?._id);
      // Use explicit callerId if available, otherwise extract from 'from' object
      const callerId = normalizeId(payload.callerId || payload.from?._id || payload.from);
      
      console.log("[Call] IDs - target:", normalizedTargetId, "me:", normalizedUserId, "caller:", callerId);
      
      // Ignore if this call is not for us (we're not the target)
      if (normalizedTargetId !== normalizedUserId) {
        console.log("[Call] Not for this user (target mismatch), ignoring");
        return;
      }
      
      // Ignore if we initiated this call (we're the caller, not the receiver)
      if (callerId === normalizedUserId) {
        console.log("[Call] We are the caller, ignoring our own call event");
        return;
      }
      
      const currentStatus = stateRef.current.status;
      console.log("[Call] current status:", currentStatus);
      
      // If we're already dialing someone, we're busy
      if (currentStatus === "dialing") {
        console.log("[Call] We're dialing, sending busy signal");
        socket.emit("call:busy", {
          callId: payload.callId,
          targetUserId: callerId,
        });
        return;
      }
      
      // If we're already in a call, we're busy
      if (currentStatus === "in-call" || currentStatus === "connecting") {
        console.log("[Call] Already in call, sending busy signal");
        socket.emit("call:busy", {
          callId: payload.callId,
          targetUserId: callerId,
        });
        return;
      }
      
      // Don't set incoming call if we're already ringing for this call
      if (currentStatus === "ringing" && callMetaRef.current.callId === payload.callId) {
        console.log("[Call] Already ringing for this call, ignoring duplicate");
        return;
      }
      
      console.log("[Call] Dispatching setIncomingCall");
      dispatch(setIncomingCall(payload));
    };

    const handleCallCancelled = ({ callId }) => {
      if (callId !== callMetaRef.current.callId) return;
      toast.error("Call cancelled");
      cleanupCall();
    };

    const handleCallRejected = ({ callId }) => {
      if (callId !== callMetaRef.current.callId) return;
      toast.error("Call rejected");
      cleanupCall();
    };

    const handleCallAccepted = async ({ callId }) => {
      if (callId !== callMetaRef.current.callId) return;
      try {
        dispatch(setCallStatus("connecting"));
        await waitForLocalStream();
        const pc = createPeerConnection();
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socket.emit("call:offer", {
          callId,
          targetUserId: callMetaRef.current.peerUserId,
          sdp: offer,
        });
      } catch (error) {
        console.error(error);
        toast.error("Unable to connect call");
        cleanupCall({ notifyPeer: true });
      }
    };

    const handleOffer = async ({ callId, sdp }) => {
      if (callId !== callMetaRef.current.callId) return;
      try {
        const pc = createPeerConnection();
        if (!pc.currentRemoteDescription) {
          await pc.setRemoteDescription(new RTCSessionDescription(sdp));
        }
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit("call:answer", {
          callId,
          targetUserId: callMetaRef.current.peerUserId,
          sdp: answer,
        });
      } catch (error) {
        console.error(error);
        toast.error("Unable to answer call");
        cleanupCall({ notifyPeer: true });
      }
    };

    const handleAnswer = async ({ callId, sdp }) => {
      if (callId !== callMetaRef.current.callId) return;
      try {
        const pc = createPeerConnection();
        if (!pc.currentRemoteDescription) {
          await pc.setRemoteDescription(new RTCSessionDescription(sdp));
        }
      } catch (error) {
        console.error(error);
        toast.error("Unable to finalize call");
        cleanupCall({ notifyPeer: true });
      }
    };

    const handleIce = async ({ callId, candidate }) => {
      if (callId !== callMetaRef.current.callId || !candidate) return;
      try {
        const pc = createPeerConnection();
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (error) {
        console.error(error);
      }
    };

    const handleCallEnded = ({ callId }) => {
      if (callId !== callMetaRef.current.callId) return;
      toast("Call ended");
      cleanupCall();
    };

    const handleUnavailable = ({ callId }) => {
      if (callId !== callMetaRef.current.callId) return;
      toast.error("User is offline");
      cleanupCall();
    };

    const handleBusy = ({ callId }) => {
      if (callId !== callMetaRef.current.callId) return;
      toast.error("User is busy");
      cleanupCall();
    };

    // Verify socket connection
    console.log("[CallManager] Socket connected:", socket.connected, "Socket ID:", socket.id, "User ID:", user?._id);
    
    // Register listener with explicit logging
    const incomingCallWrapper = (payload) => {
      console.log("🔥🔥🔥 [CALL EVENT] call:incoming event received!", payload);
      handleIncoming(payload);
    };
    
    socket.on("call:incoming", incomingCallWrapper);
    console.log("[CallManager] call:incoming listener registered");
    socket.on("call:cancelled", handleCallCancelled);
    socket.on("call:rejected", handleCallRejected);
    socket.on("call:accepted", handleCallAccepted);
    socket.on("call:offer", handleOffer);
    socket.on("call:answer", handleAnswer);
    socket.on("call:ice", handleIce);
    socket.on("call:ended", handleCallEnded);
    socket.on("call:unavailable", handleUnavailable);
    socket.on("call:busy", handleBusy);

    return () => {
      socket.off("call:incoming", handleIncoming);
      socket.off("call:cancelled", handleCallCancelled);
      socket.off("call:rejected", handleCallRejected);
      socket.off("call:accepted", handleCallAccepted);
      socket.off("call:offer", handleOffer);
      socket.off("call:answer", handleAnswer);
      socket.off("call:ice", handleIce);
      socket.off("call:ended", handleCallEnded);
      socket.off("call:unavailable", handleUnavailable);
      socket.off("call:busy", handleBusy);
    };
  }, [cleanupCall, createPeerConnection, dispatch, user, waitForLocalStream, socketConnected]);

  // When user initiates a call (status transitions to dialing)
  useEffect(() => {
    const shouldStart =
      callState.status === "dialing" &&
      callState.peerUser &&
      callState.callId &&
      user;
    if (!shouldStart) return;

    const socket = getSocket();
    if (!socket) {
      toast.error("Socket not connected");
      dispatch(resetCallState());
      return;
    }

    const startCall = async () => {
      dispatch(setCallStatus("calling"));
      socket.emit("call:initiate", {
        callId: callState.callId,
        callType: callState.callType,
        targetUserId: normalizeId(callState.peerUser?._id || callState.peerUser),
        from: {
          _id: user._id,
          fullName: user.fullName,
          profilePic: user.profilePic,
        },
      });

      try {
        const stream = await prepareLocalStream(callState.callType);
        const pc = createPeerConnection();
        attachLocalTracks(stream, pc);
      } catch (error) {
        console.error(error);
        toast.error("Unable to start call");
        dispatch(setCallError(error.message));
        socket.emit("call:debug", {
          stage: "startCall:init",
          error: error?.name || "UnknownError",
          message: error?.message || "Failed before local stream",
        });
        cleanupCall({ notifyPeer: true, reason: "cancel" });
      }
    };

    startCall();
  }, [
    attachLocalTracks,
    callState.callId,
    callState.callType,
    callState.peerUser,
    callState.status,
    createPeerConnection,
    dispatch,
    prepareLocalStream,
    cleanupCall,
    user,
  ]);

  return (
    <>
      <IncomingCallModal
        incomingCall={callState.incomingCall}
        onAccept={handleAcceptCall}
        onReject={handleRejectCall}
      />

      <CallOverlay
        status={callState.status}
        callType={callState.callType}
        peerUser={callState.peerUser}
        localStream={callState.localStream}
        remoteStream={callState.remoteStream}
        onHangUp={handleHangUp}
        onToggleMute={handleToggleMute}
        onToggleCamera={handleToggleCamera}
        isMuted={callState.isMuted}
        isCameraOff={callState.isCameraOff}
      />
    </>
  );
};

export default CallManager;

