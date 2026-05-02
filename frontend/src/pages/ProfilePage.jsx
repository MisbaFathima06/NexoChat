import { useState } from "react";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { updateProfile, updatePrivacy, updateAutoReply } from "../store/slices/authSlice";
import { Camera, Mail, User, Phone, MessageSquare, Lock, Eye, EyeOff } from "lucide-react";
import toast from "react-hot-toast";

const ProfilePage = () => {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const [selectedImg, setSelectedImg] = useState(null);
  const [status, setStatus] = useState(user?.status || "");
  const [isEditingStatus, setIsEditingStatus] = useState(false);
  const [privacy, setPrivacy] = useState(user?.privacy || {
    lastSeen: "everyone",
    profilePic: "everyone",
    status: "everyone",
    readReceipts: true,
  });
  const [autoReply, setAutoReply] = useState(user?.autoReply || {
    enabled: false,
    message: "I'm currently busy. I'll get back to you soon!",
  });

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async () => {
      const base64Image = reader.result;
      setSelectedImg(base64Image);
      try {
        await dispatch(updateProfile({ profilePic: base64Image })).unwrap();
        toast.success("Profile picture updated");
      } catch (error) {
        toast.error("Failed to update profile picture");
      }
    };
  };

  const handleStatusUpdate = async () => {
    try {
      await dispatch(updateProfile({ status })).unwrap();
      setIsEditingStatus(false);
      toast.success("Status updated");
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  const handlePrivacyUpdate = async () => {
    try {
      await dispatch(updatePrivacy(privacy)).unwrap();
      toast.success("Privacy settings updated");
    } catch (error) {
      toast.error("Failed to update privacy settings");
    }
  };

  const handleAutoReplyUpdate = async () => {
    try {
      await dispatch(updateAutoReply(autoReply)).unwrap();
      toast.success("Auto-reply settings updated");
    } catch (error) {
      toast.error("Failed to update auto-reply settings");
    }
  };

  if (!user) return null;

  return (
    <div className="h-screen pt-20 overflow-y-auto">
      <div className="max-w-2xl mx-auto p-4 py-8 space-y-6">
        {/* Profile Section */}
        <div className="bg-base-300 rounded-xl p-6 space-y-8">
          <div className="text-center">
            <h1 className="text-2xl font-semibold">Profile</h1>
            <p className="mt-2">Your profile information</p>
          </div>

          {/* Avatar Upload */}
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <img
                src={selectedImg || user.profilePic || "/avatar.png"}
                alt="Profile"
                className="size-32 rounded-full object-cover border-4"
              />
              <label
                htmlFor="avatar-upload"
                className="absolute bottom-0 right-0 bg-base-content hover:scale-105 p-2 rounded-full cursor-pointer transition-all duration-200"
              >
                <Camera className="w-5 h-5 text-base-200" />
                <input
                  type="file"
                  id="avatar-upload"
                  className="hidden"
                  accept="image/*"
                  onChange={handleImageUpload}
                />
              </label>
            </div>
            <p className="text-sm text-zinc-400">
              Click the camera icon to update your photo
            </p>
          </div>

          {/* Status */}
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Status
            </label>
            {isEditingStatus ? (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="input input-bordered flex-1"
                  maxLength={100}
                  placeholder="Enter your status"
                />
                <button onClick={handleStatusUpdate} className="btn btn-primary">
                  Save
                </button>
                <button
                  onClick={() => {
                    setIsEditingStatus(false);
                    setStatus(user.status || "");
                  }}
                  className="btn btn-ghost"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <p className="px-4 py-2.5 bg-base-200 rounded-lg border flex-1">
                  {user.status || "Hey there! I am using Chatty"}
                </p>
                <button
                  onClick={() => setIsEditingStatus(true)}
                  className="btn btn-sm btn-ghost ml-2"
                >
                  Edit
                </button>
              </div>
            )}
          </div>

          {/* User Info */}
          <div className="space-y-6">
            <div className="space-y-1.5">
              <div className="text-sm text-zinc-400 flex items-center gap-2">
                <User className="w-4 h-4" />
                Full Name
              </div>
              <p className="px-4 py-2.5 bg-base-200 rounded-lg border">{user.fullName}</p>
            </div>

            {user.email && (
            <div className="space-y-1.5">
              <div className="text-sm text-zinc-400 flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Email Address
              </div>
                <p className="px-4 py-2.5 bg-base-200 rounded-lg border">{user.email}</p>
              </div>
            )}

            {user.phoneNumber && (
              <div className="space-y-1.5">
                <div className="text-sm text-zinc-400 flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  Phone Number
                </div>
                <p className="px-4 py-2.5 bg-base-200 rounded-lg border">{user.phoneNumber}</p>
            </div>
            )}
          </div>

          {/* Account Information */}
          <div className="mt-6 bg-base-200 rounded-xl p-6">
            <h2 className="text-lg font-medium mb-4">Account Information</h2>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between py-2 border-b border-base-300">
                <span>Member Since</span>
                <span>{user.createdAt?.split("T")[0] || "N/A"}</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span>Last Seen</span>
                <span>{user.lastSeen ? new Date(user.lastSeen).toLocaleString() : "N/A"}</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span>Account Status</span>
                <span className="text-green-500">Active</span>
              </div>
            </div>
          </div>
        </div>

        {/* Privacy Settings */}
        <div className="bg-base-300 rounded-xl p-6 space-y-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Lock className="w-5 h-5" />
            Privacy Settings
          </h2>

          <div className="space-y-4">
            <div>
              <label className="label">
                <span className="label-text">Last Seen</span>
              </label>
              <select
                value={privacy.lastSeen}
                onChange={(e) => setPrivacy({ ...privacy, lastSeen: e.target.value })}
                className="select select-bordered w-full"
              >
                <option value="everyone">Everyone</option>
                <option value="contacts">Contacts Only</option>
                <option value="nobody">Nobody</option>
              </select>
            </div>

            <div>
              <label className="label">
                <span className="label-text">Profile Picture</span>
              </label>
              <select
                value={privacy.profilePic}
                onChange={(e) => setPrivacy({ ...privacy, profilePic: e.target.value })}
                className="select select-bordered w-full"
              >
                <option value="everyone">Everyone</option>
                <option value="contacts">Contacts Only</option>
                <option value="nobody">Nobody</option>
              </select>
            </div>

            <div>
              <label className="label">
                <span className="label-text">Status</span>
              </label>
              <select
                value={privacy.status}
                onChange={(e) => setPrivacy({ ...privacy, status: e.target.value })}
                className="select select-bordered w-full"
              >
                <option value="everyone">Everyone</option>
                <option value="contacts">Contacts Only</option>
                <option value="nobody">Nobody</option>
              </select>
            </div>

            <div className="form-control">
              <label className="label cursor-pointer">
                <span className="label-text">Read Receipts</span>
                <input
                  type="checkbox"
                  checked={privacy.readReceipts}
                  onChange={(e) => setPrivacy({ ...privacy, readReceipts: e.target.checked })}
                  className="toggle toggle-primary"
                />
              </label>
            </div>

            <button onClick={handlePrivacyUpdate} className="btn btn-primary w-full">
              Save Privacy Settings
            </button>
          </div>
        </div>

        {/* Auto-Reply Settings */}
        <div className="bg-base-300 rounded-xl p-6 space-y-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Auto-Reply Settings
          </h2>

          <div className="space-y-4">
            <div className="form-control">
              <label className="label cursor-pointer">
                <span className="label-text">Enable Auto-Reply</span>
                <input
                  type="checkbox"
                  checked={autoReply.enabled}
                  onChange={(e) => setAutoReply({ ...autoReply, enabled: e.target.checked })}
                  className="toggle toggle-primary"
                />
              </label>
            </div>

            {autoReply.enabled && (
              <div>
                <label className="label">
                  <span className="label-text">Auto-Reply Message</span>
                </label>
                <textarea
                  value={autoReply.message}
                  onChange={(e) => setAutoReply({ ...autoReply, message: e.target.value })}
                  className="textarea textarea-bordered w-full"
                  rows={3}
                  maxLength={200}
                  placeholder="Enter your auto-reply message"
                />
              </div>
            )}

            <button onClick={handleAutoReplyUpdate} className="btn btn-primary w-full">
              Save Auto-Reply Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
