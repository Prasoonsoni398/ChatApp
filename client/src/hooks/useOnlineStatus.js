import { useState, useEffect, useMemo } from "react";
import socketAPI from "../config/webSocket.js";

/**
 * Subscribes to Socket.IO `onlineUsers` and `busyUsers` events
 *
 * @returns {{ onlineUsersMap: Record<string, boolean>, busyUsersSet: Set<string> }}
 */
function useOnlineStatus() {
  const [onlineUsersMap, setOnlineUsersMap] = useState({});
  const [busyUsersList, setBusyUsersList] = useState([]);

  useEffect(() => {
    socketAPI.on("onlineUsers", setOnlineUsersMap);
    socketAPI.on("busyUsers", (list) => {
      setBusyUsersList(Array.isArray(list) ? list : []);
    });
    return () => {
      socketAPI.off("onlineUsers", setOnlineUsersMap);
      socketAPI.off("busyUsers");
    };
  }, []);

  const busyUsersSet = useMemo(
    () => new Set(busyUsersList.map(String)),
    [busyUsersList],
  );

  return { onlineUsersMap, setOnlineUsersMap, busyUsersSet };
}

export default useOnlineStatus;
