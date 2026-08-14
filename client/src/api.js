const BASE_URL = "http://localhost:1111";

// 1. Fetch all habits with completion status & streak
export const fetchHabits = async (date = "") => {
  const url = date ? `${BASE_URL}/habits?date=${date}` : `${BASE_URL}/habits`;
  const response = await fetch(url);
  return await response.json();
};

// 2. Add a new habit
export const addHabit = async (name) => {
  const response = await fetch(`${BASE_URL}/api/add`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: name.trim() }),
  });
  return await response.text();
};

// 3. Delete a habit by name
export const deleteHabit = async (name) => {
  const response = await fetch(
    `${BASE_URL}/api/delete/${encodeURIComponent(name)}`,
    {
      method: "DELETE",
    }
  );
  return await response.text();
};

// 4. Toggle habit completion status for a date
export const toggleCompleteHabit = async (id, date) => {
  const response = await fetch(`${BASE_URL}/api/complete`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id, date }),
  });
  return await response.text();
};

// 5. Fetch weekly habit analytics data for charts
export const fetchAnalytics = async () => {
  const response = await fetch(`${BASE_URL}/api/analytics`);
  return await response.json();
};
