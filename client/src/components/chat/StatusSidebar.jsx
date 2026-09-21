import React, { useRef } from "react";
import { BsPlus, BsRecordCircle } from "react-icons/bs";
import toast from "react-hot-toast";

const StatusSidebar = ({
  loggedInUser,
  statuses,
  onUploadStatus,
  onViewStatus,
  isUploading,
}) => {
  const fileInputRef = useRef(null);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Only image files are allowed for status');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image too large (max 5MB)');
      return;
    }
    await onUploadStatus(file);
    e.target.value = null;
  };

  // Separate my statuses from others
  const myStatusGroup = statuses.find(s => s.user._id === loggedInUser?._id);
  const otherStatuses = statuses.filter(s => s.user._id !== loggedInUser?._id);

  return (
    <div className="w-full md:w-88 lg:w-96 flex-shrink-0 flex flex-col bg-base-100 border-r border-base-300">
      {/* Header */}
      <div className="h-16 px-4 flex items-center bg-base-200/50 border-b border-base-300">
        <h2 className="text-xl font-bold">Status</h2>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* My Status */}
        <div 
          className="flex items-center gap-4 p-4 hover:bg-base-200 cursor-pointer transition-all duration-300 hover:px-5 active:scale-[0.98]"
          onClick={() => {
            if (myStatusGroup && myStatusGroup.statuses.length > 0) {
              onViewStatus(myStatusGroup);
            } else {
              fileInputRef.current?.click();
            }
          }}
        >
          <div className="relative">
            <div className={`w-12 h-12 rounded-full p-0.5 ${myStatusGroup && myStatusGroup.statuses.length > 0 ? 'ring-2 ring-primary ring-offset-2 ring-offset-base-100' : ''}`}>
              <img
                src={loggedInUser?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=Me`}
                alt="My Status"
                className="w-full h-full rounded-full object-cover"
              />
            </div>
            <button 
              className="absolute bottom-0 right-0 bg-primary text-white rounded-full p-0.5 shadow-sm border-2 border-base-100 hover:scale-110 transition-transform"
              onClick={(e) => {
                e.stopPropagation();
                fileInputRef.current?.click();
              }}
              disabled={isUploading}
            >
              <BsPlus size={16} />
            </button>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              ref={fileInputRef}
              onChange={handleFileChange}
            />
          </div>
          <div>
            <h3 className="font-semibold text-[15px]">My status</h3>
            <p className="text-sm text-base-content/60">
              {isUploading ? "Uploading..." : (myStatusGroup ? "Tap to view or add" : "Click to add status update")}
            </p>
          </div>
        </div>

        {/* Divider */}
        <div className="px-4 py-2">
          <h4 className="text-sm font-semibold text-base-content/50 uppercase tracking-wider">Recent updates</h4>
        </div>

        {/* Other Users' Statuses */}
        <div className="flex flex-col">
          {otherStatuses.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-base-content/40 text-center gap-2">
              <BsRecordCircle size={32} />
              <p className="text-sm">No recent updates</p>
            </div>
          ) : (
            otherStatuses.map((group) => (
              <div
                key={group.user._id}
                className="flex items-center gap-4 p-4 hover:bg-base-200 cursor-pointer transition-all duration-300 hover:px-5 active:scale-[0.98]"
                onClick={() => onViewStatus(group)}
              >
                <div className="w-12 h-12 rounded-full p-0.5 ring-2 ring-primary ring-offset-2 ring-offset-base-100">
                  <img
                    src={group.user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${group.user.name}`}
                    alt={group.user.name}
                    className="w-full h-full rounded-full object-cover"
                  />
                </div>
                <div>
                  <h3 className="font-semibold text-[15px]">{group.user.name}</h3>
                  <p className="text-sm text-base-content/60">
                    {new Date(group.statuses[group.statuses.length - 1].createdAt).toLocaleTimeString([], {
                      hour: '2-digit', minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default StatusSidebar;
