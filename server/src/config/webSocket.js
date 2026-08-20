import { Socket } from "socket.io";
// import Message from "../models/message.model";

const OnlineUsers = {}

const WebSocket = (io) => {

    console.log("Socket connection Established")
    io.on("connection", (socket) => {

        // Emit by Frontend when connected and remove when disconnected
        socket.on("createPath", (userId) => {
            OnlineUsers[userId] = socket.id
            console.log("Online User:", OnlineUsers);
            io.emit("onlineUsers", OnlineUsers)
        })
        
        // Emit by Frontend for typing and passing receiver id
        socket.on("typing", (data) => { 
            const receiverSocketId = OnlineUsers[data.receiverId];
            if(receiverSocketId){
                io.to(receiverSocketId).emit("typing", data.userId)
            }
        })
        
        // Emit by Frontend when disconnected and remove when disconnected
        socket.on("destroyPath", (userId) => {
            delete OnlineUsers[userId]
            console.log("Online User:", OnlineUsers);
            io.emit("onlineUsers", OnlineUsers)
        })

        socket.on("send",async(payload)=>{
            console.log("Message Pack",payload);
            const receiverSocketId = OnlineUsers[payload.receiverId];
            if(receiverSocketId){
                io.to(receiverSocketId).emit("receive", payload)
            }else{
                console.log("User is not online");
            }

        })
    })
}

export default WebSocket;