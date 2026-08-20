import { io } from "socket.io-client"

const socketAPI = io(import.meta.env.VITE_BACKEND_URL)
export default socketAPI