require("dotenv").config();
const { Pool } = require("pg");

const db = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

const initialiseDB = async () => {
  try {
    // 1. Users table
    await db.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        invite_code TEXT UNIQUE
      );
    `);

    await db.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS invite_code TEXT UNIQUE;
    `);

    // 2. Habits table with Dual Habit support
    await db.query(`
      CREATE TABLE IF NOT EXISTS habits (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        is_dual BOOLEAN DEFAULT FALSE,
        partner_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        pair_habit_id INTEGER
      );
    `);

    await db.query(`
      ALTER TABLE habits ADD COLUMN IF NOT EXISTS is_dual BOOLEAN DEFAULT FALSE;
      ALTER TABLE habits ADD COLUMN IF NOT EXISTS partner_id INTEGER REFERENCES users(id) ON DELETE CASCADE;
      ALTER TABLE habits ADD COLUMN IF NOT EXISTS pair_habit_id INTEGER;
    `);

    // 3. Completions table
    await db.query(`
      CREATE TABLE IF NOT EXISTS completions (
        habit_id INTEGER REFERENCES habits(id) ON DELETE CASCADE,
        date TEXT,
        PRIMARY KEY(habit_id, date)
      );
    `);

    // 4. Friendships table
    await db.query(`
      CREATE TABLE IF NOT EXISTS friendships (
        id SERIAL PRIMARY KEY,
        user1_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        user2_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        status TEXT NOT NULL DEFAULT 'accepted',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user1_id, user2_id)
      );
    `);

    console.log("Database initialized successfully.");
  } catch (e) {
    console.error("DB Initialization Error:", e);
  }
};

module.exports = { db, initialiseDB };
