const BASE_URL = "http://localhost:1111";

export const fetchHabits = async (date = "") => {
  const url = date ? `${BASE_URL}/habits?date=${date}` : `${BASE_URL}/habits`;
  const response = await fetch(url, { headers: getAuthHeaders() });
  return await response.json();
};

export const addHabit = async (name) => {
  const response = await fetch(`${BASE_URL}/api/add`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ name: name.trim() }),
  });
  return await response.text();
};

export const deleteHabit = async (name) => {
  const response = await fetch(
    `${BASE_URL}/api/delete/${encodeURIComponent(name)}`,
    {
      method: "DELETE",
      headers: getAuthHeaders(),
    }
  );
  return await response.text();
};

export const toggleCompleteHabit = async (id, date) => {
  const response = await fetch(`${BASE_URL}/api/complete`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ id, date }),
  });
  return await response.text();
};

export const fetchAnalytics = async () => {
  const response = await fetch(`${BASE_URL}/api/analytics`, {
    headers: getAuthHeaders(),
  });
  return await response.json();
};

const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    Authorization: token ? `Bearer ${token}` : "",
  };
};

export const registerUser = async (username, password) => {
  const response = await fetch(`${BASE_URL}/api/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  if (!response.ok) throw new Error(await response.text());
  return await response.text();
};

export const loginUser = async (username, password) => {
  const response = await fetch(`${BASE_URL}/api/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  if (!response.ok) throw new Error(await response.text());
  return await response.json();
};