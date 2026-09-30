const express = require("express");
const {
  getGoogleAuthUrl,
  getGoogleTokens,
  getGoogleProfile
} = require("../services/googleAuth");

const router = express.Router();
const User = require("../models/User");
// Start Google OAuth
router.get("/google", (req, res) => {
  const authUrl = getGoogleAuthUrl();
  res.redirect(authUrl);
});

// Google OAuth callback
router.get("/google/callback", async (req, res) => {
  try {
    const { code } = req.query;

    if (!code) {
      return res.status(400).json({
        message: "Authorization code not found"
      });
    }

    // Exchange authorization code for Google tokens
    const tokens = await getGoogleTokens(code);
    console.log("Refresh token received:", Boolean(tokens.refresh_token));

    // Get Google account information
    const profile = await getGoogleProfile();

    const {
      sub: googleId,
      name,
      email,
      picture: profilePicture
    } = profile;

    // Save or update the user
    const user = await User.findOneAndUpdate(
      { email },
      {
  googleId,
  name,
  profilePicture,

  gmail: {
    connected: true,
    refreshToken: tokens.refresh_token || undefined,
    gmailAddress: email
  }
},
      {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true
      }
    ).select("+gmail.refreshToken");

    console.log("Google OAuth successful");
    console.log("Gmail connected for:", user.email);
    console.log("Saved refresh token:", Boolean(user.gmail?.refreshToken));
console.log("Gmail connected flag:", user.gmail?.connected);

    res.json({
      message: "Gmail connected successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        gmailConnected: user.gmail?.connected
      }
    });

  } catch (error) {
    console.error("Google OAuth error:", error.message);

    res.status(500).json({
      message: "Google authentication failed"
    });
  }
});

module.exports = router;