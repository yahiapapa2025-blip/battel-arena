const express = require("express");
const mongoose = require("mongoose");
const path = require("path");

const Player = require("./models/Player");

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// =====================================
// 🛠️ وضع الصيانة
// true  = صيانة
// false = اللعبة مفتوحة
// =====================================

const MAINTENANCE_MODE = false;


// =====================================
// 🛠️ صفحة الصيانة
// =====================================

app.use((req, res, next) => {

    if (
        MAINTENANCE_MODE &&
        !req.path.startsWith("/api")
    ) {
        return res.status(503).send(`
<!DOCTYPE html>
<html lang="ar" dir="rtl">

<head>
    <meta charset="UTF-8">
    <meta name="viewport"
          content="width=device-width, initial-scale=1.0">

    <title>Battle Arena - صيانة</title>

    <style>
        body {
            margin: 0;
            min-height: 100vh;

            display: flex;
            align-items: center;
            justify-content: center;

            background: #080b12;
            color: white;

            font-family: Arial, sans-serif;
            text-align: center;
        }

        .box {
            width: min(90%, 500px);
            padding: 40px 25px;

            background: #111827;
            border-radius: 20px;
        }

        .icon {
            font-size: 70px;
        }

        h1 {
            font-size: 32px;
        }

        p {
            color: #b8c1d1;
            line-height: 1.8;
        }

        .status {
            display: inline-block;

            padding: 10px 20px;

            border-radius: 20px;

            background: #332b0b;
            color: #ffd43b;
        }
    </style>
</head>

<body>

    <div class="box">

        <div class="icon">🛠️</div>

        <h1>Battle Arena</h1>

        <h2>اللعبة تحت الصيانة</h2>

        <p>
            نقوم حاليًا بتطوير اللعبة وتحسينها.
            <br>
            حاول الدخول لاحقًا 🎮
        </p>

        <div class="status">
            🔧 تحت الصيانة
        </div>

    </div>

</body>
</html>
        `);
    }

    next();
});


// =====================================
// 📁 ملفات اللعبة
// =====================================

app.use(express.static(__dirname));


// =====================================
// 🏠 الصفحة الرئيسية
// =====================================

app.get("/", (req, res) => {

    res.sendFile(
        path.join(__dirname, "login.html")
    );

});


// =====================================
// 🟢 حالة السيرفر
// =====================================

app.get("/api/status", (req, res) => {

    res.json({
        online: true,
        game: "Battle Arena",
        maintenance: MAINTENANCE_MODE
    });

});


// =====================================
// 🔗 اتصال MongoDB
// =====================================

if (!process.env.MONGODB_URI) {

    console.error(
        "❌ MONGODB_URI غير موجود في Environment Variables"
    );

} else {

    mongoose
        .connect(process.env.MONGODB_URI)
        .then(() => {

            console.log("✅ MongoDB Connected");

        })
        .catch((error) => {

            console.error(
                "❌ MongoDB Error:",
                error.message
            );

        });
}


// =====================================
// 🆔 إنشاء Player ID
// =====================================

async function generatePlayerId() {

    while (true) {

        const id =
            Math.floor(
                100000 +
                Math.random() * 900000
            );

        const existing =
            await Player.findOne({
                playerId: id
            });

        if (!existing) {
            return id;
        }
    }
}


// =====================================
// 👤 إنشاء حساب
// =====================================

app.post("/api/register", async (req, res) => {

    try {

        const username =
            String(
                req.body.username || ""
            ).trim();


        if (username.length < 3) {

            return res.status(400).json({
                success: false,
                message:
                    "اسم اللاعب لازم يكون 3 أحرف على الأقل"
            });

        }


        if (username.length > 16) {

            return res.status(400).json({
                success: false,
                message:
                    "اسم اللاعب طويل بزاف"
            });

        }


        const existing =
            await Player.findOne({
                username: {
                    $regex:
                        `^${username}$`,
                    $options: "i"
                }
            });


        if (existing) {

            return res.status(409).json({
                success: false,
                message:
                    "هذا الاسم مستعمل"
            });

        }


        const playerId =
            await generatePlayerId();


        const player =
            await Player.create({

                playerId,

                username,

                diamonds: 0,

                gold: 0,

                level: 1,

                xp: 0,

                friends: [],

                inventory: [],

                equippedSkin: null,

                developerBadge: false,

                partnershipBanner: false,

                banned: false

            });


        console.log(
            `👤 Player Created: ${playerId} - ${username}`
        );


        res.status(201).json({

            success: true,

            message:
                "تم إنشاء الحساب بنجاح 🎉",

            player: {

                playerId:
                    player.playerId,

                username:
                    player.username,

                diamonds:
                    player.diamonds,

                gold:
                    player.gold,

                level:
                    player.level,

                xp:
                    player.xp

            }

        });


    } catch (error) {

        console.error(
            "❌ Register Error:",
            error
        );

        res.status(500).json({

            success: false,

            message:
                "حدث خطأ في إنشاء الحساب"

        });

    }

});


// =====================================
// 🔐 تسجيل الدخول
// =====================================

app.post("/api/login", async (req, res) => {

    try {

        const playerId =
            Number(
                req.body.playerId
            );


        if (!playerId) {

            return res.status(400).json({

                success: false,

                message:
                    "أدخل Player ID"

            });

        }


        const player =
            await Player.findOne({
                playerId
            });


        if (!player) {

            return res.status(404).json({

                success: false,

                message:
                    "الحساب غير موجود"

            });

        }


        if (player.banned) {

            return res.status(403).json({

                success: false,

                message:
                    "هذا الحساب محظور 🚫"

            });

        }


        res.json({

            success: true,

            message:
                "تم تسجيل الدخول ✅",

            player

        });


    } catch (error) {

        console.error(
            "❌ Login Error:",
            error
        );

        res.status(500).json({

            success: false,

            message:
                "حدث خطأ في تسجيل الدخول"

        });

    }

});


// =====================================
// 🔎 جلب بيانات لاعب
// =====================================

app.get("/api/player/:id", async (req, res) => {

    try {

        const playerId =
            Number(
                req.params.id
            );


        const player =
            await Player.findOne({
                playerId
            });


        if (!player) {

            return res.status(404).json({

                success: false,

                message:
                    "Player Not Found"

            });

        }


        res.json({

            success: true,

            player

        });


    } catch (error) {

        console.error(error);

        res.status(500).json({

            success: false,

            message:
                "Server Error"

        });

    }

});


// =====================================
// 💎 إضافة Diamonds للاختبار
// =====================================

app.post(
    "/api/player/:id/diamonds",
    async (req, res) => {

        try {

            const playerId =
                Number(
                    req.params.id
                );

            const amount =
                Number(
                    req.body.amount
                );


            if (!Number.isFinite(amount)) {

                return res.status(400).json({

                    success: false,

                    message:
                        "المبلغ غير صحيح"

                });

            }


            const player =
                await Player.findOne({
                    playerId
                });


            if (!player) {

                return res.status(404).json({

                    success: false,

                    message:
                        "Player Not Found"

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

            console.error(error);

            res.status(500).json({

                success: false,

                message:
                    "Server Error"

            });

        }

    }
);


// =====================================
// 🚀 تشغيل السيرفر
// =====================================

const PORT =
    process.env.PORT || 4000;


app.listen(
    PORT,
    "0.0.0.0",
    () => {

        console.log(
            "🔥 Battle Arena Server Running"
        );

        console.log(
            `🌐 Port: ${PORT}`
        );

        console.log(
            MAINTENANCE_MODE
                ? "🛠️ Maintenance: ON"
                : "🎮 Maintenance: OFF"
        );

    }
);
