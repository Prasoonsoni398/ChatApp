import {
  BsX,
  BsShieldLockFill,
  BsPersonCircle,
  BsChatDotsFill,
  BsBellFill,
  BsPaletteFill,
  BsKeyFill,
  BsShieldCheck,
  BsHddNetworkFill,
  BsArrowLeft,
  BsGearFill,
} from "react-icons/bs";
import ImageCropView from "./ImageCropModal.jsx";
import { usePrivacySettings } from "../../hooks/usePrivacySettings.js";
import { settingCategories } from "./settings/settingCategories.jsx";

// Sub-components for Settings tabs
import SettingsMainList from "./settings/SettingsMainList.jsx";
import PrivacyTabContent from "./settings/PrivacyTabContent.jsx";
import NotificationsTabContent from "./settings/NotificationsTabContent.jsx";
import ThemeTabContent from "./settings/ThemeTabContent.jsx";
import StorageTabContent from "./settings/StorageTabContent.jsx";
import ChatsTabContent from "./settings/ChatsTabContent.jsx";
import ProfileTabContent from "./settings/ProfileTabContent.jsx";
import AccountTabContent from "./settings/AccountTabContent.jsx";
import SecurityTabContent from "./settings/SecurityTabContent.jsx";
import ClearChatsConfirmModal from "./settings/ClearChatsConfirmModal.jsx";
import DeleteAccountConfirmModal from "./settings/DeleteAccountConfirmModal.jsx";

/**
 * PrivacySettingsModal – WhatsApp-style Privacy, Notifications, Themes & Storage Settings
 */
const PrivacySettingsModal = ({
  isOpen,
  onClose,
  loggedInUser,
  onUserUpdated,
  onAllChatsCleared,
}) => {
  const {
    currentUser,
    selectedCategory,
    setSelectedCategory,
    activeTab,
    setActiveTab,
    settings,
    isSaving,
    blockedUsers,
    loadingBlocked,
    isClearingAll,
    showClearConfirm,
    setShowClearConfirm,
    profileName,
    setProfileName,
    profileAbout,
    setProfileAbout,
    profileAvatarPreview,
    setProfileAvatarFile,
    setProfileAvatarPreview,
    cropImageSrc,
    setCropImageSrc,
    isSavingProfile,
    handleAvatarChange,
    handleSaveProfile,
    soundEnabled,
    handleToggleSound,
    notificationSound,
    handleSelectNotificationSound,
    ringtoneSound,
    handleSelectRingtoneSound,
    reactionsAlerts,
    handleToggleReactionsAlerts,
    notifPermission,
    handleRequestPermission,
    notifsEnabled,
    handleToggleNotifications,
    appTheme,
    handleThemeChange,
    autoDownload,
    handleAutoDownloadChange,
    twoStepEnabled,
    showPinSetup,
    setShowPinSetup,
    tempPin,
    setTempPin,
    handleToggleTwoStep,
    handleSavePin,
    securityNotifs,
    handleToggleSecurityNotifs,
    storageData,
    isLoadingStorage,
    loadStorageData,
    isExportingData,
    handleExportAccountData,
    showDeleteAccountModal,
    setShowDeleteAccountModal,
    deleteConfirmText,
    setDeleteConfirmText,
    isDeletingAccount,
    handleDeleteAccount,
    handleUnblock,
    handleChange,
    handleSave,
    handleClearAllChats,
  } = usePrivacySettings({
    isOpen,
    loggedInUser,
    onUserUpdated,
    onAllChatsCleared,
    onClose,
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center sm:p-4 p-0 sm:bg-black/60 bg-base-100 sm:backdrop-blur-sm animate-fade-in">
      <div className="bg-base-100 sm:rounded-2xl rounded-none w-full max-w-lg shadow-2xl overflow-hidden sm:border border-base-300 flex flex-col h-full sm:max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-base-300 flex items-center justify-between bg-base-200/50">
          <div className="flex items-center gap-2.5">
            {selectedCategory ? (
              <button
                type="button"
                onClick={() => setSelectedCategory(null)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-base-content/70 hover:text-base-content hover:bg-base-200 transition-colors cursor-pointer mr-0.5"
                title="Back to all settings"
              >
                <BsArrowLeft size={18} />
              </button>
            ) : null}

            <div className="w-8 h-8 rounded-lg bg-primary/20 text-primary flex items-center justify-center flex-shrink-0">
              {!selectedCategory && <BsGearFill size={17} />}
              {selectedCategory === "profile" && <BsPersonCircle size={16} />}
              {selectedCategory === "privacy" && <BsShieldLockFill size={16} />}
              {selectedCategory === "security" && <BsKeyFill size={16} />}
              {selectedCategory === "notifications" && <BsBellFill size={16} />}
              {selectedCategory === "theme" && <BsPaletteFill size={16} />}
              {selectedCategory === "storage" && <BsHddNetworkFill size={16} />}
              {selectedCategory === "chats" && <BsChatDotsFill size={16} />}
              {selectedCategory === "account" && <BsShieldCheck size={16} />}
            </div>

            <h3 className="font-bold text-lg text-base-content">
              {selectedCategory === "profile"
                ? "Profile"
                : selectedCategory
                  ? settingCategories.find((c) => c.id === selectedCategory)
                      ?.title || "Settings"
                  : "Settings"}
            </h3>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-base-content/70 hover:text-base-content hover:bg-base-200 transition-colors cursor-pointer"
            title="Close"
          >
            <BsX size={22} />
          </button>
        </div>

        {/* Settings Body */}
        {selectedCategory === null ? (
          <SettingsMainList
            currentUser={currentUser}
            settingCategories={settingCategories}
            onSelectCategory={(catId) => {
              setSelectedCategory(catId);
              setActiveTab(catId);
            }}
          />
        ) : (
          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            {activeTab === "privacy" && (
              <PrivacyTabContent
                settings={settings}
                handleChange={handleChange}
                blockedUsers={blockedUsers}
                loadingBlocked={loadingBlocked}
                handleUnblock={handleUnblock}
              />
            )}

            {activeTab === "notifications" && (
              <NotificationsTabContent
                soundEnabled={soundEnabled}
                handleToggleSound={handleToggleSound}
                notificationSound={notificationSound}
                handleSelectNotificationSound={handleSelectNotificationSound}
                ringtoneSound={ringtoneSound}
                handleSelectRingtoneSound={handleSelectRingtoneSound}
                reactionsAlerts={reactionsAlerts}
                handleToggleReactionsAlerts={handleToggleReactionsAlerts}
                notifPermission={notifPermission}
                handleRequestPermission={handleRequestPermission}
                notifsEnabled={notifsEnabled}
                handleToggleNotifications={handleToggleNotifications}
              />
            )}

            {activeTab === "theme" && (
              <ThemeTabContent
                appTheme={appTheme}
                handleThemeChange={handleThemeChange}
              />
            )}

            {activeTab === "storage" && (
              <StorageTabContent
                storageData={storageData}
                isLoadingStorage={isLoadingStorage}
                loadStorageData={loadStorageData}
                autoDownload={autoDownload}
                handleAutoDownloadChange={handleAutoDownloadChange}
              />
            )}

            {activeTab === "chats" && (
              <ChatsTabContent
                onOpenClearConfirm={() => setShowClearConfirm(true)}
              />
            )}

            {activeTab === "profile" && (
              <ProfileTabContent
                profileAvatarPreview={profileAvatarPreview}
                currentUser={currentUser}
                profileName={profileName}
                handleAvatarChange={handleAvatarChange}
                handleSaveProfile={handleSaveProfile}
                setProfileName={setProfileName}
                profileAbout={profileAbout}
                setProfileAbout={setProfileAbout}
                isSavingProfile={isSavingProfile}
              />
            )}

            {activeTab === "account" && (
              <AccountTabContent
                securityNotifs={securityNotifs}
                handleToggleSecurityNotifs={handleToggleSecurityNotifs}
                handleExportAccountData={handleExportAccountData}
                isExportingData={isExportingData}
                onOpenDeleteAccountModal={() => {
                  setDeleteConfirmText("");
                  setShowDeleteAccountModal(true);
                }}
              />
            )}

            {activeTab === "security" && (
              <SecurityTabContent
                twoStepEnabled={twoStepEnabled}
                showPinSetup={showPinSetup}
                handleToggleTwoStep={handleToggleTwoStep}
                handleSavePin={handleSavePin}
                tempPin={tempPin}
                setTempPin={setTempPin}
                setShowPinSetup={setShowPinSetup}
                securityNotifs={securityNotifs}
                handleToggleSecurityNotifs={handleToggleSecurityNotifs}
              />
            )}
          </div>
        )}

        {/* Confirmation Modal for Clearing All Chats */}
        <ClearChatsConfirmModal
          isOpen={showClearConfirm}
          onClose={() => setShowClearConfirm(false)}
          onConfirm={handleClearAllChats}
          isClearingAll={isClearingAll}
        />

        {/* Confirmation Modal for Deleting Account Permanently */}
        <DeleteAccountConfirmModal
          isOpen={showDeleteAccountModal}
          onClose={() => {
            setShowDeleteAccountModal(false);
            setDeleteConfirmText("");
          }}
          deleteConfirmText={deleteConfirmText}
          setDeleteConfirmText={setDeleteConfirmText}
          handleDeleteAccount={handleDeleteAccount}
          isDeletingAccount={isDeletingAccount}
        />

        {/* Footer */}
        <div className="px-5 py-3 border-t border-base-300 flex justify-end items-center gap-2 bg-base-200/30">
          <button
            type="button"
            onClick={onClose}
            className="btn btn-sm btn-ghost rounded-xl"
          >
            {selectedCategory === "privacy" ? "Cancel" : "Close"}
          </button>
          {selectedCategory === "privacy" && (
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="btn btn-sm btn-primary rounded-xl px-5"
            >
              {isSaving ? (
                <span className="loading loading-spinner loading-xs"></span>
              ) : (
                "Save Changes"
              )}
            </button>
          )}
        </div>

        {/* Profile Picture Cropper Modal Overlay */}
        {cropImageSrc && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-base-100 w-full max-w-md rounded-2xl overflow-hidden shadow-2xl border border-base-300 animate-modal-pop">
              <ImageCropView
                imageSrc={cropImageSrc}
                onCropComplete={(croppedFile) => {
                  setProfileAvatarFile(croppedFile);
                  setProfileAvatarPreview(URL.createObjectURL(croppedFile));
                  setCropImageSrc(null);
                }}
                onCancel={() => setCropImageSrc(null)}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PrivacySettingsModal;
