import {
  BsSearch,
  BsXCircleFill,
  BsImage,
  BsCameraVideo,
  BsLink45Deg,
  BsFileEarmarkText,
  BsMicFill,
  BsBarChartFill,
} from "react-icons/bs";
import { searchInput } from "../../../constants/styles.js";

const FILTER_CHIPS = [
  { id: "all", label: "All" },
  { id: "unread", label: "Unread" },
  { id: "favorites", label: "Favorites" },
  { id: "groups", label: "Groups" },
];

const MEDIA_FILTER_CHIPS = [
  { id: "photos", label: "Photos", icon: BsImage },
  { id: "videos", label: "Videos", icon: BsCameraVideo },
  { id: "links", label: "Links", icon: BsLink45Deg },
  { id: "documents", label: "Docs", icon: BsFileEarmarkText },
  { id: "audio", label: "Audio", icon: BsMicFill },
  { id: "polls", label: "Polls", icon: BsBarChartFill },
];

const SidebarSearchBar = ({
  searchQuery,
  setSearchQuery,
  searchCategory,
  setSearchCategory,
  activeFilter,
  setActiveFilter,
  isSearchActive,
  setIsSearchActive,
  isGlobalSearchMode,
  onClearSearch,
}) => {
  return (
    <>
      {/* ── Search Bar ── */}
      <div className="p-3 border-b border-base-300">
        <div className="relative flex items-center">
          <BsSearch
            size={14}
            className="absolute left-3 text-base-content/40 pointer-events-none"
          />
          <input
            type="text"
            value={searchQuery}
            onFocus={() => setIsSearchActive(true)}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search or start new chat…"
            className={`${searchInput} pr-8`}
          />
          {(searchQuery || searchCategory !== "all") && (
            <button
              onClick={onClearSearch}
              className="absolute right-2.5 p-1 text-base-content/40 hover:text-base-content transition-colors"
              title="Clear search"
            >
              <BsXCircleFill size={14} />
            </button>
          )}
        </div>
      </div>

      {/* ── Filter Chips (Mobile / Web Style) ── */}
      {isGlobalSearchMode || isSearchActive ? (
        <div className="flex items-center gap-1.5 px-3 py-2 border-b border-base-300/60 overflow-x-auto scrollbar-none animate-fade-in">
          <button
            onClick={() => setSearchCategory("all")}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-all duration-200 flex-shrink-0 ${
              searchCategory === "all"
                ? "bg-primary text-primary-content shadow-sm"
                : "bg-base-200 text-base-content/70 hover:bg-base-300"
            }`}
          >
            All
          </button>
          {MEDIA_FILTER_CHIPS.map((chip) => {
            const Icon = chip.icon;
            const isSelected = searchCategory === chip.id;
            return (
              <button
                key={chip.id}
                onClick={() => setSearchCategory(isSelected ? "all" : chip.id)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-all duration-200 flex-shrink-0 flex items-center gap-1.5 ${
                  isSelected
                    ? "bg-primary text-primary-content shadow-sm"
                    : "bg-base-200 text-base-content/70 hover:bg-base-300"
                }`}
              >
                <Icon size={12} />
                {chip.label}
              </button>
            );
          })}
        </div>
      ) : (
        <div className="flex items-center gap-2 px-3 py-2 border-b border-base-300/60 overflow-x-auto scrollbar-none">
          {FILTER_CHIPS.map((chip) => (
            <button
              key={chip.id}
              onClick={() => setActiveFilter(chip.id)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all duration-200 flex-shrink-0 ${
                activeFilter === chip.id
                  ? "bg-primary text-primary-content shadow-sm"
                  : "bg-base-200 text-base-content/70 hover:bg-base-300"
              }`}
            >
              {chip.label}
            </button>
          ))}
        </div>
      )}
    </>
  );
};

export default SidebarSearchBar;
