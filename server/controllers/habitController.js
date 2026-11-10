const { db } = require("../config/db");

// Calculates streak for a solo habit
const getHabitStreak = async (habitId) => {
  const query = `
    SELECT date FROM completions
    WHERE habit_id = $1
    ORDER BY date DESC;
  `;
  const result = await db.query(query, [habitId]);
  const data = result.rows;
  if (data.length === 0) return 0;

  const today = new Date().toISOString().split("T")[0];
  let checkDate = new Date();
  let streak = 0;
  let i = 0;

  if (data[0].date !== today) {
    checkDate.setDate(checkDate.getDate() - 1);
  }

  while (i < data.length) {
    const expectedDate = checkDate.toISOString().split("T")[0];
    if (data[i].date === expectedDate) {
      streak++;
      i++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }
  return streak;
};

// Calculates streak for a dual habit (both partners must complete on the same date)
const getDualHabitStreak = async (habitId, pairHabitId) => {
  if (!pairHabitId) return getHabitStreak(habitId);

  const query = `
    SELECT c1.date 
    FROM completions c1
    INNER JOIN completions c2 ON c1.date = c2.date
    WHERE c1.habit_id = $1 AND c2.habit_id = $2
    ORDER BY c1.date DESC;
  `;
  const result = await db.query(query, [habitId, pairHabitId]);
  const data = result.rows;
  if (data.length === 0) return 0;

  const today = new Date().toISOString().split("T")[0];
  let checkDate = new Date();
  let streak = 0;
  let i = 0;

  if (data[0].date !== today) {
    checkDate.setDate(checkDate.getDate() - 1);
  }

  while (i < data.length) {
    const expectedDate = checkDate.toISOString().split("T")[0];
    if (data[i].date === expectedDate) {
      streak++;
      i++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }
  return streak;
};

// 1. Returns all habits (solo + dual)
const getHabits = async (req, res) => {
  const { date } = req.query;
  const today = new Date().toISOString().split("T")[0];
  const targetDate = date || today;
  const userId = req.user.id;

  try {
    const query = `
      SELECT 
        h.id, 
        h.name, 
        h.is_dual, 
        h.partner_id, 
        h.pair_habit_id,
        u.username AS partner_username,
        (c.habit_id IS NOT NULL) AS completed,
        (c_partner.habit_id IS NOT NULL) AS partner_completed
      FROM habits h
      LEFT JOIN completions c ON h.id = c.habit_id AND c.date = $1
      LEFT JOIN users u ON h.partner_id = u.id
      LEFT JOIN completions c_partner ON h.pair_habit_id = c_partner.habit_id AND c_partner.date = $1
      WHERE h.user_id = $2
      ORDER BY h.id ASC
    `;
    const result = await db.query(query, [targetDate, userId]);
    const habits = result.rows;

    for (let habit of habits) {
      if (habit.is_dual && habit.pair_habit_id) {
        habit.streak = await getDualHabitStreak(habit.id, habit.pair_habit_id);
      } else {
        habit.streak = await getHabitStreak(habit.id);
      }
    }
    res.json(habits);
  } catch (error) {
    console.error("Error fetching habits:", error);
    res.status(500).send("Error fetching habits");
  }
};

// 2. Adds a solo habit
const addHabit = async (req, res) => {
  const { name } = req.body;
  const userId = req.user.id;

  if (!name) return res.status(400).send("Missing 'name' field");

  try {
    await db.query(
      "INSERT INTO habits (user_id, name, is_dual) VALUES ($1, $2, FALSE)",
      [userId, name.trim()]
    );
    res.status(200).send(`Habit '${name}' added successfully`);
  } catch (error) {
    console.error("Error adding habit:", error);
    res.status(500).send("Error adding habit");
  }
};

// 3. Adds a dual habit
const addDualHabit = async (req, res) => {
  const { name, partnerId } = req.body;
  const userId = req.user.id;

  if (!name || !partnerId) {
    return res.status(400).send("Missing habit name or partner");
  }

  try {
    const h1 = await db.query(
      "INSERT INTO habits (user_id, name, is_dual, partner_id) VALUES ($1, $2, TRUE, $3) RETURNING id",
      [userId, name.trim(), partnerId]
    );
    const habit1Id = h1.rows[0].id;

    const h2 = await db.query(
      "INSERT INTO habits (user_id, name, is_dual, partner_id, pair_habit_id) VALUES ($1, $2, TRUE, $3, $4) RETURNING id",
      [partnerId, name.trim(), userId, habit1Id]
    );
    const habit2Id = h2.rows[0].id;

    await db.query("UPDATE habits SET pair_habit_id = $1 WHERE id = $2", [
      habit2Id,
      habit1Id,
    ]);

    res.status(200).send(`Dual habit '${name}' created for both friends!`);
  } catch (error) {
    console.error("Error creating dual habit:", error);
    res.status(500).send("Error creating dual habit");
  }
};

// 4. Deletes a habit
const deleteHabit = async (req, res) => {
  const { name } = req.params;
  const userId = req.user.id;

  try {
    const habit = await db.query(
      "SELECT id, pair_habit_id FROM habits WHERE name = $1 AND user_id = $2",
      [name, userId]
    );

    if (habit.rows.length > 0) {
      const pairId = habit.rows[0].pair_habit_id;
      if (pairId) {
        await db.query("DELETE FROM habits WHERE id = $1", [pairId]);
      }
    }

    await db.query("DELETE FROM habits WHERE name = $1 AND user_id = $2", [
      name,
      userId,
    ]);
    res.status(200).send(`Habit '${name}' deleted successfully`);
  } catch (error) {
    console.error("Error deleting habit:", error);
    res.status(500).send("Error deleting habit");
  }
};

// 5. Clears user's habits
const clearHabits = async (req, res) => {
  const userId = req.user.id;
  try {
    await db.query("DELETE FROM habits WHERE user_id = $1", [userId]);
    res.status(200).send("All habits deleted successfully");
  } catch (error) {
    console.error("Error clearing habits:", error);
    res.status(500).send("Error clearing habits");
  }
};

// 6. Sets habit completed or uncompleted
const toggleComplete = async (req, res) => {
  const { id, date } = req.body;
  const userId = req.user.id;

  if (!id || !date) {
    return res.status(400).send("Missing 'id' or 'date' field");
  }

  try {
    const habitCheck = await db.query(
      "SELECT * FROM habits WHERE id = $1 AND user_id = $2",
      [id, userId]
    );
    if (habitCheck.rows.length === 0) {
      return res.status(404).send("Habit not found");
    }

    const existing = await db.query(
      "SELECT * FROM completions WHERE habit_id = $1 AND date = $2",
      [id, date]
    );

    if (existing.rows.length > 0) {
      await db.query(
        "DELETE FROM completions WHERE habit_id = $1 AND date = $2",
        [id, date]
      );
      res.status(200).send("Habit uncompleted successfully!");
    } else {
      await db.query(
        "INSERT INTO completions (habit_id, date) VALUES ($1, $2)",
        [id, date]
      );
      res.status(200).send("Habit completed successfully!");
    }
  } catch (error) {
    console.error("Error toggling completion:", error);
    res.status(500).send("Error toggling completion");
  }
};

// 7. Analytics for past 7 days
const getAnalytics = async (req, res) => {
  const userId = req.user.id;
  const result = [];

  try {
    for (let i = 6; i >= 0; i--) {
      let d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      const displayDate = d.toLocaleDateString("en-US", { weekday: "short" });

      const query = `
        SELECT COUNT(*)::int AS completed
        FROM completions c
        JOIN habits h ON c.habit_id = h.id
        WHERE h.user_id = $1 AND c.date = $2
      `;
      const completedRow = await db.query(query, [userId, dateStr]);

      result.push({
        date: displayDate,
        completed: completedRow.rows[0].completed || 0,
      });
    }

    res.json(result);
  } catch (error) {
    console.error("Error fetching analytics:", error);
    res.status(500).send("Error fetching analytics");
  }
};

module.exports = {
  getHabits,
  addHabit,
  addDualHabit,
  deleteHabit,
  clearHabits,
  toggleComplete,
  getAnalytics,
};
