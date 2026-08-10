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
      minlength: 3,
      maxlength: 16
    },

    accountKeyHash: {
      type: String,
      required: true,
      unique: true,
      index: true
    },

    // =========================
    // CHARACTER
    // =========================

    characterId: {
      type: Number,
      enum: [1, 2],
      default: 1
    },

    // =========================
    // CURRENCIES
    // =========================

    diamonds: {
      type: Number,
      default: 0,
      min: 0
    },

    gold: {
      type: Number,
      default: 0,
      min: 0
    },

    level: {
      type: Number,
      default: 1,
      min: 1
    },

    // =========================
    // BADGES
    // =========================

    developerBadge: {
      type: Boolean,
      default: false
    },

    partnershipBanner: {
      type: Boolean,
      default: false
    },

    // =========================
    // BAN
    // =========================

    banned: {
      type: Boolean,
      default: false
    },

    // =========================
    // INVENTORY
    // =========================

    ownedSkins: {
      type: [String],
      default: []
    },

    ownedWeapons: {
      type: [String],
      default: []
    },

    equippedSkin: {
      type: String,
      default: null
    },

    equippedWeaponSkin: {
      type: String,
      default: null
    },

    // =========================
    // DATE
    // =========================

    createdAt: {
      type: Date,
      default: Date.now
    }
  },

  {
    versionKey: false
  }
);

module.exports =
  mongoose.models.Player ||
  mongoose.model("Player", playerSchema);
