const mongoose = require("mongoose");

const opportunitySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    emailId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Email",
      required: true,
    },

    company: {
      type: String,
      required: true,
    },

    role: {
      type: String,
      required: true,
    },

    type: {
      type: String,
      enum: [
        "internship",
        "full-time",
        "part-time",
        "freelance",
        "other",
      ],
      default: "internship",
    },

    location: {
      type: String,
      default: "",
    },

    deadline: {
      type: Date,
    },

    status: {
      type: String,
      enum: [
        "new",
        "interested",
        "applied",
        "interview",
        "rejected",
        "closed",
      ],
      default: "new",
    },

    source: {
      type: String,
      default: "email",
    },

    description: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Opportunity", opportunitySchema);