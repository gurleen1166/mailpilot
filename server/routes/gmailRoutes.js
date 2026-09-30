const express = require("express");
const User = require("../models/User");
const { getGmailClient } = require("../services/gmailService");

const router = express.Router();

router.get("/emails/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    // Find the MailPilot user
   const user = await User.findById(userId)
  .select("+gmail.refreshToken");

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    if (!user.gmail?.refreshToken) {
      return res.status(400).json({
        message: "Gmail is not connected",
      });
    }

    // Create Gmail API client
    const gmail = getGmailClient(user.gmail.refreshToken);
    // Get latest 10 emails
    const response = await gmail.users.messages.list({
      userId: "me",
      maxResults: 10,
    });

    const messages = response.data.messages || [];

    res.json({
      message: "Emails fetched successfully",
      count: messages.length,
      messages,
    });

  } catch (error) {
    console.error("Gmail fetch error:", error.message);

    res.status(500).json({
      message: "Failed to fetch Gmail emails",
    });
  }
});

module.exports = router;