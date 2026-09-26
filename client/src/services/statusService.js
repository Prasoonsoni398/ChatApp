const BASE = "/api/status";

const getToken = () => localStorage.getItem("token");
const authHeader = () => ({ Authorization: `Bearer ${getToken()}` });

export const uploadStatus = async (formData) => {
  const res = await fetch(BASE, {
    method: "POST",
    headers: authHeader(),
    body: formData,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to upload status");
  return data;
};

export const uploadTextStatus = async ({ text, backgroundColor, fontFamily }) => {
  const res = await fetch(`${BASE}/text`, {
    method: "POST",
    headers: {
      ...authHeader(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ text, backgroundColor, fontFamily }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to create text status");
  return data;
};

export const markStatusViewed = async (statusId) => {
  try {
    const res = await fetch(`${BASE}/${statusId}/view`, {
      method: "POST",
      headers: authHeader(),
    });
    return await res.json();
  } catch (e) {
    console.error("Error marking status viewed:", e);
  }
};

export const getStatuses = async () => {
  const res = await fetch(BASE, {
    method: "GET",
    headers: authHeader(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to fetch statuses");
  return data;
};

export const deleteStatus = async (id) => {
  const res = await fetch(`${BASE}/${id}`, {
    method: "DELETE",
    headers: authHeader(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to delete status");
  return data;
};
