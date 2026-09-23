import { useState, useEffect } from "react";
import socketAPI from "../config/webSocket.js";

/**
 * Subscribes to the Socket.IO `onlineUsers` event and maintains a map of
 * userId → boolean indicating which users are currently online.
 *
 * @returns {{ onlineUsersMap: Record<string, boolean> }}
 */
function useOnlineStatus() {
  const [onlineUsersMap, setOnlineUsersMap] = useState({});

  useEffect(() => {
    socketAPI.on("onlineUsers", setOnlineUsersMap);
    return () => {
      socketAPI.off("onlineUsers", setOnlineUsersMap);
    };
  }, []);

  return { onlineUsersMap };
}

export default useOnlineStatus;
