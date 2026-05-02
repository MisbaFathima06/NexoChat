import { useEffect, useRef, useMemo } from "react";
import { Camera, CameraOff, Mic, MicOff, Phone, PhoneOff, Video } from "lucide-react";

const statusLabels = {
  dialing: "Calling…",
  calling: "Ringing…",
  connecting: "Connecting…",
  "in-call": "In call",
};

const CallOverlay = ({
  status,
  callType,
  peerUser,
  localStream,
  remoteStream,
  onHangUp,
  onToggleMute,
  onToggleCamera,
  isMuted,
  isCameraOff,
}) => {
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const isActive =
    ["dialing", "calling", "connecting", "in-call"].includes(status) && !!peerUser;
  const isVideoCall = callType === "video";

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  const statusLabel = useMemo(
    () => statusLabels[status] || "Call",
    [status],
  );

  if (!isActive) return null;

  return (
    <div className="fixed inset-0 z-[55] bg-base-200/90 backdrop-blur-lg flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-3xl flex flex-col gap-4 items-center">
        <div className="text-center space-y-1">
          <p className="uppercase text-sm tracking-wide text-base-content/60">
            {statusLabel}
          </p>
          <h2 className="text-3xl font-semibold">
            {peerUser?.fullName || "Unknown user"}
          </h2>
        </div>

        {isVideoCall ? (
          <div className="relative w-full aspect-video rounded-3xl bg-black overflow-hidden shadow-2xl">
            {remoteStream ? (
              <video
                ref={remoteVideoRef}
                className="w-full h-full object-cover"
                autoPlay
                playsInline
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white/70 text-lg">
                Waiting for video…
              </div>
            )}

            <div className="absolute bottom-4 right-4 w-40 aspect-video bg-black/70 rounded-xl overflow-hidden border border-white/10">
              {localStream ? (
                <video
                  ref={localVideoRef}
                  className="w-full h-full object-cover"
                  autoPlay
                  playsInline
                  muted
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white/70 text-xs">
                  {status === "dialing" ? "Preparing camera…" : "Camera off"}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4">
            <div className="avatar">
              <div className="w-28 rounded-full ring ring-primary/40 ring-offset-base-200 ring-offset-4 overflow-hidden">
                <img src={peerUser?.profilePic || "/avatar.png"} alt="caller" />
              </div>
            </div>
            <Phone className="size-6 text-base-content/50" />
          </div>
        )}

        <div className="flex items-center gap-4">
          <button
            onClick={onToggleMute}
            className={`btn btn-circle ${
              isMuted ? "btn-warning text-white" : "btn-ghost"
            }`}
            title={isMuted ? "Unmute" : "Mute"}
          >
            {isMuted ? <MicOff /> : <Mic />}
          </button>

          {isVideoCall && (
            <button
              onClick={onToggleCamera}
              className={`btn btn-circle ${
                isCameraOff ? "btn-warning text-white" : "btn-ghost"
              }`}
              title={isCameraOff ? "Turn camera on" : "Turn camera off"}
            >
              {isCameraOff ? <CameraOff /> : <Camera />}
            </button>
          )}

          <button onClick={onHangUp} className="btn btn-circle btn-error text-white">
            <PhoneOff />
          </button>
        </div>
      </div>
    </div>
  );
};

export default CallOverlay;

