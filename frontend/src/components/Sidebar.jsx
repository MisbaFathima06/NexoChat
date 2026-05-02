import { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { getUsers, setSelectedUser } from "../store/slices/chatSlice";
import { getGroups, setSelectedGroup } from "../store/slices/groupSlice";
import SidebarSkeleton from "./skeletons/SidebarSkeleton";
import CreateGroupModal from "./CreateGroupModal";
import { Users, Search, MessageSquare, UserPlus } from "lucide-react";

const getCallPreviewText = (message, isOwnMessage = false) => {
  if (!message) return "";
  const callType = message?.callLog?.callType === "video" ? "Video" : "Voice";
  const status = message?.callLog?.status || message?.status || "ended";

  switch (status) {
    case "ringing":
      return `${callType} call · ringing`;
    case "in-progress":
      return `${callType} call · in call`;
    case "missed":
      return isOwnMessage ? `Unanswered ${callType.toLowerCase()} call` : `Missed ${callType.toLowerCase()} call`;
    case "cancelled":
      return isOwnMessage ? `Cancelled ${callType.toLowerCase()} call` : `Missed ${callType.toLowerCase()} call`;
    case "rejected":
      return isOwnMessage ? "Call declined" : "You declined the call";
    case "unavailable":
      return "User unavailable";
    default:
      return `${callType} call`;
  }
};

const getMessagePreview = (message) => {
  if (!message) return "";
  const isCall =
    message.messageType === "call" ||
    message.isCallLog === true ||
    (message.callLog && message.callLog.callId);

  if (isCall) {
    return getCallPreviewText(message, message.isFromMe);
  }

  if (message.text) return message.text;
  if (message.image) return "📷 Photo";
  if (message.video) return "🎥 Video";
  if (message.audio) return "🎵 Audio";
  if (message.voice) return "🎤 Voice message";
  if (message.document) return "📄 Document";
  return "Message";
};

const Sidebar = () => {
  const dispatch = useAppDispatch();
  const { users, selectedUser, isLoading } = useAppSelector((state) => state.chat);
  const { groups, selectedGroup } = useAppSelector((state) => state.groups);
  const { onlineUsers } = useAppSelector((state) => state.auth);
  const [showOnlineOnly, setShowOnlineOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("contacts"); // "contacts" or "groups"
  const [showCreateGroup, setShowCreateGroup] = useState(false);

  useEffect(() => {
    dispatch(getUsers(searchQuery));
    if (activeTab === "groups") {
      dispatch(getGroups());
    }
  }, [dispatch, searchQuery, activeTab]);

  // Refresh users list periodically to update last messages
  useEffect(() => {
    const interval = setInterval(() => {
      if (activeTab === "contacts") {
        dispatch(getUsers(searchQuery));
      }
    }, 5000); // Refresh every 5 seconds

    return () => clearInterval(interval);
  }, [dispatch, searchQuery, activeTab]);

  const filteredUsers = showOnlineOnly
    ? users.filter((user) => onlineUsers.includes(user._id))
    : users;

  const filteredGroups = groups || [];

  if (isLoading && activeTab === "contacts") return <SidebarSkeleton />;

  return (
    <aside className="h-full w-20 lg:w-72 border-r border-base-300 flex flex-col transition-all duration-200">
      <div className="border-b border-base-300 w-full p-5">
        <div className="flex items-center gap-2 mb-3">
          <Users className="size-6" />
          <span className="font-medium hidden lg:block">Chats</span>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-3">
          <button
            onClick={() => setActiveTab("contacts")}
            className={`btn btn-sm flex-1 ${activeTab === "contacts" ? "btn-primary" : "btn-ghost"}`}
          >
            <Users className="w-4 h-4" />
            <span className="hidden lg:inline">Contacts</span>
          </button>
          <button
            onClick={() => setActiveTab("groups")}
            className={`btn btn-sm flex-1 ${activeTab === "groups" ? "btn-primary" : "btn-ghost"}`}
          >
            <MessageSquare className="w-4 h-4" />
            <span className="hidden lg:inline">Groups</span>
          </button>
        </div>

        {/* Search */}
        <div className="hidden lg:block mb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-base-content/40" />
            <input
              type="text"
              placeholder="Search..."
              className="input input-bordered input-sm w-full pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Online filter toggle */}
        {activeTab === "contacts" && (
          <div className="hidden lg:flex items-center gap-2">
            <label className="cursor-pointer flex items-center gap-2">
              <input
                type="checkbox"
                checked={showOnlineOnly}
                onChange={(e) => setShowOnlineOnly(e.target.checked)}
                className="checkbox checkbox-sm"
              />
              <span className="text-sm">Show online only</span>
            </label>
            <span className="text-xs text-zinc-500">({onlineUsers.length} online)</span>
          </div>
        )}
      </div>

      <div className="overflow-y-auto w-full py-3 flex-1">
        {activeTab === "contacts" ? (
          <>
            {filteredUsers.map((user) => (
              <button
                key={user._id}
                onClick={() => {
                  dispatch(setSelectedUser(user));
                  dispatch(setSelectedGroup(null));
                }}
                className={`
                  w-full p-3 flex items-center gap-3
                  hover:bg-base-300 transition-colors
                  ${selectedUser?._id === user._id ? "bg-base-300 ring-1 ring-base-300" : ""}
                `}
              >
                <div className="relative mx-auto lg:mx-0">
                  <img
                    src={user.profilePic || "/avatar.png"}
                    alt={user.fullName}
                    className="size-12 object-cover rounded-full"
                  />
                  {onlineUsers.includes(user._id) && (
                    <span
                      className="absolute bottom-0 right-0 size-3 bg-green-500 
                      rounded-full ring-2 ring-base-100"
                    />
                  )}
                </div>

                <div className="hidden lg:block text-left min-w-0 flex-1">
                  <div className="font-medium truncate flex items-center gap-2">
                    {user.fullName}
                    {user.unreadCount > 0 && (
                      <span className="badge badge-primary badge-sm">
                        {user.unreadCount > 99 ? "99+" : user.unreadCount}
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-zinc-400 truncate">
                    {user.lastMessage ? (
                      <span className={user.lastMessage.isFromMe ? "text-zinc-500" : ""}>
                        {user.lastMessage.isFromMe ? "You: " : ""}
                        {getMessagePreview(user.lastMessage)}
                      </span>
                    ) : onlineUsers.includes(user._id) ? (
                      "Online"
                    ) : (
                      "Offline"
                    )}
                  </div>
                </div>
              </button>
            ))}

            {filteredUsers.length === 0 && (
              <div className="text-center text-zinc-500 py-4">No users found</div>
            )}
          </>
        ) : (
          <>
            {/* Create Group Button */}
            <div className="p-3 border-b border-base-300">
              <button
                onClick={() => setShowCreateGroup(true)}
                className="btn btn-primary btn-sm w-full gap-2"
              >
                <UserPlus className="w-4 h-4" />
                <span className="hidden lg:inline">Create Group</span>
                <span className="lg:hidden">New</span>
              </button>
            </div>

            {filteredGroups.map((group) => (
              <button
                key={group._id}
                onClick={() => {
                  dispatch(setSelectedGroup(group));
                  dispatch(setSelectedUser(null));
                }}
                className={`
                  w-full p-3 flex items-center gap-3
                  hover:bg-base-300 transition-colors
                  ${selectedGroup?._id === group._id ? "bg-base-300 ring-1 ring-base-300" : ""}
                `}
              >
                <div className="relative mx-auto lg:mx-0">
                  <img
                    src={group.groupPic || "/avatar.png"}
                    alt={group.name}
                    className="size-12 object-cover rounded-full"
                  />
                </div>

                <div className="hidden lg:block text-left min-w-0 flex-1">
                  <div className="font-medium truncate">{group.name}</div>
                  <div className="text-sm text-zinc-400">
                    {group.members?.length || 0} members
                  </div>
                </div>
              </button>
            ))}

            {filteredGroups.length === 0 && (
              <div className="text-center text-zinc-500 py-4">No groups found</div>
            )}
          </>
        )}
      </div>

      {/* Create Group Modal */}
      <CreateGroupModal isOpen={showCreateGroup} onClose={() => setShowCreateGroup(false)} />
    </aside>
  );
};

export default Sidebar;
