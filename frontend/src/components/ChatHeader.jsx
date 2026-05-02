import { useState } from "react";
import { Users, PhoneCall, Video } from "lucide-react";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import GroupMembersModal from "./GroupMembersModal";
import { startOutgoingCall } from "../store/slices/callSlice";
import toast from "react-hot-toast";

const ChatHeader = () => {
  const dispatch = useAppDispatch();
  const { selectedUser } = useAppSelector((state) => state.chat);
  const { selectedGroup } = useAppSelector((state) => state.groups);
  const { onlineUsers } = useAppSelector((state) => state.auth);
  const [showMembersModal, setShowMembersModal] = useState(false);

  const currentChat = selectedGroup || selectedUser;

  if (!currentChat) return null;

  const isOnline = selectedUser && onlineUsers.includes(selectedUser._id);

  const handleStartCall = (type) => {
    if (!selectedUser) {
      toast.error("Select a contact to start a call");
      return;
    }
    if (!selectedUser._id) {
      toast.error("Selected contact is missing an ID");
      return;
    }
    if (!window.navigator?.mediaDevices) {
      toast.error("Calls are not supported in this browser");
      return;
    }
    const callId =
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    dispatch(
      startOutgoingCall({
        callType: type,
        callId,
        peerUser: selectedUser,
      }),
    );
  };

  return (
    <>
      <div className="p-2.5 border-b border-base-300 bg-base-100">
      <div className="flex items-center justify-between">
          <div 
            className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer"
            onClick={() => selectedGroup && setShowMembersModal(true)}
          >
            <div className="avatar flex-shrink-0">
            <div className="size-10 rounded-full relative">
                <img
                  src={currentChat.profilePic || currentChat.groupPic || "/avatar.png"}
                  alt={currentChat.fullName || currentChat.name}
                  className="object-cover"
                />
                {isOnline && (
                  <span className="absolute bottom-0 right-0 size-3 bg-green-500 rounded-full ring-2 ring-base-100" />
                )}
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="font-medium truncate">{currentChat.fullName || currentChat.name}</h3>
              <p className="text-sm text-base-content/70 truncate">
                {selectedGroup
                  ? `${selectedGroup.members?.length || 0} members${
                      selectedGroup.admins?.length > 0
                        ? ` • ${selectedGroup.admins.length} admin${selectedGroup.admins.length > 1 ? "s" : ""}`
                        : ""
                    }`
                  : isOnline
                  ? "Online"
                  : "Offline"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {selectedUser && (
              <>
                <button
                  className="btn btn-sm btn-ghost"
                  onClick={() => handleStartCall("audio")}
                  title="Voice call"
                >
                  <PhoneCall className="size-4" />
                </button>
                <button
                  className="btn btn-sm btn-ghost"
                  onClick={() => handleStartCall("video")}
                  title="Video call"
                >
                  <Video className="size-4" />
                </button>
              </>
            )}

            {selectedGroup && (
              <button
                onClick={() => setShowMembersModal(true)}
                className="btn btn-sm btn-ghost text-sm font-medium"
              >
                View members
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Group Members Modal */}
      {selectedGroup && (
        <GroupMembersModal
          isOpen={showMembersModal}
          onClose={() => setShowMembersModal(false)}
          groupId={selectedGroup._id}
        />
      )}
    </>
  );
};

export default ChatHeader;
