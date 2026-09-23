const mongoose = require("mongoose");

const emailSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    gmailMessageId: {
      type: String,
      required: true,
    },

    threadId: {
      type: String,
      required: true,
    },

    sender: {
      type: String,
      required: true,
    },

    receiver: {
      type: String,
      default: "",
    },

    subject: {
      type: String,
      default: "",
    },

    snippet: {
      type: String,
      default: "",
    },

    category: {
      type: String,
      enum: [
        "general",
        "job",
        "internship",
        "academic",
        "personal",
        "promotion",
        "spam",
        "other",
      ],
      default: "general",
    },

    importance: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
    },

    summary: {
      type: String,
      default: "",
    },

    extractedData: {
      company: {
        type: String,
        default: "",
      },

      role: {
        type: String,
        default: "",
      },

      deadline: {
        type: String,
        default: "",
      },

      interviewDate: {
        type: String,
        default: "",
      },
    },

    isRead: {
      type: Boolean,
      default: false,
    },

    receivedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Email", emailSchema);