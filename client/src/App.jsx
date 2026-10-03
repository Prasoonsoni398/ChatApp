import { useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";

import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Chat from "./pages/Chat";
import ForgotPassword from "./pages/ForgotPassword";
import JoinGroupPage from "./pages/JoinGroupPage";
import MediaExpiryNoticeModal from "./components/common/MediaExpiryNoticeModal";
import DevicePermissionModal from "./components/common/DevicePermissionModal";
import BackendWakingBanner from "./components/common/BackendWakingBanner";
import { wakeUpBackend, startKeepAlivePing } from "./config/api";

const App = () => {
  useEffect(() => {
    wakeUpBackend();
    startKeepAlivePing();
  }, []);
  return (
    <BrowserRouter>
      {/* Global Device Permission & Cookie Consent Gate */}
      <DevicePermissionModal />
      {/* Global Cloud Server Cold-Start Notice Banner */}
      <BackendWakingBanner />
      {/* Global Toaster for notifications */}
      <Toaster position="top-right" reverseOrder={false} />
      {/* 48-Hour Media Deletion Informational Notice Modal */}
      <MediaExpiryNoticeModal />

      <Routes>
        <Route
          path="/"
          element={
            <div className="w-full h-full flex flex-col overflow-hidden">
              <Navbar />
              <Home />
            </div>
          }
        />
        <Route
          path="/login"
          element={
            <div className="w-full h-full flex flex-col overflow-hidden">
              <Navbar />
              <div className="flex-1 min-h-0 overflow-y-auto">
                <Login />
              </div>
            </div>
          }
        />
        <Route
          path="/signup"
          element={
            <div className="w-full h-full flex flex-col overflow-hidden">
              <Navbar />
              <div className="flex-1 min-h-0 overflow-y-auto">
                <Register />
              </div>
            </div>
          }
        />
        <Route
          path="/forgot-password"
          element={
            <div className="w-full h-full flex flex-col overflow-hidden">
              <Navbar />
              <div className="flex-1 min-h-0 overflow-y-auto">
                <ForgotPassword />
              </div>
            </div>
          }
        />
        {/* Chat page without the main Navbar to look like an app */}
        <Route path="/chat" element={<Chat />} />
        <Route path="/join/:inviteCode" element={<JoinGroupPage />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
