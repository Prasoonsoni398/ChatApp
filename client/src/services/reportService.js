/**
 * reportService.js
 * API calls for reporting users, groups, channels, and messages (PRD Section 68).
 */

const BASE = "/api/reports";

const getToken = () => localStorage.getItem("token");

const authHeader = () => ({
  Authorization: `Bearer ${getToken()}`,
  "Content-Type": "application/json",
});

/**
 * Submit a moderation report.
 * @param {Object} reportData - { targetType, targetId, reason, details }
 * @returns {Promise<Object>}
 */
export async function createReport(reportData) {
  const res = await fetch(BASE, {
    method: "POST",
    headers: authHeader(),
    body: JSON.stringify(reportData),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to submit report");
  return data;
}
