require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "super_secret_habit_key_123";

const app = express();
app.use(cors());
app.use(express.json());

// Create PostgreSQL connection pool
const db = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

// Initialize database tables and start server
const initialiseDB = async () => {
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS habits (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        name TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS completions (
        habit_id INTEGER REFERENCES habits(id) ON DELETE CASCADE,
        date TEXT,
        PRIMARY KEY(habit_id, date)
      );
    `);

    const PORT = process.env.PORT || 1111;
    app.listen(PORT, () => {
      console.log(`Server is running at http://localhost:${PORT}`);
    });
  } catch (e) {
    console.error("DB Initialization Error:", e);
  }
};

// Middleware to check if user is authenticated via JWT
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).send("Access token required");
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).send("Invalid or expired token");
    }
    req.user = user;
    next();
  });
};

initialiseDB();

// Calculates streak for a habit
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

// 1. Returns all habits and their streaks for the current user
app.get("/habits", authenticateToken, async (req, res) => {
  const { date } = req.query;
  const today = new Date().toISOString().split("T")[0];
  const targetDate = date || today;
  const userId = req.user.id;

  try {
    const query = `
      SELECT h.id, h.name, (c.habit_id IS NOT NULL) AS completed
      FROM habits h
      LEFT JOIN completions c ON h.id = c.habit_id AND c.date = $1
      WHERE h.user_id = $2
      ORDER BY h.id ASC
    `;
    const result = await db.query(query, [targetDate, userId]);
    const habits = result.rows;

    for (let habit of habits) {
      habit.streak = await getHabitStreak(habit.id);
    }
    res.json(habits);
  } catch (error) {
    console.error("Error fetching habits:", error);
    res.status(500).send("Error fetching habits");
  }
});

// 2. Adds a habit
app.post("/api/add", authenticateToken, async (req, res) => {
  const { name } = req.body;
  const userId = req.user.id;

  if (!name) return res.status(400).send("Missing 'name' field");

  try {
    await db.query("INSERT INTO habits (user_id, name) VALUES ($1, $2)", [
      userId,
      name.trim(),
    ]);
    res.status(200).send(`Habit '${name}' added successfully`);
  } catch (error) {
    console.error("Error adding habit:", error);
    res.status(500).send("Error adding habit");
  }
});

// 3. Deletes a habit
app.delete("/api/delete/:name", authenticateToken, async (req, res) => {
  const { name } = req.params;
  const userId = req.user.id;

  try {
    await db.query("DELETE FROM habits WHERE name = $1 AND user_id = $2", [
      name,
      userId,
    ]);
    res.status(200).send(`Habit '${name}' deleted successfully`);
  } catch (error) {
    console.error("Error deleting habit:", error);
    res.status(500).send("Error deleting habit");
  }
});

// 4. Clears user's habits
app.delete("/api/clear", authenticateToken, async (req, res) => {
  const userId = req.user.id;
  try {
    await db.query("DELETE FROM habits WHERE user_id = $1", [userId]);
    res.status(200).send("All habits deleted successfully");
  } catch (error) {
    console.error("Error clearing habits:", error);
    res.status(500).send("Error clearing habits");
  }
});

// 5. Sets habit completed or uncompleted
app.post("/api/complete", authenticateToken, async (req, res) => {
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
});

// 6. Analytics for past 7 days
app.get("/api/analytics", authenticateToken, async (req, res) => {
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
});

// 7. Register user
app.post("/api/register", async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).send("Missing username or password");
  }

  try {
    const existingUser = await db.query(
      "SELECT * FROM users WHERE username = $1",
      [username]
    );
    if (existingUser.rows.length > 0) {
      return res.status(400).send("Username already exists");
    }

    const passwordHash = await bcrypt.hash(password, 10);
    await db.query(
      "INSERT INTO users (username, password_hash) VALUES ($1, $2)",
      [username, passwordHash]
    );

    res.status(200).send("User registered successfully!");
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).send("Registration error");
  }
});

// 8. Login user
app.post("/api/login", async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).send("Missing username or password");
  }

  try {
    const userResult = await db.query(
      "SELECT * FROM users WHERE username = $1",
      [username]
    );
    const user = userResult.rows[0];

    if (!user) {
      return res.status(400).send("Invalid username or password");
    }

    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      return res.status(400).send("Invalid username or password");
    }

    const token = jwt.sign(
      { id: user.id, username: user.username },
      JWT_SECRET
    );

    res.status(200).json({ token, username: user.username });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).send("Login error");
  }
});

module.exports = app;
