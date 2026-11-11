import React, { useState, useEffect } from "react";
import { fetchUserProfile, fetchFriends, connectFriend } from "../api";

function UserProfileModal({ isOpen, onClose }) {
  const [profile, setProfile] = useState(null);
  const [friends, setFriends] = useState([]);
  const [friendCode, setFriendCode] = useState("");
  const [copied, setCopied] = useState(false);
  const [message, setMessage] = useState({ text: "", isError: false });
  const [loading, setLoading] = useState(false);

  const loadProfileData = async () => {
    try {
      const userProfile = await fetchUserProfile();
      setProfile(userProfile);
      const friendsList = await fetchFriends();
      setFriends(friendsList);
    } catch (err) {
      console.error("Error loading profile:", err);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadProfileData();
      setMessage({ text: "", isError: false });
      setFriendCode("");
      setCopied(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCopyCode = () => {
    if (profile?.invite_code) {
      navigator.clipboard.writeText(profile.invite_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleConnectFriend = async (e) => {
    e.preventDefault();
    if (!friendCode.trim()) return;

    setLoading(true);
    setMessage({ text: "", isError: false });

    try {
      const res = await connectFriend(friendCode.trim());
      setMessage({ text: res.message, isError: false });
      setFriendCode("");
      loadProfileData();
    } catch (err) {
      setMessage({ text: err.message || "Failed to connect friend", isError: true });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#F6EFE5] w-full max-w-lg rounded-2xl shadow-2xl border border-[#CDB494]/60 flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-[#7F2F07] p-5 text-[#F6EFE5] flex justify-between items-center border-b border-[#CDB494]/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#AB5419] border border-[#E0B17D] flex items-center justify-center text-lg font-bold shadow-inner">
              {profile?.username?.[0]?.toUpperCase() || "👤"}
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-wide italic">
                {profile?.username || "Adventurer"}
              </h2>
              <span className="text-xs text-[#E0B17D]/90">Explorer of Habits</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#251712]/50 hover:bg-[#251712] flex items-center justify-center text-sm font-bold text-[#F6EFE5] transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex flex-col gap-6 text-[#2A1A0F]">
          
          {/* Invite Code Box */}
          <div className="bg-[#E0B17D]/30 border border-[#CDB494]/60 rounded-xl p-4 flex flex-col sm:flex-row justify-between items-center gap-3 shadow-sm">
            <div className="text-center sm:text-left">
              <span className="text-xs font-semibold text-[#6B5B47] uppercase tracking-wider block">
                Your Dual Streak Invite Code
              </span>
              <span className="text-2xl font-black tracking-widest text-[#7F2F07] font-mono">
                {profile?.invite_code || "GENERATING..."}
              </span>
            </div>
            <button
              onClick={handleCopyCode}
              className="px-4 py-2 bg-[#7F2F07] hover:bg-[#AB5419] text-[#F6EFE5] text-xs font-bold rounded-lg transition-colors shadow-sm flex items-center gap-2"
            >
              <span>{copied ? "✓ Copied!" : "📋 Copy Code"}</span>
            </button>
          </div>

          {/* Feedback Message */}
          {message.text && (
            <div
              className={`p-3 text-xs rounded-lg text-center font-semibold border ${
                message.isError
                  ? "bg-red-100 border-red-400 text-red-700"
                  : "bg-[#C98928]/15 border-[#C98928] text-[#7F2F07]"
              }`}
            >
              {message.text}
            </div>
          )}

          {/* Connect Friend Form */}
          <form onSubmit={handleConnectFriend} className="flex flex-col gap-2">
            <label className="text-xs font-bold text-[#7F2F07] uppercase tracking-wider">
              🤝 Connect with a Partner
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={friendCode}
                onChange={(e) => setFriendCode(e.target.value.toUpperCase())}
                placeholder="Enter friend's code (e.g. HAB-XXXX)"
                className="flex-1 px-3 py-2 bg-[#251712] border border-[#CDB494]/30 rounded-lg text-xs font-mono text-[#F6EFE5] placeholder-[#928464] focus:outline-none uppercase"
              />
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-[#AB5419] hover:bg-[#7F2F07] disabled:opacity-50 text-white text-xs font-bold rounded-lg transition-colors shadow-sm"
              >
                {loading ? "Linking..." : "Connect"}
              </button>
            </div>
          </form>

          {/* Friends List */}
          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-[#7F2F07] uppercase tracking-wider">
                Connected Partners ({friends.length})
              </span>
            </div>

            {friends.length === 0 ? (
              <div className="text-center py-4 bg-[#F6EFE5] border border-dashed border-[#CDB494]/60 rounded-xl text-xs text-[#6B5B47] italic">
                No partners connected yet. Share your code to start a Dual Streak!
              </div>
            ) : (
              <div className="flex flex-col gap-2 max-h-36 overflow-y-auto pr-1">
                {friends.map((f) => (
                  <div
                    key={f.id}
                    className="p-3 bg-[#F6EFE5] border border-[#CDB494]/40 rounded-lg flex justify-between items-center shadow-sm"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                      <span className="font-bold text-sm text-[#7F2F07]">
                        {f.username}
                      </span>
                    </div>
                    <span className="text-[11px] font-mono text-[#6B5B47] bg-[#E0B17D]/30 px-2 py-0.5 rounded">
                      {f.invite_code}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Footer */}
        <div className="bg-[#E0B17D]/20 border-t border-[#CDB494]/30 p-3 text-center">
          <span className="text-[11px] text-[#6B5B47] italic">
            Dual streaks stay alive only when both partners complete the habit daily!
          </span>
        </div>

      </div>
    </div>
  );
}

export default UserProfileModal;
