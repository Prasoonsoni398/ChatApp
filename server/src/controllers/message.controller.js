import Message from "../models/message.model.js";
import User from "../models/user.model.js";
import cloudinary from "../config/cloudinary.js";

// Re-export modular controllers for full backward compatibility
export * from "./poll.controller.js";
export * from "./event.controller.js";
export * from "./messageAction.controller.js";

export const getMessages = async (req, res) => {
  try {
    const { id: userToChatId } = req.params;
    const myId = req.user._id;

    const messages = await Message.find({
      $or: [
        { senderId: myId, receiverId: userToChatId },
        { senderId: userToChatId, receiverId: myId },
      ],
      deletedFor: { $ne: myId },
    }).sort({ createdAt: 1 });

    res.status(200).json(messages);
  } catch (error) {
    console.error("Error in getMessages:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const sendMessage = async (req, res) => {
  try {
    const {
      text,
      replyToId,
      replyToText,
      replyToSender,
      isVoice,
      duration,
      isForwarded,
      isViewOnce,
    } = req.body;
    const { id: receiverId } = req.params;
    const senderId = req.user._id;

    // Check if receiver blocked sender or sender blocked receiver
    const receiverUser = await User.findById(receiverId);
    if (
      receiverUser?.blockedUsers?.some(
        (b) => b.toString() === senderId.toString(),
      )
    ) {
      return res
        .status(403)
        .json({ error: "You cannot send messages to this contact (blocked)" });
    }

    const isViewOnceFlag = isViewOnce === "true" || isViewOnce === true;

    if (req.file) {
      const mimetype = req.file.mimetype || "";
      let mediaType = "document";

      if (isVoice === "true" || isVoice === true) {
        mediaType = "voice";
      } else if (mimetype.startsWith("image/")) {
        mediaType = "image";
      } else if (mimetype.startsWith("video/")) {
        mediaType = "video";
      } else if (mimetype.startsWith("audio/")) {
        mediaType = "audio";
      }

      if (
        (mediaType === "audio" ||
          mediaType === "video" ||
          mediaType === "voice") &&
        req.file.size > 5 * 1024 * 1024
      ) {
        return res.status(400).json({
          error: "Audio and video uploads are restricted to a maximum of 5MB.",
        });
      }

      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: "chatapp_messages",
          resource_type: "auto",
        },
        async (error, result) => {
          if (error) {
            console.error("Cloudinary upload error:", error);
            return res.status(500).json({ error: "Media upload failed" });
          }

          const newMessage = new Message({
            senderId,
            receiverId,
            text: text || "",
            image: result.secure_url,
            mediaType,
            mediaUrl: result.secure_url,
            fileName: req.file.originalname || "attachment",
            fileSize: req.file.size || 0,
            duration: Number(duration) || 0,
            isForwarded: Boolean(isForwarded),
            isViewOnce: isViewOnceFlag,
            replyTo: replyToId || null,
            replyToText: replyToText || null,
            replyToSender: replyToSender || null,
          });

          await newMessage.save();
          return res.status(201).json(newMessage);
        },
      );
      uploadStream.end(req.file.buffer);
      return;
    }

    let parsedLocation = null;
    if (req.body.location) {
      try {
        parsedLocation =
          typeof req.body.location === "string"
            ? JSON.parse(req.body.location)
            : req.body.location;
      } catch (_e) {
        parsedLocation = null;
      }
    }
    let parsedContact = null;
    if (req.body.contactCard) {
      try {
        parsedContact =
          typeof req.body.contactCard === "string"
            ? JSON.parse(req.body.contactCard)
            : req.body.contactCard;
      } catch (_e) {
        parsedContact = null;
      }
    }

    let resolvedMediaType = "text";
    if (req.body.mediaType === "location" || parsedLocation)
      resolvedMediaType = "location";
    else if (req.body.mediaType === "contact" || parsedContact)
      resolvedMediaType = "contact";

    const newMessage = new Message({
      senderId,
      receiverId,
      text: text || "",
      mediaType: resolvedMediaType,
      location: parsedLocation || undefined,
      contactCard: parsedContact || undefined,
      isForwarded: Boolean(isForwarded),
      isViewOnce: isViewOnceFlag,
      replyTo: replyToId || null,
      replyToText: replyToText || null,
      replyToSender: replyToSender || null,
    });

    await newMessage.save();
    res.status(201).json(newMessage);
  } catch (error) {
    console.error("Error in sendMessage:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};
