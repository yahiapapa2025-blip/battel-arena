const mongoose = require("mongoose");

const playerSchema = new mongoose.Schema(
  {
    playerId: {
      type: Number,
      required: true,
      unique: true,
      index: true
    },

    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      maxlength: 16
    },

    accountKeyHash: {
      type: String,
      required: true,
      unique: true,
      index: true
    },

    characterId: {
      type: Number,
      enum: [1, 2],
      default: 1
    },

    diamonds: {
      type: Number,
      default: 0
    },

    gold: {
      type: Number,
      default: 0
    },

    level: {
      type: Number,
      default: 1
    },

    developerBadge: {
      type: Boolean,
      default: false
    },

    partnershipBanner: {
      type: Boolean,
      default: false
    },

    banned: {
      type: Boolean,
      default: false
    },

    createdAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    versionKey: false
  }
);

module.exports = mongoose.model("Player", playerSchema);
