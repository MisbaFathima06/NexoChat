import { Phone, Video } from "lucide-react";

const IncomingCallModal = ({ incomingCall, onAccept, onReject }) => {
  console.log("[IncomingCallModal] render", { incomingCall });
  if (!incomingCall) return null;

  const { from, callType } = incomingCall;
  const isVideo = callType === "video";

  return (
    <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center px-4">
      <div className="bg-base-100 rounded-3xl shadow-2xl w-full max-w-sm p-8 text-center space-y-6">
        <div className="flex flex-col items-center gap-3">
          <div className="avatar">
            <div className="w-20 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2 overflow-hidden">
              <img src={from?.profilePic || "/avatar.png"} alt={from?.fullName || "Incoming call"} />
            </div>
          </div>
          <div>
            <p className="text-sm text-base-content/70 uppercase tracking-wide">Incoming {isVideo ? "video" : "voice"} call</p>
            <h3 className="text-2xl font-semibold mt-1">{from?.fullName || "Unknown user"}</h3>
          </div>
        </div>

        <div className="flex gap-4">
          <button onClick={onReject} className="btn btn-error flex-1 text-white">
            Decline
          </button>
          <button onClick={onAccept} className="btn btn-success flex-1 text-white">
            {isVideo ? <Video className="size-4" /> : <Phone className="size-4" />} Accept
          </button>
        </div>
      </div>
    </div>
  );
};

export default IncomingCallModal;

