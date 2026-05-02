import { useState, useEffect } from "react";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { getGroupDetails, leaveGroup } from "../store/slices/groupSlice";
import { setSelectedGroup } from "../store/slices/groupSlice";
import { setSelectedUser, clearChat } from "../store/slices/chatSlice";
import { X, Users, Crown, UserPlus, LogOut } from "lucide-react";
import toast from "react-hot-toast";
import AddMembersModal from "./AddMembersModal";

const GroupMembersModal = ({ isOpen, onClose, groupId }) => {
  const dispatch = useAppDispatch();
  const { selectedGroup } = useAppSelector((state) => state.groups);
  const { user } = useAppSelector((state) => state.auth);
  const [isLoading, setIsLoading] = useState(false);
  const [showAddMembers, setShowAddMembers] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    if (isOpen && groupId) {
      setIsLoading(true);
      dispatch(getGroupDetails(groupId))
        .finally(() => setIsLoading(false));
    }
  }, [isOpen, groupId, dispatch]);

  if (!isOpen || !selectedGroup) return null;

  const adminIds = (selectedGroup.admins || []).map((admin) =>
    typeof admin === "object" ? admin._id?.toString() : admin?.toString()
  );

  const isAdmin = adminIds.includes(user._id);

  const handleLeaveGroup = async () => {
    if (!window.confirm("Are you sure you want to leave this group?")) {
      return;
    }

    setIsLeaving(true);
    try {
      await dispatch(leaveGroup(groupId)).unwrap();
      toast.success("Left group successfully");
      dispatch(setSelectedGroup(null));
      dispatch(setSelectedUser(null));
      dispatch(clearChat());
      onClose();
    } catch (error) {
      toast.error(error.message || "Failed to leave group");
    } finally {
      setIsLeaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-base-100 rounded-lg w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-base-300 flex items-center justify-between">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Users className="w-5 h-5" />
            Group Members ({selectedGroup.members?.length || 0})
          </h2>
          <button onClick={onClose} className="btn btn-sm btn-circle btn-ghost">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Admin Info */}
        {selectedGroup.admins && selectedGroup.admins.length > 0 && (
          <div className="p-3 bg-base-200 border-b border-base-300">
            <div className="flex items-center gap-2 text-sm">
              <Crown className="w-4 h-4 text-yellow-500" />
              <span className="font-medium">Admin{selectedGroup.admins.length > 1 ? "s" : ""}:</span>
              <span className="text-base-content/70">
                {selectedGroup.admins.map((adminId, idx) => {
                  // Handle both populated and non-populated admin objects
                  const adminObj = typeof adminId === "object" ? adminId : null;
                  const adminIdStr = typeof adminId === "object" ? adminId._id : adminId;
                  
                  // Try to find admin in members list
                  const adminMember = selectedGroup.members?.find(
                    (m) => {
                      const memberUserId = typeof m.userId === "object" ? m.userId._id : m.userId;
                      return memberUserId?.toString() === adminIdStr?.toString();
                    }
                  );
                  
                  const adminName = adminObj?.fullName || 
                                   adminMember?.userId?.fullName || 
                                   (typeof adminMember?.userId === "object" ? adminMember?.userId?.fullName : null) ||
                                   "Unknown";
                  return (
                    <span key={adminIdStr || idx}>
                      {adminName}
                      {idx < selectedGroup.admins.length - 1 && ", "}
                    </span>
                  );
                })}
              </span>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="p-4 overflow-y-auto flex-1">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <span className="loading loading-spinner loading-md"></span>
            </div>
          ) : (
            <div className="space-y-2">
              {selectedGroup.members?.map((member) => {
                const memberUser = member.userId;
                const isMemberAdmin = adminIds.includes(memberUser._id);
                const isCurrentUser = memberUser._id === user._id;

                return (
                  <div
                    key={memberUser._id}
                    className="flex items-center gap-3 p-3 bg-base-200 rounded-lg"
                  >
                    <img
                      src={memberUser.profilePic || "/avatar.png"}
                      alt={memberUser.fullName}
                      className="w-10 h-10 rounded-full"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          {memberUser.fullName}
                          {isCurrentUser && " (You)"}
                        </span>
                        {isMemberAdmin && (
                          <Crown className="w-4 h-4 text-yellow-500" />
                        )}
                      </div>
                      <div className="text-sm text-base-content/60">
                        {memberUser.email || memberUser.phoneNumber}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-base-300 space-y-2">
          {isAdmin && (
            <button
              onClick={() => setShowAddMembers(true)}
              className="btn btn-primary w-full gap-2"
            >
              <UserPlus className="w-4 h-4" />
              Add Members
            </button>
          )}
          <button
            onClick={handleLeaveGroup}
            disabled={isLeaving}
            className="btn btn-error w-full gap-2"
          >
            {isLeaving ? (
              <>
                <span className="loading loading-spinner loading-sm"></span>
                Leaving...
              </>
            ) : (
              <>
                <LogOut className="w-4 h-4" />
                Exit Group
              </>
            )}
          </button>
        </div>
      </div>

      {/* Add Members Modal */}
      <AddMembersModal
        isOpen={showAddMembers}
        onClose={() => setShowAddMembers(false)}
        groupId={groupId}
      />
    </div>
  );
};

export default GroupMembersModal;

