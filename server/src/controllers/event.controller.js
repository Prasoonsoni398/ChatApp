import Message from "../models/message.model.js";

/* ── Group Event (PRD Section 47) ── */
export const createEvent = async (req, res) => {
  try {
    const senderId = req.user._id;
    const { title, startDate, startTime, location, description, groupId, receiverId } = req.body;

    if (!title || !startDate) {
      return res.status(400).json({ error: "Event title and date are required" });
    }

    const newMessage = new Message({
      senderId,
      groupId: groupId || null,
      receiverId: receiverId || null,
      mediaType: "event",
      text: title,
      event: {
        title,
        startDate,
        startTime: startTime || "",
        location: location || "",
        description: description || "",
        responses: [{ userId: senderId, status: "going" }],
      },
      status: "sent",
    });

    await newMessage.save();
    const populated = await Message.findById(newMessage._id).populate("senderId", "name avatar");
    res.status(201).json(populated);
  } catch (error) {
    console.error("Error in createEvent:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const respondEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const userId = req.user._id;

    if (!["going", "maybe", "not_going"].includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }

    const message = await Message.findById(id);
    if (!message || message.mediaType !== "event" || !message.event) {
      return res.status(404).json({ error: "Event not found" });
    }

    const existingIdx = message.event.responses.findIndex(
      (r) => r.userId.toString() === userId.toString()
    );

    if (existingIdx !== -1) {
      message.event.responses[existingIdx].status = status;
    } else {
      message.event.responses.push({ userId, status });
    }

    await message.save();
    const populated = await Message.findById(id).populate("senderId", "name avatar");
    res.status(200).json(populated);
  } catch (error) {
    console.error("Error in respondEvent:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};
