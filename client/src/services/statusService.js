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

/**
 * Upload media status with XMLHttpRequest for real progress tracking (PRD Section 9 & 14)
 */
export const uploadStatusWithProgress = (formData, onProgress) => {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", BASE);

    const token = getToken();
    if (token) {
      xhr.setRequestHeader("Authorization", `Bearer ${token}`);
    }

    if (xhr.upload && onProgress) {
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percent = Math.round((event.loaded / event.total) * 100);
          onProgress(percent);
        }
      };
    }

    xhr.onload = () => {
      try {
        const data = JSON.parse(xhr.responseText);
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(data);
        } else {
          reject(new Error(data.error || "Failed to upload status"));
        }
      } catch (_e) {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve({});
        } else {
          reject(new Error("Failed to upload status"));
        }
      }
    };

    xhr.onerror = () => {
      reject(new Error("Network connection error. Upload failed."));
    };

    xhr.send(formData);
  });
};

export const uploadTextStatus = async ({
  text,
  backgroundColor,
  textColor,
  bgPattern,
  fontFamily,
  song,
  privacy,
}) => {
  const res = await fetch(`${BASE}/text`, {
    method: "POST",
    headers: {
      ...authHeader(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      text,
      backgroundColor,
      textColor,
      bgPattern,
      fontFamily,
      song,
      privacy,
    }),
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
