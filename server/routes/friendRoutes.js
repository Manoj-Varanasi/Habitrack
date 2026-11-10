const express = require("express");
const router = express.Router();
const { authenticateToken } = require("../middleware/auth");
const {
  getProfile,
  connectFriend,
  getFriends,
} = require("../controllers/friendController");

router.get("/me", authenticateToken, getProfile);
router.post("/friends/connect", authenticateToken, connectFriend);
router.get("/friends", authenticateToken, getFriends);

module.exports = router;
