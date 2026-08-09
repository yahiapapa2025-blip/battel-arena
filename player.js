const mongoose = require("mongoose");

const PlayerSchema = new mongoose.Schema(
    {
        playerId: {
            type: Number,
            unique: true,
            required: true
        },

        username: {
            type: String,
            unique: true,
            required: true,
            trim: true,
            minlength: 3,
            maxlength: 16
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

        xp: {
            type: Number,
            default: 0
        },

        friends: {
            type: [Number],
            default: []
        },

        inventory: {
            type: [String],
            default: []
        },

        equippedSkin: {
            type: String,
            default: null
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
        }
    },
    {
        timestamps: true
    }
);

module.exports =
    mongoose.model("Player", PlayerSchema);