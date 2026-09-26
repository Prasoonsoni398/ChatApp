import React from "react";
import {
  BsDownload,
  BsImageFill,
  BsCameraVideoFill,
  BsMicFill,
  BsFileEarmarkTextFill,
} from "react-icons/bs";
import ToggleSwitch from "../../common/ToggleSwitch.jsx";

const StorageTabContent = ({
  storageData,
  isLoadingStorage,
  loadStorageData,
  autoDownload,
  handleAutoDownloadChange,
}) => {
  return (
    <div className="space-y-5 animate-fadeIn">
      {/* Storage Overview */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-xs font-semibold text-primary uppercase tracking-wider">
            Storage Usage
          </h4>
          <button
            type="button"
            onClick={loadStorageData}
            disabled={isLoadingStorage}
            className="btn btn-ghost btn-xs text-xs text-primary"
          >
            {isLoadingStorage ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        <div className="p-4 rounded-2xl bg-base-200/50 border border-base-300 space-y-3">
          <div className="flex items-baseline justify-between">
            <div>
              <span className="text-2xl font-black text-base-content">
                {storageData ? storageData.totalFormatted : "0 B"}
              </span>
              <span className="text-xs text-base-content/60 ml-2">
                used by ChatApp Media
              </span>
            </div>
            <span className="text-xs font-medium text-base-content/60">
              {storageData?.totalItems || 0} media items
            </span>
          </div>

          {/* Progress bar visual */}
          <div className="w-full bg-base-300 h-2.5 rounded-full overflow-hidden flex">
            <div
              className="bg-success h-full"
              style={{
                width: `${
                  storageData?.totalBytes
                    ? Math.min(
                        100,
                        Math.round(
                          ((storageData?.breakdown?.photos?.bytes || 0) /
                            storageData.totalBytes) *
                            100,
                        ),
                      )
                    : 0
                }%`,
              }}
              title="Photos"
            />
            <div
              className="bg-info h-full"
              style={{
                width: `${
                  storageData?.totalBytes
                    ? Math.min(
                        100,
                        Math.round(
                          ((storageData?.breakdown?.videos?.bytes || 0) /
                            storageData.totalBytes) *
                            100,
                        ),
                      )
                    : 0
                }%`,
              }}
              title="Videos"
            />
            <div
              className="bg-secondary h-full"
              style={{
                width: `${
                  storageData?.totalBytes
                    ? Math.min(
                        100,
                        Math.round(
                          ((storageData?.breakdown?.audio?.bytes || 0) /
                            storageData.totalBytes) *
                            100,
                        ),
                      )
                    : 0
                }%`,
              }}
              title="Audio"
            />
            <div
              className="bg-warning h-full"
              style={{
                width: `${
                  storageData?.totalBytes
                    ? Math.min(
                        100,
                        Math.round(
                          ((storageData?.breakdown?.documents?.bytes || 0) /
                            storageData.totalBytes) *
                            100,
                        ),
                      )
                    : 0
                }%`,
              }}
              title="Documents"
            />
          </div>

          {/* Breakdown chips */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
            <div className="p-2 rounded-xl bg-base-100 border border-base-300/80 flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-success flex-shrink-0" />
              <div className="min-w-0">
                <span className="text-[11px] font-bold block truncate">
                  Photos
                </span>
                <span className="text-[10px] text-base-content/60">
                  {storageData?.breakdown?.photos?.formatted || "0 B"}
                </span>
              </div>
            </div>
            <div className="p-2 rounded-xl bg-base-100 border border-base-300/80 flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-info flex-shrink-0" />
              <div className="min-w-0">
                <span className="text-[11px] font-bold block truncate">
                  Videos
                </span>
                <span className="text-[10px] text-base-content/60">
                  {storageData?.breakdown?.videos?.formatted || "0 B"}
                </span>
              </div>
            </div>
            <div className="p-2 rounded-xl bg-base-100 border border-base-300/80 flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-secondary flex-shrink-0" />
              <div className="min-w-0">
                <span className="text-[11px] font-bold block truncate">
                  Audio
                </span>
                <span className="text-[10px] text-base-content/60">
                  {storageData?.breakdown?.audio?.formatted || "0 B"}
                </span>
              </div>
            </div>
            <div className="p-2 rounded-xl bg-base-100 border border-base-300/80 flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-warning flex-shrink-0" />
              <div className="min-w-0">
                <span className="text-[11px] font-bold block truncate">
                  Documents
                </span>
                <span className="text-[10px] text-base-content/60">
                  {storageData?.breakdown?.documents?.formatted || "0 B"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Large Files Review (> 100 KB) */}
      <div>
        <h4 className="text-xs font-semibold text-primary uppercase tracking-wider mb-2">
          Review & Clean Up Items
        </h4>
        <div className="p-3 rounded-2xl bg-base-200/50 border border-base-300">
          {isLoadingStorage ? (
            <div className="py-6 flex items-center justify-center text-xs text-base-content/60">
              <span className="loading loading-spinner loading-xs mr-2" />
              Calculating storage breakdown...
            </div>
          ) : !storageData?.largeFiles ||
            storageData.largeFiles.length === 0 ? (
            <p className="text-xs text-base-content/60 py-2 text-center">
              No large media files currently stored.
            </p>
          ) : (
            <div className="max-h-48 overflow-y-auto divide-y divide-base-300">
              {storageData.largeFiles.map((file, idx) => (
                <div
                  key={file.id || idx}
                  className="py-2 flex items-center justify-between text-xs gap-3"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-base-300 flex items-center justify-center flex-shrink-0 text-base-content/70">
                      {file.type === "image" && <BsImageFill size={14} />}
                      {file.type === "video" && <BsCameraVideoFill size={14} />}
                      {file.type === "audio" && <BsMicFill size={14} />}
                      {file.type === "document" && (
                        <BsFileEarmarkTextFill size={14} />
                      )}
                    </div>
                    <div className="min-w-0">
                      <span className="font-semibold block truncate text-base-content">
                        {file.fileName}
                      </span>
                      <span className="text-[10px] text-base-content/50">
                        {file.createdAt
                          ? new Date(file.createdAt).toLocaleDateString()
                          : ""}{" "}
                        • {file.type}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="font-mono text-[11px] font-semibold text-primary">
                      {file.sizeFormatted}
                    </span>
                    {file.url && (
                      <a
                        href={file.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-7 h-7 rounded-full flex items-center justify-center text-base-content/70 hover:text-primary hover:bg-base-200 transition-colors cursor-pointer"
                        title="Open file"
                      >
                        <BsDownload size={12} />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Media Auto-Download Preferences */}
      <div>
        <h4 className="text-xs font-semibold text-primary uppercase tracking-wider mb-2">
          Media Auto-Download
        </h4>
        <div className="p-3.5 rounded-2xl bg-base-200/50 border border-base-300 divide-y divide-base-300/60">
          {[
            { key: "photos", label: "Photos" },
            { key: "audio", label: "Audio & Voice Notes" },
            { key: "videos", label: "Videos" },
            { key: "docs", label: "Documents & Files" },
          ].map((item) => (
            <div
              key={item.key}
              className="flex items-center justify-between py-2.5 first:pt-1 last:pb-1 text-xs"
            >
              <span className="text-sm font-medium text-base-content/90">
                {item.label}
              </span>
              <ToggleSwitch
                checked={Boolean(autoDownload[item.key])}
                onChange={(val) => handleAutoDownloadChange(item.key, val)}
                size="sm"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StorageTabContent;
