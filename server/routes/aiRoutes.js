const express = require("express");
const { generateAIResponse } = require("../services/groqService");

const router = express.Router();

router.post("/ask", async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!prompt || !prompt.trim()) {
      return res.status(400).json({
        message: "Prompt is required",
      });
    }

    const response = await generateAIResponse(prompt);

    return res.status(200).json({
      response,
    });
  } catch (error) {
    console.error("AI route error:", error);

    return res.status(500).json({
      message: "Failed to generate AI response",
    });
  }
});

module.exports = router;