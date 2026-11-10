const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { db } = require("../config/db");
const { JWT_SECRET } = require("../middleware/auth");

const generateInviteCode = () => {
  return "HAB-" + crypto.randomBytes(3).toString("hex").toUpperCase();
};

const register = async (req, res) => {
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
    const inviteCode = generateInviteCode();

    await db.query(
      "INSERT INTO users (username, password_hash, invite_code) VALUES ($1, $2, $3)",
      [username, passwordHash, inviteCode]
    );

    res.status(200).send("User registered successfully!");
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).send("Registration error");
  }
};

const login = async (req, res) => {
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
};

module.exports = { register, login, generateInviteCode };
