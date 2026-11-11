const express = require("express");
const router = express.Router();
const { authenticateToken } = require("../middleware/auth");
const {
  getHabits,
  addHabit,
  addDualHabit,
  acceptHabitInvite,
  declineHabitInvite,
  deleteHabit,
  clearHabits,
  toggleComplete,
  getAnalytics,
} = require("../controllers/habitController");

router.get("/habits", authenticateToken, getHabits);
router.post("/api/add", authenticateToken, addHabit);
router.post("/api/add-dual", authenticateToken, addDualHabit);
router.post("/api/habits/accept", authenticateToken, acceptHabitInvite);
router.post("/api/habits/decline", authenticateToken, declineHabitInvite);
router.delete("/api/delete/:name", authenticateToken, deleteHabit);
router.delete("/api/clear", authenticateToken, clearHabits);
router.post("/api/complete", authenticateToken, toggleComplete);
router.get("/api/analytics", authenticateToken, getAnalytics);

module.exports = router;
