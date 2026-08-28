import { Socket } from "socket.io";
import Group from "../models/group.model.js";
import Message from "../models/message.model.js";

const OnlineUsers = {}

const WebSocket = (io) => {

    console.log("Socket connection Established")
    io.on("connection", (socket) => {

        // Emit by Frontend when connected and remove when disconnected
        socket.on("createPath", async (userId) => {
            OnlineUsers[userId] = socket.id
            console.log("Online User:", OnlineUsers);
            io.emit("onlineUsers", OnlineUsers)

            // Mark all pending messages as delivered
            try {
                const pendingMessages = await Message.find({ receiverId: userId, status: "sent" });
                if (pendingMessages.length > 0) {
                    await Message.updateMany({ receiverId: userId, status: "sent" }, { status: "delivered" });
                    // Notify senders
                    pendingMessages.forEach(msg => {
                        const senderSocketId = OnlineUsers[msg.senderId];
                        if (senderSocketId) {
                            io.to(senderSocketId).emit("messageStatus", { messageId: msg._id, status: "delivered" });
                        }
                    });
                }
            } catch (err) {
                console.error("Error marking pending messages as delivered:", err);
            }
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
                    // Mark as delivered since the user is online
                    try {
                        await Message.findByIdAndUpdate(payload._id, { status: "delivered" });
                        socket.emit("messageStatus", { messageId: payload._id, status: "delivered" });
                    } catch (err) {
                        console.error("Error setting delivered status:", err);
                    }
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

        socket.on("messageStatus", async (payload) => {
            // payload: { messageId, status: 'delivered' | 'read', senderId, receiverId }
            console.log("Message Status Update", payload);
            try {
                await Message.findByIdAndUpdate(payload.messageId, { status: payload.status });
                // Notify the sender that their message was delivered/read
                const senderSocketId = OnlineUsers[payload.senderId];
                if (senderSocketId) {
                    io.to(senderSocketId).emit("messageStatus", payload);
                }
            } catch (error) {
                console.error("Error updating message status:", error);
            }
        });

        socket.on("newGroup", (group) => {
            console.log("New Group Created", group);
            if (group && group.members) {
                group.members.forEach(member => {
                    const memberId = member._id || member;
                    const receiverSocketId = OnlineUsers[memberId];
                    if (receiverSocketId) io.to(receiverSocketId).emit("newGroup", group);
                });
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