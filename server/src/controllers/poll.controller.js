import Message from "../models/message.model.js";

export const createPoll = async (req, res) => {
  try {
    const senderId = req.user._id;
    const { question, options, allowMultipleAnswers, receiverId, groupId } =
      req.body;

    if (
      !question ||
      !options ||
      !Array.isArray(options) ||
      options.length < 2
    ) {
      return res
        .status(400)
        .json({ error: "Poll question and at least 2 options are required" });
    }

    const pollOptions = options
      .map((opt) => ({
        text: typeof opt === "string" ? opt.trim() : (opt?.text || "").trim(),
        votes: [],
      }))
      .filter((opt) => opt.text.length > 0);

    if (pollOptions.length < 2) {
      return res
        .status(400)
        .json({ error: "At least 2 non-empty options are required" });
    }

    const newMessage = new Message({
      senderId,
      receiverId: receiverId || null,
      groupId: groupId || null,
      mediaType: "poll",
      text: question,
      poll: {
        question,
        options: pollOptions,
        allowMultipleAnswers: Boolean(allowMultipleAnswers),
      },
      status: "sent",
    });

    await newMessage.save();
    const populated = await Message.findById(newMessage._id).populate(
      "senderId",
      "name avatar",
    );

    res.status(201).json(populated);
  } catch (error) {
    console.error("Error in createPoll:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const votePoll = async (req, res) => {
  try {
    const { id } = req.params;
    const { optionIndex } = req.body;
    const userId = req.user._id;

    const message = await Message.findById(id);
    if (!message || message.mediaType !== "poll" || !message.poll) {
      return res.status(404).json({ error: "Poll message not found" });
    }

    const optIdx = parseInt(optionIndex, 10);
    if (isNaN(optIdx) || optIdx < 0 || optIdx >= message.poll.options.length) {
      return res.status(400).json({ error: "Invalid option index" });
    }

    const option = message.poll.options[optIdx];
    const hasVotedThis = option.votes.some(
      (uid) => uid.toString() === userId.toString(),
    );

    if (!message.poll.allowMultipleAnswers) {
      // Single answer: clear user vote from all options first
      message.poll.options.forEach((opt) => {
        opt.votes = opt.votes.filter(
          (uid) => uid.toString() !== userId.toString(),
        );
      });
      if (!hasVotedThis) {
        option.votes.push(userId);
      }
    } else {
      // Multiple answers allowed: toggle vote for this option
      if (hasVotedThis) {
        option.votes = option.votes.filter(
          (uid) => uid.toString() !== userId.toString(),
        );
      } else {
        option.votes.push(userId);
      }
    }

    await message.save();
    const populated = await Message.findById(id).populate(
      "senderId",
      "name avatar",
    );
    res.status(200).json(populated);
  } catch (error) {
    console.error("Error in votePoll:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};
