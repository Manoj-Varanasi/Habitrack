const express = require("express");
const cors = require("cors");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");

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
            name TEXT NOT NULL UNIQUE
        );
        CREATE TABLE IF NOT EXISTS completions (
            habit_id INTEGER,
            date TEXT,
            PRIMARY KEY(habit_id, date),
            FOREIGN KEY (habit_id) REFERENCES habits(id) ON DELETE CASCADE
        );
    `);
    app.listen(1111, () => {
      console.log(`Server is running at http://localhost:1111`);
    });
  } catch (e) {
    console.log(`The error is ${e}`);
  }
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
app.get("/habits", async (req, res) => {
  const { date } = req.query;
  const today = new Date().toISOString().split("T")[0];
  const targetDate = date || today;
  const query = `
    SELECT h.id, h.name, (c.habit_id IS NOT NULL) AS completed
    FROM habits h
    LEFT JOIN completions c ON h.id = c.habit_id AND c.date = '${targetDate}'
  `;
  const resp = await db.all(query);
  for (let habit of resp) {
    habit.streak = await getHabitStreak(db, habit.id);
  }
  res.send(resp);
});

//2.adds a habit
app.post("/api/add", async (req, res) => {
  const { name } = req.body;

  if (!name) {
    res.status(400).send("Missing 'name' field");
    return;
  }
  const query = `
        insert into habits (name) values ('${name}');
    `;
  await db.run(query);
  res.status(200).send(`Habit '${name}' added Successfully`);
});

//3. deletes a habit
app.delete("/api/delete/:name", async (req, res) => {
  const { name } = req.params;

  if (!name) {
    res.status(400).send("Missing 'name' field");
    return;
  }
  const query = `
        delete from habits where name='${name}';
    `;
  await db.run(query);
  res.status(200).send(`Habit '${name}' deleted Successfully`);
});

//4. clears whole database
app.delete("/api/clear", async (req, res) => {
  await db.run("delete from habits");
  await db.run("delete from completions");
  res.status(200).send("All habits and completions are deleted successfully");
});

//5. sets a habit is completed and vice versa
app.post("/api/complete", async (req, res) => {
  const { id, date } = req.body;

  if (!id || !date) {
    res.status(400).send("Missing 'id' or 'date' field");
    return;
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
app.get("/api/analytics", async (req, res) => {
  const result = [];

  for (let i = 6; i >= 0; i--) {
    let d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];
    const displayDate = d.toLocaleDateString("en-US", { weekday: "short" });
    const completedRow = await db.get(
      `SELECT COUNT(*) AS completed FROM completions WHERE date = '${dateStr}'`,
    );

    result.push({
      date: displayDate,
      completed: completedRow.completed || 0,
    });
  }

  res.json(result);
});

module.exports = app;
