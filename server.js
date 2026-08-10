require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const crypto = require("crypto");
const Player = require("./models/player");

const app = express();
const PORT = process.env.PORT || 10000;

// ================================
// ⚙️ MIDDLEWARE
// ================================

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname));

// ================================
// 🔐 ACCOUNT KEY
// ================================

function hashKey(key) {
    return crypto
        .createHash("sha256")
        .update(key)
        .digest("hex");
}

function createAccountKey() {
    return (
        "BA-" +
        crypto
            .randomBytes(18)
            .toString("hex")
            .toUpperCase()
    );
}

// ================================
// 🆔 PLAYER ID
// ================================

async function createPlayerId() {
    let id;
    let exists = true;

    while (exists) {
        id = Math.floor(
            1000000 + Math.random() * 9000000
        );

        exists = await Player.exists({
            playerId: id
        });
    }

    return id;
}

// ================================
// 🗄️ MONGODB
// ================================

async function connectDB() {
    try {
        if (!process.env.MONGODB_URI) {
            console.log("❌ MONGODB_URI missing");
            return false;
        }

        await mongoose.connect(
            process.env.MONGODB_URI
        );

        console.log("✅ MongoDB Connected");
        return true;

    } catch (error) {
        console.log(
            "❌ MongoDB Error:",
            error.message
        );

        return false;
    }
}

// ================================
// 🏠 HOME
// ================================

app.get("/", (req, res) => {
    res.sendFile(
        __dirname + "/index.html"
    );
});

// ================================
// ❤️ HEALTH
// ================================

app.get("/api/health", (req, res) => {
    res.json({
        success: true,

        server: "ONLINE",

        mongodb:
            mongoose.connection.readyState === 1
                ? "CONNECTED"
                : "DISCONNECTED",

        characters: "ON"
    });
});

// ================================
// 🆕 REGISTER
// ================================

app.post("/api/register", async (req, res) => {
    try {
        if (
            mongoose.connection.readyState !== 1
        ) {
            return res.status(503).json({
                success: false,
                message:
                    "قاعدة البيانات غير متصلة"
            });
        }

        const username =
            String(
                req.body.username || ""
            ).trim();

        const characterId =
            Number(req.body.characterId);

        if (!username) {
            return res.status(400).json({
                success: false,
                message:
                    "اكتب اسم اللاعب"
            });
        }

        if (username.length < 3) {
            return res.status(400).json({
                success: false,
                message:
                    "الاسم لازم يكون 3 حروف على الأقل"
            });
        }

        if (username.length > 16) {
            return res.status(400).json({
                success: false,
                message:
                    "الاسم طويل بزاف"
            });
        }

        if (![1, 2].includes(characterId)) {
            return res.status(400).json({
                success: false,
                message:
                    "الشخصية غير صالحة"
            });
        }

        const existing =
            await Player.findOne({
                username
            });

        if (existing) {
            return res.status(409).json({
                success: false,
                message:
                    "اسم اللاعب مستعمل"
            });
        }

        const playerId =
            await createPlayerId();

        const accountKey =
            createAccountKey();

        const accountKeyHash =
            hashKey(accountKey);

        const player =
            await Player.create({
                playerId,
                username,
                accountKeyHash,
                characterId,

                diamonds: 0,
                gold: 0,
                level: 1,

                developerBadge: false,
                partnershipBanner: false,
                banned: false
            });

        console.log(
            `👤 Created: ${username} | ID: ${playerId} | Character: ${characterId}`
        );

        res.json({
            success: true,

            message:
                "تم إنشاء الحساب بنجاح",

            accountKey,

            player: {
                playerId:
                    player.playerId,

                username:
                    player.username,

                characterId:
                    player.characterId,

                diamonds:
                    player.diamonds,

                gold:
                    player.gold,

                level:
                    player.level,

                developerBadge:
                    player.developerBadge,

                partnershipBanner:
                    player.partnershipBanner
            }
        });

    } catch (error) {

        console.log(
            "❌ Register Error:",
            error.message
        );

        res.status(500).json({
            success: false,
            message:
                "فشل إنشاء الحساب"
        });
    }
});

// ================================
// 🔑 LOGIN
// ================================

app.post("/api/login", async (req, res) => {
    try {

        const accountKey =
            String(
                req.body.accountKey || ""
            ).trim();

        if (!accountKey) {
            return res.status(400).json({
                success: false,
                message:
                    "أدخل Account Key"
            });
        }

        const hash =
            hashKey(accountKey);

        const player =
            await Player.findOne({
                accountKeyHash: hash
            });

        if (!player) {
            return res.status(401).json({
                success: false,
                message:
                    "Account Key غير صحيح"
            });
        }

        if (player.banned) {
            return res.status(403).json({
                success: false,
                message:
                    "الحساب محظور"
            });
        }

        console.log(
            `🔑 Login: ${player.username} | ID: ${player.playerId}`
        );

        res.json({
            success: true,

            message:
                "تم تسجيل الدخول",

            player: {
                playerId:
                    player.playerId,

                username:
                    player.username,

                characterId:
                    player.characterId,

                diamonds:
                    player.diamonds,

                gold:
                    player.gold,

                level:
                    player.level,

                developerBadge:
                    player.developerBadge,

                partnershipBanner:
                    player.partnershipBanner
            }
        });

    } catch (error) {

        console.log(
            "❌ Login Error:",
            error.message
        );

        res.status(500).json({
            success: false,
            message:
                "خطأ في تسجيل الدخول"
        });
    }
});

// ================================
// 👤 GET PLAYER
// ================================

app.get(
    "/api/player/:id",
    async (req, res) => {

        try {

            const id =
                Number(req.params.id);

            if (!Number.isInteger(id)) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Player ID غير صالح"
                });
            }

            const player =
                await Player.findOne({
                    playerId: id
                });

            if (!player) {
                return res.status(404).json({
                    success: false,
                    message:
                        "اللاعب غير موجود"
                });
            }

            res.json({
                success: true,

                player: {
                    playerId:
                        player.playerId,

                    username:
                        player.username,

                    characterId:
                        player.characterId,

                    diamonds:
                        player.diamonds,

                    gold:
                        player.gold,

                    level:
                        player.level,

                    developerBadge:
                        player.developerBadge,

                    partnershipBanner:
                        player.partnershipBanner,

                    banned:
                        player.banned
                }
            });

        } catch (error) {

            console.log(
                "❌ Player Error:",
                error.message
            );

            res.status(500).json({
                success: false,
                message:
                    "Server Error"
            });
        }
    }
);

// ================================
// 🎭 CHANGE CHARACTER
// ================================

app.post(
    "/api/player/:id/character",
    async (req, res) => {

        try {

            const id =
                Number(req.params.id);

            const characterId =
                Number(
                    req.body.characterId
                );

            if (![1, 2].includes(characterId)) {
                return res.status(400).json({
                    success: false,
                    message:
                        "الشخصية غير صالحة"
                });
            }

            const player =
                await Player.findOne({
                    playerId: id
                });

            if (!player) {
                return res.status(404).json({
                    success: false,
                    message:
                        "اللاعب غير موجود"
                });
            }

            if (player.banned) {
                return res.status(403).json({
                    success: false,
                    message:
                        "الحساب محظور"
                });
            }

            player.characterId =
                characterId;

            await player.save();

            console.log(
                `🎭 Character changed: ${player.username} -> ${characterId}`
            );

            res.json({
                success: true,

                message:
                    "تم حفظ الشخصية",

                characterId:
                    player.characterId
            });

        } catch (error) {

            console.log(
                "❌ Character Error:",
                error.message
            );

            res.status(500).json({
                success: false,
                message:
                    "فشل حفظ الشخصية"
            });
        }
    }
);

// ================================
// 💎 ADD DIAMONDS
// ================================

app.post(
    "/api/player/:id/diamonds",
    async (req, res) => {

        try {

            const id =
                Number(req.params.id);

            const amount =
                Number(req.body.amount);

            if (!Number.isFinite(amount)) {
                return res.status(400).json({
                    success: false,
                    message:
                        "قيمة الجواهر غير صالحة"
                });
            }

            const player =
                await Player.findOne({
                    playerId: id
                });

            if (!player) {
                return res.status(404).json({
                    success: false,
                    message:
                        "اللاعب غير موجود"
                });
            }

            player.diamonds += amount;

            await player.save();

            res.json({
                success: true,
                diamonds:
                    player.diamonds
            });

        } catch (error) {

            console.log(
                "❌ Diamonds Error:",
                error.message
            );

            res.status(500).json({
                success: false,
                message:
                    "فشل تحديث الجواهر"
            });
        }
    }
);

// ================================
// 🪙 ADD GOLD
// ================================

app.post(
    "/api/player/:id/gold",
    async (req, res) => {

        try {

            const id =
                Number(req.params.id);

            const amount =
                Number(req.body.amount);

            if (!Number.isFinite(amount)) {
                return res.status(400).json({
                    success: false,
                    message:
                        "قيمة الذهب غير صالحة"
                });
            }

            const player =
                await Player.findOne({
                    playerId: id
                });

            if (!player) {
                return res.status(404).json({
                    success: false,
                    message:
                        "اللاعب غير موجود"
                });
            }

            player.gold += amount;

            await player.save();

            res.json({
                success: true,
                gold:
                    player.gold
            });

        } catch (error) {

            console.log(
                "❌ Gold Error:",
                error.message
            );

            res.status(500).json({
                success: false,
                message:
                    "فشل تحديث الذهب"
            });
        }
    }
);

// ================================
// 🚀 START SERVER
// ================================

async function startServer() {

    await connectDB();

    app.listen(
        PORT,
        "0.0.0.0",
        () => {

            console.log("");

            console.log(
                "🔥 BATTLE ARENA SERVER ONLINE"
            );

            console.log(
                "🌐 PORT:",
                PORT
            );

            console.log(
                "🎭 3D CHARACTERS: ON"
            );

            console.log(
                "💾 ACCOUNT SAVE: ON"
            );

            console.log(
                "🆔 PLAYER ID SAVE: ON"
            );

            console.log("");
        }
    );
}

startServer();
