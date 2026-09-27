import React from "react";
import { BsChevronRight } from "react-icons/bs";

const SettingsMainList = ({
  currentUser,
  settingCategories,
  onSelectCategory,
}) => {
  return (
    <div className="flex-1 overflow-y-auto no-scrollbar px-3 py-2 flex flex-col justify-between">
      <div className="space-y-1.5">
        {/* User Profile Card */}
        {currentUser && (
          <div
            onClick={() => onSelectCategory("profile")}
            className="p-3 rounded-2xl bg-base-200/50 hover:bg-base-200 border border-base-300 flex items-center justify-between cursor-pointer transition-all group"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-primary/20 group-hover:border-primary transition-all flex-shrink-0">
                <img
                  src={
                    currentUser.avatar ||
                    `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser.name}`
                  }
                  alt={currentUser.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="min-w-0">
                <h4 className="font-bold text-sm text-base-content truncate group-hover:text-primary transition-colors">
                  {currentUser.name}
                </h4>
                <p className="text-xs text-base-content/60 truncate">
                  {currentUser.about || "Hey there! I am using ChatApp."}
                </p>
                {currentUser.phone && (
                  <p className="text-[10px] font-mono text-base-content/50 truncate">
                    {currentUser.phone}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              <BsChevronRight
                size={14}
                className="text-base-content/40 group-hover:text-primary group-hover:translate-x-0.5 transition-all"
              />
            </div>
          </div>
        )}

        {/* List of Settings Types */}
        <div className="space-y-2">
          <p className="text-[11px] font-bold text-base-content/50 uppercase tracking-wider px-1 pt-0.5">
            Categories
          </p>
          {settingCategories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => onSelectCategory(cat.id)}
              className="w-full flex items-center justify-between py-3 px-2 rounded-xl hover:bg-base-200/80 active:scale-[0.99] transition-all text-left group border border-base-300/20 hover:border-base-300/40"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 text-sm ${cat.color}`}
                >
                  {cat.icon}
                </div>
                <div className="min-w-0">
                  <span className="font-semibold text-xs sm:text-sm text-base-content block group-hover:text-primary transition-colors leading-tight">
                    {cat.title}
                  </span>
                  <span className="text-[11px] text-base-content/60 block truncate leading-tight mt-0.5">
                    {cat.subtitle}
                  </span>
                </div>
              </div>
              <BsChevronRight
                size={13}
                className="text-base-content/40 group-hover:text-primary group-hover:translate-x-0.5 transition-all flex-shrink-0 ml-1.5"
              />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SettingsMainList;
