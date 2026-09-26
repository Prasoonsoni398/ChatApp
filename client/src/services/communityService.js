const BASE = "/api/communities";

const getToken = () => localStorage.getItem("token");
const authHeader = () => ({ Authorization: `Bearer ${getToken()}` });

export async function getCommunities() {
  const res = await fetch(BASE, { headers: authHeader() });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to fetch communities");
  return data;
}

export async function getCommunityById(communityId) {
  const res = await fetch(`${BASE}/${communityId}`, { headers: authHeader() });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to fetch community");
  return data;
}

export async function createCommunity(communityData) {
  const res = await fetch(BASE, {
    method: "POST",
    headers: { ...authHeader(), "Content-Type": "application/json" },
    body: JSON.stringify(communityData),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to create community");
  return data;
}

export async function addGroupsToCommunity(communityId, groupIds) {
  const res = await fetch(`${BASE}/${communityId}/groups`, {
    method: "POST",
    headers: { ...authHeader(), "Content-Type": "application/json" },
    body: JSON.stringify({ groupIds }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to add groups");
  return data;
}

export async function removeGroupFromCommunity(communityId, groupId) {
  const res = await fetch(`${BASE}/${communityId}/groups/${groupId}`, {
    method: "DELETE",
    headers: authHeader(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to remove group");
  return data;
}

export async function deleteCommunity(communityId) {
  const res = await fetch(`${BASE}/${communityId}`, {
    method: "DELETE",
    headers: authHeader(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to delete community");
  return data;
}
