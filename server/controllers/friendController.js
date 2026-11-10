const { db } = require("../config/db");
const { generateInviteCode } = require("./authController");

// Get current user profile (username, id, invite_code)
const getProfile = async (req, res) => {
  try {
    let result = await db.query(
      "SELECT id, username, invite_code FROM users WHERE id = $1",
      [req.user.id]
    );
    let user = result.rows[0];

    if (!user.invite_code) {
      const code = generateInviteCode();
      await db.query("UPDATE users SET invite_code = $1 WHERE id = $2", [
        code,
        user.id,
      ]);
      user.invite_code = code;
    }

    res.json(user);
  } catch (error) {
    console.error("Error fetching user profile:", error);
    res.status(500).send("Error fetching user profile");
  }
};

// Connect with a friend using their invite code
const connectFriend = async (req, res) => {
  const { inviteCode } = req.body;
  const currentUserId = req.user.id;

  if (!inviteCode) {
    return res.status(400).send("Please provide an invite code");
  }

  try {
    const friendResult = await db.query(
      "SELECT id, username FROM users WHERE invite_code = $1",
      [inviteCode.trim().toUpperCase()]
    );

    if (friendResult.rows.length === 0) {
      return res.status(404).send("Invalid invite code. User not found.");
    }

    const friend = friendResult.rows[0];

    if (friend.id === currentUserId) {
      return res.status(400).send("You cannot friend yourself!");
    }

    const existing = await db.query(
      `SELECT * FROM friendships 
       WHERE (user1_id = $1 AND user2_id = $2) 
          OR (user1_id = $2 AND user2_id = $1)`,
      [currentUserId, friend.id]
    );

    if (existing.rows.length > 0) {
      return res.status(400).send(`You are already friends with ${friend.username}!`);
    }

    await db.query(
      "INSERT INTO friendships (user1_id, user2_id, status) VALUES ($1, $2, 'accepted')",
      [currentUserId, friend.id]
    );

    res.status(200).json({
      message: `Successfully connected with ${friend.username}!`,
      friend: { id: friend.id, username: friend.username },
    });
  } catch (error) {
    console.error("Error connecting with friend:", error);
    res.status(500).send("Error connecting with friend");
  }
};

// Get list of accepted friends
const getFriends = async (req, res) => {
  const currentUserId = req.user.id;

  try {
    const query = `
      SELECT u.id, u.username, u.invite_code
      FROM friendships f
      JOIN users u ON (u.id = CASE WHEN f.user1_id = $1 THEN f.user2_id ELSE f.user1_id END)
      WHERE f.user1_id = $1 OR f.user2_id = $1
      ORDER BY u.username ASC
    `;
    const result = await db.query(query, [currentUserId]);
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching friends:", error);
    res.status(500).send("Error fetching friends");
  }
};

module.exports = { getProfile, connectFriend, getFriends };
