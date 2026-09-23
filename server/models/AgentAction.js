const mongoose = require("mongoose");

const agentActionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    task: {
      type: String,
      required: true,
    },

    toolUsed: {
      type: String,
      required: true,
    },

    input: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    result: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    status: {
      type: String,
      enum: [
        "planned",
        "running",
        "completed",
        "waiting_approval",
        "approved",
        "rejected",
        "failed",
      ],
      default: "planned",
    },

    requiresApproval: {
      type: Boolean,
      default: false,
    },

    approved: {
      type: Boolean,
      default: false,
    },

    errorMessage: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("AgentAction", agentActionSchema);