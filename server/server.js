require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { initialiseDB } = require("./config/db");

const authRoutes = require("./routes/authRoutes");
const friendRoutes = require("./routes/friendRoutes");
const habitRoutes = require("./routes/habitRoutes");

const app = express();
app.use(cors());
app.use(express.json());

// Routes
app.use("/api", authRoutes);
app.use("/api", friendRoutes);
app.use("/", habitRoutes);

// Initialize database and start server
const PORT = process.env.PORT || 1111;

initialiseDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
  });
});

module.exports = app;
