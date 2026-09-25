import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";

import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Chat from "./pages/Chat";
import ForgotPassword from "./pages/ForgotPassword";
import JoinGroupPage from "./pages/JoinGroupPage";

const App = () => {
  return (
    <BrowserRouter>
      {/* Global Toaster for notifications */}
      <Toaster position="top-right" reverseOrder={false} />

      <Routes>
        <Route
          path="/"
          element={
            <>
              <Navbar />
              <Home />
            </>
          }
        />
        <Route
          path="/login"
          element={
            <>
              <Navbar />
              <Login />
            </>
          }
        />
        <Route
          path="/signup"
          element={
            <>
              <Navbar />
              <Register />
            </>
          }
        />
        <Route
          path="/forgot-password"
          element={
            <>
              <Navbar />
              <ForgotPassword />
            </>
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
