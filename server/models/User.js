const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    googleId: {
      type: String,
      required: true,
      unique: true,
    },

    name: {
      type: String,
      required: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
    },

    profilePicture: {
      type: String,
      default: "",
    },
    gmail: {
  connected: {
    type: Boolean,
    default: false,
  },

  refreshToken: {
    type: String,
    default: null,
    select: false,
  },

  gmailAddress: {
    type: String,
    default: "",
  },
},

    preferences: {
      replyStyle: {
        type: String,
        default: "professional",
      },

      jobRoles: {
        type: [String],
        default: [],
      },

      locations: {
        type: [String],
        default: [],
      },
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("User", userSchema);