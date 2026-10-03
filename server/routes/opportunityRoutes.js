
const express = require("express");
const Opportunity = require("../models/Opportunity");

const router = express.Router();

router.get("/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    const opportunities = await Opportunity.find({ userId })
      .sort({ createdAt: -1 });

    return res.status(200).json({
      count: opportunities.length,
      opportunities,
    });
  } catch (error) {
    console.error("Fetch opportunities error:", error);

    return res.status(500).json({
      message: "Failed to fetch opportunities",
    });
  }
});


module.exports = router;
