import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { BsPeopleFill, BsCheckCircleFill, BsExclamationTriangleFill } from "react-icons/bs";
import toast from "react-hot-toast";
import * as groupService from "../services/groupService.js";

const JoinGroupPage = () => {
  const { inviteCode } = useParams();
  const navigate = useNavigate();

  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    const fetchInfo = async () => {
      try {
        setLoading(true);
        const data = await groupService.getGroupByInviteCode(inviteCode);
        setGroup(data);
      } catch (err) {
        setError(err.message || "Invalid or expired group invite link");
      } finally {
        setLoading(false);
      }
    };
    if (inviteCode) fetchInfo();
  }, [inviteCode]);

  const handleJoin = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Please log in to join this group");
      navigate("/login");
      return;
    }
    try {
      setJoining(true);
      const res = await groupService.joinGroupByInviteCode(inviteCode);
      toast.success(`Joined ${res.group.name}!`);
      navigate("/");
    } catch (err) {
      toast.error(err.message || "Failed to join group");
    } finally {
      setJoining(false);
    }
  };

  return (
    <div className="min-h-screen bg-base-200 flex flex-col items-center justify-center p-4">
      <div className="card w-full max-w-md bg-base-100 shadow-xl border border-base-300">
        <div className="card-body items-center text-center p-8">
          {loading ? (
            <div className="flex flex-col items-center gap-4 py-8">
              <span className="loading loading-spinner loading-lg text-primary"></span>
              <p className="text-sm text-base-content/60">Fetching group invite details...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center gap-4 py-6">
              <div className="w-16 h-16 rounded-full bg-error/10 text-error flex items-center justify-center">
                <BsExclamationTriangleFill size={32} />
              </div>
              <h2 className="text-xl font-bold">Invite Link Expired</h2>
              <p className="text-sm text-base-content/60">{error}</p>
              <button onClick={() => navigate("/")} className="btn btn-primary btn-sm mt-4 rounded-xl">
                Go to Chats
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-5 w-full">
              {/* Group Avatar */}
              <div className="avatar">
                <div className="w-24 h-24 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2">
                  <img
                    src={group.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${group.name}`}
                    alt={group.name}
                  />
                </div>
              </div>

              {/* Title & Info */}
              <div>
                <h2 className="text-2xl font-bold">{group.name}</h2>
                <div className="flex items-center justify-center gap-1.5 text-xs text-base-content/60 mt-1">
                  <BsPeopleFill />
                  <span>{group.memberCount || 1} members</span>
                </div>
              </div>

              {group.description && (
                <p className="text-sm text-base-content/70 bg-base-200 p-3 rounded-xl w-full text-left">
                  {group.description}
                </p>
              )}

              {/* Join Button */}
              <button
                onClick={handleJoin}
                disabled={joining}
                className="btn btn-primary w-full rounded-2xl shadow-lg shadow-primary/20 text-base"
              >
                {joining ? "Joining group..." : "Join Group"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default JoinGroupPage;
