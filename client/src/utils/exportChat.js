/**
 * exportChat.js
 * Exports conversation history to a standard WhatsApp-formatted .txt file (PRD Section 73).
 * Format: [DD/MM/YYYY, HH:MM:SS] Sender: Message
 */

export function exportChatToTxt(chat, messages = [], loggedInUser = null) {
  if (!chat) return;

  const chatName = chat.name || "Chat";
  const header = `GuftguChat History with ${chatName}\nExported on: ${new Date().toLocaleString()}\n--------------------------------------------------\n\n`;

  const lines = messages.map((msg) => {
    const date = new Date(msg.createdAt || Date.now());
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const seconds = String(date.getSeconds()).padStart(2, "0");

    const timeStr = `[${day}/${month}/${year}, ${hours}:${minutes}:${seconds}]`;

    // Sender name
    let senderName = "Unknown";
    const senderId =
      typeof msg.senderId === "object" ? msg.senderId?._id : msg.senderId;
    if (
      senderId &&
      loggedInUser &&
      String(senderId) === String(loggedInUser._id)
    ) {
      senderName = loggedInUser.name || "You";
    } else if (typeof msg.senderId === "object" && msg.senderId?.name) {
      senderName = msg.senderId.name;
    } else if (chat.name && !chat.isGroup) {
      senderName = chat.name;
    }

    // Format content based on mediaType
    let body = msg.text || "";

    if (msg.isViewOnce) {
      body = body
        ? `[View Once Photo/Video: ${body}]`
        : `[View Once Photo/Video - Opened]`;
    } else if (msg.mediaType === "image" && msg.mediaUrl) {
      body = body
        ? `<Photo: ${msg.mediaUrl}> - ${body}`
        : `<Photo: ${msg.mediaUrl}>`;
    } else if (msg.mediaType === "video" && msg.mediaUrl) {
      body = body
        ? `<Video: ${msg.mediaUrl}> - ${body}`
        : `<Video: ${msg.mediaUrl}>`;
    } else if (
      (msg.mediaType === "voice" || msg.mediaType === "audio") &&
      msg.mediaUrl
    ) {
      body = `<Voice note: ${msg.mediaUrl}${msg.duration ? ` (${msg.duration}s)` : ""}>`;
    } else if (msg.mediaType === "document" && msg.mediaUrl) {
      body = `<Document: ${msg.fileName || "File"} (${msg.mediaUrl})>`;
    } else if (msg.mediaType === "location" && msg.location) {
      body = `<Location: ${msg.location.name || "Shared Location"} (${msg.location.latitude}, ${msg.location.longitude})>`;
    } else if (msg.mediaType === "contact" && msg.contactCard) {
      body = `<Contact Card: ${msg.contactCard.name || "Contact"} - ${msg.contactCard.phone || ""}>`;
    } else if (msg.mediaType === "poll" && msg.poll) {
      const opts = (msg.poll.options || [])
        .map((o) => `"${o.text}" (${o.votes?.length || 0} votes)`)
        .join(", ");
      body = `<Poll: ${msg.poll.question} [${opts}]>`;
    }

    return `${timeStr} ${senderName}: ${body}`;
  });

  const fullContent = header + lines.join("\n");
  const blob = new Blob([fullContent], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  const safeName = chatName.replace(/[/\\?%*:|"<>]/g, "-");
  a.download = `GuftguChat with ${safeName}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
