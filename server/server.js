require("dotenv").config();
const googleRoutes = require("./routes/googleRoutes");
const gmailRoutes = require("./routes/gmailRoutes");
const opportunityRoutes = require("./routes/opportunityRoutes");
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");

const app = express();

const PORT = 5001;

// Middleware
app.use(cors());
app.use(express.json());
app.use("/auth", googleRoutes);
app.use("/api/gmail", gmailRoutes);
app.use("/api/opportunities", opportunityRoutes);
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