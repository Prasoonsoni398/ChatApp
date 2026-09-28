/**
 * reportService.js
 * API calls for reporting users, groups, channels, and messages (PRD Section 68).
 */

import { API_BASE_URL, authHeader } from "../config/api.js";

const BASE = `${API_BASE_URL}/reports`;

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
