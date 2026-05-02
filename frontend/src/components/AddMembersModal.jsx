import { useState, useEffect } from "react";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { addMembers } from "../store/slices/groupSlice";
import { getUsers } from "../store/slices/chatSlice";
import { X, UserPlus, Search } from "lucide-react";
import toast from "react-hot-toast";

const AddMembersModal = ({ isOpen, onClose, groupId }) => {
  const dispatch = useAppDispatch();
  const { users } = useAppSelector((state) => state.chat);
  const { selectedGroup } = useAppSelector((state) => state.groups);
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    if (isOpen) {
      dispatch(getUsers(""));
      setSelectedMembers([]);
      setSearchQuery("");
    }
  }, [isOpen, dispatch]);

  // Get existing member IDs
  const existingMemberIds = selectedGroup?.members?.map((m) => 
    typeof m.userId === "object" ? m.userId._id : m.userId
  ) || [];

  // Filter out existing members
  const filteredUsers = users.filter(
    (user) =>
      user.fullName.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !existingMemberIds.includes(user._id) &&
      !selectedMembers.includes(user._id)
  );

  const toggleMember = (userId) => {
    setSelectedMembers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const handleAddMembers = async () => {
    if (selectedMembers.length === 0) {
      toast.error("Select at least one member to add");
      return;
    }

    setIsAdding(true);
    try {
      await dispatch(
        addMembers({
          groupId,
          memberIds: selectedMembers,
        })
      ).unwrap();
      toast.success("Members added successfully!");
      onClose();
      setSelectedMembers([]);
    } catch (error) {
      toast.error(error.message || "Failed to add members");
    } finally {
      setIsAdding(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-base-100 rounded-lg w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-base-300 flex items-center justify-between">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <UserPlus className="w-5 h-5" />
            Add Members
          </h2>
          <button onClick={onClose} className="btn btn-sm btn-circle btn-ghost">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto flex-1 space-y-4">
          {/* Selected Members */}
          {selectedMembers.length > 0 && (
            <div>
              <label className="label">
                <span className="label-text">Selected Members ({selectedMembers.length})</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {selectedMembers.map((memberId) => {
                  const member = users.find((u) => u._id === memberId);
                  if (!member) return null;
                  return (
                    <div
                      key={memberId}
                      className="badge badge-primary gap-2 p-2"
                    >
                      {member.fullName}
                      <button
                        onClick={() => toggleMember(memberId)}
                        className="btn btn-xs btn-circle btn-ghost"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Search */}
          <div>
            <label className="label">
              <span className="label-text">Search Users</span>
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-base-content/40" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input input-bordered w-full pl-10"
                placeholder="Search users..."
              />
            </div>
          </div>

          {/* User List */}
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {filteredUsers.map((user) => (
              <button
                key={user._id}
                onClick={() => toggleMember(user._id)}
                className={`w-full p-3 flex items-center gap-3 rounded-lg transition-colors ${
                  selectedMembers.includes(user._id)
                    ? "bg-primary text-primary-content"
                    : "bg-base-200 hover:bg-base-300"
                }`}
              >
                <img
                  src={user.profilePic || "/avatar.png"}
                  alt={user.fullName}
                  className="w-10 h-10 rounded-full"
                />
                <div className="flex-1 text-left">
                  <div className="font-medium">{user.fullName}</div>
                  <div className="text-sm opacity-70">{user.email || user.phoneNumber}</div>
                </div>
                {selectedMembers.includes(user._id) && (
                  <div className="badge badge-success">Selected</div>
                )}
              </button>
            ))}
            {filteredUsers.length === 0 && (
              <div className="text-center text-base-content/60 py-4">
                {searchQuery ? "No users found" : "All users are already members"}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-base-300 flex gap-2">
          <button onClick={onClose} className="btn btn-ghost flex-1">
            Cancel
          </button>
          <button
            onClick={handleAddMembers}
            disabled={selectedMembers.length === 0 || isAdding}
            className="btn btn-primary flex-1"
          >
            {isAdding ? (
              <>
                <span className="loading loading-spinner loading-sm"></span>
                Adding...
              </>
            ) : (
              `Add ${selectedMembers.length > 0 ? `(${selectedMembers.length})` : ""}`
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddMembersModal;

