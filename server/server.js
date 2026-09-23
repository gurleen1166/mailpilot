const express = require("express");
const cors = require("cors");
require("dotenv").config();
const connectDB = require("./config/db");

const app = express();

const PORT = 5001;

// Middleware
app.use(cors());
app.use(express.json());

// Test route
app.get("/", (req, res) => {
  res.json({
    message: "MailPilot backend is running 🚀"
  });
});
connectDB();
// Start server
app.listen(PORT, () => {
  console.log(`MailPilot server running on http://localhost:${PORT}`);
});