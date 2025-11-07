// src/api/tasks.js
const BASE = import.meta.env.VITE_BACKEND_URL || "http://localhost:5001/tasks";

function getAuthHeader(token) {
  return { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
}

async function handleRes(res) {
  const text = await res.text();
  try { return JSON.parse(text); } catch { return text; }
}

export async function createTask(payload, token) {
  const res = await fetch(`${BASE}/create`, {
    method: "POST",
    headers: getAuthHeader(token),
    body: JSON.stringify(payload),
  });
  return handleRes(res);
}

export async function listTasks({ page=1, limit=20, q, status, priority, dateFilter, createdBy, assignee } = {}, token) {
  const params = new URLSearchParams();
  params.set("page", page);
  params.set("limit", limit);
  if (q) params.set("q", q);
  if (status) params.set("status", status);
  if (priority) params.set("priority", priority);
  if (dateFilter) params.set("dateFilter", dateFilter);
  if (createdBy) params.set("createdBy", createdBy);
  if (assignee) params.set("assignee", assignee);

  const res = await fetch(`${BASE}/list?${params.toString()}`, {
    method: "GET",
    headers: getAuthHeader(token),
  });
  return handleRes(res);
}

export async function getTask(id, token) {
  const res = await fetch(`${BASE}/get/${id}`, {
    method: "GET",
    headers: getAuthHeader(token),
  });
  return handleRes(res);
}

export async function updateTask(id, payload, token) {
  const res = await fetch(`${BASE}/update/${id}`, {
    method: "PATCH",
    headers: getAuthHeader(token),
    body: JSON.stringify(payload),
  });
  return handleRes(res);
}

export async function changeStatus(id, status, token) {
  const res = await fetch(`${BASE}/${id}/status`, {
    method: "POST",
    headers: getAuthHeader(token),
    body: JSON.stringify({ status }),
  });
  return handleRes(res);
}

export async function assignUser(id, assigneeId, token) {
  const res = await fetch(`${BASE}/${id}/assign`, {
    method: "POST",
    headers: getAuthHeader(token),
    body: JSON.stringify({ assignee: assigneeId }),
  });
  return handleRes(res);
}

export async function addActivity(id, text, meta = {}, token) {
  const res = await fetch(`${BASE}/${id}/activity`, {
    method: "POST",
    headers: getAuthHeader(token),
    body: JSON.stringify({ text, meta }),
  });
  return handleRes(res);
}

export async function deleteTask(id, token) {
  const res = await fetch(`${BASE}/delete/${id}`, {
    method: "DELETE",
    headers: getAuthHeader(token),
  });
  return handleRes(res);
}
