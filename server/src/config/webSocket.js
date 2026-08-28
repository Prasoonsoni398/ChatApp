import { Socket } from "socket.io";
import Group from "../models/group.model.js";

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
                io.to(receiverSocketId).emit("typing", data)
            }
        })
        
        // Emit by Frontend when disconnected and remove when disconnected
        socket.on("destroyPath", (userId) => {
            delete OnlineUsers[userId]
            console.log("Online User:", OnlineUsers);
            io.emit("onlineUsers", OnlineUsers)
        })

        socket.on("send", async (payload) => {
            console.log("Message Pack", payload);
            if (payload.groupId) {
                // It's a group message, send to all members
                const group = await Group.findById(payload.groupId);
                if (group) {
                    group.members.forEach(memberId => {
                        // don't send back to the sender
                        if (memberId.toString() !== payload.senderId?.toString() && memberId.toString() !== payload.senderId?._id?.toString()) {
                            const receiverSocketId = OnlineUsers[memberId];
                            if (receiverSocketId) io.to(receiverSocketId).emit("receive", payload);
                        }
                    });
                }
            } else {
                // Direct message
                const receiverSocketId = OnlineUsers[payload.receiverId];
                if (receiverSocketId) {
                    io.to(receiverSocketId).emit("receive", payload);
                } else {
                    console.log("User is not online");
                }
            }
        });

        socket.on("deleteMessage", async (payload) => {
            console.log("Delete Pack", payload);
            if (payload.groupId) {
                const group = await Group.findById(payload.groupId);
                if (group) {
                    group.members.forEach(memberId => {
                        const receiverSocketId = OnlineUsers[memberId];
                        if (receiverSocketId) io.to(receiverSocketId).emit("deleteMessage", payload);
                    });
                }
            } else {
                const receiverSocketId = OnlineUsers[payload.receiverId];
                if (receiverSocketId) {
                    io.to(receiverSocketId).emit("deleteMessage", payload);
                }
            }
        });

        // Built-in socket disconnect
        socket.on("disconnect", () => {
            const userId = Object.keys(OnlineUsers).find(key => OnlineUsers[key] === socket.id);
            if (userId) {
                delete OnlineUsers[userId];
                console.log("Online User (after disconnect):", OnlineUsers);
                io.emit("onlineUsers", OnlineUsers);
            }
        });
    })
}

export default WebSocket;