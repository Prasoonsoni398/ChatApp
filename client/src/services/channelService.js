const BASE = "/api/channels";

const getToken = () => localStorage.getItem("token");
const authHeader = () => ({ Authorization: `Bearer ${getToken()}` });

export async function getChannels(search = "") {
  const url = search ? `${BASE}?search=${encodeURIComponent(search)}` : BASE;
  const res = await fetch(url, { headers: authHeader() });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to fetch channels");
  return data;
}

export async function getChannelById(channelId) {
  const res = await fetch(`${BASE}/${channelId}`, { headers: authHeader() });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to fetch channel");
  return data;
}

export async function createChannel(channelData) {
  const isFormData =
    typeof FormData !== "undefined" && channelData instanceof FormData;
  const headers = authHeader();
  if (!isFormData) {
    headers["Content-Type"] = "application/json";
  }
  const res = await fetch(BASE, {
    method: "POST",
    headers,
    body: isFormData ? channelData : JSON.stringify(channelData),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to create channel");
  return data;
}

export async function toggleFollowChannel(channelId) {
  const res = await fetch(`${BASE}/${channelId}/follow`, {
    method: "PATCH",
    headers: authHeader(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to toggle follow");
  return data;
}

export async function postToChannel(channelId, postData) {
  const isFormData =
    typeof FormData !== "undefined" && postData instanceof FormData;
  const headers = authHeader();
  if (!isFormData) {
    headers["Content-Type"] = "application/json";
  }
  const res = await fetch(`${BASE}/${channelId}/posts`, {
    method: "POST",
    headers,
    body: isFormData ? postData : JSON.stringify(postData),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to post to channel");
  return data;
}

export async function reactToChannelPost(channelId, postId, emoji) {
  const res = await fetch(`${BASE}/${channelId}/posts/${postId}/react`, {
    method: "POST",
    headers: { ...authHeader(), "Content-Type": "application/json" },
    body: JSON.stringify({ emoji }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to react to post");
  return data;
}

export async function deleteChannelPost(channelId, postId) {
  const res = await fetch(`${BASE}/${channelId}/posts/${postId}`, {
    method: "DELETE",
    headers: authHeader(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to delete post");
  return data;
}

export async function deleteChannel(channelId) {
  const res = await fetch(`${BASE}/${channelId}`, {
    method: "DELETE",
    headers: authHeader(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to delete channel");
  return data;
}

export async function toggleMuteChannel(channelId) {
  const res = await fetch(`${BASE}/${channelId}/mute`, {
    method: "PATCH",
    headers: authHeader(),
  }).catch(() => null);
  if (!res || !res.ok) return { isMuted: false };
  return res.json();
}

// Aliases for compatibility
export const createChannelPost = postToChannel;
export const reactChannelPost = reactToChannelPost;
