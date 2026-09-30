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
  handleLogout,
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
    <div className="fixed inset-0 z-50 md:relative md:inset-auto md:z-auto w-full md:w-88 lg:w-96 flex-shrink-0 flex flex-col bg-base-100 border-r border-r-theme-soothing chat-sidebar-panel h-full overflow-hidden animate-slide-up md:animate-fade-in select-none">
      {/* Header — WhatsApp style with Back Arrow and Title */}
      <div className="h-16 px-4 border-b border-b-theme-soothing flex items-center justify-between bg-base-100 flex-shrink-0 z-10">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={
              selectedCategory ? () => setSelectedCategory(null) : onClose
            }
            className="w-9 h-9 rounded-full flex items-center justify-center text-base-content/70 hover:text-base-content hover:bg-base-200 transition-colors cursor-pointer"
            title={selectedCategory ? "Back to Settings" : "Back to Chats"}
          >
            <BsArrowLeft size={19} />
          </button>

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

          <h3 className="font-bold text-lg text-base-content tracking-wide">
            {selectedCategory === "profile"
              ? "Profile"
              : selectedCategory
                ? settingCategories.find((c) => c.id === selectedCategory)
                    ?.title || "Settings"
                : "Settings"}
          </h3>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-9 h-9 rounded-full flex items-center justify-center text-base-content/70 hover:text-base-content hover:bg-base-200 transition-colors cursor-pointer"
          title="Close Settings"
        >
          <BsX size={22} />
        </button>
      </div>

      {/* Settings Body */}
      {selectedCategory === null ? (
        <SettingsMainList
          currentUser={currentUser}
          settingCategories={settingCategories}
          handleLogout={() => {
            onClose?.();
            handleLogout?.();
          }}
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
              handleLogout={() => {
                onClose?.();
                handleLogout?.();
              }}
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

      {/* Footer (Only shown in Privacy category where Save Changes is required) */}
      {selectedCategory === "privacy" && (
        <div className="px-4 py-2.5 border-t border-base-300 flex justify-end items-center gap-2 bg-base-200/40 flex-shrink-0">
          <button
            type="button"
            onClick={() => setSelectedCategory(null)}
            className="btn btn-sm btn-ghost rounded-xl"
          >
            Cancel
          </button>
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
        </div>
      )}

      {/* Profile Picture Cropper Modal Overlay */}
      {cropImageSrc && (
        <ImageCropView
          imageSrc={cropImageSrc}
          title="Crop Profile Photo"
          cropShape="round"
          initialAspect="1:1"
          onCropComplete={(croppedFile) => {
            setProfileAvatarFile(croppedFile);
            setProfileAvatarPreview(URL.createObjectURL(croppedFile));
            setCropImageSrc(null);
          }}
          onCancel={() => setCropImageSrc(null)}
        />
      )}
    </div>
  );
};

export default PrivacySettingsModal;
