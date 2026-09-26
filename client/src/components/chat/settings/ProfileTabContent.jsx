import React from "react";
import { BsCameraFill, BsPencilFill, BsTelephoneFill, BsLockFill } from "react-icons/bs";

const statusPresets = [
  "Available",
  "Busy",
  "At work",
  "In a meeting",
  "Can't talk, Guftgu only",
  "Battery about to die",
];

const ProfileTabContent = ({
  profileAvatarPreview,
  currentUser,
  profileName,
  handleAvatarChange,
  handleSaveProfile,
  setProfileName,
  profileAbout,
  setProfileAbout,
  isSavingProfile,
}) => {
  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Avatar Section */}
      <div className="flex flex-col items-center justify-center pt-2">
        <div className="relative group cursor-pointer w-28 h-28 rounded-full border-4 border-base-200 overflow-hidden shadow-lg transition-all">
          <img
            src={
              profileAvatarPreview ||
              currentUser?.avatar ||
              `https://api.dicebear.com/7.x/avataaars/svg?seed=${profileName || "User"}`
            }
            alt="Profile Avatar"
            className="w-full h-full object-cover"
          />
          <label className="absolute inset-0 bg-black/45 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
            <BsCameraFill className="text-white text-2xl drop-shadow" />
            <span className="text-[11px] text-white font-medium mt-1">Change</span>
            <input
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              className="hidden"
            />
          </label>
        </div>
        <p className="text-xs text-base-content/50 mt-2">
          Click photo to change avatar
        </p>
      </div>

      {/* Name & About Form */}
      <form onSubmit={handleSaveProfile} className="space-y-4">
        {/* Your Name */}
        <div className="p-4 rounded-2xl bg-base-200/40 border border-base-300 space-y-2">
          <label className="text-xs font-semibold text-primary uppercase tracking-wider block">
            Your Name
          </label>
          <div className="relative">
            <input
              type="text"
              value={profileName}
              onChange={(e) => setProfileName(e.target.value)}
              placeholder="Enter your name"
              className="input input-bordered input-sm w-full rounded-xl bg-base-100 pr-8"
              maxLength={50}
            />
            <BsPencilFill
              size={12}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-base-content/40 pointer-events-none"
            />
          </div>
          <p className="text-[11px] text-base-content/50 leading-relaxed">
            This is not your username or PIN. This name will be visible to your
            Guftgu contacts.
          </p>
        </div>

        {/* About */}
        <div className="p-4 rounded-2xl bg-base-200/40 border border-base-300 space-y-2.5">
          <label className="text-xs font-semibold text-primary uppercase tracking-wider block">
            About
          </label>
          <div className="relative">
            <input
              type="text"
              value={profileAbout}
              onChange={(e) => setProfileAbout(e.target.value)}
              placeholder="Hey there! I am using Guftgu."
              className="input input-bordered input-sm w-full rounded-xl bg-base-100 pr-8"
              maxLength={120}
            />
            <BsPencilFill
              size={12}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-base-content/40 pointer-events-none"
            />
          </div>

          {/* Presets */}
          <div className="space-y-1 pt-1">
            <span className="text-[10px] text-base-content/50 font-medium uppercase tracking-wider block">
              Quick Status Presets
            </span>
            <div className="flex flex-wrap gap-1.5">
              {statusPresets.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setProfileAbout(preset)}
                  className={`text-xs px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                    profileAbout === preset
                      ? "bg-primary text-primary-content border-primary font-medium"
                      : "bg-base-100 text-base-content/70 border-base-300 hover:bg-base-200"
                  }`}
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Phone Number */}
        <div className="p-4 rounded-2xl bg-base-200/40 border border-base-300 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
              <BsTelephoneFill size={14} />
            </div>
            <div>
              <span className="text-xs font-semibold text-primary uppercase tracking-wider block">
                Phone Number
              </span>
              <span className="text-sm font-semibold text-base-content font-mono block mt-0.5">
                {currentUser?.phone || "No phone linked"}
              </span>
              <p className="text-[10px] text-base-content/50 mt-0.5">
                Linked WhatsApp Identifier (cannot be changed)
              </p>
            </div>
          </div>
          <BsLockFill size={15} className="text-base-content/40 flex-shrink-0" />
        </div>

        {/* Save Button */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={isSavingProfile || !profileName.trim()}
            className="btn btn-sm btn-primary rounded-xl px-5"
          >
            {isSavingProfile ? (
              <span className="loading loading-spinner loading-xs" />
            ) : (
              "Save Profile Changes"
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProfileTabContent;
