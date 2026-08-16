const express = require("express");
const cors = require("cors");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const JWT_SECRET = "super_secret_habit_key_123";
const dbPath = path.join(__dirname, "habits.db");

const app = express();
let db = null;

app.use(cors());
app.use(express.json());

//used to create db, if db is present, starts server
const initialiseDB = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    await db.exec(`
        CREATE TABLE IF NOT EXISTS habits (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            name TEXT NOT NULL,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );
        CREATE TABLE IF NOT EXISTS completions (
            habit_id INTEGER,
            date TEXT,
            PRIMARY KEY(habit_id, date),
            FOREIGN KEY (habit_id) REFERENCES habits(id) ON DELETE CASCADE
        );
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT NOT NULL UNIQUE,
            password_hash TEXT NOT NULL
        );
    `);
    app.listen(1111, () => {
      console.log(`Server is running at http://localhost:1111`);
    });
  } catch (e) {
    console.log(`The error is ${e}`);
  }
};

//checks if user is authenticated
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

//calculates streak with my own implementation
const getHabitStreak = async (db, habitId) => {
  const query = `
        select date from completions
        where habit_id = ${habitId}
        order by date desc;
    `;
  const data = await db.all(query);
  if (data.length == 0) return 0;
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

//1.returns all habits and streaks of em
app.get("/habits", authenticateToken, async (req, res) => {
  const { date } = req.query;
  const today = new Date().toISOString().split("T")[0];
  const targetDate = date || today;
  const userId = req.user.id;

  const query = `
    SELECT h.id, h.name, (c.habit_id IS NOT NULL) AS completed
    FROM habits h
    LEFT JOIN completions c ON h.id = c.habit_id AND c.date = '${targetDate}'
    WHERE h.user_id = ${userId}
  `;
  const resp = await db.all(query);
  for (let habit of resp) {
    habit.streak = await getHabitStreak(db, habit.id);
  }
  res.send(resp);
});

//2.adds a habit
app.post("/api/add", authenticateToken, async (req, res) => {
  const { name } = req.body;
  const userId = req.user.id;

  if (!name) return res.status(400).send("Missing 'name' field");

  await db.run("INSERT INTO habits (user_id, name) VALUES (?, ?)", [
    userId,
    name.trim(),
  ]);
  res.status(200).send(`Habit '${name}' added successfully`);
});

//3. deletes a habit
app.delete("/api/delete/:name", authenticateToken, async (req, res) => {
  const { name } = req.params;
  const userId = req.user.id;

  await db.run("DELETE FROM habits WHERE name = ? AND user_id = ?", [
    name,
    userId,
  ]);
  res.status(200).send(`Habit '${name}' deleted successfully`);
});

//4. clears whole database
app.delete("/api/clear", async (req, res) => {
  await db.run("delete from habits");
  await db.run("delete from completions");
  res.status(200).send("All habits and completions are deleted successfully");
});

//5. sets a habit is completed and vice versa
app.post("/api/complete", authenticateToken, async (req, res) => {
  const { id, date } = req.body;
  const userId = req.user.id;

  if (!id || !date) {
    res.status(400).send("Missing 'id' or 'date' field");
    return;
  }

  const habit = await db.get(
    "SELECT * FROM habits WHERE id = ? AND user_id = ?",
    [id, userId],
  );
  if (!habit) {
    return res.status(404).send("Habit not found");
  }

  const existing = await db.get(
    `SELECT * FROM completions WHERE habit_id = ${id} AND date = '${date}'`,
  );

  if (existing) {
    await db.run(
      `DELETE FROM completions WHERE habit_id = ${id} AND date = '${date}'`,
    );
    res.status(200).send("Habit uncompleted successfully!");
  } else {
    await db.run(
      `INSERT INTO completions (habit_id, date) VALUES (${id}, '${date}')`,
    );
    res.status(200).send("Habit completed successfully!");
  }
});

//calculates no of habits done in a week for rechart
app.get("/api/analytics", authenticateToken, async (req, res) => {
  const userId = req.user.id;
  const result = [];

  for (let i = 6; i >= 0; i--) {
    let d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];
    const displayDate = d.toLocaleDateString("en-US", { weekday: "short" });
    const completedRow = await db.get(`
      SELECT COUNT(*) AS completed 
      FROM completions c
      JOIN habits h ON c.habit_id = h.id
      WHERE h.user_id = ${userId} AND c.date = '${dateStr}'
    `);

    result.push({
      date: displayDate,
      completed: completedRow.completed || 0,
    });
  }

  res.json(result);
});

//runs when a new user tries to register into app
app.post("/api/register", async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).send("Missing username or password");
  }

  try {
    const existingUser = await db.get(
      "SELECT * FROM users WHERE username = ?",
      [username],
    );
    if (existingUser) {
      return res.status(400).send("Username already exists");
    }

    const passwordHash = await bcrypt.hash(password, 10);
    await db.run("INSERT INTO users (username, password_hash) VALUES (?, ?)", [
      username,
      passwordHash,
    ]);

    res.status(200).send("User registered successfully!");
  } catch (error) {
    res.status(500).send("Registration error");
  }
});

//login functionality
app.post("/api/login", async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).send("Missing username or password");
  }

  try {
    const user = await db.get("SELECT * FROM users WHERE username = ?", [
      username,
    ]);
    if (!user) {
      return res.status(400).send("Invalid username or password");
    }

    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      return res.status(400).send("Invalid username or password");
    }

    const token = jwt.sign(
      { id: user.id, username: user.username },
      JWT_SECRET,
    );

    res.status(200).json({ token, username: user.username });
  } catch (error) {
    res.status(500).send("Login error");
  }
});

module.exports = app;
