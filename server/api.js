const BASE_URL = "http://localhost:1111";

export const fetchHabits = async (date = "") => {
  const url = date ? `${BASE_URL}/habits?date=${date}` : `${BASE_URL}/habits`;
  const response = await fetch(url);
  return await response.json();
};

export const addHabit = async (name) => {
  const response = await fetch(`${BASE_URL}/api/add`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: name.trim() }),
  });
  return await response.text();
};

export const deleteHabit = async (name) => {
  const response = await fetch(
    `${BASE_URL}/api/delete/${encodeURIComponent(name)}`,
    {
      method: "DELETE",
    },
  );
  return await response.text();
};

export const toggleCompleteHabit = async (id, date) => {
  const response = await fetch(`${BASE_URL}/api/complete`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id, date }),
  });
  return await response.text();
};

export const fetchAnalytics = async () => {
  const response = await fetch(`${BASE_URL}/api/analytics`);
  return await response.json();
};
